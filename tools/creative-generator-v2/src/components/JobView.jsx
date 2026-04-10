import SubjectCard from './SubjectCard';
import PriorityGate from './PriorityGate';

export default function JobView({ audienceName, jobs, jobStatus, refStatus, refsComplete, onGenerate, onViewPrompt, onView, selectedItemId }) {
  // Check if any ref dependency failed → mark jobs blocked
  const getEffectiveStatus = (job) => {
    const currentStatus = jobStatus[job.job_id] || { status: 'pending' };
    if (!refsComplete) return { ...currentStatus, status: 'pending' };
    const hasFailed = (job.ref_dependencies || []).some(
      (refId) => refStatus[refId]?.status === 'failed'
    );
    if (hasFailed) return { status: 'blocked', gcs_uri: null };
    return currentStatus;
  };

  // Group jobs by scene
  const scenes = {};
  for (const job of jobs) {
    const scene = job.scene_id || job.scene || 'default';
    if (!scenes[scene]) scenes[scene] = [];
    scenes[scene].push(job);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{audienceName}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {jobs.length} jobs &middot; {Object.keys(scenes).length} scenes
          </p>
        </div>
      </div>

      {!refsComplete && <PriorityGate />}

      {Object.entries(scenes).map(([sceneName, sceneJobs]) => (
        <div key={sceneName} className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 px-1">
            {sceneName.replace('_', ' ')}
          </h3>
          <div className="space-y-3">
            {sceneJobs.map((job) => (
              <SubjectCard
                key={job.job_id}
                item={job}
                status={getEffectiveStatus(job)}
                isRef={false}
                isLocked={!refsComplete}
                onGenerate={onGenerate}
                onViewPrompt={onViewPrompt}
                onView={onView}
                isSelected={selectedItemId === job.job_id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
