# Shorts Automation Toolbox - Consolidation Plan

**Project:** Unified Shorts Automation Platform
**Target:** v3-creative-engine.web.app (Single Firebase/GCP account)
**Created:** February 12, 2026
**Status:** Planning Phase

---

## Executive Summary

This document outlines the plan to consolidate all 6 Shorts Automation tools into a single unified platform hosted under `v3-creative-engine.web.app`, using one Firebase project and one Google Cloud billing account.

### Benefits
1. **Cost Management:** Single billing account, unified cost tracking
2. **Code Management:** One Git repository with organized structure
3. **Simplified Deployment:** Single deployment pipeline
4. **Shared Resources:** Unified Firestore, Storage, Functions
5. **Easier Maintenance:** One codebase to update and monitor
6. **Better Integration:** Tools can share data and APIs seamlessly

### Migration Scope

| Tool | Current Project | Current URL | Status |
|------|----------------|-------------|--------|
| 1. **Shorts Intel Hub** | shorts-intel-hub-5c45f | https://shorts-intel-hub-5c45f.web.app/ | ✅ Active |
| 2. **YTM Agent Collective** | v3-creative-engine | https://v3-creative-engine.web.app/agent-collective.html | ✅ Active |
| 3. **YTM Creative Generator** | v3-creative-engine | https://v3-creative-engine.web.app/index.html | ✅ Active |
| 4. **YTM Template Stamper** | template-stamper-d7045 | https://template-stamper-d7045.web.app/ | ✅ Active |
| 5. **APAC Shorts Brain '26** | apac-shorts-brain-v2 | https://apac-shorts-brain-v2.web.app/ | ✅ Active |
| 6. **Campaign Learnings Agent** | (not built yet) | N/A | ⏳ Future |

---

## Current State Analysis

### 1. Shorts Intel Hub
**Firebase Project:** `shorts-intel-hub-5c45f`
**Tech Stack:** React/TypeScript frontend + Cloud Functions backend + Cloud SQL (PostgreSQL)
**Key Features:**
- Topic aggregation and ranking
- AI-powered trend analysis (Gemini 3.0)
- Manager UI (internal) + Agency Upload UI (public)
- MCP bridge to Agent Collective
- Cloud Scheduler for weekly refresh

**Resources:**
- Frontend: React app (build output to `frontend/dist/`)
- Backend: Cloud Functions (`backend/functions/`)
- Database: Cloud SQL with pgvector
- Storage: File uploads

**Firestore Collections:** (None - uses Cloud SQL)

**Cloud Functions:**
- Data ingestion handlers
- Gemini AI processing
- Ranking and scoring
- Weekly scheduler
- MCP bridge integration

---

### 2. YTM Agent Collective
**Firebase Project:** `v3-creative-engine` ✅ (already in target)
**Tech Stack:** Vanilla HTML/JS
**Key Features:**
- Agentic workflow for GTM automation
- Market-based creative brief generation
- Gemini API integration
- Chat interface with agent personas

**Resources:**
- Frontend: `public/agent-collective.html`, `public/agent-collective-*.html`
- No backend functions (client-side only)
- Uses Gemini API directly from client

**Firestore Collections:**
- `agent_markets` - Market configurations
- `chat_archives` - Conversation history
- `prompt_transfers` - Analytics tracking

---

### 3. YTM Creative Generator
**Firebase Project:** `v3-creative-engine` ✅ (already in target)
**Tech Stack:** Vanilla HTML/JS + Cloud Functions
**Key Features:**
- Image generation (Vertex AI Imagen 3)
- Video generation (Vertex AI Veo 3/3.1)
- Multi-country galleries (Korea, Japan, Indonesia, India)
- Asset editing (upscale, iterate, expand, animate)
- MCP bridge to Template Stamper

**Resources:**
- Frontend: `public/index.html`, `public/script.js`, `public/style.css`
- Backend: Cloud Functions (`functions/src/`)
- Storage: Generated images and videos

**Firestore Collections:**
- `jobs` - Generation job tracking
- `gallery` - Saved assets by country
- `template_stamper_transfers` - Asset transfers to Template Stamper

**Cloud Functions:**
- `createTestJob` - Job creation
- `processJob` - Firestore trigger for processing
- `regenerateJob`, `upscaleJob`, `iterateJob` - Image operations
- `imageToVideoJob`, `expandImageJob` - Video operations
- `callGeminiAgent` - Agent calls
- `pollVideoOperations` - Scheduled poller
- `downloadAsset`, `importPrompt` - Utilities

---

### 4. YTM Template Stamper
**Firebase Project:** `template-stamper-d7045`
**Tech Stack:** React/TypeScript + Vite + Cloud Functions + Remotion Lambda (AWS)
**Key Features:**
- Template-based video generation
- One-click batch rendering
- Asset slot management
- MCP bridge from Creative Generator
- Remotion Lambda for video rendering (AWS)

**Resources:**
- Frontend: React app (Vite build) in `src/`
- Backend: Cloud Functions (`functions/src/`)
- Templates: Remotion templates in `templates/`
- Storage: Input assets and output videos
- **AWS:** Remotion Lambda functions in `us-east-1`

**Firestore Collections:**
- `template_stamper_transfers` - Incoming asset transfers (shared with Creative Generator)
- `templates` - Template definitions
- `jobs` - Rendering jobs
- `job_history` - Completed jobs

**Cloud Functions:**
- `mcpReceiveAssets` - Receive assets from Creative Generator
- Template upload/management
- Job creation and tracking
- Remotion Lambda invocation

---

