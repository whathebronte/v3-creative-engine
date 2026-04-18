import { Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-neutral-700', text: 'text-neutral-300' },
  running: { label: 'Generating...', bg: 'bg-amber-900/50', text: 'text-amber-400', spin: true },
  complete: { label: 'Complete', bg: 'bg-emerald-900/50', text: 'text-emerald-400' },
  failed: { label: 'Failed', bg: 'bg-red-900/50', text: 'text-red-400' },
  blocked: { label: 'Blocked', bg: 'bg-red-900/30', text: 'text-red-400/60' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.spin && <Loader2 className="w-3 h-3 animate-spin-slow" />}
      {config.label}
    </span>
  );
}
