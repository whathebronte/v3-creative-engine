/**
 * Two-stage topic matcher: keyword (Jaccard) → semantic (Gemini embeddings).
 * Pairs internal (Nyan Cat) and external (Vayner) trends that cover the same topic.
 */

import { GoogleAuth } from 'google-auth-library';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from', 'as', 'that',
  'this', 'it', 'its', 'my', 'your', 'our', 'their', 'his', 'her', 'i',
  'you', 'we', 'they', 'he', 'she', 'how', 'what', 'when', 'where', 'why',
  'video', 'videos', 'trend', 'trends', 'shorts', 'short', 'new',
]);

function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/#/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function trendTokens(trend) {
  const parts = [
    trend.topicName,
    trend.description,
    (trend.hashtags || []).join(' '),
    trend.audio,
    trend.trendBucket,
  ];
  return new Set(tokenize(parts.filter(Boolean).join(' ')));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return intersection / union;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

let _authClient = null;
async function getAuthToken() {
  if (!_authClient) {
    _authClient = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  }
  const client = await _authClient.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

// Vertex AI endpoint uses service account auth (no API key needed).
// Works automatically in Cloud Functions via Application Default Credentials.
function vertexEmbedEndpoint() {
  const project = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/text-embedding-004:predict`;
}

async function embedBatch(trends) {
  if (!trends.length) return [];
  const texts = trends.map((t) =>
    [t.topicName, t.description, (t.hashtags || []).join(' ')].filter(Boolean).join('. ')
  );
  const token = await getAuthToken();
  const endpoint = vertexEmbedEndpoint();

  // Vertex supports batched predict; split into chunks of 25 (safe for rate limits + payload size)
  const CHUNK = 25;
  const results = new Array(texts.length);
  for (let i = 0; i < texts.length; i += CHUNK) {
    const chunk = texts.slice(i, i + CHUNK);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        instances: chunk.map((content) => ({ content, task_type: 'SEMANTIC_SIMILARITY' })),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Vertex embedding failed: ${res.status} ${body.slice(0, 200)}`);
    }
    const json = await res.json();
    json.predictions.forEach((p, j) => (results[i + j] = p.embeddings.values));
  }
  return results;
}

/**
 * Match internal vs external trends in two stages.
 *
 * @param {Array} internal - trends from Nyan Cat (source === 'Nyan Cat')
 * @param {Array} external - trends from Vayner (source === 'Vayner')
 * @param {Object} opts - { jaccardThreshold=0.5, cosineThreshold=0.78, apiKey, enableSemantic=true }
 * @returns {Object} { matches: [{internalId, externalId, score, stage}], internalOnlyIds, externalOnlyIds }
 */
export async function matchTopics(internal, external, opts = {}) {
  const {
    jaccardThreshold = 0.35,
    cosineThreshold = 0.72,
    enableSemantic = true,
  } = opts;

  const matches = [];
  const matchedInternal = new Set();
  const matchedExternal = new Set();

  // Stage 1: Jaccard keyword match
  const intTokens = internal.map((t) => ({ id: t.id, tokens: trendTokens(t) }));
  const extTokens = external.map((t) => ({ id: t.id, tokens: trendTokens(t) }));

  for (const i of intTokens) {
    let best = { id: null, score: 0 };
    for (const e of extTokens) {
      if (matchedExternal.has(e.id)) continue;
      const score = jaccard(i.tokens, e.tokens);
      if (score > best.score) best = { id: e.id, score };
    }
    if (best.score >= jaccardThreshold) {
      matches.push({ internalId: i.id, externalId: best.id, score: best.score, stage: 'keyword' });
      matchedInternal.add(i.id);
      matchedExternal.add(best.id);
    }
  }

  // Stage 2: Semantic match on remainder (uses Vertex AI via service account auth)
  if (enableSemantic) {
    const intRest = internal.filter((t) => !matchedInternal.has(t.id));
    const extRest = external.filter((t) => !matchedExternal.has(t.id));

    if (intRest.length && extRest.length) {
      try {
        const [intVecs, extVecs] = await Promise.all([
          embedBatch(intRest),
          embedBatch(extRest),
        ]);

        for (let i = 0; i < intRest.length; i++) {
          let best = { idx: -1, score: 0 };
          for (let j = 0; j < extRest.length; j++) {
            if (matchedExternal.has(extRest[j].id)) continue;
            const score = cosine(intVecs[i], extVecs[j]);
            if (score > best.score) best = { idx: j, score };
          }
          if (best.idx >= 0 && best.score >= cosineThreshold) {
            matches.push({
              internalId: intRest[i].id,
              externalId: extRest[best.idx].id,
              score: best.score,
              stage: 'semantic',
            });
            matchedInternal.add(intRest[i].id);
            matchedExternal.add(extRest[best.idx].id);
          }
        }
      } catch (err) {
        console.error('[matchTopics] semantic stage failed, falling back to keyword-only:', err.message);
      }
    }
  }

  const internalOnlyIds = internal.filter((t) => !matchedInternal.has(t.id)).map((t) => t.id);
  const externalOnlyIds = external.filter((t) => !matchedExternal.has(t.id)).map((t) => t.id);

  return { matches, internalOnlyIds, externalOnlyIds };
}
