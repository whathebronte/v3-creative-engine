import { AlertTriangle } from 'lucide-react';

export default function PriorityGate() {
  return (
    <div className="flex items-start gap-3 bg-amber-900/15 border border-amber-700/30 rounded-lg px-4 py-3 mb-4">
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-400">Priority gate.</p>
        <p className="text-xs text-amber-500/70 mt-0.5">
          All reference images must complete before jobs unlock. Generate them first, then move to the job queue.
        </p>
      </div>
    </div>
  );
}
