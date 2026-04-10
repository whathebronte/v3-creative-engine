import { useState, useCallback, useRef, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ReferenceView from './components/ReferenceView';
import JobView from './components/JobView';
import ManifestUploader from './components/ManifestUploader';
import PromptViewer from './components/PromptViewer';
import Lightbox from './components/Lightbox';
import CreativePackagePanel from './components/CreativePackagePanel';
import { MOCK_MANIFEST, MOCK_RUNS, buildInitialStatuses } from './mockData';
import * as api from './api';

// ---------------------------------------------------------------------------
// Archive persistence (localStorage)
// ---------------------------------------------------------------------------
const ARCHIVE_KEY = 'creative_generator_v2_archive';

function loadArchive() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    return raw ? JSON.parse(raw) : MOCK_RUNS;
  } catch {
    return MOCK_RUNS;
  }
}

function saveArchive(runs) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(runs));
}

function createArchiveEntry(manifest, refStatus, jobStatus, creativePackage = null) {
  const runId = manifest.pipeline_run_id || manifest.brief_id || `run_${Date.now()}`;
  const type = manifest.brief_id ? 'create' : 'adapt';
  const name = manifest.campaign_name || runId;
  const date = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  return {
    id: runId,
    type,
    label: `${name} \u00B7 ${date}`,
    market: manifest.market || '',
    created_at: new Date().toISOString(),
    status: 'active',
    manifest,
    refStatus,
    jobStatus,
    creativePackage,
  };
}

// Map market codes from Agent Collective to sidebar market IDs
const MARKET_CODE_MAP = { kr: 'korea', jp: 'japan', id: 'indonesia', in: 'india' };