### 5. APAC Shorts Brain '26
**Firebase Project:** `apac-shorts-brain-v2`
**Tech Stack:** Vanilla HTML/JS (single-page app)
**Key Features:**
- Campaign performance analysis
- Automated insights generation
- Multi-market data visualization
- Historical trend tracking

**Resources:**
- Frontend: `public/index.html`, `public/app.js`, `public/config.js`, `public/styles.css`
- No backend functions (client-side only)
- Large amount of legacy HTML files (version history - can be archived)

**Firestore Collections:** (Unknown - need to verify)

---

### 6. Campaign Learnings Agent
**Firebase Project:** (Not built yet)
**Tech Stack:** TBD
**Key Features:**
- Correlate performance results with analyzed creatives
- Pattern recognition across campaigns
- Automated learning extraction
- Integration with Shorts Brain and Creative Generator

**Resources:**
- To be defined during development

---

## Target Architecture

### Consolidated Project Structure

```
v3-creative-engine/                          # Single unified repository
│
├── .git/                                     # Single Git repository
├── .gitignore                                # Consolidated gitignore
├── README.md                                 # Master README
├── package.json                              # Root package.json
│
├── docs/                                     # Consolidated documentation
│   ├── architecture/                         # System architecture docs
│   ├── planning/                             # BRDs, PRDs, planning docs
│   ├── api/                                  # API documentation
│   ├── cost-estimates/                       # Cost analysis
│   │   └── COST_ESTIMATE_2026.md            ✅ (existing)
│   └── migration/                            # Migration logs
│       └── CONSOLIDATION_PLAN.md            ✅ (this document)
│
├── public/                                   # Firebase Hosting root
│   ├── index.html                           ✅ Hub landing page (existing)
│   ├── hub.html                             ✅ Automation hub (existing)
│   ├── favicon.svg                          ✅ (existing)
│   │
│   ├── creative-generator/                   # YTM Creative Generator
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   │
│   ├── agent-collective/                     # YTM Agent Collective
│   │   ├── index.html
│   │   ├── agent-*.html                      # Various agent versions
│   │   └── assets/                           # Agent-specific assets
│   │
│   ├── template-stamper/                     # YTM Template Stamper
│   │   ├── index.html                        # React build output
│   │   ├── assets/                           # Built JS/CSS
│   │   └── templates/                        # Template preview files
│   │
│   ├── shorts-intel-hub/                     # Shorts Intel Hub
│   │   ├── index.html                        # React build output
│   │   ├── manager/                          # Manager UI
│   │   ├── agency/                           # Agency upload UI
│   │   └── assets/                           # Built JS/CSS
│   │
│   ├── shorts-brain/                         # APAC Shorts Brain
│   │   ├── index.html
│   │   ├── app.js
│   │   ├── config.js
│   │   └── styles.css
│   │
│   └── campaign-learnings/                   # Campaign Learnings Agent (future)
│       └── (to be built)
│
├── src/                                      # Shared source code (if applicable)
│   ├── shared-components/                    # Reusable React components
│   ├── shared-utils/                         # Shared utilities
│   └── shared-types/                         # TypeScript type definitions
│
├── tools/                                    # Individual tool source code
│   ├── creative-generator/                   # YTM Creative Generator source
│   │   └── (currently in public/, no build step)
│   │
│   ├── agent-collective/                     # YTM Agent Collective source
│   │   └── (currently in public/, no build step)
│   │
│   ├── template-stamper/                     # Template Stamper source (React/Vite)
│   │   ├── src/                              # React source code
│   │   ├── templates/                        # Remotion templates
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── shorts-intel-hub/                     # Shorts Intel Hub source (React)
│   │   ├── src/                              # React source code
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shorts-brain/                         # Shorts Brain source
│   │   └── (currently in public/, no build step)
│   │
│   └── campaign-learnings/                   # Campaign Learnings (future)
│       └── (to be built)
│
├── functions/                                # Consolidated Cloud Functions
│   ├── src/
│   │   ├── index.js                         ✅ Main exports (existing)
│   │   │
│   │   ├── creative-generator/               # Creative Generator functions
│   │   │   ├── testJob.js                   ✅ (existing)
│   │   │   ├── jobProcessor.js              ✅ (existing)
│   │   │   ├── regenerateJob.js             ✅ (existing)
│   │   │   ├── upscaleJob.js                ✅ (existing)
│   │   │   ├── imageToVideoJob.js           ✅ (existing)
│   │   │   ├── expandImageJob.js            ✅ (existing)
│   │   │   ├── iterateJob.js                ✅ (existing)
│   │   │   ├── videoPoller.js               ✅ (existing)
│   │   │   └── downloadAsset.js             ✅ (existing)
│   │   │
│   │   ├── agent-collective/                 # Agent Collective functions
│   │   │   ├── callGeminiAgent.js           ✅ (existing)
│   │   │   └── importPrompt.js              ✅ (existing)
│   │   │
│   │   ├── template-stamper/                 # Template Stamper functions
│   │   │   ├── mcpReceiveAssets.js           # (to migrate)
│   │   │   ├── templateManagement.js         # (to migrate)
│   │   │   ├── jobManagement.js              # (to migrate)
│   │   │   └── remotionLambda.js             # (to migrate)
│   │   │
│   │   ├── shorts-intel-hub/                 # Shorts Intel Hub functions
│   │   │   ├── ingestion.js                  # (to migrate)
│   │   │   ├── processing.js                 # (to migrate)
│   │   │   ├── ranking.js                    # (to migrate)
│   │   │   ├── scheduler.js                  # (to migrate)
│   │   │   ├── api.js                        # (to migrate)
│   │   │   └── mcpBridge.js                  # (to migrate)
│   │   │
│   │   ├── shorts-brain/                     # Shorts Brain functions
│   │   │   └── (if any - to be verified)
│   │   │
│   │   ├── campaign-learnings/               # Campaign Learnings functions (future)
│   │   │   └── (to be built)
│   │   │
│   │   └── shared/                           # Shared utilities
│   │       ├── gemini.js                    ✅ (existing)
│   │       ├── auth.js
│   │       └── utils.js
│   │
│   └── package.json                         ✅ (existing)
│
├── firestore.rules                          ✅ Consolidated Firestore rules (existing)
├── firestore.indexes.json                   ✅ Consolidated indexes (existing)
├── storage.rules                            ✅ Consolidated storage rules (existing)
├── firebase.json                            ✅ Consolidated Firebase config (existing)
├── .firebaserc                              ✅ Single project reference (existing)
│
├── database/                                 # Database schemas and migrations
│   ├── cloud-sql/                            # Cloud SQL schemas (for Shorts Intel Hub)
│   │   ├── schema.sql
│   │   └── migrations/
│   └── firestore/                            # Firestore structure documentation
│       └── collections.md
│
└── scripts/                                  # Utility scripts
    ├── deploy-all.sh                         # Deploy all tools
    ├── deploy-single.sh                      # Deploy single tool
    ├── migrate-data.sh                       # Data migration scripts
    └── setup-dev.sh                          # Development environment setup
```

