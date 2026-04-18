# Agent Collective Revamp — Integration Guide

This document covers replacing the current Agent Collective tool with a new ADK-based multi-agent system backed by a FastAPI/Cloud Run service.

---

## Current State

| Layer | File | Description |
|---|---|---|
| Frontend | `public/agent-collective/index.html` | Single vanilla HTML file |
| Frontend | `public/agent-collective/favicon.svg` | Favicon |
| Backend | `functions/src/creative-generator/callGeminiAgent.js` | Cloud Function (callable) |
| Export | `functions/src/index.js` line 55 | `exports.callGeminiAgent` |

The current implementation makes a single Gemini API call per user message with no persistent agent state or multi-step orchestration.

---

## Incoming Project Structure

The source project contains a `demo_ui/` directory alongside an `agents/` package at the root:

```
<source-project-root>/
├── agents/                    # ADK agents package (Python)
│   ├── __init__.py
│   ├── creative_collective/   # Root agent definition
│   │   ├── __init__.py
│   │   ├── agent.py           # creative_collective root agent
│   │   └── sub_agents/        # Sub-agents for each path/phase
│   └── ...
└── demo_ui/
    ├── server.py              # FastAPI + ADK runtime, SSE streaming
    ├── static/
    │   ├── index.html         # Frontend UI
    │   ├── app.js             # Frontend JS
    │   └── style.css          # Frontend styles
    └── requirements.txt       # Python dependencies
```

---

## Agent Architecture

### Root Agent: `creative_collective`

The `creative_collective` root agent acts as an orchestrator. It receives the user's goal and routes to one of two execution paths:

```
creative_collective (root)
├── Path 1: Campaign Creation
│   ├── Phase 1 — Brief Analysis
│   ├── Phase 2 — Concept Development
│   ├── Phase 3 — Asset Planning
│   └── Phase 4 — Content Scripting
└── Path 2: Asset Adaptation
    ├── Phase 1 — Source Analysis
    ├── Phase 2 — Adaptation Strategy
    └── Phase 3 — Output Generation
```

### Path 1: Campaign Creation (4 phases)

| Phase | Agent | Responsibility |
|---|---|---|
| 1 | Brief Analysis | Parse campaign brief, extract goals, audience, KPIs, constraints |
| 2 | Concept Development | Generate creative concepts aligned with brief |
| 3 | Asset Planning | Define required assets (images, video clips, copy) per concept |
| 4 | Content Scripting | Produce scripts, captions, and metadata for each asset |

### Path 2: Asset Adaptation (3 phases)

| Phase | Agent | Responsibility |
|---|---|---|
| 1 | Source Analysis | Analyse existing creative assets for reuse potential |
| 2 | Adaptation Strategy | Plan format conversions, crops, copy rewrites for new markets/formats |
| 3 | Output Generation | Produce adapted asset specifications and copy variants |

---

## Target Architecture

```
Firebase Hosting (public/agent-collective/)
    ├── index.html
    ├── app.js
    └── style.css
          │
          │  HTTP + SSE
          ▼
Cloud Run Service: agent-collective-api
    ├── server.py (FastAPI)
    ├── ADK runtime
    └── agents/ package
          │
          │  Gemini API / Vertex AI
          ▼
     Google AI / Vertex AI
```

Static files are served from Firebase Hosting as before. The FastAPI backend replaces `callGeminiAgent` and runs as a dedicated Cloud Run service.

---

## SSE Streaming — Cloud Run Configuration

The FastAPI server streams agent responses via Server-Sent Events (SSE). Cloud Run's default request timeout (60 s) will terminate long-running agent sessions. Use the following flag at deploy time:

```bash
gcloud run deploy agent-collective-api \
  --timeout 3600 \
  ...
```

Additional recommended settings:

| Setting | Value | Reason |
|---|---|---|
| `--timeout` | `3600` | Allow up to 1-hour agent sessions |
| `--concurrency` | `80` | Default; SSE holds connections open, reduce if memory pressure |
| `--min-instances` | `0` | Cost saving; cold start acceptable for internal tool |
| `--max-instances` | `10` | Cap to control cost |
| `--memory` | `512Mi` | ADK + Gemini client; increase if OOM |

---

## Step-by-Step Integration Plan

### Step 1 — Prepare the Cloud Run service

1. Copy `demo_ui/` and the root-level `agents/` package into a new directory `services/agent-collective/`:
   ```
   services/agent-collective/
   ├── agents/          # copied from source root
   ├── server.py        # copied from demo_ui/
   ├── requirements.txt # copied from demo_ui/
   └── Dockerfile
   ```

