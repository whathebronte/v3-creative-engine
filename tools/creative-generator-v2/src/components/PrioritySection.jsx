import { useState } from 'react';
import { ChevronRight, Image, Users } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function PrioritySection({ title, icon, items, statuses, selected, onSelect }) {
  const [expanded, setExpanded] = useState(true);

  const completedCount = items.filter((item) => {
    const id = item.ref_id || item.audience_id;
    const statusObj = statuses[id];
    return statusObj?.status === 'complete';
  }).length;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-1 py-1.5 text-left group"
      >
        <ChevronRight
          className={`w-3.5 h-3.5 text-white transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-white flex-1">
          {title}
        </span>
        <span className="text-xs text-neutral-300">
          {completedCount} / {items.length}
        </span>
      </button>

      {expanded && (
        <div className="ml-1 space-y-0.5">
          {items.map((item) => {
            const id = item.ref_id || item.audience_id;
            const label = item.subject_label || item.audience_name;
            const sublabel = item.audience_name || null;
            const statusObj = statuses[id] || { status: 'pending' };
            const isSelected = selected === id;

            return (
              <button
                key={id}
                onClick={() => onSelect(id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-surface-raised border border-border'
                    : 'hover:bg-surface-raised/50'
                }`}
              >
                <StatusDot status={statusObj.status} />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs text-white">{label}</div>
                  {sublabel && !item.ref_id && (
                    <div className="truncate text-[10px] text-neutral-500">{sublabel}</div>
                  )}
                </div>
                <StatusBadge status={statusObj.status} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    pending: 'bg-neutral-500',
    running: 'bg-amber-400',
    complete: 'bg-emerald-400',
    failed: 'bg-red-400',
    blocked: 'bg-red-400/50',
  };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] || colors.pending}`} />;
}
