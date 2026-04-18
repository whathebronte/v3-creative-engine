/**
 * Vayner CSV parser — trend-level data, one row per trend.
 * Normalizes rows into the shared Trend shape expected by the frontend.
 */

const lower = (v) => String(v ?? '').trim().toLowerCase();

const splitList = (v) =>
  String(v ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const parseNumber = (v) => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

const mapContentQuality = (v) => {
  const s = lower(v);
  if (s === 'ai slop' || s === 'aislop') return 'aiSlop';
  if (s === 'potential ai slop' || s === 'potentially ai slop') return 'potentiallyAISlop';
  if (s === 'not ai slop' || s === '') return 'good';
  return 'good';
};

const mapSentiment = (v) => {
  const s = lower(v);
  if (s === 'negative') return 'negative';
  if (s === 'positive') return 'positive';
  if (s.includes('mix')) return 'mixed';
  if (s === 'neutral') return 'neutral';
  return undefined;
};

const mapVelocity = (v) => {
  const s = lower(v);
  if (s === 'trending') return 'Trending';
  if (s === 'emerging') return 'Emerging';
  if (s === 'niche') return 'Niche';
  return undefined;
};

const mapComplexity = (v) => {
  const s = lower(v);
  if (s === 'easy' || s === 'low') return 'Easy';
  if (s === 'medium') return 'Medium';
  if (s === 'hard') return 'Hard';
  return undefined;
};

const mapScale = (v) => {
  const s = lower(v);
  if (s.includes('creation-led') || s.includes('creator-led')) return 'Creation-Led';
  if (s.includes('viewer-led')) return 'Viewer-led';
  return undefined;
};

const slug = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/**
 * Parse Vayner rows into normalized trend objects.
 * The two-line Vayner header (where line 2 is a field hint) must be stripped
 * before calling this — pass only data rows keyed by the real header line.
 */
export function parseVaynerRows(rows) {
  return rows
    .filter((row) => {
      // Skip the descriptive hint row that follows the header
      const name = String(row['Topic Name'] ?? '').trim();
      return name && name !== 'Topic Name' && !name.startsWith('One liner');
    })
    .map((row, idx) => {
      const topicName = String(row['Topic Name'] ?? '').trim();
      const platforms = splitList(row['Platforms Trending']);
      const primaryMarkets = splitList(row['Primary Markets']);
      const secondaryMarkets = splitList(row['Secondary Markets']);
      const hashtagsField = row['Hashtags (comma-separated)'] ?? row['Hashtags'] ?? '';
      const hashtags = splitList(hashtagsField);
      const brandSafeRaw = lower(row['Brand Safe']);

      return {
        id: `vayner-${slug(topicName)}-${idx}`,
        topicName,
        description: String(row['Description'] ?? '').trim(),
        targetDemo: String(row['Target Demo'] ?? '').trim(),
        referenceLink: String(row['Reference Links'] ?? '').trim(),
        hashtags: hashtags.length ? hashtags : undefined,
        audio: String(row['Audio Track'] ?? '').trim() || undefined,
        source: 'Vayner',

        // Quality & safety
        contentQuality: mapContentQuality(row['Content Quality']),
        brandSafe: brandSafeRaw === 'yes' || brandSafeRaw === 'true',
        sentiment: mapSentiment(row['User Sentiment']),

        // Trend analytics
        trendVelocity: mapVelocity(row['Trend Velocity']),
        trendBucket: String(row['Trend Bucket'] ?? '').trim() || undefined,
        creationComplexity: mapComplexity(row['Creation Complexity\n(Ease of Participation)']
          ?? row['Creation Complexity']),
        trendScale: mapScale(row['Trend Scale\n(Creation-led/Viewer-led)'] ?? row['Trend Scale']),
        platformsTrending: platforms.length ? platforms : undefined,
        primaryMarkets: primaryMarkets.length ? primaryMarkets : undefined,
        secondaryMarkets: secondaryMarkets.length ? secondaryMarkets : undefined,
        platformOrigin: String(row['Platform Origin'] ?? '').trim() || undefined,
        aiTool: String(row['AI Tool'] ?? '').trim() || undefined,
        genAI: lower(row['GenAI/non-GenAI']) === 'genai',
        initialTrigger: String(row['Initial Trigger'] ?? '').trim() || undefined,
        engagementRate: parseNumber(row['Engagement Rate']),

        // Raw metrics
        views: parseNumber(row['Views']),
        likes: parseNumber(row['Likes']),
        comments: parseNumber(row['Comments']),
        shares: parseNumber(row['Shares (TT-only']),
        saves: parseNumber(row['Saves (TT-only)']),
        creatorSubs: parseNumber(row['Creator Subscriber Count']),
        publicationDate: normalizeDate(row['Publication Date']),
        dateIdentified: normalizeDate(row['Date Identified']),

        // Legacy fields used by existing UI
        rank: 0,
        score: 0,
        velocity: 'stable',
        ageInWeeks: 0,
      };
    });
}

/**
 * Vayner dates come in inconsistent formats: "March 25, 2026", "Mar-15,2026",
 * "February 24, 2026". Normalize to ISO for downstream freshness math.
 */
function normalizeDate(v) {
  if (!v) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;

  // Try "Mar-15,2026" → "Mar 15, 2026"
  const dashMatch = s.match(/^([A-Za-z]+)-(\d+),\s*(\d{4})$/);
  if (dashMatch) {
    const [, mon, day, year] = dashMatch;
    const d = new Date(`${mon} ${day}, ${year}`);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}