2. Write a `Dockerfile`:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
   ```

3. Build and push the container:
   ```bash
   gcloud builds submit --tag gcr.io/v3-creative-engine/agent-collective-api \
     services/agent-collective/
   ```

4. Deploy to Cloud Run:
   ```bash
   gcloud run deploy agent-collective-api \
     --image gcr.io/v3-creative-engine/agent-collective-api \
     --platform managed \
     --region us-central1 \
     --timeout 3600 \
     --memory 512Mi \
     --no-allow-unauthenticated \
     --project v3-creative-engine
   ```
   Use `--no-allow-unauthenticated` and rely on Firebase Hosting rewrites + Identity-Aware Proxy or a service account token for auth (see Auth section below).

### Step 2 — CORS setup

In `server.py`, configure CORS to accept requests from the Firebase Hosting origin:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://v3-creative-engine.web.app",
        "https://v3-creative-engine.firebaseapp.com",
        "http://localhost:5000",   # local emulator
        "http://localhost:3000",   # local dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 3 — Firebase Hosting rewrite

Add a rewrite in `firebase.json` so `/agent-collective/api/**` proxies to Cloud Run:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/agent-collective/api/**",
        "run": {
          "serviceId": "agent-collective-api",
          "region": "us-central1"
        }
      },
      {
        "source": "/agent-collective/**",
        "destination": "/agent-collective/index.html"
      }
    ]
  }
}
```

The rewrite handles auth transparently — Firebase Hosting forwards requests to Cloud Run using the hosting service account, so the service can remain non-public.

### Step 4 — Replace static frontend files

Copy the three static files into `public/agent-collective/`, replacing the existing `index.html`:

```bash
cp demo_ui/static/index.html  public/agent-collective/index.html
cp demo_ui/static/app.js      public/agent-collective/app.js
cp demo_ui/static/style.css   public/agent-collective/style.css
```

Update any hardcoded API URLs in `app.js` to use the relative path `/agent-collective/api/` so the Firebase Hosting rewrite handles routing.

### Step 5 — Deploy

```bash
# Deploy hosting rewrites + static files
firebase deploy --only hosting

# Functions deploy is NOT required (callGeminiAgent can stay; see Cleanup)
```

### Step 6 — Smoke test

1. Open https://v3-creative-engine.web.app/agent-collective/
2. Send a test message and verify SSE chunks stream correctly
3. Trigger both Path 1 (campaign brief input) and Path 2 (existing asset input)
4. Check Cloud Run logs: `gcloud run services logs read agent-collective-api --region us-central1`

---

## Environment Variables & Secrets

The FastAPI service needs credentials to call Gemini / Vertex AI. Set these as Cloud Run environment variables or Secret Manager secrets:

| Variable | Source | Notes |
|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | `v3-creative-engine` | Set automatically on Cloud Run if using Workload Identity |
| `GOOGLE_CLOUD_LOCATION` | `us-central1` | Vertex AI region |
| `GEMINI_API_KEY` | Secret Manager: `gemini-api-key` | Same key used by Cloud Functions |

Recommended: grant the Cloud Run service account the `roles/aiplatform.user` role and use Application Default Credentials instead of an API key:

```bash
gcloud run services update agent-collective-api \
  --service-account agent-collective-sa@v3-creative-engine.iam.gserviceaccount.com \
  --region us-central1
```

---

## Local Development

Run the FastAPI server locally alongside the Firebase emulator:

```bash
# Terminal 1 — FastAPI backend
cd services/agent-collective
pip install -r requirements.txt
uvicorn server:app --reload --port 8081

# Terminal 2 — Firebase emulator (hosting only)
firebase emulators:start --only hosting
```

In `app.js`, detect local dev and point to `http://localhost:8081/` instead of the rewrite path. A simple env flag in a `.env` file or a `window.location.hostname` check works.

---

## Ongoing Maintenance

- **Agent code lives in `services/agent-collective/agents/`** — this is the canonical source. Do not edit the original source project.
- **Frontend lives in `public/agent-collective/`** — edit in place, redeploy hosting.
- **No build step required** — static files are vanilla HTML/JS/CSS.
- **Cloud Run redeploys** require a new container build + `gcloud run deploy`. Consider adding a Cloud Build trigger for the `services/agent-collective/` path on pushes to `main`.
- **Cloud Function `callGeminiAgent`** can be retired once the new service is confirmed stable (see Cleanup).

---

## Cleanup Steps (post-cutover)

Once the new Cloud Run service is live and validated:

1. Remove `exports.callGeminiAgent` from `functions/src/index.js`
2. Delete `functions/src/creative-generator/callGeminiAgent.js`
3. Run `firebase deploy --only functions` to remove the old callable function
4. Delete the old `public/agent-collective/index.html` content is already replaced in Step 4; just ensure `favicon.svg` is kept or replaced

---

## Open Questions

1. **Auth model** — Should the Cloud Run service be fully public (relying on Firebase Hosting to restrict access) or protected behind IAP? For an internal team tool, the Firebase Hosting rewrite + non-public Cloud Run is sufficient.

2. **Session persistence** — Does the ADK runtime maintain conversation state in memory (per-request) or persist to Firestore? If in-memory, Cloud Run scale-to-zero will lose state between sessions. Consider adding Firestore session storage if multi-turn context across browser reloads is needed.

3. **Shared Gemini API key** — `callGeminiAgent` (Cloud Functions) and the new FastAPI service both use the same key. Confirm the new service uses the same Secret Manager secret or ADC, not a separate key rotation.

4. **Cloud Build CI/CD** — The existing `.github/workflows/deploy-hosting.yml` only deploys Firebase Hosting. A separate trigger (Cloud Build or GitHub Actions) is needed to rebuild and redeploy the Cloud Run container when `services/agent-collective/` changes.

5. **Cost** — Cloud Run with `--min-instances 0` has zero idle cost. Estimate ~$0–2/month for light internal usage. Monitor with Cloud Billing alerts on the `agent-collective-api` service label.
