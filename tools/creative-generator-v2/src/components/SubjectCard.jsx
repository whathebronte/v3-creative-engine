import { Image, Film, Eye } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function SubjectCard({ item, status, isRef, isLocked, onGenerate, onViewPrompt, onView, isSelected }) {
  const statusValue = status?.status || 'pending';
  const isFailed = statusValue === 'failed';
  const isDisabled = isLocked || statusValue === 'blocked' || statusValue === 'running';
  const isComplete = statusValue === 'complete';
  const isVideo = item.asset_type === 'video';
  const title = item.subject_label || item.element || item.job_id;
  const id = item.ref_id || item.job_id;

  // Metadata line
  const metaParts = [id];
  if (item.audience_name) metaParts.push(item.audience_name);
  if (item.style?.resolution) metaParts.push(item.style.resolution);
  if (item.style?.aspect_ratio) metaParts.push(item.style.aspect_ratio);
  if (item.style?.duration_seconds) metaParts.push(`${item.style.duration_seconds}s`);

  return (
    <div className={`bg-surface border rounded-lg overflow-hidden transition-colors ${
      isSelected ? 'border-accent' : 'border-border hover:border-neutral-600'
    }`}>
      <div className="p-4">
        {/* Top row: icon + title + status */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-raised flex items-center justify-center flex-shrink-0">
            {isVideo ? (
              <Film className="w-4.5 h-4.5 text-neutral-400" />
            ) : (
              <Image className="w-4.5 h-4.5 text-neutral-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className={`text-sm font-medium truncate ${
                isComplete ? 'text-white hover:text-accent cursor-pointer' : 'text-white'
              }`}
              onClick={() => isComplete && onView?.(item)}
            >
              {title}
            </h4>
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5 truncate">
              {metaParts.join(' \u00B7 ')}
            </p>
          </div>
        </div>

        {/* Description (truncated prompt) */}
        <p className="text-xs text-neutral-400 mt-2.5 line-clamp-2 leading-relaxed">
          {item.prompt}
        </p>

        {/* Actions row */}
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={() => onViewPrompt(item)}
            className="px-3 py-1.5 text-xs font-medium text-neutral-300 bg-surface-raised border border-border rounded-md hover:bg-surface-hover hover:text-white transition-colors"
          >
            Prompt
          </button>
          {isComplete && (
            <button
              onClick={() => onView?.(item)}
              className="px-3 py-1.5 text-xs font-medium text-neutral-300 bg-surface-raised border border-border rounded-md hover:bg-surface-hover hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3 h-3" />
              View
            </button>
          )}
          <button
            onClick={() => !isDisabled && onGenerate(id)}
            disabled={isDisabled}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isDisabled
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent-hover'
            }`}
          >
            Generate
          </button>
          <StatusBadge status={statusValue} />
        </div>
      </div>
    </div>
  );
}
