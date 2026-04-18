import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, X } from 'lucide-react';

export default function CreativePackagePanel({ content, onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  if (!content) return null;

  return (
    <div className="border-t-2 border-accent bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-semibold text-white hover:text-accent transition-colors"
        >
          <FileText className="w-4 h-4 text-accent" />
          Creative Package
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </button>
        <button
          onClick={onDismiss}
          className="text-neutral-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsible content */}
      {expanded && (
        <div className="px-4 pb-3">
          <div className="bg-surface-raised border border-border rounded-lg p-4 max-h-[300px] overflow-y-auto">
            <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
              {content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
