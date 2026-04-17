/**
 * Upload dispatcher — detects Vayner vs Nyan Cat CSV format, parses, scores,
 * and returns ranked trends.
 */

import { parseCSV, detectFormat } from '../analysis/csv.js';
import { parseVaynerRows } from '../analysis/parseVayner.js';
import { parseNyanCatRows } from '../analysis/parseNyanCat.js';
import { rankTrends, DEFAULT_SCORING_CONFIG } from '../ranking/calculate.js';

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
