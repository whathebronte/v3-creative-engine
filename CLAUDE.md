# CLAUDE.md — V3 Creative Engine

This file is the primary onboarding guide for Claude Code sessions. Read this first.

---

## What This Project Is

**V3 Creative Engine** is a Firebase monorepo that consolidates 6 YouTube Shorts automation tools into one deployment. It is an internal tool for the YouTube Marketing APAC team.

**Live URL:** https://v3-creative-engine.web.app/
**Firebase Project ID:** `v3-creative-engine`
**GCP Project:** `v3-creative-engine`

All 6 tools are live in production. The consolidation from 6 separate Firebase projects is complete (80% cost reduction: $30-40/month → $6-12/month).

---

## Repository Structure

```
v3-creative-engine/
├── public/                        # Firebase Hosting — deployed as static files
│   ├── hub.html                   # Central hub/landing page
│   ├── creative-generator/        # Vanilla HTML/CSS/JS app
│   ├── agent-collective/          # Vanilla HTML app (single file)
│   ├── shorts-brain/              # React app (pre-built)
│   ├── shorts-intel-hub/          # React/TypeScript app (pre-built)
│   └── template-stamper/          # React/TypeScript app (pre-built)
│
├── functions/                     # Cloud Functions v2 (Node.js 20, CommonJS)
│   └── src/
│       ├── index.js               # ENTRY POINT — exports all functions
│       ├── creative-generator/    # Image/video generation (Vertex AI)
│       ├── shorts-intel-hub/      # Trending topics backend
│       ├── template-stamper/      # Video rendering backend
│       ├── shorts-brain/          # Campaign memory system
│       ├── general-context/       # Shared: gemini.js helper
│       ├── shorts-intel-hub-wrapper.js   # ES module ↔ CommonJS bridge
│       └── template-stamper-wrapper.js   # ES module ↔ CommonJS bridge
│
├── tools/                         # Source code for React apps (build → public/)
│   ├── template-stamper/          # React + Vite + Remotion source
│   │   ├── src/                   # Frontend source
│   │   ├── remotion-templates/    # Remotion rendering config (Docker + Cloud Run)
│   │   ├── templates/             # Asset slot schema JSON files
│   │   ├── scripts/               # Backup scripts
│   │   └── docs/                  # Tool-specific documentation
│   ├── shorts-intel-hub/
│   │   ├── frontend/src/          # React/TypeScript frontend source
│   │   └── docs/                  # Tool-specific documentation
│   ├── shorts-brain/              # React + Vite source
│   │   └── src/                   # Builds to public/shorts-brain/
│   └── creative-generator-v2/     # React + Vite source (Creative Generator V2)
│
├── services/                      # Cloud Run backends (Python)
│   ├── agent-collective-v2/       # 38-agent ADK pipeline + FastAPI (deploy.sh)
│   └── creative-generator-v2/     # ADK executor + manifest bridge (deploy.sh)
│
├── archive/                       # Unused files preserved for history — see archive/README.md
│   ├── frontend/                  # Stale build output, unwired ADK demo UI, standalone HTML
│   ├── backend/                   # Diverged backend mirrors, standalone Firebase config, stale demo README
│   ├── scripts/                   # check-jobs.js (superseded by emulator UI / tool frontends)
│   └── docs/planning-2026/        # Root copies of migration planning docs (docs/migration/ is canonical)
│
├── docs/                          # All project documentation (organized)
│   ├── README.md                  # Documentation index
│   ├── architecture/              # System design docs (incl. MCP_BRIDGE_RECEIVER_SPEC.md)
│   ├── guides/                    # Setup & operational guides
│   ├── phases/                    # Phase planning & completion records
│   ├── security/                  # Security audit & measures
│   ├── team/                      # Team-specific task lists
│   └── migration/                 # Migration & consolidation history
│
├── scripts/                       # Utility shell scripts (Firestore/Storage backup)
├── _backups/                      # Local backup records (phase completion notes)
├── firebase.json                  # Firebase Hosting rewrites + Functions config
├── firestore.rules                # Firestore security rules (ALL tools)
├── firestore.indexes.json         # Firestore composite indexes
├── storage.rules                  # Cloud Storage security rules
├── .firebaserc                    # Firebase project binding
└── .github/workflows/deploy-hosting.yml  # CI/CD auto-deploy on push to main
```

---

## The 6 Tools

