# V3 Creative Engine

Firebase + Cloud Run monorepo consolidating the YouTube Shorts automation stack for the YouTube Marketing APAC team.

**Live:** https://v3-creative-engine.web.app/ · **Firebase/GCP project:** `v3-creative-engine`

---

## Tools

| Tool | URL | Frontend source | Deployed frontend | Backend |
|---|---|---|---|---|
| **Hub** | [/](https://v3-creative-engine.web.app/) | `public/hub.html` (edit in place) | `public/hub.html` | — |
| **Creative Generator** (V1) | [/creative-generator/](https://v3-creative-engine.web.app/creative-generator/) | `public/creative-generator/` (vanilla, edit in place) | `public/creative-generator/` | Cloud Functions — `functions/src/creative-generator/` |
| **Creative Generator V2** | [/creative-generator-v2/](https://v3-creative-engine.web.app/creative-generator-v2/) | `tools/creative-generator-v2/` (React + Vite) | `public/creative-generator-v2/` | Cloud Run — `services/creative-generator-v2/` (Python / ADK) |
| **Agent Collective** (V1) | [/agent-collective/](https://v3-creative-engine.web.app/agent-collective/) | `public/agent-collective/` (vanilla, edit in place) | `public/agent-collective/` | Cloud Functions — `callGeminiAgent` in `functions/src/general-context/` |
| **Agent Collective V2** | [/agent-collective-v2/](https://v3-creative-engine.web.app/agent-collective-v2/) | `public/agent-collective-v2/` (edit in place) | `public/agent-collective-v2/` | Cloud Run — `services/agent-collective-v2/` (Python / ADK, 38-agent pipeline) |
| **Template Stamper** | [/template-stamper/](https://v3-creative-engine.web.app/template-stamper/) | `tools/template-stamper/` (React + TS + Remotion) | `public/template-stamper/` | Cloud Functions (`ts*`) + Cloud Run renderer — `functions/src/template-stamper/` |
| **Shorts Intel Hub** | [/shorts-intel-hub/](https://v3-creative-engine.web.app/shorts-intel-hub/) | `tools/shorts-intel-hub/frontend/` (React + TS) | `public/shorts-intel-hub/` | Cloud Functions (`shortsIntel*`) + Cloud SQL — `functions/src/shorts-intel-hub/` |
| **Shorts Brain** | [/shorts-brain/](https://v3-creative-engine.web.app/shorts-brain/) | `tools/shorts-brain/` (React + Vite) | `public/shorts-brain/` | Cloud Functions (`sb*`) — `functions/src/shorts-brain/` |

> V1 Agent Collective and Creative Generator remain live for backward compatibility. The hub now points at the V2 apps; the MCP bridge ships a generation manifest from Agent Collective V2 → Creative Generator V2 via Firestore (`prompt_transfers_v2`).

---

## Repository Structure

```
v3-creative-engine/
├── public/                            # Firebase Hosting (served as-is)
│   ├── hub.html                       # Landing page
│   ├── creative-generator/            # Vanilla HTML/JS (V1) — edit in place
│   ├── creative-generator-v2/         # Built from tools/creative-generator-v2/
│   ├── agent-collective/              # Vanilla HTML (V1) — edit in place
│   ├── agent-collective-v2/           # Vanilla HTML (V2) — edit in place
│   ├── template-stamper/              # Built from tools/template-stamper/
│   ├── shorts-intel-hub/              # Built from tools/shorts-intel-hub/frontend/
│   └── shorts-brain/                  # Built from tools/shorts-brain/
│
├── tools/                             # Source for buildable frontends (→ public/)
│   ├── creative-generator-v2/         # React + Vite + Tailwind
│   ├── template-stamper/              # React + Vite + Remotion
│   ├── shorts-intel-hub/frontend/     # React + TypeScript
│   └── shorts-brain/                  # React + Vite
│
├── functions/                         # Cloud Functions v2 (Node 20, CommonJS)
│   └── src/
│       ├── index.js                   # Entry point — exports all functions
│       ├── creative-generator/        # Imagen 3 + Veo (Vertex AI)
│       ├── shorts-intel-hub/          # ERS scoring, Nyan Cat + Vayner ingestion, match-and-rank
│       ├── template-stamper/          # Render job orchestration (canonical source)
│       ├── shorts-brain/              # Campaign snapshots
│       ├── general-context/           # Shared Gemini helper
│       └── *-wrapper.js               # CommonJS ↔ ES module bridges
│
├── services/                          # Cloud Run backends (Python)
│   ├── agent-collective-v2/           # 38-agent ADK pipeline + FastAPI + deploy.sh
│   └── creative-generator-v2/         # ADK executor + manifest bridge + deploy.sh
│
├── docs/                              # See docs/README.md for the full index
│   ├── architecture/                  # TDD, MCP bridge, Agent Collective revamp, multi-user
│   ├── guides/                        # Vertex AI setup, quota, getting started
│   ├── phases/                        # Migration phase records
│   ├── security/                      # Audit + measures
│   └── migration/                     # Consolidation history
│
├── scripts/                           # Firestore/Storage backup scripts
├── CLAUDE.md                          # AI onboarding guide — read first for Claude Code sessions
├── firebase.json                      # Hosting rewrites + Functions config
├── firestore.rules / .indexes.json    # Firestore security + indexes
├── storage.rules                      # Cloud Storage security
├── .firebaserc                        # Firebase project binding
└── .github/workflows/deploy-hosting.yml   # Auto-deploy hosting on push to main
```

---

## What's New (April 2026)

- **Agent Collective V2 + Creative Generator V2** — ADK multi-agent pipelines on Cloud Run, React/Vite frontends, MCP bridge via Firestore (`chat_archives_v2`, `prompt_transfers_v2`). Auto-reconnect on expired Cloud Run sessions.
- **Shorts Intel Hub ERS rework** — Python ERS formula ported to Node, dual-format ingestion (Vayner trend-level + Nyan Cat video-level), brand-safety hiding, Scoring Settings UI for the full multiplier config.
- **Three-track topic matching** — Jaccard 0.35 → Vertex AI `text-embedding-004` cosine 0.72 matcher between Nyan Cat ↔ Vayner sources (`POST /api/match-and-rank`), with a Three-Track view in the frontend.
- **Canonical backend** — `functions/src/shorts-intel-hub/` is now the single deployed source; the old `tools/shorts-intel-hub/backend/` mirror moved to `archive/backend/` in the April 2026 cleanup.
- **CI/CD** — `.github/workflows/deploy-hosting.yml` auto-deploys Hosting on push to `main`. Functions and Cloud Run services still deploy manually.

---

## Architecture

```
Firebase Hosting (v3-creative-engine.web.app)
  ├── Static pages                      (hub, V1 creative-generator, V1/V2 agent-collective)
  ├── Built React apps                  (V2 creative-generator, template-stamper, shorts-intel-hub, shorts-brain)
  └── Rewrites
        ├── /shorts-intel-hub/api/**    → Cloud Functions: shortsIntelApi
        └── /<tool>/**                  → SPA index.html

Cloud Functions v2 (Node 20)            Cloud Run (Python / ADK)
  ├── Creative Generator (Vertex AI)      ├── agent-collective-v2
  ├── Template Stamper (ts*)              └── creative-generator-v2
  ├── Shorts Intel Hub (shortsIntel*)
  └── Shorts Brain (sb*)

Firestore:  jobs · template-stamper-jobs · shorts-intel · shorts-brain
            chat_archives_v2 · prompt_transfers_v2
Storage:    gs://v3-creative-engine.appspot.com (creative-generator/, template-stamper/)
Cloud SQL:  PostgreSQL + pgvector (Shorts Intel Hub embeddings)
```

**Key patterns**
- **Function naming**: `ts*` (Template Stamper), `shortsIntel*` (Shorts Intel Hub), `sb*` (Shorts Brain), none (Creative Generator V1).
- **ES module bridge**: React tools use TS/ESM; `*-wrapper.js` files wrap them for the CommonJS `functions/src/index.js` entry.
- **Canonical backend paths**: always edit `functions/src/<tool>/` — `tools/<tool>/backend/` or `tools/<tool>/functions/` are mirrors.

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+ (only for Cloud Run services in `services/`)
- Firebase CLI: `npm install -g firebase-tools` → `firebase login`
- `gcloud` CLI authenticated to project `v3-creative-engine` (for Cloud Run deploys)

### Install
```bash
cd functions && npm install
cd tools/creative-generator-v2 && npm install
cd tools/template-stamper && npm install
cd tools/shorts-intel-hub/frontend && npm install
cd tools/shorts-brain && npm install
```

### Build frontends (required before deploying hosting)
```bash
cd tools/creative-generator-v2 && npm run build     # → public/creative-generator-v2/
cd tools/template-stamper && npm run build          # → public/template-stamper/
cd tools/shorts-intel-hub/frontend && npm run build # → public/shorts-intel-hub/
cd tools/shorts-brain && npm run build              # → public/shorts-brain/
```
V1 Creative Generator, V1/V2 Agent Collective, and the hub are vanilla — no build step.

---

## Local Testing (Google Cloud Shell)

Cloud Shell is the default dev environment — `gcloud`, `node`, `npm`, and `firebase-tools` are pre-installed and auth inherits from the GCP session.

**Open:** https://shell.cloud.google.com/?project=v3-creative-engine

### 1. Clone + install
```bash
git clone https://github.com/whathebronte/v3-creative-engine.git
cd v3-creative-engine && cd functions && npm install && cd ..
firebase login --no-localhost   # paste the auth code back
```

### 2. Run the emulators
```bash
firebase emulators:start --import=./emulator-data --export-on-exit
```
- Use Cloud Shell's **Web Preview** on port **4000** for the Emulator UI (Firestore data, function logs, Storage).
- Functions: `:5001` · Firestore: `:8080` · Hosting: `:5000` · Storage: `:9199`
- `--import` / `--export-on-exit` persists test data across Cloud Shell sessions.

### 3. Iterate on a frontend (optional)
For the React tools, run Vite alongside the emulators and point its API base at the emulated Functions or a deployed Cloud Run URL:
```bash
cd tools/creative-generator-v2 && npm install && npm run dev
# Then Web Preview → change port to the Vite port printed in the terminal
```
Set `VITE_API_BASE_URL` / `VITE_API_BASE` in the tool's `.env` as needed.

### 4. Hit a Cloud Function directly
```bash
curl -s http://localhost:5001/v3-creative-engine/us-central1/createTestJob \
  -H "Content-Type: application/json" \
  -d '{"data": {"type": "image", "prompt": "test"}}'
```

### 5. Run a Cloud Run service locally (only if editing `services/`)
```bash
cd services/creative-generator-v2 && pip install -r requirements.txt
uvicorn server.app:app --reload --port 8080
# Web Preview on port 8080
```

---

## Testing Agent Collective V2 Locally (non-dev friendly)

This runs the full 38-agent pipeline on your Cloud Shell machine and gives you a browser UI to chat with it — no code changes needed.

**One-time setup** (copy/paste each block in order):

1. Open Cloud Shell: https://shell.cloud.google.com/?project=v3-creative-engine

2. Clone the repo (skip if you already have it):
   ```bash
   git clone https://github.com/whathebronte/v3-creative-engine.git
   cd v3-creative-engine
   ```

3. Go into the Agent Collective V2 service and create a Python sandbox:
   ```bash
   cd services/agent-collective-v2
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
   The `source .venv/bin/activate` line activates the sandbox — your prompt will show `(.venv)` in front. Run it again every time you open a new Cloud Shell tab.

4. Set your Gemini API key (ask Marco or Gus if you don't have one):
   ```bash
   export GOOGLE_API_KEY="paste-your-key-here"
   ```

**Start the app** (do this every time):

```bash
cd ~/v3-creative-engine/services/agent-collective-v2
source .venv/bin/activate
uvicorn demo_ui.server:app --host 0.0.0.0 --port 8080
```

Leave that terminal running. You should see lines like `Uvicorn running on http://0.0.0.0:8080`. This is the **backend only** (ADK + API) — no HTML is served here.

**Open the UI** — the production frontend lives in `public/agent-collective-v2/` and is what you'll iterate on. Serve it locally in a **second Cloud Shell tab** so the backend keeps running:

```bash
cd ~/v3-creative-engine/public/agent-collective-v2
python3 -m http.server 5500
```

In Cloud Shell, click the **Web Preview** button (top right) → **Change port** → `5500` → **Preview**. The page auto-detects `localhost` and points `API_BASE` at `http://localhost:8080` (see `public/agent-collective-v2/script.js:15-18`), so the frontend you see is exactly the one shipped to production, talking to your local backend.

**When you're done**: press `Ctrl+C` in each terminal to stop both servers.

> Heads-up: an unused ADK demo UI scaffold lived at `services/agent-collective-v2/demo_ui/static/`. It was never wired up (`server.py` sets `web=False`) and has been moved to `archive/frontend/agent-collective-v2-adk-demo-ui/`. The canonical frontend is `public/agent-collective-v2/`.

**Troubleshooting**
- *"command not found: uvicorn"* → you forgot `source .venv/bin/activate`. Run it and try again.
- *Port 8080 already in use* → another process is running. Either close its terminal, or start on another port: `uvicorn demo_ui.server:app --host 0.0.0.0 --port 8081` (and preview port 8081).
- *API key errors* → re-run the `export GOOGLE_API_KEY=...` line; it doesn't persist across sessions.
- *Slow first run* → normal. Pip is downloading ~200 MB of ADK dependencies the first time.

**Switching to the cheap model for testing** (recommended while iterating): open `services/agent-collective-v2/agent_collective/agent.py` in the Cloud Shell Editor and change `MODEL_PRO = "gemini-2.5-pro"` to `"gemini-2.5-flash"` (~$0.15/run instead of ~$2–3/run). Change it back before deploying.

### File map — what you edit for Agent Collective V2

The files below are the only ones you need to touch for day-to-day iteration. Everything you edit locally is the same file that ships to the public site.

**Agent logic + prompts (local = production, ships via `./deploy.sh`)**
```
services/agent-collective-v2/
├── agent_collective/
│   ├── agent.py                    ← 38-agent pipeline wiring + model constants
│   └── prompts/
│       ├── root_agent.md
│       ├── adaptation/             strategy_generator.md, strategy_presenter.md
│       ├── analysis/               audience_mapper.md, deconstructor.md, preprocessor.md, analysis_presenter.md
│       ├── brief/                  brief_generator.md, brief_quality_checker.md, brief_reviser.md, brief_presenter.md
│       ├── creative/               creative_director.md, creative_presenter.md
│       ├── delivery/               variation_generator.md, variation_regenerator.md, consistency_checker.md, results_presenter.md
│       ├── discovery/              concept_generator.md, kb_analyzer.md, concept_presenter.md
│       ├── full_campaign/          creative_bridge.md, analysis_presenter.md, results_presenter.md
│       └── production/             creative_prompter.md, prompt_quality_checker.md, prompt_regenerator.md, results_presenter.md
└── demo_ui/
    ├── server.py                   ← FastAPI routes (/api/session, /api/run/stream, /api/kb/*, /api/brief, …)
    └── kb_storage.py               ← KB read/write logic
```

**Frontend (local = production, ships via `firebase deploy --only hosting` or CI)**
```
public/agent-collective-v2/
├── index.html
├── script.js                       ← API_BASE auto-switches local ↔ production (lines 15-18)
└── style.css
```

**Iteration checklist**

| You edited | Reload by | Ship to prod with |
|---|---|---|
| `agent_collective/agent.py` | `Ctrl+C` uvicorn → re-run | `cd services/agent-collective-v2 && ./deploy.sh` |
| `agent_collective/prompts/**/*.md` | `Ctrl+C` uvicorn → re-run | `./deploy.sh` |
| `demo_ui/server.py` / `kb_storage.py` | `Ctrl+C` uvicorn → re-run (or `uvicorn --reload`) | `./deploy.sh` |
| `public/agent-collective-v2/*.html/.js/.css` | Just refresh the browser tab on port 5500 | `firebase deploy --only hosting` (or push to `main` — CI auto-deploys) |

**Do not resurrect** `archive/frontend/agent-collective-v2-adk-demo-ui/` — it's archived because it was never wired up; see `archive/README.md`.



### Inspecting outputs

Every run writes files to disk inside the service folder. By default the market is `kr` (controlled by the `MARKET` env var — set `export MARKET=jp` / `in` / `id` before starting `uvicorn` to switch).

```
services/agent-collective-v2/agent_collective/outputs/<market>/
  latest_marketing_brief.md           # Phase 1 brief
  latest_creative_package.md          # Phase 2 creative package
  latest_generation_manifest.json     # Handoff payload for Creative Generator V2
  latest_full_campaign_manifest.json  # Full-campaign variant
```

**Three ways to look at them:**

1. **Cloud Shell Editor** — click the pencil icon in the Cloud Shell toolbar to open the file tree, then navigate to the path above. Markdown files render nicely; JSON is syntax-highlighted.
2. **List / print from the terminal** (open a second Cloud Shell tab so the server keeps running):
   ```bash
   cd ~/v3-creative-engine/services/agent-collective-v2/agent_collective/outputs/kr
   ls -lh
   cat latest_marketing_brief.md
   ```
3. **Download via the app's API** (same endpoints the frontend uses):
   ```bash
   curl -s http://localhost:8080/api/brief              -o brief.md
   curl -s http://localhost:8080/api/creative-package   -o package.md
   curl -s http://localhost:8080/api/manifest           -o manifest.json
   ```

Files named `latest_*` are overwritten by each run. If you want to keep a copy, rename it (`cp latest_marketing_brief.md brief-2026-04-18.md`) before running the pipeline again.

### Adding knowledge base (KB) files

The pipeline reads reference material from:

```
services/agent-collective-v2/agent_collective/kb/
  global/   # shared across all markets
  kr/       # Korea-only
  jp/       # Japan-only
  in/       # India-only
  id/       # Indonesia-only
```

Only `.md` and `.json` files are accepted. Pick the right folder: market-specific context goes in the market folder; anything that applies to every market goes in `global/`.

**Two ways to add a file:**

1. **Through the UI** (easiest) — the demo UI at port 8080 has a KB panel with drag-and-drop upload. Pick the scope (global / kr / jp / in / id) and drop the `.md` or `.json` file. It lands in the folder above automatically.
2. **Directly on disk** — upload the file into Cloud Shell (drag-and-drop into the Cloud Shell Editor, or use the **⋮ → Upload** menu), then move it into place:
   ```bash
   mv ~/your-file.md ~/v3-creative-engine/services/agent-collective-v2/agent_collective/kb/global/
   ```
   Restart `uvicorn` (`Ctrl+C` then run the start command again) so the agents re-scan the KB folder on boot.

**Checking what's loaded:**
```bash
ls ~/v3-creative-engine/services/agent-collective-v2/agent_collective/kb/global/
ls ~/v3-creative-engine/services/agent-collective-v2/agent_collective/kb/kr/
# or via API:
curl -s http://localhost:8080/api/kb
```

> KB files you add locally are NOT pushed to Cloud Run — they live only on your Cloud Shell VM. To make them available in production, commit them to the repo and redeploy (`./deploy.sh`).

### Persistence + uploading KB from your laptop

**Cloud Shell keeps your `$HOME` for you.** Everything under `~/v3-creative-engine/` — including `outputs/` and `kb/` — survives when you close the tab, disconnect, or come back tomorrow. Cloud Shell gives you 5 GB of persistent home-directory storage; it only resets if you don't open Cloud Shell for 120+ days. You do NOT need to re-clone or re-upload between sessions.

Two practical notes:
- `outputs/` is in `.gitignore`, so `git pull` / `git checkout` won't wipe it.
- `kb/` is NOT gitignored. After you drop files into `kb/`, `git status` will show them — if you don't want them committed, leave them uncommitted; they'll still persist locally in `$HOME`.

**Four ways to copy KB files from your laptop into Cloud Shell** (pick whichever is easiest):

1. **Drag-and-drop into the Cloud Shell Editor** (easiest). Click the pencil icon in the Cloud Shell toolbar to open the editor, expand the file tree to `services/agent-collective-v2/agent_collective/kb/<scope>/`, then drag the file from your laptop's Finder / Explorer straight into that folder.

2. **Upload via the Cloud Shell menu.** In the Cloud Shell terminal toolbar click the **⋮** (three-dot menu) → **Upload** → pick the file. It lands in your `$HOME`. Move it into place:
   ```bash
   mv ~/your-file.md ~/v3-creative-engine/services/agent-collective-v2/agent_collective/kb/global/
   ```

3. **Use the app's KB upload panel.** Start the server, open Web Preview on port 8080, go to the KB panel, pick the scope, drop the file. This writes straight into the correct `kb/<scope>/` folder — no `mv` needed.

4. **Go through git** (only if you want the file in production too). On your laptop: drop the file into the repo's `kb/` folder, commit, push. On Cloud Shell: `cd ~/v3-creative-engine && git pull`. Then `./deploy.sh` to ship it to Cloud Run.

**Downloading outputs back to your laptop.** Right-click any file in the Cloud Shell Editor → **Download**. Or from the terminal toolbar, **⋮** → **Download file** → paste the full path, e.g.:
```
/home/<your-user>/v3-creative-engine/services/agent-collective-v2/agent_collective/outputs/kr/latest_marketing_brief.md
```

### Loading KB for the public site

**Same folder, different delivery.** Production uses the exact same structure — `services/agent-collective-v2/agent_collective/kb/{global,kr,jp,in,id}/` — but the files have to be in the git repo when the Cloud Run image is built, because the Dockerfile copies `agent_collective/` into the container at deploy time. Runtime uploads via the live site's KB panel hit the container's ephemeral disk and disappear when Cloud Run recycles the instance, so they don't count as "production KB".

The workflow:

1. Put the file in the right `kb/<scope>/` folder (drag-drop in Cloud Shell Editor, or on your laptop in your local clone).
2. Commit and push:
   ```bash
   cd ~/v3-creative-engine
   git add services/agent-collective-v2/agent_collective/kb/
   git commit -m "kb: add <short description>"
   git push
   ```
3. Redeploy Cloud Run so the image picks up the new files:
   ```bash
   cd services/agent-collective-v2
   GOOGLE_API_KEY=... ./deploy.sh
   ```
4. Verify on the live site (https://v3-creative-engine.web.app/agent-collective-v2/) — open the KB panel; the file should appear under the scope you picked.

**Quick decision guide:**

| What you want | Where to put it | How it lands |
|---|---|---|
| Try a KB file just for your local testing | `kb/<scope>/` on Cloud Shell | Restart `uvicorn`, see it on port 8080 |
| Same file for everyone on the public site | Same folder, but committed + pushed + `./deploy.sh` | Baked into the Cloud Run image |
| One-off upload on the live site (not durable) | KB panel at `/agent-collective-v2/` | Lives until the Cloud Run instance recycles |

## Deploying to Public Hosting

### Hosting (static + rewrites)
Auto-deploys on push to `main` via `.github/workflows/deploy-hosting.yml`. Manual:
```bash
firebase deploy --only hosting
```
Always rebuild the affected React app first (see **Build frontends**).

### Cloud Functions
```bash
firebase deploy --only functions
# Single function:
firebase deploy --only functions:shortsIntelApi
```

### Firestore / Storage rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only firestore:indexes
```

### Cloud Run services (V2 backends)
```bash
cd services/agent-collective-v2
GOOGLE_API_KEY=... ./deploy.sh

cd services/creative-generator-v2
./deploy.sh
```
After deploy, copy the printed service URL into the corresponding frontend's `.env.production` (`VITE_API_BASE` / `VITE_API_BASE_URL`), rebuild, then `firebase deploy --only hosting`.

### Full deploy
```bash
firebase deploy     # hosting + functions + rules + indexes (not Cloud Run)
```

---

## Adding a New Tool

1. Create frontend (`public/tool-name/` for vanilla, or `tools/tool-name/` + build target in `public/tool-name/` for React).
2. Add Cloud Functions under `functions/src/tool-name/` and export them from `functions/src/index.js` (add a wrapper if the source is ESM).
3. If a Cloud Run backend is needed, scaffold under `services/tool-name/` with a `Dockerfile` + `deploy.sh`.
4. Add a hosting rewrite to `firebase.json`.
5. Link the tool from `public/hub.html`.

---

## Documentation

Start with **[CLAUDE.md](CLAUDE.md)** (AI onboarding) or **[docs/README.md](docs/README.md)** (full index).

Key references:
- [System architecture (TDD)](docs/architecture/TECHNICAL_DESIGN_DOCUMENT.md)
- [Agent Collective V2 architecture](docs/architecture/AGENT_COLLECTIVE_REVAMP.md)
- [MCP bridge integration](docs/architecture/MCP_BRIDGE_INTEGRATION.md)
- [Vertex AI setup](docs/guides/VERTEX_AI_SETUP.md)
- [Security audit](docs/security/SECURITY_AUDIT_REPORT.md)
- [Migration summary](docs/migration/MIGRATION_SUMMARY.md)

---

**Team**: YouTube Marketing APAC (Gus · Marco · Dice)
**Last updated**: April 2026