export default function App() {
  // Load mock data by default for development
  const [manifest, setManifest] = useState(MOCK_MANIFEST);
  const initialStatuses = buildInitialStatuses(MOCK_MANIFEST);
  const [refStatus, setRefStatus] = useState(initialStatuses.refStatus);
  const [jobStatus, setJobStatus] = useState(initialStatuses.jobStatus);

  const [market, setMarket] = useState('korea');
  const [selectedView, setSelectedView] = useState('refs');
  const [archivedRuns, setArchivedRuns] = useState(loadArchive);
  const [activeRunId, setActiveRunId] = useState(
    () => (manifest?.pipeline_run_id || manifest?.brief_id || loadArchive()[0]?.id || null)
  );
  const [promptItem, setPromptItem] = useState(null);
  const [lightboxItem, setLightboxItem] = useState(null);

  // Backend session tracking
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // Creative package from Agent Collective transfer
  const [creativePackage, setCreativePackage] = useState(null);
  const [transferBanner, setTransferBanner] = useState(null);

  const allRefsComplete = manifest
    ? manifest.reference_images.every((r) => refStatus[r.ref_id]?.status === 'complete')
    : false;

  // ---------------------------------------------------------------------------
  // Transfer receiver — check URL params on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transferId = params.get('transfer');
    const importedMarket = params.get('market');

    if (importedMarket) {
      const mapped = MARKET_CODE_MAP[importedMarket] || importedMarket;
      setMarket(mapped);
    }

    if (transferId) {
      loadTransfer(transferId);
    }

    // Clean URL params after reading
    if (transferId || importedMarket) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTransfer(transferId) {
    setError(null);
    try {
      const docRef = doc(db, 'prompt_transfers_v2', transferId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        setError('Transfer not found in Firestore.');
        return;
      }

      const data = snap.data();
      const transferManifest = data.manifest || {};
      const transferCreativePackage = data.creativePackage || null;
      const jobCount = data.jobCount || transferManifest.jobs?.length || 0;

      if (!transferManifest.jobs?.length && !transferManifest.reference_images?.length) {
        setError('Transfer received but no jobs or references found.');
        return;
      }

      // Store creative package
      if (transferCreativePackage) {
        setCreativePackage(transferCreativePackage);
      }

      // Show transfer banner
      setTransferBanner(`Pipeline transfer from Agent Collective: ${jobCount} jobs loaded`);
      setTimeout(() => setTransferBanner(null), 6000);

      // Load manifest into the standard pipeline (handles its own loading/error state)
      await handleLoadManifest(transferManifest, transferCreativePackage);
    } catch (e) {
      console.error('Transfer load failed:', e);
      setError(`Transfer load failed: ${e.message}`);
    }
  }

  // Poll session status from backend
  const pollStatus = useCallback(async (sid) => {
    if (!sid) return;
    try {
      const status = await api.getStatus(sid);
      if (status.ref_status && Object.keys(status.ref_status).length > 0) {
        setRefStatus(status.ref_status);
      }
      if (status.job_status && Object.keys(status.job_status).length > 0) {
        setJobStatus(status.job_status);
      }
    } catch (e) {
      console.warn('Status poll failed:', e);
    }
  }, []);

  // Start/stop polling
  const startPolling = useCallback((sid) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => pollStatus(sid), 3000);
  }, [pollStatus]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Auto-save current statuses to archive whenever they change
  useEffect(() => {
    if (!activeRunId || !manifest) return;
    setArchivedRuns((prev) => {
      const updated = prev.map((r) =>
        r.id === activeRunId ? { ...r, refStatus, jobStatus, manifest, creativePackage } : r
      );
      saveArchive(updated);
      return updated;
    });
  }, [activeRunId, manifest, refStatus, jobStatus, creativePackage]);

  const handleLoadManifest = useCallback(async (json, creativePackageMd = null) => {
    setManifest(json);
    const statuses = buildInitialStatuses(json);
    setRefStatus(statuses.refStatus);
    setJobStatus(statuses.jobStatus);
    setSelectedView('refs');
    setLightboxItem(null);
    setError(null);

    // Store creative package if provided
    if (creativePackageMd) {
      setCreativePackage(creativePackageMd);
    }

    // Auto-save to archive (include creative package)
    const pkgForArchive = creativePackageMd || creativePackage;
    const entry = createArchiveEntry(json, statuses.refStatus, statuses.jobStatus, pkgForArchive);
    setArchivedRuns((prev) => {
      const filtered = prev.filter((r) => r.id !== entry.id);
      const updated = [entry, ...filtered];
      saveArchive(updated);
      return updated;
    });
    setActiveRunId(entry.id);

    // Create backend session and load manifest
    setLoading(true);
    try {
      const marketCode = json.market || 'kr';
      const { session_id } = await api.createSession(marketCode, creativePackageMd || creativePackage);
      setSessionId(session_id);

      await api.loadManifest(session_id, json);

      // Poll for status after load
      await pollStatus(session_id);
      startPolling(session_id);
    } catch (e) {
      console.error('Backend session/manifest load failed:', e);
      setError(`Backend error: ${e.message}. Using local mode.`);
    } finally {
      setLoading(false);
    }
  }, [pollStatus, startPolling, creativePackage]);

  // Generate a reference image via backend
  const handleGenerateRef = useCallback(async (refId) => {
    setRefStatus((prev) => ({
      ...prev,
      [refId]: { ...prev[refId], status: 'running' },
    }));

    if (sessionId) {
      try {
        await api.generateRef(sessionId, refId);
        await pollStatus(sessionId);
      } catch (e) {
        console.error(`Ref generation failed for ${refId}:`, e);
        setRefStatus((prev) => ({
          ...prev,
          [refId]: { status: 'failed', gcs_uri: null },
        }));
      }
    } else {
      console.warn(`No backend session for ref ${refId}, cannot generate`);
      setError('No backend session. Reload the manifest to create a session.');
      setRefStatus((prev) => ({
        ...prev,
        [refId]: { status: 'failed', gcs_uri: null },
      }));
    }
  }, [sessionId, pollStatus]);

  const handleGenerateAllRefs = useCallback(() => {
    if (!manifest) return;
    manifest.reference_images.forEach((ref, i) => {
      if (refStatus[ref.ref_id]?.status === 'pending') {
        setTimeout(() => handleGenerateRef(ref.ref_id), i * 500);
      }
    });
  }, [manifest, refStatus, handleGenerateRef]);

  // Generate a job via backend
  const handleGenerateJob = useCallback(async (jobId) => {
    setJobStatus((prev) => ({
      ...prev,
      [jobId]: { ...prev[jobId], status: 'running' },
    }));

    if (sessionId) {
      try {
        await api.generateJob(sessionId, jobId);
        await pollStatus(sessionId);
      } catch (e) {
        console.error(`Job generation failed for ${jobId}:`, e);
        setError(`Job ${jobId} failed: ${e.message}`);
        setJobStatus((prev) => ({
          ...prev,
          [jobId]: { status: 'failed', gcs_uri: null },
        }));
      }
    } else {
      // No backend session — show error instead of silent mock
      console.warn(`No backend session for job ${jobId}, cannot generate`);
      setError('No backend session. Reload the manifest to create a session.');
      setJobStatus((prev) => ({
        ...prev,
        [jobId]: { status: 'failed', gcs_uri: null },
      }));
    }
  }, [sessionId, pollStatus]);

  // Archive: restore a run — re-creates a backend session so generation works
  const handleSelectRun = useCallback(async (runId) => {
    stopPolling();
    setSessionId(null);
    const run = archivedRuns.find((r) => r.id === runId);
    if (!run?.manifest) {
      setActiveRunId(runId);
      return;
    }

    const restoredManifest = run.manifest;
    const restoredPackage = run.creativePackage || null;

    setManifest(restoredManifest);
    setRefStatus(run.refStatus || buildInitialStatuses(restoredManifest).refStatus);
    setJobStatus(run.jobStatus || buildInitialStatuses(restoredManifest).jobStatus);
    setCreativePackage(restoredPackage);
    setSelectedView('refs');
    setLightboxItem(null);
    setError(null);
    setActiveRunId(runId);

    // Create a fresh backend session so generation buttons work
    setLoading(true);
    try {
      const marketCode = restoredManifest.market || 'kr';
      const { session_id } = await api.createSession(marketCode, restoredPackage);
      setSessionId(session_id);

      await api.loadManifest(session_id, restoredManifest);
      await pollStatus(session_id);
      startPolling(session_id);
    } catch (e) {
      console.error('Backend session restore failed:', e);
      setError(`Backend error: ${e.message}. Generation unavailable until session is restored.`);
    } finally {
      setLoading(false);
    }
  }, [archivedRuns, stopPolling, pollStatus, startPolling]);

  // Archive: delete a run
  const handleDeleteRun = useCallback((runId) => {
    setArchivedRuns((prev) => {
      const updated = prev.filter((r) => r.id !== runId);
      saveArchive(updated);
      return updated;
    });
    if (runId === activeRunId) {
      setActiveRunId(archivedRuns.find((r) => r.id !== runId)?.id || null);
    }
  }, [activeRunId, archivedRuns]);

  // All items and statuses for lightbox navigation
  const allItems = manifest
    ? [...manifest.reference_images, ...manifest.jobs]
    : [];
  const allStatuses = { ...refStatus, ...jobStatus };
  const lightboxItemId = lightboxItem ? (lightboxItem.ref_id || lightboxItem.job_id) : null;

  // Determine main content view
  const renderMainContent = () => {
    if (!manifest) {
      return <ManifestUploader onLoad={handleLoadManifest} />;
    }

    if (selectedView === 'refs') {
      return (
        <ReferenceView
          refs={manifest.reference_images}
          refStatus={refStatus}
          allRefsComplete={allRefsComplete}
          onGenerate={handleGenerateRef}
          onGenerateAll={handleGenerateAllRefs}
          onViewPrompt={setPromptItem}
          onView={setLightboxItem}
          selectedItemId={lightboxItemId}
        />
      );
    }

    // Job group view — matches audience_id, deliverable_id, or 'all' fallback
    const audienceJobs = manifest.jobs.filter((j) => {
      if (selectedView === 'all') return true;
      if (j.audience_id === selectedView) return true;
      if (j.deliverable_id === selectedView) return true;
      return false;
    });
    const audienceName = audienceJobs[0]?.audience_name || audienceJobs[0]?.deliverable_id || selectedView;

    return (
      <JobView
        audienceName={audienceName}
        jobs={audienceJobs}
        jobStatus={jobStatus}
        refStatus={refStatus}
        refsComplete={allRefsComplete}
        onGenerate={handleGenerateJob}
        onViewPrompt={setPromptItem}
        onView={setLightboxItem}
        selectedItemId={lightboxItemId}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header runId={manifest?.pipeline_run_id || manifest?.brief_id} hasCreativePackage={!!creativePackage} />

      {/* Transfer banner */}
      {transferBanner && (
        <div className="bg-accent/20 border-t-2 border-accent px-4 py-2 text-xs text-white flex items-center justify-between">
          <span>{transferBanner}</span>
          <button onClick={() => setTransferBanner(null)} className="text-neutral-400 hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-yellow-900/50 border-b border-yellow-700 px-4 py-2 text-xs text-yellow-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-yellow-400 hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="bg-accent/20 border-b border-accent/30 px-4 py-1.5 text-xs text-white text-center">
          Loading manifest into ADK session...
        </div>
      )}

      {/* Creative Package panel — visible when transfer includes one */}
      <CreativePackagePanel
        content={creativePackage}
        onDismiss={() => setCreativePackage(null)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          market={market}
          onMarketChange={setMarket}
          manifest={manifest}
          refStatus={refStatus}
          jobStatus={jobStatus}
          runs={archivedRuns}
          activeRunId={activeRunId}
          onSelectRun={handleSelectRun}
          onDeleteRun={handleDeleteRun}
          selectedView={selectedView}
          onSelectView={setSelectedView}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {renderMainContent()}
        </main>

        {lightboxItem && (
          <Lightbox
            item={lightboxItem}
            status={allStatuses[lightboxItem.ref_id || lightboxItem.job_id]}
            allItems={allItems}
            allStatuses={allStatuses}
            onSelect={setLightboxItem}
            onClose={() => setLightboxItem(null)}
          />
        )}
      </div>

      <PromptViewer item={promptItem} onClose={() => setPromptItem(null)} />
    </div>
  );
}
