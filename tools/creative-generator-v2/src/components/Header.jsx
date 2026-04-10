import { Play, Link } from 'lucide-react';

export default function Header({ runId, hasCreativePackage }) {
  return (
    <header className="bg-black border-b border-border px-5 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <Play className="w-5 h-5 text-accent fill-accent" />
        <span className="text-lg font-semibold tracking-wide">Creative Generator</span>
      </div>
      <div className="flex items-center gap-3">
        {hasCreativePackage && (
          <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/30 px-2.5 py-1 rounded text-xs text-accent">
            <Link className="w-3 h-3" />
            <span>Agent Collective</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}
        {runId && (
          <span className="text-xs font-mono text-neutral-400 bg-surface px-3 py-1 rounded">
            {runId}
          </span>
        )}
      </div>
    </header>
  );
}
