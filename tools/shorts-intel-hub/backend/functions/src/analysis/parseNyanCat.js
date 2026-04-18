/**
 * Nyan Cat CSV parser — video-level data.
 * Aggregates by audio_id into trend-level rows, then infers quality & safety
 * from per-video signals:
 *   - elmo_bucket = LOW_RISK/UNKNOWN anywhere → brandSafe=false
 *   - avg visual_quality_score < 0.45 → contentQuality=potentiallyAISlop
 *   - avg visual_quality_score < 0.3 → contentQuality=aiSlop (hard filter)
 */

const AGE_BUCKET_MAP = {
  AGE_13_17: '13-17',
  AGE_18_24: '18-24',
  AGE_25_34: '25-34',
  AGE_35_44: '35-44',
  AGE_45_54: '45+',
};

const GENDER_MAP = { f: 'Females', m: 'Males' };

const COUNTRY_MAP = {
  JP: 'JP',
  KR: 'KR',
  IN: 'IN',
  ID: 'ID',
  AU: 'AUNZ',
  NZ: 'AUNZ',
};

const num = (v, fallback = 0) => {
  if (v === null || v === undefined || v === '' || v === 'null') return fallback;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : fallback;
};

const slug = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const dominantDemo = (rows) => {
  const counts = {};
  for (const r of rows) {
    const gender = GENDER_MAP[String(r.creator_gender ?? '').toLowerCase()];
    const age = AGE_BUCKET_MAP[r.creator_age_bucket];
    if (!gender || !age) continue;
    const key = `${gender} ${age}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries.length ? entries[0][0] : 'All Demographics';
};

const dominantCountry = (rows) => {
  const counts = {};
  for (const r of rows) {
    const c = COUNTRY_MAP[r.shorts_video_upload_country];
    if (!c) continue;
    counts[c] = (counts[c] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries.length ? entries[0][0] : undefined;
};

/**
 * Group video rows by audio_id and compute aggregates.
 */
export function parseNyanCatRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = row.audio_id || row.Song_title;
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  return Array.from(groups.entries()).map(([audioId, videos], idx) => {
    const first = videos[0];
    const songTitle = String(first.Song_title ?? '').trim() || `Sound ${audioId}`;

    // Sum-aggregate metrics from 3-day windows
    const totalViews = videos.reduce((s, v) => s + num(v.Views_3D), 0);
    const totalWatchtime = videos.reduce((s, v) => s + num(v.watch_time_hour_3D), 0);
    const totalEngagement = videos.reduce((s, v) => s + num(v.engagement_3D), 0);
    const totalCreations = videos.reduce((s, v) => s + num(v.downstream_uploads_3d_by_shorts_video_published_date), 0);
    const totalSubs = videos.reduce((s, v) => s + num(v.Total_followers_at_video_published_date), 0);

    // Average quality scores
    const visualScores = videos.map((v) => num(v.visual_quality_score, NaN)).filter(Number.isFinite);
    const audioScores = videos.map((v) => num(v.audio_quality_score, NaN)).filter(Number.isFinite);
    const avgVisual = visualScores.length
      ? visualScores.reduce((a, b) => a + b, 0) / visualScores.length
      : null;
    const avgAudio = audioScores.length
      ? audioScores.reduce((a, b) => a + b, 0) / audioScores.length
      : null;

    // Worst-case brand safety: if any video flags LOW_RISK or worse, trend is unsafe
    const elmoBuckets = videos.map((v) => String(v.elmo_bucket ?? '').toUpperCase());
    const anyUnsafe = elmoBuckets.some((b) => b && b !== 'TRUSTED' && b !== 'LOW_RISK');
    const allTrusted = elmoBuckets.every((b) => b === 'TRUSTED');
    const brandSafe = allTrusted ? true : !anyUnsafe;

    // Content quality from visual score
    let contentQuality = 'good';
    if (avgVisual !== null) {
      if (avgVisual < 0.3) contentQuality = 'aiSlop';
      else if (avgVisual < 0.45) contentQuality = 'potentiallyAISlop';
    }

    // Hashtags union (dedup, cap at 20)
    const hashtagSet = new Set();
    for (const v of videos) {
      const raw = v.Hashtags;
      if (!raw) continue;
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) parsed.forEach((h) => hashtagSet.add(String(h).trim()));
      } catch {
        // Some rows may have bare "[]" or malformed JSON; ignore.
      }
    }

    // Freshest publication date drives dateIdentified
    const dates = videos
      .map((v) => v.shorts_video_published_date)
      .filter(Boolean)
      .sort();
    const publicationDate = dates[dates.length - 1] || undefined;

    const market = dominantCountry(videos);
    const targetDemo = dominantDemo(videos);
    const description = videos.length > 1
      ? `Sound "${songTitle}" powering ${videos.length} viral Shorts. ${totalCreations.toLocaleString()} downstream uploads in 3 days.`
      : String(first.title ?? `Sound: ${songTitle}`).slice(0, 240);

    return {
      id: `nyancat-${slug(songTitle)}-${idx}`,
      topicName: songTitle,
      description,
      targetDemo,
      referenceLink: first.Shorts_link || first.Song_link || '',
      hashtags: Array.from(hashtagSet).slice(0, 20),
      audio: songTitle,
      source: 'Nyan Cat',

      // Quality & safety (derived)
      contentQuality,
      brandSafe,
      sentiment: 'positive', // Nyan Cat feed has no sentiment; assume neutral-positive

      // Trend analytics — map Nyan Cat signals into ERS-compatible fields
      trendVelocity: totalCreations > 100 ? 'Trending' : totalCreations > 30 ? 'Emerging' : 'Niche',
      trendScale: totalCreations >= 10 ? 'Creation-Led' : 'Viewer-led',
      platformsTrending: ['YT Shorts'],
      platformOrigin: 'YT Shorts',
      primaryMarkets: market ? [market] : undefined,
      genAI: false,

      // Raw metrics for ERS
      views: totalViews,
      likes: Math.round(totalEngagement * 0.8), // engagement field ~= likes+comments; split 80/20
      comments: Math.round(totalEngagement * 0.2),
      creatorSubs: totalSubs,
      publicationDate,
      dateIdentified: new Date().toISOString().slice(0, 10),

      // Context
      viewsVolume: formatCompact(totalViews),
      watchtimeVolume: formatCompact(totalWatchtime),
      creationRate: `${totalCreations}`,

      // Extra metadata
      avgVisualQuality: avgVisual,
      avgAudioQuality: avgAudio,
      videoCount: videos.length,
      audioId,

      // Legacy fields used by existing UI
      rank: 0,
      score: 0,
      velocity: 'stable',
      ageInWeeks: 0,
    };
  });
}

function formatCompact(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}
