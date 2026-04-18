# Archive

Files preserved here are **not used by the public site** (https://v3-creative-engine.web.app/) and are **not referenced by any deployed code path**. They're kept for history — not as a staging area for revival.

Archived **April 2026** during the post-V2 repo cleanup. Source branch: `claude/update-readme-hosting-3Hkd2`.

> Rule of thumb: if you're about to copy something out of here, stop and ask whether the canonical source in `functions/src/`, `public/`, or `docs/` already covers what you need.

---

## Layout

```
archive/
├── frontend/
│   ├── tools-public/                             # Stale Shorts Intel Hub build output
│   ├── ytm-agent-collective-v3.html              # Standalone reference page
│   ├── ytm-agent-collective-test.html            # Standalone test page
│   └── agent-collective-v2-adk-demo-ui/static/   # Unwired ADK demo UI scaffold
│
├── backend/
│   ├── template-stamper-standalone/              # firebase.json/firestore.rules/storage.rules
│   │                                              #   from the standalone Template Stamper project
│   ├── template-stamper-functions-mirror/        # Diverged copy of functions/src/template-stamper/
│   ├── shorts-intel-hub-backend-mirror/          # Diverged copy of functions/src/shorts-intel-hub/
│   └── agent-collective-v2-demo-ui/README.md     # Stale two-terminal `adk web` walkthrough
│
├── scripts/
│   └── check-jobs.js                             # Ad-hoc Cloud Functions job-status query
│
└── docs/
    └── planning-2026/                            # Root-level planning docs, superseded by docs/migration/
        ├── CONSOLIDATION_PLAN.md
        ├── MIGRATION_SUMMARY.md
        └── PROJECT_DECOMMISSIONING_CHECKLIST.md
```

---

## Why each item is here

### `frontend/tools-public/`
Old Shorts Intel Hub build output written to `tools/public/` when the Vite config pointed at the wrong `outDir`. Vite config has since been corrected (writes to `public/shorts-intel-hub/` now). **Canonical:** `public/shorts-intel-hub/`.

### `frontend/ytm-agent-collective-v3.html` and `ytm-agent-collective-test.html`
Standalone prototype/test HTML for Agent Collective. Never linked from `public/hub.html`, never in `firebase.json` rewrites. **Canonical:** `public/agent-collective-v2/`.

### `frontend/agent-collective-v2-adk-demo-ui/static/`
Default demo UI from the Google ADK sample scaffold. The current `services/agent-collective-v2/demo_ui/server.py` sets `web=False` (line ~120) and has no StaticFiles mount, so these files were never served. Copied into the Cloud Run image as dead weight. **Canonical frontend for Agent Collective V2:** `public/agent-collective-v2/`.

### `backend/template-stamper-standalone/`
`firebase.json`, `firestore.rules`, `storage.rules` left over from when Template Stamper was its own Firebase project. The root-level files at `/firebase.json`, `/firestore.rules`, `/storage.rules` are the canonical ones used for deploy.

### `backend/template-stamper-functions-mirror/`
Old `tools/template-stamper/functions/` copy of the Template Stamper Cloud Functions. Flagged in CLAUDE.md as diverged (newer fixes were applied directly to `functions/src/template-stamper/`). The wrapper at `functions/src/template-stamper-wrapper.js` imports from `./template-stamper/index.js` (canonical), never from this mirror.

### `backend/shorts-intel-hub-backend-mirror/`
Old `tools/shorts-intel-hub/backend/` copy. Same pattern — canonical source is `functions/src/shorts-intel-hub/`; the wrapper at `functions/src/shorts-intel-hub-wrapper.js` imports from there.

### `backend/agent-collective-v2-demo-ui/README.md`
Setup walkthrough for the two-process `adk web` + proxy pattern used before `services/agent-collective-v2/demo_ui/server.py` was refactored to embed ADK in-process. Superseded by the root `README.md` "Testing Agent Collective V2 Locally" section.

### `scripts/check-jobs.js`
One-off Node script for querying Cloud Functions job state from a local shell. Superseded by the Firebase Emulator UI and the per-tool frontends' own job views.

### `docs/planning-2026/`
Root-level copies of three migration planning docs. `docs/migration/` has the canonical, more-up-to-date versions (with ✅ COMPLETE markers added). Archived to declutter the repo root.

---

## Recovery

All files moved here via `git mv`, so history is intact. To resurrect any of them:

```bash
git mv archive/<path> <original-location>
```
