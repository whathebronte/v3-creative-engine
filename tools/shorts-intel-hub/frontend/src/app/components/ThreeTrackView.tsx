import { useRef, useState } from 'react';
import { Upload, Loader2, Sparkles, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import { TrendCard } from '@/app/components/TrendCard';
import { matchAndRank, type MatchAndRankResponse, type MatchPair } from '@/services/api';
import type { Trend } from '@/types';

interface FileSlotProps {
  label: string;
  accept: string;
  file: File | null;
  onPick: (f: File | null) => void;
  hint?: string;
}

function FileSlot({ label, accept, file, onPick, hint }: FileSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex-1 min-w-[240px]">
      <label className="block mb-2 text-foreground text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-card hover:border-primary/50 transition-colors">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent text-sm"
        >
          <Upload className="size-4" />
          Pick CSV
        </button>
        <span className="text-sm text-muted-foreground truncate">
          {file ? file.name : hint || 'No file chosen'}
        </span>
      </div>
    </div>
  );
}

function MatchingCard({ pair, onApprove, approvedIds }: {
  pair: MatchPair;
  onApprove: (id: string) => void;
  approvedIds: Set<string>;
}) {
  return (
    <div className="bg-card border border-cyan-500/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          #{pair.rank}
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs">
          <Link2 className="size-3" />
          Matched by {pair.matchStage} ({Math.round(pair.matchScore * 100)}%)
        </span>
        <div className="ml-auto text-right">
          <div className="text-lg font-bold text-foreground">{pair.combinedScore.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">Combined ERS</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs uppercase text-muted-foreground mb-2">Internal (Nyan Cat)</div>
          <TrendCard
            trend={pair.internal}
            onApprove={onApprove}
            isApproved={approvedIds.has(pair.internal.id)}
          />
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground mb-2">External (Vayner)</div>
          <TrendCard
            trend={pair.external}
            onApprove={onApprove}
            isApproved={approvedIds.has(pair.external.id)}
          />
        </div>
      </div>
    </div>
  );
}

function TrackSection({ title, subtitle, trends, onApprove, approvedIds, accentClass }: {
  title: string;
  subtitle: string;
  trends: Trend[];
  onApprove: (id: string) => void;
  approvedIds: Set<string>;
  accentClass: string;
}) {
  const [expanded, setExpanded] = useState(true);
  if (!trends.length) {
    return (
      <div className={`mb-6 p-5 rounded-lg border ${accentClass} bg-card`}>
        <h3 className="text-foreground font-medium mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <p className="mt-3 text-sm text-muted-foreground italic">No trends in this track.</p>
      </div>
    );
  }
  return (
    <div className={`mb-6 rounded-lg border ${accentClass} bg-card`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-foreground font-medium mb-1">{title} ({trends.length})</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {expanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {trends.map((t) => (
            <TrendCard
              key={t.id}
              trend={t}
              onApprove={onApprove}
              isApproved={approvedIds.has(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ThreeTrackView() {
  const [nyanCatFile, setNyanCatFile] = useState<File | null>(null);
  const [vaynerFile, setVaynerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchAndRankResponse | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);

  const handleApprove = (id: string) => setApprovedIds((prev) => new Set(prev).add(id));

  const handleRun = async () => {
    if (!nyanCatFile && !vaynerFile) {
      setError('Pick at least one CSV (ideally both for matching to work).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await matchAndRank(nyanCatFile, vaynerFile);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Matching failed');
    } finally {
      setLoading(false);
    }
  };

  const filterVisible = (trends: Trend[]) => showHidden ? trends : trends.filter((t) => !t.hidden);

  return (
    <div>
      {/* Uploader */}
      <div className="mb-6 p-5 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-primary" />
          <h3 className="text-foreground font-medium">Run Topic Matching + ERS</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Upload the Nyan Cat (internal) and Vayner (external) CSVs. The backend runs a two-stage
          matcher (keyword → semantic) and splits results into three ranked tracks.
        </p>
        <div className="flex flex-wrap gap-4 mb-4">
          <FileSlot
            label="Nyan Cat CSV (Internal)"
            accept=".csv,text/csv"
            file={nyanCatFile}
            onPick={setNyanCatFile}
            hint="video_id, audio_id, views, watchtime…"
          />
          <FileSlot
            label="Vayner CSV (External)"
            accept=".csv,text/csv"
            file={vaynerFile}
            onPick={setVaynerFile}
            hint="Topic Name, Trend Velocity, Content Quality…"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? 'Matching + ranking…' : 'Run Matching + Ranking'}
          </button>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
              className="size-4"
            />
            Show hidden trends
          </label>
        </div>
        {error && (
          <div className="mt-3 p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Stats strip */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Internal parsed" value={result.stats.internalParsed} />
            <Stat label="External parsed" value={result.stats.externalParsed} />
            <Stat
              label="Matched"
              value={result.stats.matched}
              sub={`${result.stats.matchedByKeyword} keyword · ${result.stats.matchedBySemantic} semantic`}
            />
            <Stat
              label="Unique to one source"
              value={result.stats.internalOnly + result.stats.externalOnly}
              sub={`${result.stats.internalOnly} internal · ${result.stats.externalOnly} external`}
            />
          </div>

          <div className="mb-6 rounded-lg border border-cyan-500/30 bg-card p-5">
            <h3 className="text-foreground font-medium mb-1">
              Matching Topics ({result.matching.length})
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              High rank internally AND externally — strongest signal. Shown as side-by-side pairs, sorted by combined ERS.
            </p>
            {result.matching.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No overlapping topics found.</p>
            ) : (
              <div className="space-y-4">
                {result.matching.map((pair) => (
                  <MatchingCard
                    key={`${pair.internal.id}::${pair.external.id}`}
                    pair={pair}
                    onApprove={handleApprove}
                    approvedIds={approvedIds}
                  />
                ))}
              </div>
            )}
          </div>

          <TrackSection
            title="Internal Only (Nyan Cat)"
            subtitle="High rank internally — not flagged by external source."
            trends={filterVisible(result.internal)}
            onApprove={handleApprove}
            approvedIds={approvedIds}
            accentClass="border-purple-500/30"
          />

          <TrackSection
            title="External Only (Vayner)"
            subtitle="High rank externally — not surfaced internally yet."
            trends={filterVisible(result.external)}
            onApprove={handleApprove}
            approvedIds={approvedIds}
            accentClass="border-cyan-500/30"
          />
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="p-4 rounded-lg bg-muted">
      <div className="text-xs uppercase text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
