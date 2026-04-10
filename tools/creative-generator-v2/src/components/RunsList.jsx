import { useState } from 'react';
import { FolderOpen, Sparkles, Pencil, Trash2, X } from 'lucide-react';

export default function RunsList({ runs, activeRunId, onSelect, onDelete }) {
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between px-1 py-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-white">Archive</span>
        {runs.length > 0 && (
          <button
            onClick={() => setEditing(!editing)}
            className="text-neutral-400 hover:text-white transition-colors"
            title={editing ? 'Done editing' : 'Edit archive'}
          >
            {editing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3 h-3" />}
          </button>
        )}
      </div>

      {runs.length === 0 ? (
        <p className="text-[10px] text-neutral-500 px-2 py-2">No archived runs yet</p>
      ) : (
        <div className="space-y-1">
          {runs.map((run) => {
            const isActive = run.id === activeRunId;
            const Icon = run.type === 'create' ? Sparkles : FolderOpen;
            return (
              <div
                key={run.id}
                className={`flex items-center gap-1 rounded transition-colors ${
                  isActive
                    ? 'bg-surface-raised border border-border'
                    : 'hover:bg-surface-raised/50'
                }`}
              >
                <button
                  onClick={() => onSelect(run.id)}
                  className="flex-1 flex items-start gap-2 px-2 py-2 text-left min-w-0"
                >
                  <Icon className="w-3.5 h-3.5 text-white mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {run.type === 'create' ? 'Create' : 'Adapt'}
                    </div>
                    <div className="text-[10px] text-neutral-300 truncate">{run.label}</div>
                  </div>
                </button>

                {editing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(run.id);
                    }}
                    className="px-2 py-2 text-neutral-500 hover:text-red-400 transition-colors flex-shrink-0"
                    title="Delete run"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