---

## URL Structure (After Consolidation)

All tools hosted under **v3-creative-engine.web.app**:

| Tool | New URL |
|------|---------|
| **Hub Landing Page** | https://v3-creative-engine.web.app/ |
| **Automation Hub** | https://v3-creative-engine.web.app/hub.html |
| **Creative Generator** | https://v3-creative-engine.web.app/creative-generator/ |
| **Agent Collective** | https://v3-creative-engine.web.app/agent-collective/ |
| **Template Stamper** | https://v3-creative-engine.web.app/template-stamper/ |
| **Shorts Intel Hub** | https://v3-creative-engine.web.app/shorts-intel-hub/ |
| **Shorts Brain** | https://v3-creative-engine.web.app/shorts-brain/ |
| **Campaign Learnings** | https://v3-creative-engine.web.app/campaign-learnings/ |

**Backward Compatibility:**
- Old URLs will redirect to new URLs (via Firebase Hosting rewrites)
- Maintain old Firebase projects for 3 months (read-only) before decommissioning

---

## Firestore Structure (Consolidated)

All tools will share a single Firestore database with organized collections:

```
v3-creative-engine (Firestore)
│
├── jobs/                                    # Creative Generator jobs
│   ├── {jobId}/
│   │   ├── type: 'image' | 'video'
│   │   ├── status: 'pending' | 'processing' | 'complete' | 'error'
│   │   ├── country: 'korea' | 'japan' | 'indonesia' | 'india'
│   │   └── ...
│
├── gallery/                                 # Creative Generator saved assets
│   ├── {assetId}/
│   │   ├── country: 'korea' | 'japan' | 'indonesia' | 'india'
│   │   ├── url: string
│   │   └── ...
│
├── template_stamper_transfers/              # Asset transfers (Creative Generator → Template Stamper)
│   ├── {transferId}/
│   │   ├── country: string
│   │   ├── assets: []
│   │   └── status: 'pending' | 'processing' | 'complete'
│
├── template_stamper_templates/              # Template Stamper template definitions
│   ├── {templateId}/
│   │   ├── name: string
│   │   ├── version: string
│   │   └── assetSlots: []
│
├── template_stamper_jobs/                   # Template Stamper rendering jobs
│   ├── {jobId}/
│   │   ├── templateId: string
│   │   ├── status: 'queued' | 'rendering' | 'completed' | 'failed'
│   │   └── outputUrl: string
│
├── agent_markets/                           # Agent Collective market setups
│   ├── {marketId}/
│   │   ├── country: string
│   │   ├── protocols: {}
│   │   └── knowledge: {}
│
├── chat_archives/                           # Agent Collective chat history
│   ├── {archiveId}/
│   │   ├── market: string
│   │   ├── messages: []
│   │   └── timestamp: timestamp
│
├── prompt_transfers/                        # Agent Collective prompt analytics
│   ├── {transferId}/
│
├── shorts_intel_topics/                     # Shorts Intel Hub topics (if not using Cloud SQL)
│   ├── {topicId}/
│   │   ├── market: string
│   │   ├── demo: string
│   │   ├── topicName: string
│   │   ├── description: string
│   │   ├── rankScore: number
│   │   ├── status: 'active' | 'expired' | 'approved' | 'archived'
│   │   └── ...
│
├── shorts_brain_campaigns/                  # Shorts Brain campaign data
│   ├── {campaignId}/
│   │   ├── market: string
│   │   ├── performance: {}
│   │   └── insights: []
│
└── campaign_learnings/                      # Campaign Learnings data (future)
    ├── {learningId}/
    │   ├── campaignId: string
    │   ├── patterns: []
    │   └── recommendations: []
```

**Note:** Shorts Intel Hub may continue using Cloud SQL (PostgreSQL) for topics data due to vector search requirements (pgvector). If so, it will be the only tool using Cloud SQL.

---

## Cloud Functions Organization

### Current Functions (v3-creative-engine) ✅

Already deployed and working:
- `createTestJob`, `processJob`
- `regenerateJob`, `upscaleJob`, `iterateJob`
- `imageToVideoJob`, `expandImageJob`
- `callGeminiAgent`, `importPrompt`
- `pollVideoOperations`, `downloadAsset`

