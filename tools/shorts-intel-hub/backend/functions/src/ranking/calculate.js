/**
 * External Ranking Score (ERS)
 *
 * Ported 1:1 from the Python reference calculate_ers. All multipliers read
 * from ScoringConfig so the Scoring Settings UI is the source of truth.
 */

export const DEFAULT_SCORING_CONFIG = {
  velocity: { trending: 2.5, emerging: 1.5, niche: 1.0 },
  breakout: {
    heavyMultiplier: 1.5,
    lightMultiplier: 1.2,
    baseMultiplier: 1.0,
    heavyThreshold: 5,
  },
  scale: { creatorLed: 1.5, viewerLed: 1.0 },
  complexity: { easy: 1.5, medium: 1.2, hard: 1.0 },
  distribution: { perPlatformBoost: 0.2, perMarketBoost: 0.15 },
  freshness: { recentDays: 7, staleDays: 30, stalePenalty: 0.8 },
  quality: { potentialSlopMultiplier: 0.6, slopHidden: true },
  origin: { youtubeShortsBoost: 1.2 },
};

const num = (v, fallback = 0) => {
  if (v === null || v === undefined || v === '') return fallback;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : fallback;
};

const lower = (v) => String(v ?? '').trim().toLowerCase();

const splitList = (v) => {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return String(v ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
};

const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Returns { ers, hidden, hiddenReason } for a trend row.
 *
 * Hard filters (Brand Safe=No, Sentiment=Negative, Content Quality=AI Slop)
 * return ers=null + hidden=true. Potential AI Slop is surfaced but scored
 * lower — not hidden — so it can get the "For quality review" pill.
 */
export function calculateERS(row, config = DEFAULT_SCORING_CONFIG) {
  const brandSafe = lower(row['Brand Safe'] ?? row.brandSafe);
  const sentiment = lower(row['User Sentiment'] ?? row.sentiment);
  const contentQuality = lower(row['Content Quality'] ?? row.contentQuality);

  // 1. Hard filters
  if (
    brandSafe === 'no' ||
    brandSafe === 'false' ||
    sentiment === 'negative' ||
    contentQuality === 'ai slop' ||
    contentQuality === 'aislop'
  ) {
    const reasons = [];
    if (brandSafe === 'no' || brandSafe === 'false') reasons.push('non-brand-safe');
    if (sentiment === 'negative') reasons.push('negative-sentiment');
    if (contentQuality === 'ai slop' || contentQuality === 'aislop')
      reasons.push('ai-slop');
    return { ers: null, hidden: true, hiddenReason: reasons.join(', ') };
  }

  // 2. Base impact score
  const views = num(row.Views ?? row.views);
  const likes = num(row.Likes ?? row.likes);
  const comments = num(row.Comments ?? row.comments);
  const subs = num(row['Creator Subs'] ?? row['Creator Subscriber Count'] ?? row.creatorSubs, 1);

  const trueER = (likes + comments) / Math.max(views, 1);

  let breakoutMult;
  if (views > subs * config.breakout.heavyThreshold) breakoutMult = config.breakout.heavyMultiplier;
  else if (views > subs) breakoutMult = config.breakout.lightMultiplier;
  else breakoutMult = config.breakout.baseMultiplier;

  const baseScore = trueER * 100 * breakoutMult;

  // 3. Velocity
  const velocityStr = String(row['Trend Velocity'] ?? row.trendVelocity ?? 'Niche')
    .trim()
    .toLowerCase();
  let velocityMult;
  if (velocityStr === 'trending') velocityMult = config.velocity.trending;
  else if (velocityStr === 'emerging') velocityMult = config.velocity.emerging;
  else velocityMult = config.velocity.niche;

  // 4. Participation & replicability
  const trendScale = String(row['Trend Scale'] ?? row.trendScale ?? '').toLowerCase();
  // Python matches "Creator-Led" (typo'd from "Creation-Led" in the CSV). Accept both.
  const scaleMult =
    trendScale.includes('creation-led') || trendScale.includes('creator-led')
      ? config.scale.creatorLed
      : config.scale.viewerLed;

  const complexity = String(row['Creation Complexity'] ?? row.creationComplexity ?? '')
    .trim()
    .toLowerCase();
  let compMult;
  if (complexity === 'easy' || complexity === 'low') compMult = config.complexity.easy;
  else if (complexity === 'medium') compMult = config.complexity.medium;
  else compMult = config.complexity.hard;

  // 5. Distribution & ubiquity
  const platforms = splitList(row['Platforms Trending'] ?? row.platformsTrending);
  const platformCount = platforms.length || 1;
  const distMult = 1 + config.distribution.perPlatformBoost * platformCount;

  const markets = splitList(row['Primary Markets'] ?? row.primaryMarkets);
  const marketCount = markets.length || 1;
  const marketMult = 1 + config.distribution.perMarketBoost * marketCount;

  // 6. Freshness
  let freshnessMult = 1.0;
  const dateIdentified = parseDate(row['Date Identified'] ?? row.dateIdentified);
  const pubDate = parseDate(row['Publication Date'] ?? row.publicationDate);
  if (dateIdentified && pubDate) {
    const daysToIdentify = Math.max(
      Math.round((dateIdentified.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24)),
      1
    );
    if (daysToIdentify <= config.freshness.recentDays) {
      freshnessMult = 1 + 1.0 / daysToIdentify;
    } else if (daysToIdentify > config.freshness.staleDays) {
      freshnessMult = config.freshness.stalePenalty;
    }
  }

  // 7. Quality & origin
  const qualityMult =
    contentQuality === 'potential ai slop' || contentQuality === 'potentiallyaislop'
      ? config.quality.potentialSlopMultiplier
      : 1.0;

  const origins = splitList(row['Platform Origin'] ?? row.platformOrigin).map(lower);
  const originMult =
    origins.includes('yt shorts') || origins.includes('youtube shorts')
      ? config.origin.youtubeShortsBoost
      : 1.0;

  // Final ERS
  const contextBonus =
    scaleMult * compMult * distMult * marketMult * freshnessMult * qualityMult * originMult;
  const finalERS = baseScore * velocityMult * contextBonus;

  return {
    ers: Math.round(finalERS * 100) / 100,
    hidden: false,
    hiddenReason: null,
  };
}

/**
 * Batch: compute ERS for every row then attach rank by descending ERS.
 * Hidden rows get rank = null but remain in the list.
 */
export function rankTrends(rows, config = DEFAULT_SCORING_CONFIG) {
  const scored = rows.map((row) => {
    const result = calculateERS(row, config);
    return { ...row, ...result };
  });

  const visible = scored
    .filter((r) => !r.hidden && r.ers !== null)
    .sort((a, b) => (b.ers ?? 0) - (a.ers ?? 0));

  visible.forEach((r, i) => {
    r.rank = i + 1;
    r.score = r.ers;
  });

  const hidden = scored
    .filter((r) => r.hidden || r.ers === null)
    .map((r) => ({ ...r, rank: null, score: 0 }));

  return [...visible, ...hidden];
}

// Back-compat alias used by scheduler/other callers.
export async function calculateRankings(_market, _gender, _age) {
  return { ranked: [], updated: 0 };
}