| Tool | Frontend (deployed) | Source | Functions prefix | Key Firestore collection |
|---|---|---|---|---|
| Creative Generator | `public/creative-generator/` | (vanilla, edit in place) | (no prefix) | `jobs/` |
| Agent Collective | `public/agent-collective/` | (vanilla, edit in place) | `callGeminiAgent` | — |
| Template Stamper | `public/template-stamper/` | `tools/template-stamper/` | `ts*` | `template-stamper-jobs/` |
| Shorts Intel Hub | `public/shorts-intel-hub/` | `tools/shorts-intel-hub/frontend/` | `shortsIntel*` | `shorts-intel/` |
| Shorts Brain | `public/shorts-brain/` | `tools/shorts-brain/` | `sb*` | `shorts-brain/` |
| Campaign Learnings | (future) | — | — | — |

### Creative Generator
- Generates images (Imagen 3) and videos (Veo) via Vertex AI
- Job-based workflow: job created in Firestore → `processJob` Firestore trigger fires → asset uploaded to Cloud Storage
- Key files: `functions/src/creative-generator/jobProcessor.js`, `videoPoller.js`
- Video generation is async: Vertex AI returns an operation name, `pollVideoOperations` checks every minute via PubSub

### Template Stamper
- Renders videos from templates using Remotion on Cloud Run
- Source in `tools/template-stamper/`; built output goes to `public/template-stamper/`
- Functions use TypeScript (ES modules), bridged via `template-stamper-wrapper.js`
- MCP bridge: external tools can send assets via `tsReceiveAssets` HTTP endpoint

### Shorts Intel Hub
- Aggregates trending topics from 4 data sources weekly
- Uses Cloud SQL (PostgreSQL + pgvector) for vector embeddings and deduplication
- Source in `tools/shorts-intel-hub/`; built output goes to `public/shorts-intel-hub/`
- Functions use ES modules, bridged via `shorts-intel-hub-wrapper.js`
- Scheduled weekly refresh: `shortsIntelWeeklyRefresh`

### Shorts Brain
- Campaign performance memory — weekly snapshots persisted to Firestore
- Functions: `sbSaveSnapshot`, `sbLoadSnapshots`, `sbDeleteSnapshot`

---

## Common Commands

### Deploy
```bash
firebase deploy                          # Deploy everything
firebase deploy --only hosting           # Frontend only
firebase deploy --only functions         # Backend only
firebase deploy --only firestore:rules   # Rules only
firebase deploy --only storage:rules     # Storage rules only
```

### Build React Apps (before deploying hosting)
```bash
# Template Stamper
cd tools/template-stamper && npm run build
# Output → public/template-stamper/

# Shorts Intel Hub
cd tools/shorts-intel-hub/frontend && npm run build
# Output → public/shorts-intel-hub/

# Shorts Brain
cd tools/shorts-brain && npm run build
# Output → public/shorts-brain/
```

### Local Development
```bash
firebase emulators:start                 # Full local emulation

cd tools/template-stamper && npm run dev        # Template Stamper dev server
cd tools/shorts-intel-hub/frontend && npm run dev  # Shorts Intel Hub dev server
```

### Install Dependencies
```bash
cd functions && npm install              # Cloud Functions deps
cd tools/template-stamper && npm install
cd tools/shorts-intel-hub/frontend && npm install
```

### Testing in Google Cloud Shell (Recommended)

Cloud Shell is the fastest way to test against the live GCP project without a local setup. It already has `gcloud`, `node`, `npm`, and `firebase-tools` available.

1. Open Cloud Shell: https://shell.cloud.google.com/?project=v3-creative-engine
2. Clone and install:
   ```bash
   git clone https://github.com/whathebronte/v3-creative-engine.git
   cd v3-creative-engine && cd functions && npm install && cd ..
   ```
3. Authenticate:
   ```bash
   firebase login --no-localhost
   # Paste the auth code back after following the printed URL
   ```
4. Start emulators:
   ```bash
   firebase emulators:start --only firestore,functions,storage
   ```
   Use Cloud Shell's **Web Preview** (port 4000) to open the Emulator UI.
5. Test functions directly:
   ```bash
   # Callable function (emulator port 5001)
   curl -s http://localhost:5001/v3-creative-engine/us-central1/createTestJob \
     -H "Content-Type: application/json" \
     -d '{"data": {"type": "image", "prompt": "test"}}'
   ```
6. Persist emulator data between sessions:
   ```bash
   firebase emulators:start --import=./emulator-data --export-on-exit
   ```

---

## Architecture Patterns

### Canonical Backend Paths

