# functions/

Cloud Functions v2 for all V3 Creative Engine tools. Node.js 20, CommonJS.

## Entry Point

`src/index.js` — exports every deployed function. All additions must be registered here.

## Structure

```
functions/
├── src/
│   ├── index.js                    # Main entry — all function exports
│   ├── creative-generator/         # Image/video generation (Vertex AI Imagen 3 + Veo)
│   │   ├── jobProcessor.js         # Firestore trigger: processes new jobs
│   │   ├── videoPoller.js          # PubSub: polls async Veo operations (every minute)
│   │   ├── callGeminiAgent.js      # Gemini API callable
│   │   ├── downloadAsset.js        # Proxy for CORS-safe asset downloads
│   │   └── ...                     # regenerate, upscale, iterate, expand, imageToVideo
│   ├── shorts-intel-hub/           # Trending topics backend (ES module, bridged)
│   │   ├── index.js                # Module entry
│   │   ├── api/routes.js           # HTTP API routes
│   │   ├── db/                     # Cloud SQL (PostgreSQL + pgvector) queries
│   │   ├── ingestion/              # Data upload handlers
│   │   ├── processing/             # Normalization
│   │   ├── ranking/                # Trend scoring
│   │   └── scheduler/              # Weekly refresh trigger
│   ├── template-stamper/           # Video rendering backend (TypeScript, bridged)
│   │   ├── index.ts                # Module entry
│   │   ├── api/                    # jobs.ts, templates.ts — HTTP endpoints
│   │   ├── jobs/                   # preprocessAsset.ts, triggerRender.ts
│   │   └── mcp/receiveAssets.ts    # MCP bridge endpoint
│   ├── shorts-brain/
│   │   └── memory.js               # Firestore snapshot save/load/delete
│   ├── general-context/
│   │   └── gemini.js               # Shared Gemini API helper
│   ├── shorts-intel-hub-wrapper.js # CommonJS wrapper for ES module functions
│   └── template-stamper-wrapper.js # CommonJS wrapper for TypeScript functions
└── package.json                    # Dependencies (Node 20)
```

## Function Naming

| Tool | Prefix | Example |
|---|---|---|
| Creative Generator | (none) | `processJob`, `createTestJob` |
| Template Stamper | `ts` | `tsCreateJob`, `tsGetTemplates` |
| Shorts Intel Hub | `shortsIntel` | `shortsIntelApi`, `shortsIntelWeeklyRefresh` |
| Shorts Brain | `sb` | `sbSaveSnapshot`, `sbLoadSnapshots` |

## ES Module Bridge Pattern

Template Stamper and Shorts Intel Hub ship ES-module code inside their subfolders. Since the `functions/` codebase is CommonJS, each tool is wrapped:

```
functions/src/template-stamper/index.js    (ES module — canonical)
   ↑ dynamic-imported by
functions/src/template-stamper-wrapper.js  (CommonJS — exports tsCreateJob, etc.)
```

Shorts Intel Hub follows the same pattern via `shorts-intel-hub-wrapper.js`. Always make backend changes in `functions/src/<tool>/`. The old `tools/<tool>/functions/` and `tools/<tool>/backend/` mirrors were moved to `archive/backend/` during the April 2026 cleanup.

## Deploy

```bash
cd functions && npm install   # after adding packages
firebase deploy --only functions
```

## Environment Variables

Stored in `functions/.env` (not committed). Required:
- `GEMINI_API_KEY`
- `VERTEX_AI_PROJECT`, `VERTEX_AI_LOCATION`
- `CLOUD_SQL_CONNECTION_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
