import { useEffect, useState } from 'react';
import { Save, RotateCcw, Info } from 'lucide-react';
import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from '@/types';
import { getRankingConfig, updateRankingConfig } from '@/services/api';

type NumberField = {
  label: string;
  description: string;
  path: (keyof ScoringConfig | string)[];
  step?: number;
  min?: number;
  max?: number;
};

const SECTIONS: Array<{ title: string; description: string; fields: NumberField[] }> = [
  {
    title: 'Velocity Multiplier',
    description: 'Multiplier applied based on Vayner Trend Velocity tag.',
    fields: [
      { label: 'Trending', description: 'Applied when Trend Velocity = Trending', path: ['velocity', 'trending'], step: 0.1 },
      { label: 'Emerging', description: 'Applied when Trend Velocity = Emerging', path: ['velocity', 'emerging'], step: 0.1 },
      { label: 'Niche', description: 'Applied when Trend Velocity = Niche', path: ['velocity', 'niche'], step: 0.1 },
    ],
  },
  {
    title: 'Breakout Multiplier',
    description: 'Boost based on views relative to creator subs.',
    fields: [
      { label: 'Heavy multiplier', description: 'Applied when views > subs × threshold', path: ['breakout', 'heavyMultiplier'], step: 0.1 },
      { label: 'Light multiplier', description: 'Applied when views > subs', path: ['breakout', 'lightMultiplier'], step: 0.1 },
      { label: 'Base multiplier', description: 'Applied otherwise', path: ['breakout', 'baseMultiplier'], step: 0.1 },
      { label: 'Heavy threshold', description: 'Multiple of subs for "heavy" breakout', path: ['breakout', 'heavyThreshold'], step: 1, min: 1 },
    ],
  },
  {
    title: 'Participation & Replicability',
    description: 'How trend scale and creation complexity affect the score.',
    fields: [
      { label: 'Creation-Led scale', description: 'Applied to Creation-Led / Creator-Led trends', path: ['scale', 'creatorLed'], step: 0.1 },
      { label: 'Viewer-led scale', description: 'Applied to Viewer-led trends', path: ['scale', 'viewerLed'], step: 0.1 },
      { label: 'Easy complexity', description: 'Easy or Low complexity', path: ['complexity', 'easy'], step: 0.1 },
      { label: 'Medium complexity', description: 'Medium complexity', path: ['complexity', 'medium'], step: 0.1 },
      { label: 'Hard complexity', description: 'Hard complexity', path: ['complexity', 'hard'], step: 0.1 },
    ],
  },
  {
    title: 'Distribution & Ubiquity',
    description: 'Boost per platform and per market the trend appears in.',
    fields: [
      { label: 'Per-platform boost', description: 'Added per platform listed (e.g. 0.2 = +20% per platform)', path: ['distribution', 'perPlatformBoost'], step: 0.05 },
      { label: 'Per-market boost', description: 'Added per primary market listed', path: ['distribution', 'perMarketBoost'], step: 0.05 },
    ],
  },
  {
    title: 'Freshness',
    description: 'Reward trends caught early; penalize stale ones.',
    fields: [
      { label: 'Recent days threshold', description: 'If identified within N days of publication, apply 1 + 1/days boost', path: ['freshness', 'recentDays'], step: 1, min: 1 },
      { label: 'Stale days threshold', description: 'Beyond N days, apply stale penalty', path: ['freshness', 'staleDays'], step: 1, min: 1 },
      { label: 'Stale penalty', description: 'Multiplier applied when stale', path: ['freshness', 'stalePenalty'], step: 0.05, max: 1 },
    ],
  },
  {
    title: 'Quality & Origin',
    description: 'Downweight Potential AI Slop and boost YT Shorts origin.',
    fields: [
      { label: 'Potential AI Slop multiplier', description: 'Applied to trends flagged Potential AI Slop', path: ['quality', 'potentialSlopMultiplier'], step: 0.05, max: 1 },
      { label: 'YT Shorts origin boost', description: 'Applied when Platform Origin includes YT Shorts', path: ['origin', 'youtubeShortsBoost'], step: 0.1 },
    ],
  },
];

