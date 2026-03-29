# V3 Creative Engine

Firebase monorepo consolidating 6 YouTube Shorts automation tools into a single ecosystem for the YouTube Marketing APAC team.

**Live:** https://v3-creative-engine.web.app/ | **Firebase Project:** `v3-creative-engine`

---

## Tools

| Tool | URL | Description | Stack |
|---|---|---|---|
| **Hub** | [/](https://v3-creative-engine.web.app/) | Central launcher for all tools | HTML |
| **Creative Generator** | [/creative-generator/](https://v3-creative-engine.web.app/creative-generator/) | AI image & video generation (Imagen 3 + Veo) | HTML/JS |
| **Agent Collective** | [/agent-collective/](https://v3-creative-engine.web.app/agent-collective/) | Multi-agent workflow automation | HTML |
| **Template Stamper** | [/template-stamper/](https://v3-creative-engine.web.app/template-stamper/) | Batch video rendering via Remotion | React + TS |
| **Shorts Intel Hub** | [/shorts-intel-hub/](https://v3-creative-engine.web.app/shorts-intel-hub/) | Weekly trending topics dashboard | React + TS |
| **Shorts Brain** | [/shorts-brain/](https://v3-creative-engine.web.app/shorts-brain/) | Campaign performance memory | React |
| Campaign Learnings | (future) | Performance correlation engine | — |

---

## Repository Structure

```
v3-creative-engine/
├── public/                        # Firebase Hosting (static files)
│   ├── hub.html                   # Hub landing page
│   ├── creative-generator/        # Vanilla HTML/JS app
│   ├── agent-collective/          # Vanilla HTML app
│   ├── shorts-brain/              # React app (pre-built)
│   ├── shorts-intel-hub/          # React/TypeScript app (pre-built)
│   └── template-stamper/          # React/TypeScript app (pre-built)
│
├── functions/                     # Cloud Functions v2 (Node.js 20)
│   └── src/
│       ├── index.js               # Main entry point — all function exports
│       ├── creative-generator/    # Image/video generation (Vertex AI)
│       ├── shorts-intel-hub/      # Trending topics backend
│       ├── template-stamper/      # Video rendering backend
│       ├── shorts-brain/          # Campaign memory system
│       ├── general-context/       # Shared helpers (Gemini)
│       ├── shorts-intel-hub-wrapper.js   # ES module compatibility bridge
│       └── template-stamper-wrapper.js   # ES module compatibility bridge
│
├── tools/                         # Source for React apps (build → public/)
│   ├── template-stamper/          # React + Vite + Remotion source
│   └── shorts-intel-hub/          # React + TypeScript source
│
├── docs/                          # All documentation (see docs/README.md)
│   ├── README.md                  # Documentation index
│   ├── architecture/              # System design & technical specs
│   ├── guides/                    # Setup & operational guides
│   ├── phases/                    # Phase records & planning
│   ├── security/                  # Security audit & controls
│   ├── team/                      # Team task references
│   └── migration/                 # Consolidation history
│
├── scripts/                       # Utility scripts (backup, setup)
├── CLAUDE.md                      # AI session onboarding guide
├── firebase.json                  # Hosting rewrites + Functions config
├── firestore.rules                # Security rules for all tools
├── firestore.indexes.json         # Firestore composite indexes
├── storage.rules                  # Cloud Storage security rules
└── .firebaserc                    # Firebase project binding
```

---

## Architecture

### Infrastructure (100% Google Cloud)

```
Firebase Hosting (v3-creative-engine.web.app)
    ├── Static SPAs (Creative Generator, Agent Collective, Hub)
    ├── Built React Apps (Template Stamper, Shorts Intel Hub, Shorts Brain)
    └── Rewrites → Cloud Functions v2
            ├── Vertex AI: Imagen 3 (images), Veo (videos), Gemini (text)
            ├── Cloud Storage: Generated assets (CDN-backed)
            ├── Firestore: Job state, templates, trends, snapshots
            ├── Cloud Run: Remotion video rendering (Template Stamper)
            └── Cloud SQL: PostgreSQL + pgvector (Shorts Intel Hub)
```

### Key Patterns
- **ES module bridge**: React tool functions (TypeScript) are wrapped with CommonJS-compatible wrapper files so they can be exported from the single `functions/src/index.js` entry point
- **Function naming**: `ts*` (Template Stamper), `shortsIntel*` (Shorts Intel Hub), `sb*` (Shorts Brain), no prefix (Creative Generator)
- **Single domain**: All tools under `v3-creative-engine.web.app` via Firebase Hosting rewrites

---

## Getting Started

### Prerequisites
- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project access: `firebase login`

### Install Dependencies
```bash
cd functions && npm install
cd tools/template-stamper && npm install
cd tools/shorts-intel-hub/frontend && npm install
```

### Build React Apps
```bash
cd tools/template-stamper && npm run build        # → public/template-stamper/
cd tools/shorts-intel-hub/frontend && npm run build  # → public/shorts-intel-hub/
```

### Local Development
```bash
firebase emulators:start                          # Full local stack
cd tools/template-stamper && npm run dev          # Template Stamper only
cd tools/shorts-intel-hub/frontend && npm run dev # Shorts Intel Hub only
```

### Testing in Google Cloud Shell

Google Cloud Shell is the recommended way to test against the live Firebase project before deploying, without needing local setup.

1. Open [Google Cloud Shell](https://shell.cloud.google.com/?project=v3-creative-engine)
2. Clone the repo and install deps:
   ```bash
   git clone https://github.com/whathebronte/v3-creative-engine.git
   cd v3-creative-engine
   cd functions && npm install && cd ..
   ```
3. Authenticate Firebase CLI:
   ```bash
   firebase login --no-localhost
   # Follow the URL printed, paste back the auth code
   ```
4. Run the Firebase emulators in Cloud Shell:
   ```bash
   firebase emulators:start --only firestore,functions,storage
   ```
   Cloud Shell will offer a **Web Preview** button (port 4000) to open the Emulator UI.
5. Test function invocations directly:
   ```bash
   # Test a callable function via curl (emulator port 5001)
   curl -s http://localhost:5001/v3-creative-engine/us-central1/createTestJob \
     -H "Content-Type: application/json" \
     -d '{"data": {"type": "image", "prompt": "test"}}'
   ```
6. Once satisfied, deploy:
   ```bash
   firebase deploy --only functions   # Deploy functions
   firebase deploy --only hosting     # Deploy frontend
   ```

**Tips:**
- Cloud Shell already has `gcloud`, `node`, and `npm` pre-installed
- Use `firebase emulators:start --import=./emulator-data --export-on-exit` to persist test data between sessions
- The Emulator UI at port 4000 shows Firestore data, function logs, and Storage in real time

### Deploy
```bash
firebase deploy                           # Everything
firebase deploy --only hosting            # Frontend only
firebase deploy --only functions          # Backend only
firebase deploy --only firestore:rules    # Firestore rules only
```

---

## Adding a New Tool

1. Create frontend in `public/tool-name/`
2. Add Cloud Functions in `functions/src/tool-name/`
3. Export functions from `functions/src/index.js`
4. Add hosting rewrite to `firebase.json`
5. Add tool link to `public/hub.html`

---

## Migration History

| Original Project | Status | Phase |
|---|---|---|
| v3-creative-engine (base) | ✅ Complete | Phase 1 |
| shorts-intel-hub-5c45f | ✅ Complete | Phase 2 |
| apac-shorts-brain-v2 | ✅ Complete | Phase 3 |
| ytm-agent-collective-f4f71 | ✅ Complete | Phase 4 |
| template-stamper-d7045 | ✅ Complete | Phase 6 |
| campaign-learnings | ⏸️ Pending | Future |

**Result**: 6 Firebase projects → 1 · ~80% cost reduction · Single domain

---

## Documentation

For AI sessions: read **[CLAUDE.md](CLAUDE.md)** first.
For all docs: see **[docs/README.md](docs/README.md)**.

Key references:
- [System Architecture](docs/architecture/TECHNICAL_DESIGN_DOCUMENT.md)
- [Vertex AI Setup](docs/guides/VERTEX_AI_SETUP.md)
- [Security Audit](docs/security/SECURITY_AUDIT_REPORT.md)
- [Migration Summary](docs/migration/MIGRATION_SUMMARY.md)

---

**Team**: YouTube Marketing APAC (Gus · Marco · Dice)
**Last Updated**: March 2026
