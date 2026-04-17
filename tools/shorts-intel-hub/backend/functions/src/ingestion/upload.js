/**
 * Upload dispatcher — detects Vayner vs Nyan Cat CSV format, parses, scores,
 * and returns ranked trends.
 */

import { parseCSV, detectFormat } from '../analysis/csv.js';
import { parseVaynerRows } from '../analysis/parseVayner.js';
import { parseNyanCatRows } from '../analysis/parseNyanCat.js';
import { rankTrends, DEFAULT_SCORING_CONFIG } from '../ranking/calculate.js';
import { matchTopics } from '../analysis/matchTopics.js';

/**
 * Accepts raw CSV text, detects the source format, normalizes rows, applies
 * ERS, and returns { format, trends, stats }.
 */
export function processUpload(csvText, config = DEFAULT_SCORING_CONFIG) {
  const { headers, rows } = parseCSV(csvText);
  const format = detectFormat(headers);

  let normalized = [];
  if (format === 'vayner') {
    normalized = parseVaynerRows(rows);
  } else if (format === 'nyancat') {
    normalized = parseNyanCatRows(rows);
  } else {
    throw new Error(
      `Unrecognized CSV format. Expected Vayner (Topic Name, Trend Velocity, Content Quality) or Nyan Cat (external_video_id, audio_id) headers.`
    );
  }

  const ranked = rankTrends(normalized, config);
  const stats = {
    total: ranked.length,
    visible: ranked.filter((t) => !t.hidden).length,
    hidden: ranked.filter((t) => t.hidden).length,
    forQualityReview: ranked.filter((t) => t.contentQuality === 'potentiallyAISlop').length,
  };

  return { format, trends: ranked, stats };
}

/**
 * Legacy signature — kept for callers that pass a file buffer.
 */
export async function handleUpload(file, _source, _market) {
  const text = typeof file === 'string' ? file : file?.toString('utf8') ?? '';
  return processUpload(text);
}

/**
 * Dual-CSV batch: parse Nyan Cat + Vayner, run topic matching, split into
 * three tracks (internal-only, matching, external-only), and rank each.
 *
 * Returns:
 *   {
 *     internal:  [ranked trends only in Nyan Cat],
 *     matching:  [{ internal, external, matchScore, matchStage }],
 *     external:  [ranked trends only in Vayner],
 *     stats:     { ... }
 *   }
 */
export async function processBatch({ nyanCatCsv, vaynerCsv, config = DEFAULT_SCORING_CONFIG, matchOpts = {} }) {
  if (!nyanCatCsv && !vaynerCsv) {
    throw new Error('processBatch requires at least one of nyanCatCsv or vaynerCsv');
  }

  const internalTrends = nyanCatCsv ? parseNyanCatRows(parseCSV(nyanCatCsv).rows) : [];
  const externalTrends = vaynerCsv ? parseVaynerRows(parseCSV(vaynerCsv).rows) : [];

  const { matches, internalOnlyIds, externalOnlyIds } = await matchTopics(
    internalTrends,
    externalTrends,
    matchOpts
  );

  const internalById = new Map(internalTrends.map((t) => [t.id, t]));
  const externalById = new Map(externalTrends.map((t) => [t.id, t]));

  const internalOnly = rankTrends(internalOnlyIds.map((id) => internalById.get(id)), config);
  const externalOnly = rankTrends(externalOnlyIds.map((id) => externalById.get(id)), config);

  // Matching: rank the union (internal + external copies), then pair them up preserving combined rank order.
  const matchingPairs = matches.map((m) => {
    const i = internalById.get(m.internalId);
    const e = externalById.get(m.externalId);
    return { internal: i, external: e, matchScore: m.score, matchStage: m.stage };
  });

  // Rank matching track by combined ERS (internal + external) so most impactful overlap floats up.
  const rankedInternalInMatches = rankTrends(matchingPairs.map((p) => p.internal), config);
  const rankedExternalInMatches = rankTrends(matchingPairs.map((p) => p.external), config);

  const rankedIntById = new Map(rankedInternalInMatches.map((t) => [t.id, t]));
  const rankedExtById = new Map(rankedExternalInMatches.map((t) => [t.id, t]));

  const matchingRanked = matchingPairs
    .map((p) => {
      const i = rankedIntById.get(p.internal.id) ?? p.internal;
      const e = rankedExtById.get(p.external.id) ?? p.external;
      const combinedScore = (i.ers ?? 0) + (e.ers ?? 0);
      return { ...p, internal: i, external: e, combinedScore };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .map((p, idx) => ({ ...p, rank: idx + 1 }));

  return {
    internal: internalOnly,
    matching: matchingRanked,
    external: externalOnly,
    stats: {
      internalParsed: internalTrends.length,
      externalParsed: externalTrends.length,
      matched: matches.length,
      matchedByKeyword: matches.filter((m) => m.stage === 'keyword').length,
      matchedBySemantic: matches.filter((m) => m.stage === 'semantic').length,
      internalOnly: internalOnly.length,
      externalOnly: externalOnly.length,
    },
  };
}