Always edit backend code under `functions/src/<tool>/` — that's what gets deployed. The old `tools/<tool>/functions/` and `tools/<tool>/backend/` mirrors have been moved to `archive/backend/` because they had diverged and no live code imported from them.

### ES Module Compatibility
Cloud Functions uses CommonJS (`require`). The tool subfolders (Template Stamper, Shorts Intel Hub) use TypeScript / ES modules internally. The bridge pattern:
```
functions/src/template-stamper-wrapper.js   → dynamic-imports functions/src/template-stamper/index.js
functions/src/shorts-intel-hub-wrapper.js   → dynamic-imports functions/src/shorts-intel-hub/index.js
```

### Function Naming Conventions
- Creative Generator: no prefix (legacy, was the base project)
- Template Stamper: `ts*` prefix (e.g. `tsCreateJob`, `tsGetTemplates`)
- Shorts Intel Hub: `shortsIntel*` prefix
- Shorts Brain: `sb*` prefix

### Firestore Collections
```
jobs/                    # Creative Generator jobs
template-stamper-jobs/   # Template Stamper render jobs
shorts-intel/            # Shorts Intel Hub topics & trends
shorts-brain/            # Campaign snapshots
```

### Cloud Storage Buckets
All tools share the single default bucket `v3-creative-engine.appspot.com` with path-based separation:
```
creative-generator/      # Generated images/videos
template-stamper/        # Rendered videos
```

---

## Environment & Configuration

### Environment Variables (functions/.env — not committed)
```
GEMINI_API_KEY=...
VERTEX_AI_PROJECT=v3-creative-engine
VERTEX_AI_LOCATION=us-central1
CLOUD_SQL_CONNECTION_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

### Firebase Hosting Rewrites (firebase.json)
- `/shorts-intel-hub/api/**` → `shortsIntelApi` function
- `/shorts-intel-hub/**` → `shorts-intel-hub/index.html` (SPA)
- `/shorts-brain/**` → `shorts-brain/index.html`
- `/agent-collective/**` → `agent-collective/index.html`
- `/creative-generator/**` → `creative-generator/index.html`
- `/template-stamper/**` → `template-stamper/index.html`
- `**` → `hub.html` (catch-all)

---

## CI/CD

`.github/workflows/deploy-hosting.yml` auto-deploys Firebase Hosting on push to `main`.
Functions are deployed manually via `firebase deploy --only functions`.

---

## Key Documentation

| Topic | File |
|---|---|
| Full system architecture | `docs/architecture/TECHNICAL_DESIGN_DOCUMENT.md` |
| Security rules & audit | `docs/security/SECURITY_AUDIT_REPORT.md` |
| Vertex AI setup | `docs/guides/VERTEX_AI_SETUP.md` |
| MCP bridge integration | `docs/architecture/MCP_BRIDGE_INTEGRATION.md` |
| Migration history | `docs/migration/MIGRATION_SUMMARY.md` |
| All docs index | `docs/README.md` |
| Tool-specific docs (Template Stamper) | `tools/template-stamper/docs/` |
| Tool-specific docs (Shorts Intel Hub) | `tools/shorts-intel-hub/docs/` |

---

## Team

| Person | Role |
|---|---|
| Gus | Coordinator & integration |
| Marco | Backend (Vertex AI, Cloud Functions) |
| Dice | Frontend (UI/UX) |

---

## Current State (as of March 2026)

All 6 migration phases are complete. All tools are live and operational:
- Phases 1–6: Complete
- Live URL confirmed working: https://v3-creative-engine.web.app/
- Video generation (Veo + Imagen 3) operational
- Template Stamper rendering on Cloud Run operational
- Shorts Intel Hub weekly refresh operational

**Next focus areas:**
- Campaign Learnings tool (Phase 7, not yet started)
- Multi-user support (see `docs/architecture/MULTI_USER_ANALYSIS.md`)
- Any ongoing feature work in individual tools

---

## When Making Changes

1. **Frontend only** (no JS logic changes): Edit files in `public/tool-name/`, then `firebase deploy --only hosting`.
2. **React app changes**: Edit in `tools/tool-name/`, build, then deploy hosting.
3. **Function changes**: Edit in `functions/src/`, then `firebase deploy --only functions`.
4. **Security rules**: Edit `firestore.rules` or `storage.rules`, then deploy rules.
5. **New tool**: Add to `public/`, add functions in `functions/src/`, register exports in `functions/src/index.js`, add rewrite to `firebase.json`, add link to `public/hub.html`.

Always run `cd functions && npm install` after adding new npm packages.
