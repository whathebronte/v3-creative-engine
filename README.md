# V3 Creative Engine - Consolidated Repository

**Consolidated Firebase project** for all YouTube Shorts automation tools.

🌐 **Live Hub**: https://v3-creative-engine.web.app/

## Overview

This repository consolidates 6 separate Firebase projects into a single, unified ecosystem for YouTube Shorts campaign automation. All tools are now accessible under one domain with shared infrastructure and optimized costs.

## Tools & URLs

| Tool | URL | Description |
|------|-----|-------------|
| **Hub** | [v3-creative-engine.web.app](https://v3-creative-engine.web.app/) | Central hub for all tools |
| **Creative Generator** | [/creative-generator/](https://v3-creative-engine.web.app/creative-generator/) | AI-powered creative generation with Gemini |
| **Agent Collective** | [/agent-collective/](https://v3-creative-engine.web.app/agent-collective/) | Multi-agent workflow automation |
| **Template Stamper** | [/template-stamper/](https://v3-creative-engine.web.app/template-stamper/) | Video template rendering with Remotion |
| **Shorts Intel Hub** | [/shorts-intel-hub/](https://v3-creative-engine.web.app/shorts-intel-hub/) | Weekly trending topics dashboard |
| **Shorts Brain** | [/shorts-brain/](https://v3-creative-engine.web.app/shorts-brain/) | Campaign performance analysis |
| Campaign Learnings | (future) | Performance correlation analysis |

## Repository Structure

```
v3-creative-engine/
├── public/                           # Frontend apps (Firebase Hosting)
│   ├── hub.html                      # Main hub page
│   ├── creative-generator/           # Creative Generator app
│   ├── agent-collective/             # Agent Collective app
│   ├── template-stamper/             # Template Stamper app
│   ├── shorts-intel-hub/             # Shorts Intel Hub app
│   ├── shorts-brain/                 # Shorts Brain app
│   └── campaign-learnings/           # (future)
├── tools/                            # Source code for Vite/React apps
│   ├── template-stamper/             # Template Stamper source
│   └── shorts-intel-hub/             # Shorts Intel Hub source
├── functions/                        # Cloud Functions
│   └── src/
│       ├── index.js                  # Main entry point
│       ├── creative-generator/       # Creative Generator functions
│       ├── template-stamper/         # Template Stamper functions
│       ├── shorts-intel-hub/         # Shorts Intel Hub functions
│       ├── general-context/          # Shared helpers (gemini.js, etc.)
│       └── *-wrapper.js              # ES module wrappers
├── remotion-templates/               # Remotion video templates
├── docs/                             # Documentation
├── scripts/                          # Utility scripts
├── firebase.json                     # Firebase configuration
├── firestore.rules                   # Firestore security rules
└── storage.rules                     # Cloud Storage security rules
```

## Architecture

### Frontend
- **Creative Generator**: Vanilla HTML/CSS/JS
- **Agent Collective**: Self-contained HTML
- **Template Stamper**: React + TypeScript + Vite
- **Shorts Intel Hub**: React + TypeScript + Vite
- **Shorts Brain**: Vanilla HTML/CSS/JS

### Backend
- **Cloud Functions v2**: Node.js 20
- **Firestore**: Document database for all tools
- **Cloud Storage**: Asset storage with CDN
- **Cloud Run**: Remotion video rendering (Template Stamper)
- **Cloud SQL**: PostgreSQL with pgvector (Shorts Intel Hub)

### Key Features
- **ES Module Support**: TypeScript functions wrapped with CommonJS compatibility
- **Single Domain**: All tools under `v3-creative-engine.web.app`
- **Shared Infrastructure**: Consolidated Firestore, Storage, and Functions
- **Cost Optimized**: 80% cost reduction from consolidation

## Getting Started

### Prerequisites
- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/ivanivanho-work/v3-creative-engine.git
cd v3-creative-engine

# Install functions dependencies
cd functions
npm install
cd ..

# Install Template Stamper dependencies
cd tools/template-stamper
npm install
cd ../..

# Install Shorts Intel Hub dependencies
cd tools/shorts-intel-hub/frontend
npm install
cd ../../..
```

### Build

```bash
# Build Template Stamper
cd tools/template-stamper
npm run build
cd ../..

# Build Shorts Intel Hub
cd tools/shorts-intel-hub/frontend
npm run build
cd ../../..
```

### Deploy

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Development

### Local Development

```bash
# Start Firebase emulators
firebase emulators:start

# Start Template Stamper dev server
cd tools/template-stamper
npm run dev

# Start Shorts Intel Hub dev server
cd tools/shorts-intel-hub/frontend
npm run dev
```

### Adding a New Tool

1. Create frontend in `public/tool-name/`
2. Add Cloud Functions in `functions/src/tool-name/`
3. Update `functions/src/index.js` to export functions
4. Add rewrite in `firebase.json`:
   ```json
   {
     "source": "/tool-name/**",
     "destination": "/tool-name/index.html"
   }
   ```
5. Update `public/hub.html` with tool link

## Migration History

This repository represents the consolidation of 6 Firebase projects:

| Original Project | Migrated | Phase |
|-----------------|----------|-------|
| v3-creative-engine | ✅ Base | Phase 1 |
| shorts-intel-hub-5c45f | ✅ Complete | Phase 2 |
| apac-shorts-brain-v2 | ✅ Complete | Phase 3 |
| ytm-agent-collective-f4f71 | ✅ Complete | Phase 4 |
| template-stamper-d7045 | ✅ Complete | Phase 6 |
| campaign-learnings | ⏸️ Pending | Future |

**Cost Savings**: ~80% reduction (from $30-40/month to $6-12/month)

## Key Files

- **`firebase.json`**: Firebase Hosting configuration with rewrites
- **`firestore.rules`**: Security rules for all tools
- **`storage.rules`**: Storage rules with tool-specific paths
- **`functions/src/index.js`**: Main Cloud Functions entry point
- **`functions/.env`**: Environment variables (not committed)

## Documentation

- [Functions Structure](functions/src/README.md)
- [Phase 1: Preparation](PHASE1_README.md)
- [Phase 4 & 5: Reorganization](PHASE4_5_README.md)
- [Template Stamper Docs](tools/template-stamper/docs/)

## Contributing

This is an internal tool for YouTube Marketing APAC team. For questions or contributions, please contact the development team.

## License

Internal use only - YouTube Marketing APAC

---

**Maintained by**: YouTube Marketing APAC Team
**Last Updated**: February 2026
