/**
 * Creative Generator V2 - Backend API Client
 *
 * Communicates with the FastAPI + ADK backend on Cloud Run.
 * Falls back to localhost:8080 for local development.
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

/**
 * Create a new ADK session.
 * @param {string} market - Market code (kr, jp, id, in)
 * @param {string|null} creativePackage - Optional creative package markdown from Agent Collective
 */
export async function createSession(market = 'kr', creativePackage = null) {
  const body = { market };
  if (creativePackage) body.creative_package = creativePackage;
  const resp = await fetch(`${API_BASE}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Session creation failed: ${resp.statusText}`);
  return resp.json(); // { session_id }
}

/**
 * Load and validate a manifest into an ADK session.
 */
export async function loadManifest(sessionId, manifestJson) {
  const resp = await fetch(`${API_BASE}/api/manifest/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      manifest_json: typeof manifestJson === 'string' ? manifestJson : JSON.stringify(manifestJson),
    }),
  });
  if (!resp.ok) throw new Error(`Manifest load failed: ${resp.statusText}`);
  return resp.json();
}

/**
 * Validate a manifest without starting a session (dry run).
 */
export async function validateManifest(manifestJson) {
  const resp = await fetch(`${API_BASE}/api/manifest/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: '',
      manifest_json: typeof manifestJson === 'string' ? manifestJson : JSON.stringify(manifestJson),
    }),
  });
  if (!resp.ok) throw new Error(`Validation failed: ${resp.statusText}`);
  return resp.json();
}

/**
 * Trigger reference image generation.
 * @param {string} refId - Specific ref_id, or empty string for all pending refs
 */
export async function generateRef(sessionId, refId = '') {
  const resp = await fetch(`${API_BASE}/api/refs/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, ref_id: refId }),
  });
  if (!resp.ok) throw new Error(`Ref generation failed: ${resp.statusText}`);
  return resp.json();
}

/**
 * Trigger a single job generation.
 */
export async function generateJob(sessionId, jobId) {
  const resp = await fetch(`${API_BASE}/api/jobs/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, job_id: jobId }),
  });
  if (!resp.ok) throw new Error(`Job generation failed: ${resp.statusText}`);
  return resp.json();
}

/**
 * Get current session state (ref_status, job_status, etc.)
 */
export async function getStatus(sessionId) {
  const resp = await fetch(`${API_BASE}/api/status/${sessionId}`);
  if (!resp.ok) throw new Error(`Status fetch failed: ${resp.statusText}`);
  return resp.json();
}

/**
 * SSE stream for real-time generation progress.
 * Returns an EventSource-like interface via fetch + ReadableStream.
 */
export function streamRun(sessionId, message, onEvent, onDone, onError) {
  const controller = new AbortController();

  fetch(`${API_BASE}/api/run/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
    signal: controller.signal,
  })
    .then(async (resp) => {
      if (!resp.ok) throw new Error(`Stream failed: ${resp.statusText}`);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim());
              onEvent(data);
            } catch {
              // Non-JSON SSE line, skip
            }
          }
        }
      }
      onDone?.();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err);
      }
    });

  return { cancel: () => controller.abort() };
}

/**
 * Get the URL for a generated asset (image/video) via the backend proxy.
 */
export function getAssetUrl(gcsPath) {
  if (!gcsPath) return null;
  // If it's already a full public URL, return as-is
  if (gcsPath.startsWith('https://')) return gcsPath;
  // Strip gs://bucket/ prefix if present
  const cleaned = gcsPath.replace(/^gs:\/\/[^/]+\//, '');
  return `${API_BASE}/api/asset/${cleaned}`;
}
