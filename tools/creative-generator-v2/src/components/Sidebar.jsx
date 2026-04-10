import MarketSelector from './MarketSelector';
import JobQueueSummary from './JobQueueSummary';
import PrioritySection from './PrioritySection';
import RunsList from './RunsList';

export default function Sidebar({
  market,
  onMarketChange,
  manifest,
  refStatus,
  jobStatus,
  runs,
  activeRunId,
  onSelectRun,
  onDeleteRun,
  selectedView,
  onSelectView,
}) {
  if (!manifest) {
    return (
      <aside className="w-[260px] bg-surface border-r border-border flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="p-4">
          <MarketSelector selected={market} onChange={onMarketChange} />
        </div>
        <div className="px-4 py-8 text-center">
          <p className="text-xs text-neutral-500">No manifest loaded</p>
        </div>
      </aside>
    );
  }

  // Build job groups for the priority-1 section.
  // Path 2 (adaptation) groups by audience_id.
  // Path 1 (production) groups by deliverable_id.
  // Fallback: single "All Jobs" group.
  const audienceGroups = {};
  const hasAudienceIds = manifest.jobs.some((j) => j.audience_id);
  const hasDeliverableIds = manifest.jobs.some((j) => j.deliverable_id);

  for (const job of manifest.jobs) {
    let groupId, groupName;
    if (hasAudienceIds) {
      groupId = job.audience_id || 'default';
      groupName = job.audience_name || groupId;
    } else if (hasDeliverableIds) {
      groupId = job.deliverable_id || 'default';
      groupName = job.deliverable_id || 'Jobs';
    } else {
      groupId = 'all';
      groupName = 'All Jobs';
    }
    if (!audienceGroups[groupId]) {
      audienceGroups[groupId] = {
        audience_id: groupId,
        audience_name: groupName,
        jobs: [],
      };
    }
    audienceGroups[groupId].jobs.push(job);
  }

  // Build audience-level statuses (complete if all jobs complete)
  const audienceStatuses = {};
  for (const [audId, group] of Object.entries(audienceGroups)) {
    const allComplete = group.jobs.every((j) => jobStatus[j.job_id]?.status === 'complete');
    const anyRunning = group.jobs.some((j) => jobStatus[j.job_id]?.status === 'running');
    const anyFailed = group.jobs.some((j) => jobStatus[j.job_id]?.status === 'failed');
    audienceStatuses[audId] = {
      status: allComplete ? 'complete' : anyRunning ? 'running' : anyFailed ? 'failed' : 'pending',
    };
  }

  return (
    <aside className="w-[260px] bg-surface border-r border-border flex flex-col flex-shrink-0 overflow-y-auto">
      {/* Market */}
      <div className="p-4 border-b border-border">
        <MarketSelector selected={market} onChange={onMarketChange} />
      </div>

      {/* Job Queue */}
      <div className="p-4 space-y-4 flex-1">
        <JobQueueSummary
          refCount={manifest.reference_images.length}
          jobCount={manifest.jobs.length}
        />

        {/* References */}
        <PrioritySection
          title="References"
          items={manifest.reference_images}
          statuses={refStatus}
          selected={selectedView === 'refs' ? 'refs' : null}
          onSelect={() => onSelectView('refs')}
        />

        {/* Batch Creation */}
        <PrioritySection
          title="Batch Creation"
          items={Object.values(audienceGroups)}
          statuses={audienceStatuses}
          selected={selectedView !== 'refs' && audienceGroups[selectedView] ? selectedView : null}
          onSelect={(audId) => onSelectView(audId)}
        />
      </div>

      {/* Runs */}
      <div className="p-4 border-t border-border">
        <RunsList runs={runs} activeRunId={activeRunId} onSelect={onSelectRun} onDelete={onDeleteRun} />
      </div>
    </aside>
  );
}