### Functions to Migrate

#### From Template Stamper (template-stamper-d7045)
- `mcpReceiveAssets` - Receive assets from Creative Generator
- Template management functions
- Job creation and tracking
- Remotion Lambda invocation

#### From Shorts Intel Hub (shorts-intel-hub-5c45f)
- Data ingestion handlers
- Gemini AI processing
- Ranking and scoring
- Weekly scheduler
- API endpoints
- MCP bridge

#### From Shorts Brain (apac-shorts-brain-v2)
- (To be verified - likely no backend functions)

### Consolidated Functions Structure

All functions in `/functions/src/` organized by tool:

```javascript
// functions/src/index.js

// Creative Generator functions
exports.createTestJob = require('./creative-generator/testJob').createTestJob;
exports.processJob = require('./creative-generator/jobProcessor').processJob;
exports.regenerateJob = require('./creative-generator/regenerateJob').regenerateJob;
// ... (all existing functions)

// Template Stamper functions
exports.templateStamperReceiveAssets = require('./template-stamper/mcpReceiveAssets').receiveAssets;
exports.templateStamperCreateJob = require('./template-stamper/jobManagement').createJob;
exports.templateStamperRenderVideo = require('./template-stamper/remotionLambda').renderVideo;
// ... (migrated functions)

// Shorts Intel Hub functions
exports.shortsIntelIngestData = require('./shorts-intel-hub/ingestion').ingestData;
exports.shortsIntelProcessTopics = require('./shorts-intel-hub/processing').processTopics;
exports.shortsIntelRankTopics = require('./shorts-intel-hub/ranking').rankTopics;
exports.shortsIntelWeeklyRefresh = require('./shorts-intel-hub/scheduler').weeklyRefresh;
// ... (migrated functions)

// Campaign Learnings functions (future)
// ... (to be built)
```

---

## Cloud Storage Organization

### Current Structure (v3-creative-engine)

```
v3-creative-engine.firebasestorage.app/
├── uploads/                                 # User uploads
│   ├── korea/
│   ├── japan/
│   ├── indonesia/
│   └── india/
├── generated/                               # AI-generated assets
│   ├── images/
│   └── videos/
└── examples/                                # Example assets
    └── veo-shorts-v1-example.mp4
```

### Target Structure (Consolidated)

```
v3-creative-engine.firebasestorage.app/
│
├── creative-generator/                      # Creative Generator assets
│   ├── uploads/
│   │   ├── korea/
│   │   ├── japan/
│   │   ├── indonesia/
│   │   └── india/
│   ├── generated/
│   │   ├── images/
│   │   └── videos/
│   └── examples/
│
├── template-stamper/                        # Template Stamper assets
│   ├── input-assets/                        # Received from Creative Generator
│   │   ├── korea/
│   │   ├── japan/
│   │   ├── indonesia/
│   │   └── india/
│   ├── output-videos/                       # Rendered videos
│   │   ├── korea/
│   │   ├── japan/
│   │   ├── indonesia/
│   │   └── india/
│   └── templates/                           # Template assets
│       └── veo-shorts-v1/
│
├── shorts-intel-hub/                        # Shorts Intel Hub uploads
│   ├── agency-uploads/                      # Agency CSV/MD uploads
│   │   ├── japan/
│   │   ├── korea/
│   │   ├── india/
│   │   ├── indonesia/
│   │   └── aunz/
│   └── music-team-uploads/
│
├── shorts-brain/                            # Shorts Brain data
│   └── exports/                             # Exported reports
│
└── campaign-learnings/                      # Campaign Learnings (future)
    └── analysis-data/
```

---

## Git Repository Consolidation

### Current State

