import { X } from 'lucide-react';

export default function PromptViewer({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">
            {item.subject_label || `Job ${item.job_id}`}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Prompt
            </label>
            <p className="text-sm text-neutral-200 bg-surface-raised rounded-lg p-3 leading-relaxed">
              {item.prompt}
            </p>
          </div>

          {item.negative_prompt && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Negative Prompt
              </label>
              <p className="text-sm text-neutral-400 bg-surface-raised rounded-lg p-3 leading-relaxed">
                {item.negative_prompt}
              </p>
            </div>
          )}

          <div className="flex gap-4 text-xs text-neutral-500">
            <span>Model: <span className="text-neutral-300">{item.model}</span></span>
            {item.style?.aspect_ratio && (
              <span>Ratio: <span className="text-neutral-300">{item.style.aspect_ratio}</span></span>
            )}
            {item.style?.resolution && (
              <span>Res: <span className="text-neutral-300">{item.style.resolution}</span></span>
            )}
            {item.style?.duration_seconds && (
              <span>Duration: <span className="text-neutral-300">{item.style.duration_seconds}s</span></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
