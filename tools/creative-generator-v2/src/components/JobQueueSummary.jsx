export default function JobQueueSummary({ refCount, jobCount }) {
  return (
    <div className="flex items-center justify-between px-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-white">Job Queue</span>
      <span className="text-xs text-neutral-300">
        {refCount} refs &middot; {jobCount} jobs
      </span>
    </div>
  );
}