6 separate repositories:
1. `shorts-intel-hub` (https://github.com/ivanivanho-work/shorts-intel-hub)
2. `v3-creative-engine` (existing)
3. `template-stamper` (https://github.com/ivanivanho-work/template-stamper)
4. `APAC-Shorts-Brain` (local only, no remote)
5. `campaign-learnings` (not created yet)
6. Agent Collective (inside v3-creative-engine)

### Target State

**Single consolidated repository:**
- **Repository:** `v3-creative-engine` (keep existing, migrate others into it)
- **Location:** `/Users/ivs/shorts-automation/` (new parent directory)

### Git Strategy

**Option 1: Git Subtree (Recommended)**
- Preserve full commit history of each tool
- Merge each repo as a subtree into v3-creative-engine
- Maintain individual tool histories

**Option 2: Fresh Start**
- Start clean Git repository
- Archive old repos for reference
- Simpler but loses history

**Recommended: Option 1 (Git Subtree)**

---

## Migration Plan

### Phase 1: Preparation (Week 1)

**1.1 Create Parent Directory Structure**
```bash
cd /Users/ivs
mkdir shorts-automation
cd shorts-automation
```

**1.2 Clone All Repositories**
```bash
# Clone existing v3-creative-engine as base
git clone [v3-creative-engine-url] .

# Clone other repos to temporary locations
cd /Users/ivs
git clone [shorts-intel-hub-url] _migrate/shorts-intel-hub
git clone [template-stamper-url] _migrate/template-stamper
cp -r APAC-Shorts-Brain _migrate/shorts-brain
```

**1.3 Audit Current State**
- ✅ Document all Cloud Functions in each project
- ✅ Document all Firestore collections
- ✅ Document all Cloud Storage buckets
- ✅ Export production data (Firestore, Cloud SQL)
- ✅ Document all environment variables and secrets

**1.4 Set Up Consolidated Project Structure**
```bash
cd /Users/ivs/shorts-automation

# Create directory structure
mkdir -p tools/{template-stamper,shorts-intel-hub,shorts-brain,campaign-learnings}
mkdir -p public/{template-stamper,shorts-intel-hub,shorts-brain,campaign-learnings}
mkdir -p functions/src/{template-stamper,shorts-intel-hub,shorts-brain,campaign-learnings}
mkdir -p docs/{migration,architecture,api,cost-estimates}
mkdir -p database/{cloud-sql,firestore}
mkdir -p scripts
```

---

### Phase 2: Shorts Intel Hub Migration (Week 2) - MOVED UP

**Originally Phase 3, now Phase 2 to allow Template Stamper AWS→GCP migration to complete first**

**2.1 Merge Template Stamper Code**

```bash
cd /Users/ivs/shorts-automation

# Add template-stamper as a Git subtree
git subtree add --prefix=tools/template-stamper /Users/ivs/_migrate/template-stamper main --squash
```

**2.2 Migrate Frontend Build**
- Copy React source to `tools/template-stamper/src/`
- Update build output to `public/template-stamper/`
- Update `package.json` build scripts

**2.3 Migrate Cloud Functions**
- Move functions from `template-stamper/functions/` to `functions/src/template-stamper/`
- Update function exports in `functions/src/index.js`
- Test functions locally with Firebase emulator

**2.4 Update Firestore Rules**
- Add Template Stamper collections to `firestore.rules`
- Test security rules

**2.5 Migrate Cloud Storage**
- Update storage paths from `template-stamper-d7045.firebasestorage.app` to `v3-creative-engine.firebasestorage.app/template-stamper/`
- Copy existing files to new paths
- Update `storage.rules`

**2.6 Update Environment Variables**
- Migrate AWS credentials for Remotion Lambda
- Update Firebase config references
- Store secrets in Google Secret Manager

**2.7 Test Migration**
- Test frontend locally
- Test functions locally
- Deploy to staging (if available)
- Run integration tests

**2.8 Deploy to Production**
```bash
# Build frontend
cd tools/template-stamper
npm run build

# Deploy functions and hosting
firebase deploy --only functions:templateStamper*,hosting
```

**2.9 Update External References**
- Update hub.html link to new URL
- Update MCP bridge endpoint in Creative Generator
- Add redirect from old URL to new URL

---

### Phase 3: APAC Shorts Brain Migration (Week 3) - MOVED UP

**Originally Phase 4, now Phase 3 to allow Template Stamper AWS→GCP migration to complete first**

**3.1 Merge Shorts Intel Hub Code**

```bash
cd /Users/ivs/shorts-automation

# Add shorts-intel-hub as a Git subtree
git subtree add --prefix=tools/shorts-intel-hub /Users/ivs/_migrate/shorts-intel-hub main --squash
```

**3.2 Migrate Frontend Build**
- Copy React source to `tools/shorts-intel-hub/src/`
- Update build output to `public/shorts-intel-hub/`
- Update `package.json` build scripts

**3.3 Migrate Cloud Functions**
- Move functions from `shorts-intel-hub/backend/functions/` to `functions/src/shorts-intel-hub/`
- Update function exports in `functions/src/index.js`
- Test functions locally

**3.4 Migrate Cloud SQL Database**
- **Option A:** Keep Cloud SQL, update connection config
- **Option B:** Migrate to Firestore (requires rewrite of vector search logic)
- **Recommended:** Option A (keep Cloud SQL for now)

**3.5 Update Firestore Rules**
- Add Shorts Intel Hub collections (if any) to `firestore.rules`

**3.6 Migrate Cloud Storage**
- Update storage paths to `v3-creative-engine.firebasestorage.app/shorts-intel-hub/`
- Copy agency upload files

**3.7 Update Cloud Scheduler**
- Migrate weekly refresh scheduler
- Update Cloud Scheduler job targets to new function URLs

**3.8 Test Migration**
- Test both Manager UI and Agency UI
- Test data ingestion pipeline
- Test Gemini AI processing
- Test MCP bridge to Agent Collective

**3.9 Deploy to Production**
```bash
# Build frontend
cd tools/shorts-intel-hub
npm run build

# Deploy functions, scheduler, and hosting
firebase deploy --only functions:shortsIntel*,hosting
gcloud scheduler jobs update [job-name] --uri=[new-uri]
```

**3.10 Update External References**
- Update hub.html link
- Update Agent Collective MCP endpoint
- Add redirect from old URL

---

### Phase 4: Agent Collective & Creative Generator Updates (Week 4) - RENAMED

**Originally Phase 5, now Phase 4 to allow Template Stamper AWS→GCP migration to complete first**

**4.1 Clean Up Legacy Files**
- Archive 50+ legacy HTML version files
- Keep only production `index.html`, `app.js`, `config.js`, `styles.css`

**4.2 Copy Shorts Brain Code**
```bash
cd /Users/ivs/shorts-automation

# Copy files directly (no Git history needed for single-file app)
cp /Users/ivs/_migrate/shorts-brain/public/* public/shorts-brain/
```

**4.3 Update References**
- Update Firebase config in `config.js`
- Update any hardcoded URLs

**4.4 Verify Firestore Collections**
- Document collections used by Shorts Brain
- Add to `firestore.rules` if needed

**4.5 Test and Deploy**
```bash
# No build step needed (vanilla HTML/JS)
firebase deploy --only hosting
```

**4.6 Update External References**
- Update hub.html link
- Add redirect from old URL

---

### Phase 5: Cleanup & Optimization (Week 5) - RENAMED

**Originally Phase 6, now Phase 5 to allow Template Stamper AWS→GCP migration to complete first**

**5.1 Update Agent Collective**
- Already in `public/agent-collective.html`
- Move to `public/agent-collective/index.html` for consistency
- Update all internal links

**5.2 Update Creative Generator**
- Already in `public/index.html`, `public/script.js`, `public/style.css`
- Move to `public/creative-generator/` for consistency
- Update hub.html to point to new path

**5.3 Update Hub Landing Page**
- Update all tool links to new paths
- Ensure backward compatibility with old URLs

**5.4 Deploy Updates**
```bash
firebase deploy --only hosting
```

---

### Phase 6: Template Stamper Migration (Week 6-7) - DEFERRED

**⚠️ IMPORTANT:** This phase is **deferred** until Template Stamper completes its AWS Remotion Lambda → Google Cloud migration.

**Prerequisites:**
1. ✅ Template Stamper AWS→GCP migration complete
2. ✅ Remotion running fully on Google Cloud (no AWS dependencies)
3. ✅ Tested and stable in production

**Why Deferred:**
- Template Stamper is actively migrating from AWS Remotion Lambda to Google Cloud
- Consolidation should happen AFTER that migration is complete
- Avoids complexity of migrating while infrastructure is changing

**Migration Steps (Execute When Ready):**

**6.1 Verify Template Stamper is Fully on Google Cloud**

Before starting migration, confirm:
- ✅ Remotion rendering running on Google Cloud (not AWS)
- ✅ No AWS Lambda functions in use
- ✅ No AWS S3 buckets required
- ✅ All video rendering using Google Cloud infrastructure
- ✅ Stable in production for at least 2 weeks

**6.2 Merge Template Stamper Code**

```bash
cd /Users/ivs/shorts-automation

# Add template-stamper as a Git subtree
git subtree add --prefix=tools/template-stamper /Users/ivs/_migrate/template-stamper main --squash
```

**6.3 Migrate Frontend Build**
- Copy React/Vite source to `tools/template-stamper/src/`
- Update build output to `public/template-stamper/`
- Update `package.json` build scripts
- Test local build

**6.4 Migrate Cloud Functions**
- Move functions from `template-stamper/functions/` to `functions/src/template-stamper/`
- Update function exports in `functions/src/index.js`
- Update all Google Cloud references (no more AWS)
- Test functions locally with Firebase emulator

**6.5 Update Firestore Rules**
- Add Template Stamper collections to `firestore.rules`
- Collections: `template_stamper_templates`, `template_stamper_jobs`
- Test security rules

**6.6 Migrate Cloud Storage**
- Update storage paths from `template-stamper-d7045.firebasestorage.app` to `v3-creative-engine.firebasestorage.app/template-stamper/`
- Copy existing files to new paths:
  - Input assets → `/template-stamper/input-assets/`
  - Output videos → `/template-stamper/output-videos/`
  - Template assets → `/template-stamper/templates/`
- Update `storage.rules`

**6.7 Update Environment Variables**
- Remove AWS credentials (no longer needed)
- Update Firebase config references
- Store any new secrets in Google Secret Manager

**6.8 Update MCP Bridge**
- Update Creative Generator MCP endpoint to new Template Stamper function URL
- Test asset transfer from Creative Generator → Template Stamper
- Verify Firestore `template_stamper_transfers` collection still works

**6.9 Test Migration**
- Test frontend locally
- Test video rendering with Google Cloud backend
- Deploy to staging (if available)
- Run end-to-end integration tests
- Test batch job creation

**6.10 Deploy to Production**
```bash
# Build frontend
cd tools/template-stamper
npm run build

# Deploy functions and hosting
firebase deploy --only functions:templateStamper*,hosting
```

**6.11 Update External References**
- Update hub.html link to new URL: `/template-stamper/`
- Update MCP bridge endpoint in Creative Generator
- Add redirect from old URL (`template-stamper-d7045.web.app`) to new URL
- Update any documentation or external links

**6.12 Monitor & Verify**
- Monitor Cloud Functions logs
- Check video rendering success rate
- Verify no AWS-related errors
- Monitor costs (should be Google Cloud only)

---

### Phase 7: Cleanup & Optimization (After All Migrations) - NEW

**Execute after Phase 6 (Template Stamper) is complete**

**7.1 Database Optimization**
- Review all Firestore collections
- Remove duplicate or unused data
- Optimize indexes

**6.2 Storage Optimization**
- Implement storage lifecycle rules
- Archive old generated assets (>6 months)
- Clean up test data

**6.3 Function Optimization**
- Review function memory allocations
- Optimize cold start times
- Consolidate shared code

**6.4 Documentation**
- Update all README files
- Create unified API documentation
- Document migration process
- Update cost estimates

**6.5 Monitoring & Alerts**
- Set up unified Cloud Monitoring dashboard
- Configure cost alerts
- Set up error tracking

**6.6 Decommission Old Projects**
- Set old Firebase projects to read-only mode
- Add shutdown notice to old URLs
- Wait 3 months before full decommission

---

## Firebase Hosting Configuration

### Updated `firebase.json`

```json
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/",
        "destination": "/hub.html"
      },
      {
        "source": "/creative-generator",
        "destination": "/creative-generator/index.html"
      },
      {
        "source": "/agent-collective",
        "destination": "/agent-collective/index.html"
      },
      {
        "source": "/template-stamper/**",
        "destination": "/template-stamper/index.html"
      },
      {
        "source": "/shorts-intel-hub/**",
        "destination": "/shorts-intel-hub/index.html"
      },
      {
        "source": "/shorts-brain",
        "destination": "/shorts-brain/index.html"
      },
      {
        "source": "/campaign-learnings/**",
        "destination": "/campaign-learnings/index.html"
      }
    ],
    "redirects": [
      {
        "source": "/index.html",
        "destination": "/creative-generator",
        "type": 301
      },
      {
        "source": "/agent-collective.html",
        "destination": "/agent-collective",
        "type": 301
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=7200"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=3600"
          }
        ]
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

---

## Cost Impact Analysis

### Current Costs (Multiple Projects)

| Project | Monthly Cost | Annual Cost |
|---------|-------------|-------------|
| v3-creative-engine | $2,469 | $29,622 |
| template-stamper-d7045 | $15 | $180 |
| shorts-intel-hub-5c45f | TBD | TBD |
| apac-shorts-brain-v2 | ~$5 | ~$60 |
| **TOTAL** | **~$2,489+** | **~$29,862+** |

### Consolidated Costs (Single Project)

| Service | Monthly Cost | Annual Cost | Notes |
|---------|-------------|-------------|-------|
| Vertex AI (Imagen + Veo + Gemini) | $2,460 | $29,524 | Same (no change) |
| Cloud Functions | $5 | $60 | Slight increase (more functions) |
| Cloud Scheduler | $5 | $60 | Slight increase (more jobs) |
| Cloud SQL (PostgreSQL) | $10 | $120 | Shorts Intel Hub only |
| Cloud Storage | $5 | $60 | Consolidated storage |
| Cloud Firestore | <$1 | <$10 | Minimal |
| Firebase Hosting | <$1 | <$10 | Single hosting |
| Remotion Lambda (AWS) | $10 | $120 | Template Stamper only |
| **TOTAL** | **$2,496** | **$29,964** |

### Cost Analysis

**Savings:** Minimal (~$7/month, $84/year)

**Why minimal savings?**
- 99% of costs are Vertex AI usage (doesn't change)
- Infrastructure costs are already minimal (<$50/month total)
- Consolidation mainly saves on Firebase project overhead

**Real Benefits:**
- ✅ **Unified billing** - easier to track and forecast
- ✅ **Simplified management** - one project to monitor
- ✅ **Better visibility** - single cost dashboard
- ✅ **No duplication** - shared resources where possible

---

## External URL Redirects

To maintain backward compatibility, add redirects from old URLs:

### Template Stamper
- **Old:** https://template-stamper-d7045.web.app/
- **New:** https://v3-creative-engine.web.app/template-stamper/
- **Method:** Firebase Hosting redirect in old project

### Shorts Intel Hub
- **Old:** https://shorts-intel-hub-5c45f.web.app/
- **New:** https://v3-creative-engine.web.app/shorts-intel-hub/
- **Method:** Firebase Hosting redirect in old project

### Shorts Brain
- **Old:** https://apac-shorts-brain-v2.web.app/
- **New:** https://v3-creative-engine.web.app/shorts-brain/
- **Method:** Firebase Hosting redirect in old project

**Implementation:**

In each old Firebase project, update `firebase.json`:

```json
{
  "hosting": {
    "public": "public",
    "redirects": [
      {
        "source": "/**",
        "destination": "https://v3-creative-engine.web.app/[tool-name]",
        "type": 301
      }
    ]
  }
}
```

---

## Testing Strategy

### Pre-Migration Testing

1. **Functionality Tests**
   - Test each tool in isolation
   - Document all user flows
   - Create test data sets

2. **Integration Tests**
   - Test MCP bridges between tools
   - Test data flow between Creative Generator → Template Stamper
   - Test data flow between Intel Hub → Agent Collective

3. **Performance Tests**
   - Measure current load times
   - Benchmark API response times
   - Document baseline metrics

### During Migration Testing

1. **Incremental Testing**
   - Test each tool after migration
   - Verify functions work in new locations
   - Test new URL paths

2. **Integration Testing**
   - Verify cross-tool communication still works
   - Test MCP bridges with new endpoints
   - Verify shared Firestore access

3. **User Acceptance Testing**
   - Have 1-2 users test each tool
   - Verify no regressions
   - Collect feedback

### Post-Migration Testing

1. **Smoke Tests**
   - Quick verification all tools load
   - Test critical user paths
   - Verify data persistence

2. **Performance Validation**
   - Compare performance metrics to baseline
   - Verify no degradation
   - Check Cloud Functions cold start times

3. **Monitoring**
   - Set up alerts for errors
   - Monitor usage patterns
   - Track cost metrics

---

## Rollback Plan

If migration fails, rollback to previous state:

### Rollback Procedure

1. **Immediate Actions**
   - Restore old Firebase project settings
   - Revert DNS/URL changes
   - Switch back to old function endpoints

2. **Data Rollback**
   - Restore Firestore from backup (taken pre-migration)
   - Restore Cloud Storage from backup
   - Restore Cloud SQL from backup (if modified)

3. **Communication**
   - Notify users of rollback
   - Document what went wrong
   - Plan remediation

### Rollback Triggers

Roll back if:
- Critical functionality broken >2 hours
- Data loss or corruption detected
- Performance degradation >50%
- Multiple user-facing bugs in production

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Data loss during migration** | Low | High | Full backups before each phase, test restores |
| **Function naming conflicts** | Medium | Medium | Use namespaced function names (e.g., `templateStamperCreateJob`) |
| **Cloud SQL connection issues** | Medium | High | Thoroughly test connection strings, keep Cloud SQL config separate |
| **AWS Remotion Lambda config** | Medium | Medium | Document all AWS resources, test independently |
| **URL redirect failures** | Low | Medium | Test redirects extensively, monitor 404s |
| **Firestore rule conflicts** | Medium | High | Review rules carefully, test with Firebase emulator |
| **Storage path conflicts** | Low | Low | Use namespaced paths (`/template-stamper/`, etc.) |
| **Cost overruns** | Low | Medium | Set up budget alerts, monitor daily |
| **User confusion (new URLs)** | Medium | Low | Communication plan, update documentation |
| **Git merge conflicts** | High | Low | Use git subtree, resolve conflicts incrementally |

---

## Success Criteria

Migration is successful when:

1. ✅ All 6 tools hosted under `v3-creative-engine.web.app`
2. ✅ All tools fully functional at new URLs
3. ✅ All Cloud Functions migrated and working
4. ✅ All Firestore data accessible and secure
5. ✅ All Cloud Storage files migrated
6. ✅ MCP bridges working between tools
7. ✅ No data loss or corruption
8. ✅ Performance metrics equal or better than baseline
9. ✅ Old URLs redirect to new URLs
10. ✅ Single Git repository with clean structure
11. ✅ Unified billing and cost tracking
12. ✅ Documentation complete and up-to-date
13. ✅ No critical bugs in production
14. ✅ Users can access all features

---

## Timeline Summary

| Phase | Duration | Tasks | Completion Date |
|-------|----------|-------|-----------------|
| **Phase 1: Preparation** | Week 1 | Setup, audit, planning | Feb 19, 2026 |
| **Phase 2: Shorts Intel Hub** | Week 2 | Migrate Shorts Intel Hub | Feb 26, 2026 |
| **Phase 3: Shorts Brain** | Week 3 | Migrate Shorts Brain | Mar 5, 2026 |
| **Phase 4: Agent/Generator** | Week 4 | Update existing tools | Mar 12, 2026 |
| **Phase 5: Cleanup** | Week 5 | Optimization, docs | Mar 19, 2026 |
| **Phase 6: Template Stamper** | Week 6-7 | Migrate Template Stamper (AFTER AWS→GCP migration) | Apr 2, 2026 |
| **Total** | **5-7 weeks** | | **Apr 2, 2026** |

**Target Go-Live Date (Phases 1-5):** March 19, 2026
**Final Completion (with Template Stamper):** April 2, 2026

**Note:** Template Stamper migration is **deferred** until AWS Remotion Lambda → Google Cloud migration is complete. This allows parallel work on both efforts.

---

## Next Steps

### Immediate Actions (This Week)

1. ✅ Review and approve this consolidation plan
2. ⏳ Create backups of all current Firebase projects
3. ⏳ Export all Firestore data
4. ⏳ Export Cloud SQL database (Shorts Intel Hub)
5. ⏳ Document all environment variables and secrets
6. ⏳ Set up new parent directory structure
7. ⏳ Schedule migration kickoff meeting

### Week 1 (Preparation)

1. Create consolidated directory structure
2. Clone all repositories
3. Set up Git subtree merges
4. Audit all Cloud Functions
5. Document all API endpoints
6. Create test data sets
7. Set up staging environment (if needed)

### Communication Plan

**Internal Stakeholders:**
- Notify team of consolidation plan
- Share timeline and milestones
- Set up status update cadence (weekly)

**External Users (if applicable):**
- Announce URL changes 2 weeks before migration
- Provide documentation for new URLs
- Set up email notifications for major changes

---

## Appendix

### A. Environment Variables Checklist

Document all env vars from each project:

**v3-creative-engine:**
- Firebase config
- Vertex AI credentials
- Gemini API keys

**template-stamper-d7045:**
- Firebase config
- AWS credentials (Remotion Lambda)
- AWS region
- AWS S3 bucket

**shorts-intel-hub-5c45f:**
- Firebase config
- Cloud SQL connection string
- Cloud SQL credentials
- Gemini API keys

**apac-shorts-brain-v2:**
- Firebase config
- (any other config)

---

### B. Firebase Project Settings

**Current Projects:**
1. `v3-creative-engine` (keep as primary)
2. `template-stamper-d7045` (decommission after migration)
3. `shorts-intel-hub-5c45f` (decommission after migration)
4. `apac-shorts-brain-v2` (decommission after migration)

**Project Settings to Preserve:**
- Cloud Firestore location (keep as is)
- Cloud Storage location (keep as is)
- Authentication providers
- Cloud Functions regions
- Billing account (consolidate all to v3-creative-engine)

---

### C. Git Subtree Commands Reference

```bash
# Add a repository as a subtree
git subtree add --prefix=tools/[tool-name] [repo-path] main --squash

# Pull updates from subtree (if needed)
git subtree pull --prefix=tools/[tool-name] [repo-path] main --squash

# Push changes back to original repo (if maintaining separate repos)
git subtree push --prefix=tools/[tool-name] [repo-path] main
```

---

### D. Firebase CLI Commands Reference

```bash
# Deploy everything
firebase deploy

# Deploy specific targets
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Deploy specific functions
firebase deploy --only functions:templateStamperCreateJob,functions:templateStamperRenderVideo

# Test locally
firebase emulators:start

# View logs
firebase functions:log
firebase functions:log --only templateStamperCreateJob
```

---

### E. Cost Monitoring Setup

```bash
# Set up budget alerts
gcloud billing budgets create \
  --billing-account=[BILLING_ACCOUNT_ID] \
  --display-name="V3 Creative Engine Monthly Budget" \
  --budget-amount=2500 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100

# View current costs
gcloud billing accounts list
gcloud billing accounts describe [BILLING_ACCOUNT_ID]
```

---

**Document Version:** 1.0
**Created:** February 12, 2026
**Last Updated:** February 12, 2026
**Next Review:** After Phase 1 completion
**Owner:** Ivan Ho