function getPath(obj: any, path: string[]): number {
  return path.reduce((acc, k) => (acc == null ? acc : acc[k]), obj) ?? 0;
}

function setPath(obj: any, path: string[], value: number): ScoringConfig {
  const next = JSON.parse(JSON.stringify(obj));
  let cursor = next;
  for (let i = 0; i < path.length - 1; i++) cursor = cursor[path[i]];
  cursor[path[path.length - 1]] = value;
  return next;
}

export function ScoringSettings() {
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG);
  const [initial, setInitial] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRankingConfig()
      .then((res) => {
        if (cancelled) return;
        setConfig(res.config);
        setInitial(res.config);
      })
      .catch(() => {
        // Offline / backend unavailable — fall back to defaults silently.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateValue = (path: string[], value: number) => {
    setConfig((prev) => {
      const next = setPath(prev, path, value);
      setHasChanges(true);
      return next;
    });
  };

  const toggleSlopHidden = () => {
    setConfig((prev) => ({ ...prev, quality: { ...prev.quality, slopHidden: !prev.quality.slopHidden } }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await updateRankingConfig(config);
      setInitial(res.config);
      setConfig(res.config);
      setHasChanges(false);
      setNotice('Scoring config saved — ranking will update on next upload.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_SCORING_CONFIG);
    setHasChanges(JSON.stringify(DEFAULT_SCORING_CONFIG) !== JSON.stringify(initial));
  };

  return (
    <div className="max-w-4xl">
      {/* Info Banner */}
      <div className="mb-6 p-4 bg-card border border-border rounded-lg flex gap-3">
        <Info className="size-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-foreground font-medium mb-1">ERS — External Ranking Score</h4>
          <p className="text-muted-foreground text-sm">
            Adjust the multipliers below to tune how trends are ranked. The ERS
            pipeline first applies hard filters (Brand Safe=No, User
            Sentiment=Negative, Content Quality=AI Slop → score 0, hidden by
            default) then combines the multipliers below with the base impact
            score (true engagement rate × breakout multiplier).
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 p-3 rounded-lg border border-green-500/50 bg-green-500/10 text-green-600 text-sm">
          {notice}
        </div>
      )}

      {/* Sections */}
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-6 bg-card border border-border rounded-lg p-5">
          <div className="mb-4">
            <h4 className="text-foreground font-medium mb-1">{section.title}</h4>
            <p className="text-muted-foreground text-sm">{section.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field) => {
              const path = field.path as string[];
              const value = getPath(config, path);
              return (
                <div key={path.join('.')} className="p-3 rounded-lg bg-muted">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {field.label}
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">{field.description}</p>
                  <input
                    type="number"
                    step={field.step ?? 0.01}
                    min={field.min}
                    max={field.max}
                    value={value}
                    onChange={(e) => updateValue(path, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Toggle: slop hidden */}
      <div className="mb-6 bg-card border border-border rounded-lg p-5 flex items-center justify-between">
        <div>
          <h4 className="text-foreground font-medium mb-1">Hide AI Slop by default</h4>
          <p className="text-muted-foreground text-sm">
            When on, trends tagged AI Slop are hidden from dashboards. Turn off to
            include them in the ranking regardless.
          </p>
        </div>
        <button
          onClick={toggleSlopHidden}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            config.quality.slopHidden ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              config.quality.slopHidden ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-opacity ${
            !hasChanges || saving
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          <Save className="size-5" />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
        >
          <RotateCcw className="size-5" />
          Reset to Defaults
        </button>
      </div>

      {/* ERS Formula explainer */}
      <div className="mt-8 p-5 bg-muted rounded-lg">
        <h4 className="text-foreground font-medium mb-3">ERS Formula</h4>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
{`base_score = (likes + comments) / max(views, 1) * 100 * breakout_mult
context_bonus = scale × complexity × distribution × market × freshness × quality × origin
ERS = base_score × velocity × context_bonus

Hard filters → ERS = null (hidden):
  Brand Safe = No
  User Sentiment = Negative
  Content Quality = AI Slop

Soft filters → ERS reduced but visible with review pill:
  Content Quality = Potential AI Slop (× ${config.quality.potentialSlopMultiplier})`}
        </pre>
      </div>
    </div>
  );
}
