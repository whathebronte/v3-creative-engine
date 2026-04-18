import SubjectCard from './SubjectCard';
import PriorityGate from './PriorityGate';

export default function ReferenceView({ refs, refStatus, allRefsComplete, onGenerate, onGenerateAll, onViewPrompt, onView, selectedItemId }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Reference Images</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {refs.length} subjects &middot; must complete before jobs unlock
          </p>
        </div>
        <button
          onClick={onGenerateAll}
          disabled={allRefsComplete}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            allRefsComplete
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              : 'bg-accent text-white hover:bg-accent-hover'
          }`}
        >
          Generate all references
        </button>
      </div>

      {/* Priority gate banner */}
      {!allRefsComplete && <PriorityGate />}

      {/* Cards grid */}
      <div className="space-y-3">
        {refs.map((ref) => (
          <SubjectCard
            key={ref.ref_id}
            item={ref}
            status={refStatus[ref.ref_id]}
            isRef
            isLocked={false}
            onGenerate={onGenerate}
            onViewPrompt={onViewPrompt}
            onView={onView}
            isSelected={selectedItemId === ref.ref_id}
          />
        ))}
      </div>
    </div>
  );
}
