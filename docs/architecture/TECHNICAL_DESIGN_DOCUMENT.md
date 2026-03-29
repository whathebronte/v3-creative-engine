# V3 Creative Engine - Technical Design Document

**Version:** 1.0
**Last Updated:** February 2026
**Project:** YouTube Shorts Automation Toolbox
**Owner:** YouTube Marketing APAC Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture](#3-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Tool-Specific Technical Specifications](#5-tool-specific-technical-specifications)
6. [Data Models](#6-data-models)
7. [API Specifications](#7-api-specifications)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Security & Authentication](#9-security--authentication)
10. [Integration Patterns](#10-integration-patterns)
11. [Performance & Scalability](#11-performance--scalability)
12. [Monitoring & Observability](#12-monitoring--observability)
13. [Development Workflow](#13-development-workflow)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. Executive Summary

### 1.1 Product Vision

The V3 Creative Engine (Shorts Toolbox) is a consolidated ecosystem of six specialized tools designed to automate and optimize the YouTube Shorts campaign workflow for APAC markets. The platform enables creative generation, multi-agent orchestration, template-based video production, market intelligence gathering, and campaign performance analysis.

### 1.2 Key Objectives

- **Consolidation**: Unified 6 separate Firebase projects into a single infrastructure
- **Cost Optimization**: Achieved 80% cost reduction (from $30-40/month to $6-12/month)
- **Automation**: End-to-end automation from ideation to video delivery
- **Scale**: Support for multiple APAC markets (Korea, Japan, Indonesia, India)
- **Intelligence**: AI-powered insights and trend analysis

### 1.3 Current Status

- **Phase 1-6 Complete**: 5 out of 6 tools fully migrated and operational
- **Live Production URL**: https://v3-creative-engine.web.app/
- **Infrastructure**: Google Cloud Platform (100% Google Cloud)
- **Deployment Status**: Production-ready, actively used by APAC team

---

## 2. System Overview

### 2.1 Platform Architecture

The V3 Creative Engine follows a **microservices-inspired monorepo architecture** where each tool operates independently but shares common infrastructure:

```
┌─────────────────────────────────────────────────────────────────┐
│                     v3-creative-engine.web.app                  │
│                         (Firebase Hosting)                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
       ┌────────▼────────┐  ┌────▼─────┐  ┌───────▼────────┐
       │ Static Frontend │  │ Cloud    │  │ Cloud Storage  │
       │ Apps (SPAs)     │  │ Functions│  │ (Assets/Media) │
       └─────────────────┘  └──────────┘  └────────────────┘
                │                 │                 │
                └────────┬────────┴────────┬────────┘
                         │                 │
                    ┌────▼─────┐    ┌─────▼──────┐
                    │ Firestore│    │ Cloud Run  │
                    │ Database │    │ (Remotion) │
                    └──────────┘    └────────────┘
```

### 2.2 Tool Ecosystem

| Tool Name | Type | Purpose | Status |
|-----------|------|---------|--------|
| **Hub** | Portal | Central navigation and tool launcher | ✅ Live |
| **Creative Generator** | SPA | AI-powered image/video generation with Gemini | ✅ Live |
| **Agent Collective** | SPA | Multi-agent workflow automation system | ✅ Live |
| **Template Stamper** | SPA | Video template rendering with Remotion | ✅ Live |
| **Shorts Intel Hub** | SPA | Weekly trending topics dashboard | ✅ Live |
| **Shorts Brain** | SPA | Campaign performance analysis | ✅ Live |
| **Campaign Learnings** | Analytics | Performance correlation engine | ⏸️ Future |

### 2.3 Data Flow

```
1. Intelligence Gathering (Shorts Intel Hub)
   └─> Weekly trends & topics

2. Ideation & Creative Generation (Agent Collective + Creative Generator)
   └─> AI-generated images/videos

3. Template Stamping (Template Stamper)
   └─> Branded video ads with asset slots

4. Campaign Analysis (Shorts Brain)
   └─> Performance metrics & insights

5. Learning Loop (Campaign Learnings) [Future]
   └─> Correlation analysis & optimization
```

---

## 3. Architecture

### 3.1 Overall System Architecture

**Architecture Pattern**: Serverless Microservices with Shared Infrastructure

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                 │
├──────────────────────────────────────────────────────────────────────┤
│  Hub (Vanilla)  │  Creative Gen (Vanilla)  │  Agent Collective       │
│  Shorts Brain   │  Template Stamper (React)│  Shorts Intel (React)   │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS/REST API
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                              │
├──────────────────────────────────────────────────────────────────────┤
│                     Firebase Hosting + Rewrites                       │
│  Routes:  /creative-generator/**, /template-stamper/**,              │
│           /shorts-intel-hub/api/**, /shorts-brain/**                 │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
┌───────────────────┐  ┌──────────────────┐  ┌───────────────┐
│  Cloud Functions  │  │   Cloud Run      │  │ Cloud SQL     │
│  v2 (Node 20)     │  │   (Remotion)     │  │ PostgreSQL    │
├───────────────────┤  ├──────────────────┤  │ + pgvector    │
│ • Creative Gen    │  │ • Video Renderer │  └───────────────┘
│ • Template Stamp  │  │ • Chromium       │
│ • Shorts Intel    │  │ • FFmpeg         │
│ • Agent Collective│  └──────────────────┘
└───────────────────┘
         │
         │
         ▼
┌───────────────────────────────────────────────────────────────┐
│                    DATA & STORAGE LAYER                        │
├───────────────────────────────────────────────────────────────┤
│  Firestore (NoSQL)  │  Cloud Storage  │  Cloud Scheduler     │
│  • jobs             │  • renders/     │  • Video poller      │
│  • gallery          │  • uploads/     │  • Weekly refresh    │
│  • weekly_topics    │  • knowledge/   │                      │
│  • campaigns        │  • remotion-    │                      │
│  • chat_archives    │    bundle/      │                      │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 Frontend Architecture

#### 3.2.1 Hub (Vanilla HTML/CSS/JS)
- **Pattern**: Multi-page app with client-side routing
- **Framework**: None (pure HTML/CSS/JS)
- **State Management**: LocalStorage for country preferences
- **Styling**: Custom CSS with gradient animations

#### 3.2.2 Creative Generator (Vanilla JS)
- **Pattern**: Single-page application
- **Framework**: None (pure HTML/CSS/JS)
- **State Management**: In-memory JavaScript objects
- **UI Components**: Custom modals, gallery grid, lightbox
- **Real-time**: Firestore snapshots for job status polling
- **File Structure**:
  ```
  public/creative-generator/
  ├── index.html       # Main layout (3-column design)
  ├── script.js        # Application logic (~2000 lines)
  ├── style.css        # Styling
  └── config.js        # Firebase configuration
  ```

#### 3.2.3 Agent Collective (Vanilla JS)
- **Pattern**: Single-page application
- **Framework**: None (self-contained HTML)
- **State Management**: In-memory state with localStorage persistence
- **UI Components**: Agent cards, chat interface, knowledge uploader
- **Architecture**: Multi-agent orchestration with protocol-based communication
- **File Structure**:
  ```
  public/agent-collective/
  └── index.html       # Self-contained (HTML + CSS + JS in one file)
  ```

#### 3.2.4 Template Stamper (React + TypeScript)
- **Pattern**: Single-page application
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3.4
- **UI Library**: Lucide React (icons)
- **Routing**: React Router DOM 6
- **State Management**: React hooks (useState, useEffect)
- **File Upload**: React Dropzone
- **Bundle Size**: ~704KB (production build)
- **File Structure**:
  ```
  tools/template-stamper/
  ├── src/
  │   ├── components/    # React components
  │   ├── pages/         # Route pages
  │   ├── lib/           # Firebase SDK initialization
  │   └── App.tsx        # Main app component
  ├── vite.config.ts     # Build to ../../public/template-stamper/
  └── package.json
  ```

#### 3.2.5 Shorts Intel Hub (React + TypeScript)
- **Pattern**: Single-page application
- **Framework**: React 18.3 + TypeScript
- **Build Tool**: Vite 6.3
- **UI Library**: Radix UI + Material-UI 7
- **Styling**: Tailwind CSS 4.1 + Emotion
- **State Management**: React Hook Form
- **Visualization**: Recharts 2.15
- **Animation**: Framer Motion 12
- **Special Features**:
  - Vector similarity search (pgvector)
  - Weekly topic curation
  - Masonry grid layout (react-responsive-masonry)
  - Dark mode support (next-themes)
- **File Structure**:
  ```
  tools/shorts-intel-hub/frontend/
  ├── src/
  │   ├── components/    # React components
  │   ├── pages/         # Route pages
  │   └── lib/           # Utilities
  ├── vite.config.ts
  └── package.json
  ```

#### 3.2.6 Shorts Brain (Vanilla JS)
- **Pattern**: Single-page application
- **Framework**: None (pure HTML/CSS/JS)
- **State Management**: Firestore real-time listeners
- **Data Structure**: Nested Firestore collections (artifacts/app/data)
- **UI**: Dataset management, analysis visualization
- **File Structure**:
  ```
  public/shorts-brain/
  ├── index.html       # Main layout
  ├── app.js           # Application logic
  ├── config.js        # Firebase + Gemini API config
  └── styles.css       # Styling
  ```

### 3.3 Backend Architecture

#### 3.3.1 Cloud Functions (Node.js 20)

**Organization Pattern**: Tool-based folder structure

```
functions/src/
├── index.js                       # Main entry point
├── creative-generator/            # 11 functions
│   ├── jobProcessor.js           # Firestore trigger
│   ├── testJob.js                # HTTP callable
│   ├── regenerateJob.js          # HTTP callable
│   ├── upscaleJob.js             # HTTP callable
│   ├── imageToVideoJob.js        # HTTP callable
│   ├── expandImageJob.js         # HTTP callable
│   ├── iterateJob.js             # HTTP callable
│   ├── importPrompt.js           # HTTP endpoint
│   ├── callGeminiAgent.js        # HTTP callable
│   ├── videoPoller.js            # PubSub scheduled
│   └── downloadAsset.js          # HTTP endpoint
├── template-stamper/              # 8 functions (TypeScript ES modules)
│   ├── index.ts                  # Exports
│   ├── api/                      # REST API endpoints
│   │   ├── templates.ts          # Get templates
│   │   └── jobs.ts               # Job CRUD
│   ├── jobs/                     # Job processing
│   │   ├── triggerRender.ts     # Firestore trigger
│   │   └── preprocessAsset.ts   # Asset preprocessing
│   └── mcp/                      # MCP Bridge
│       └── receiveAssets.ts     # Creative Generator integration
├── shorts-intel-hub/              # 2 functions (ES modules)
│   ├── index.js                  # Exports
│   ├── api/                      # Express REST API
│   │   └── routes.js            # Topic endpoints
│   ├── scheduler/                # Scheduled jobs
│   │   └── refresh.js           # Weekly topic refresh
│   └── db/                       # PostgreSQL + pgvector
│       └── connection.js        # Cloud SQL connector
├── general-context/               # Shared utilities
│   └── gemini.js                 # Gemini API client
├── shorts-intel-hub-wrapper.js   # ES module wrapper
└── template-stamper-wrapper.js   # ES module wrapper
```

**Function Types**:
- **Firestore Triggers**: Automatically execute on document creation
- **HTTP Callable**: Secure, authenticated Firebase SDK calls
- **HTTP Endpoints**: REST API endpoints with CORS
- **PubSub Scheduled**: Cron-like scheduled jobs

**Memory & Timeout Configuration**:
| Function Type | Memory | Timeout | Concurrency |
|--------------|--------|---------|-------------|
| Job Processors | 2GB | 540s | 50 |
| API Endpoints | 512MB | 60s | 100 |
| Scheduled Jobs | 1GB | 300s | 1 |
| MCP Bridges | 256MB | 30s | 100 |

#### 3.3.2 Cloud Run (Video Rendering)

**Service**: `remotion-render`
**Region**: us-central1
**Purpose**: Render videos using Remotion framework

**Specifications**:
- **Container**: Custom Docker image with Chromium + FFmpeg
- **Memory**: 8GB
- **CPU**: 4 cores
- **Timeout**: 15 minutes
- **Max Instances**: 10
- **Authentication**: Allow unauthenticated (called from Cloud Functions)

**Base Image**: Node.js 20 with system dependencies
```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y \
  chromium \
  ffmpeg \
  fonts-liberation \
  && rm -rf /var/lib/apt/lists/*
```

**Endpoints**:
- `POST /render` - Render video from composition
- `POST /compositions` - List available compositions
- `GET /health` - Health check

**Workflow**:
1. Cloud Function triggers job creation in Firestore
2. Firestore trigger calls Cloud Run `/render` endpoint
3. Cloud Run renders video with Remotion + Puppeteer
4. Returns base64-encoded video to Cloud Function
5. Cloud Function uploads to Cloud Storage
6. Firestore updated with signed URL (1-year expiry)

#### 3.3.3 Cloud SQL (PostgreSQL + pgvector)

**Instance**: shorts-intel-hub-5c45f
**Database**: Shorts Intel Hub vector storage
**Purpose**: Weekly topic embeddings for semantic search

**Specifications**:
- **PostgreSQL Version**: 14
- **Extension**: pgvector (vector similarity search)
- **Connection**: Cloud SQL Connector (IAM authentication)
- **Region**: asia-southeast1

**Schema**:
```sql
CREATE TABLE weekly_topics (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sources JSONB,
  embedding VECTOR(768),  -- Gemini text embedding dimension
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON weekly_topics USING ivfflat (embedding vector_cosine_ops);
```

**Usage**:
- Store weekly trending topics with text embeddings
- Semantic similarity search using cosine distance
- MCP integration for Agent Collective knowledge retrieval

### 3.4 Data Storage Architecture

#### 3.4.1 Firestore (NoSQL Document Database)

**Collections**:

```
v3-creative-engine (database)
│
├── jobs/                          # Creative Generator & Template Stamper
│   ├── {jobId}
│   │   ├── type: "image" | "video" | "render"
│   │   ├── status: "pending" | "processing" | "completed" | "failed"
│   │   ├── prompt: string
│   │   ├── format: "9:16" | "16:9" | "1:1" | "4:3"
│   │   ├── result: { url, data, metadata }
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── gallery/                       # Creative Generator saved assets
│   ├── {galleryId}
│   │   ├── country: "korea" | "japan" | "indonesia" | "india"
│   │   ├── url: string
│   │   ├── type: "image" | "video"
│   │   ├── prompt: string
│   │   ├── metadata: object
│   │   └── savedAt: timestamp
│
├── template_stamper_transfers/    # Asset transfers (MCP bridge)
│   ├── {transferId}
│   │   ├── assets: array
│   │   ├── country: string
│   │   ├── transferredAt: timestamp
│   │   └── processed: boolean
│
├── agent_markets/                 # Agent Collective protocols
│   ├── {marketId}  # korea, japan, indonesia, india
│   │   ├── protocol: string (markdown)
│   │   ├── knowledgeFiles: array
│   │   └── updatedAt: timestamp
│
├── chat_archives/                 # Agent Collective chat history
│   ├── {archiveId}
│   │   ├── marketId: string
│   │   ├── messages: array
│   │   ├── agents: array
│   │   └── archivedAt: timestamp
│
├── prompt_transfers/              # Agent → Creative Generator
│   ├── {transferId}
│   │   ├── prompt: string
│   │   ├── country: string
│   │   ├── transferredAt: timestamp
│   │   └── processed: boolean
│
├── weekly_topics/                 # Shorts Intel Hub topics
│   ├── {topicId}
│   │   ├── weekStart: timestamp
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── sources: array
│   │   └── createdAt: timestamp
│
├── campaigns/                     # Shorts Brain campaign data
│   ├── {campaignId}
│   │   ├── name: string
│   │   ├── market: string
│   │   ├── metrics: object
│   │   └── createdAt: timestamp
│
├── analysis_results/              # Shorts Brain analysis
│   ├── {resultId}
│   │   ├── campaignId: string
│   │   ├── insights: array
│   │   └── analyzedAt: timestamp
│
└── artifacts/                     # Shorts Brain (legacy structure)
    └── animac-app/
        └── public/
            └── data/
                ├── datasets/
                ├── pauseReliveDatasets/
                └── persistentMemory/
```

**Indexes**:
- `jobs`: compound index on `(status, createdAt)`
- `gallery`: compound index on `(country, savedAt)`
- `weekly_topics`: single field index on `weekStart`

#### 3.4.2 Cloud Storage

**Bucket**: `v3-creative-engine.firebasestorage.app`

**Directory Structure**:
```
gs://v3-creative-engine.firebasestorage.app/
│
├── uploads/                       # Creative Generator user uploads
│   ├── korea/
│   ├── japan/
│   ├── indonesia/
│   └── india/
│
├── renders/                       # Template Stamper rendered videos
│   └── {jobId}.mp4
│
├── knowledge/                     # Agent Collective knowledge base
│   ├── korea/
│   ├── japan/
│   ├── indonesia/
│   └── india/
│
├── shorts-intel-hub/              # Weekly reports and exports
│   └── reports/
│
├── shorts-brain/                  # Campaign assets and analysis
│   └── analysis/
│
├── remotion-bundle/               # Remotion static bundle
│   └── build/
│       ├── index.html
│       └── assets/
│
└── examples/                      # Public example assets
    └── veo-shorts-v1-example.mp4
```

**Access Patterns**:
- Public read access for all files (CDN optimization)
- Signed URLs for sensitive renders (1-year expiry)
- Size limits enforced via Storage Rules
- CORS enabled for cross-origin uploads

---

## 4. Technology Stack

### 4.1 Frontend Technologies

| Tool | Framework | Build Tool | Styling | UI Libraries |
|------|-----------|------------|---------|--------------|
| Hub | Vanilla JS | None | Custom CSS | None |
| Creative Generator | Vanilla JS | None | Custom CSS | None |
| Agent Collective | Vanilla JS | None | Inline CSS | None |
| Template Stamper | React 18 + TS | Vite 5 | Tailwind 3.4 | Lucide React, React Dropzone |
| Shorts Intel Hub | React 18.3 + TS | Vite 6.3 | Tailwind 4.1 + Emotion | Radix UI, Material-UI 7, Recharts |
| Shorts Brain | Vanilla JS | None | Custom CSS | None |

### 4.2 Backend Technologies

#### 4.2.1 Runtime & Languages
- **Node.js**: 20.x (LTS)
- **Languages**: JavaScript (CommonJS), TypeScript (ES Modules), ES6+

#### 4.2.2 Core Dependencies
```json
{
  "@google-cloud/vertexai": "^1.10.0",       // Vertex AI SDK
  "@google/generative-ai": "^0.2.1",         // Gemini API SDK
  "@google-cloud/storage": "^7.7.0",         // Cloud Storage
  "@google-cloud/cloud-sql-connector": "^1.2.0",  // Cloud SQL
  "firebase-admin": "^12.0.0",               // Admin SDK
  "firebase-functions": "^4.6.0",            // Cloud Functions v2
  "express": "^4.18.2",                      // Web framework
  "cors": "^2.8.5",                          // CORS middleware
  "helmet": "^7.1.0",                        // Security headers
  "pg": "^8.11.3",                           // PostgreSQL client
  "pgvector": "^0.1.8",                      // Vector extension
  "axios": "^1.6.0",                         // HTTP client
  "dotenv": "^17.2.3"                        // Environment variables
}
```

### 4.3 Google Cloud Platform Services

| Service | Purpose | Region | Configuration |
|---------|---------|--------|---------------|
| Firebase Hosting | Static file hosting + CDN | Global | Multi-region |
| Cloud Functions v2 | Serverless compute | us-central1 | Node 20 |
| Cloud Run | Container runtime | us-central1 | 8GB, 4 CPU |
| Firestore | NoSQL database | Multi-region | Native mode |
| Cloud Storage | Object storage | Multi-region | Standard class |
| Cloud SQL | PostgreSQL + pgvector | asia-southeast1 | db-f1-micro |
| Cloud Scheduler | Cron jobs | us-central1 | PubSub triggers |
| Vertex AI | Gemini API | us-central1 | Imagen 3 + Veo 2 |
| Cloud Build | CI/CD | us-central1 | Docker builds |

### 4.4 AI & ML Services

#### 4.4.1 Google Gemini API
- **Model**: Gemini 2.0 Flash (multimodal)
- **APIs Used**:
  - `generateContent` - Text generation
  - `generateImages` - Imagen 3 (image generation)
  - `generateVideo` - Veo 2 (video generation)
  - `editImage` - Image expansion, upscaling
  - `embedContent` - Text embeddings (768 dimensions)

#### 4.4.2 Vertex AI
- **Purpose**: Long-running video generation operations
- **Model**: Veo 2 (6-second video clips at 1080p)
- **Polling**: Cloud Scheduler + PubSub (every 1 minute)
- **Cost**: ~$0.50 per video generation

### 4.5 Third-Party Libraries & Tools

#### 4.5.1 Video Rendering
- **Remotion**: 4.x (React-based video framework)
- **Puppeteer**: Headless Chromium for rendering
- **FFmpeg**: Video encoding and processing

#### 4.5.2 Development Tools
- **TypeScript**: 5.3+ (Template Stamper, Shorts Intel Hub)
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Vite**: Fast build tool and dev server
- **Vitest**: Unit testing framework

---

## 5. Tool-Specific Technical Specifications

### 5.1 Hub (Central Portal)

**Purpose**: Central navigation and tool launcher

**Technology**:
- Vanilla HTML/CSS/JS
- Single HTML file (`hub.html`)
- LocalStorage for country preferences

**Features**:
- Tool cards with gradient animations
- Track-based organization (Intelligence, Creation, Production, Analysis)
- "Coming Soon" badges for future tools
- Direct links to all tools

**URL Structure**:
- Root: `https://v3-creative-engine.web.app/`
- Rewrite rule: `/** → /hub.html`

---

### 5.2 Creative Generator

**Purpose**: AI-powered image and video generation using Google Gemini

#### 5.2.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Vanilla JS)                       │
├─────────────────────────────────────────────────────────────────┤
│  Control Panel  │  Main Lightbox  │  Gallery View              │
│  • Generate     │  • Preview      │  • Saved assets            │
│  • Aspect ratio │  • Actions      │  • Country folders         │
│  • Actions      │  • Status       │  • MCP transfer            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Firebase SDK
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Cloud Functions                             │
├─────────────────────────────────────────────────────────────────┤
│  processJob (Firestore trigger)                                 │
│  • Image generation (Gemini Imagen 3)                           │
│  • Video generation (Gemini Veo 2)                              │
│  • Upload to Cloud Storage                                      │
│                                                                  │
│  Action Functions (HTTP Callable)                               │
│  • upscaleJob - Increase resolution                             │
│  • iterateJob - Create variations                               │
│  • expandImageJob - Expand canvas                               │
│  • imageToVideoJob - Animate static images                      │
│  • regenerateJob - Retry failed jobs                            │
│                                                                  │
│  Utility Functions                                              │
│  • pollVideoOperations - Check Veo 2 operation status           │
│  • downloadAsset - Proxy for CORS-enabled downloads             │
│  • callGeminiAgent - Server-side Gemini API calls               │
│  • importPrompt - MCP bridge from Agent Collective              │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 Key Features

**Generation**:
- **Image Generation**: Gemini Imagen 3 (text-to-image)
  - Aspect ratios: 9:16, 16:9, 1:1, 4:3
  - Resolution: Up to 1536×1536 pixels
  - Latency: ~3-5 seconds

- **Video Generation**: Gemini Veo 2 (text-to-video)
  - Aspect ratios: 9:16, 16:9
  - Duration: 6 seconds at 24fps
  - Resolution: 1080p
  - Latency: ~3-5 minutes (polling-based)

**Actions**:
- **Upscale**: Increase image resolution (2x-4x)
- **Iterate**: Generate variations with random seed
- **Prompt Iterate**: Generate variations with prompt modifications
- **Expand**: Extend image canvas (outpainting)
- **Animate (i2v)**: Convert static image to video

**Gallery Management**:
- Country-based folders (Korea, Japan, Indonesia, India)
- Save to gallery with metadata
- Upload custom assets
- Multi-select for batch actions
- MCP transfer to Template Stamper

#### 5.2.3 Job Processing Flow

```
1. User Action (Generate/Upscale/etc)
   │
   ├─> Create job document in Firestore
   │   {
   │     type: "image" | "video",
   │     status: "pending",
   │     prompt: "...",
   │     format: "9:16",
   │     context: { ... }
   │   }
   │
2. Firestore Trigger (onCreate)
   │
   ├─> processJob function executes
   │   │
   │   ├─> Call Gemini API
   │   │   • Image: generateImages() - immediate response
   │   │   • Video: generateVideo() - returns operationId
   │   │
   │   ├─> For video: Store operationId in Firestore
   │   │
   │   ├─> Upload result to Cloud Storage
   │   │
   │   └─> Update job status to "completed"
   │
3. Video Polling (PubSub scheduled every 1 minute)
   │
   ├─> pollVideoOperations function
   │   │
   │   ├─> Query jobs with pending video operations
   │   │
   │   ├─> Check operation status via Vertex AI
   │   │
   │   ├─> If complete: Download video, upload to Storage
   │   │
   │   └─> Update job status
   │
4. Real-time Updates
   │
   └─> Frontend listens to job document snapshots
       │
       └─> Update UI with status/results
```

#### 5.2.4 API Endpoints

| Function | Type | Trigger | Input | Output |
|----------|------|---------|-------|--------|
| `processJob` | Firestore | `jobs/{jobId}` onCreate | Job document | Updates job with result |
| `upscaleJob` | HTTP Callable | Manual | `{ jobId, factor }` | New job ID |
| `iterateJob` | HTTP Callable | Manual | `{ jobId }` | New job ID |
| `expandImageJob` | HTTP Callable | Manual | `{ jobId, expandMode }` | New job ID |
| `imageToVideoJob` | HTTP Callable | Manual | `{ jobId, motionPrompt }` | New job ID |
| `regenerateJob` | HTTP Callable | Manual | `{ jobId }` | New job ID |
| `pollVideoOperations` | PubSub | Cloud Scheduler | None | Updates pending jobs |
| `downloadAsset` | HTTP | Manual | `?url=...` | Asset with CORS headers |
| `callGeminiAgent` | HTTP Callable | Manual | `{ prompt, context }` | Gemini response |
| `importPrompt` | HTTP | MCP bridge | `{ prompt, country }` | Job ID |

#### 5.2.5 Data Models

**Job Document**:
```typescript
interface Job {
  type: 'image' | 'video' | 'upscale' | 'iterate' | 'expand' | 'i2v';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  format: '9:16' | '16:9' | '1:1' | '4:3';
  result?: {
    url: string;           // Cloud Storage signed URL
    data?: string;         // Base64 (optional, for small images)
    metadata?: object;     // Gemini response metadata
  };
  context?: {
    referenceImageUrl?: string;
    expandMode?: boolean;
    operationId?: string;  // For video operations
    parentJobId?: string;  // For derived jobs
  };
  error?: {
    message: string;
    code: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Gallery Document**:
```typescript
interface GalleryItem {
  country: 'korea' | 'japan' | 'indonesia' | 'india';
  url: string;
  type: 'image' | 'video';
  prompt: string;
  metadata?: {
    jobId?: string;
    format?: string;
    source?: 'generated' | 'uploaded';
  };
  savedAt: Timestamp;
}
```

---

### 5.3 Agent Collective

**Purpose**: Multi-agent workflow automation with protocol-based communication

#### 5.3.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Frontend (Self-contained HTML)                 │
├─────────────────────────────────────────────────────────────────┤
│  Agent Selection  │  Chat Interface  │  Knowledge Management   │
│  • 6 agents       │  • Multi-agent   │  • PDF/DOCX upload      │
│  • Protocol-based │  • Protocol      │  • Market-specific      │
│  • Roles          │  • History       │  • Firestore sync       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Gemini API (client-side)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Gemini 2.0 Flash                            │
├─────────────────────────────────────────────────────────────────┤
│  • Multi-turn conversations                                      │
│  • Protocol-guided responses                                     │
│  • Knowledge base integration                                    │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3.2 Agent Roles

| Agent | Role | Specialization |
|-------|------|----------------|
| **Creative Strategist** | Campaign ideation | Brand positioning, creative concepts |
| **Audience Analyst** | Audience insights | Demographics, psychographics, trends |
| **Cultural Advisor** | Localization | Market-specific cultural nuances |
| **Performance Manager** | Optimization | KPI tracking, A/B testing, budget allocation |
| **Compliance Officer** | Legal review | Ad policies, copyright, regulations |
| **Production Coordinator** | Asset management | Creative briefs, asset specifications |

#### 5.3.3 Protocol System

**Protocol Structure**:
```markdown
# Agent Protocol: {Agent Name}

## Role
{Description of agent's responsibilities}

## Expertise
- {Area 1}
- {Area 2}

## Communication Style
{How the agent should communicate}

## Decision Framework
{How the agent should make decisions}

## Handoff Conditions
- When to involve {Other Agent}
- When to escalate to human
```

**Protocol Storage**:
- Stored in Firestore: `agent_markets/{marketId}`
- Market-specific protocols (korea, japan, indonesia, india)
- Editable via UI
- Loaded into Gemini system instructions

#### 5.3.4 Knowledge Base

**Upload Process**:
1. User selects market and uploads PDF/DOCX
2. File uploaded to Cloud Storage: `knowledge/{market}/{filename}`
3. Metadata stored in Firestore: `agent_markets/{marketId}.knowledgeFiles[]`
4. Gemini API accesses via signed URLs during conversations

**Supported Formats**:
- PDF (application/pdf)
- Word (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- Max size: 50MB

#### 5.3.5 MCP Integrations

**Prompt Transfer to Creative Generator**:
```javascript
// Transfer finalized prompt
fetch('https://v3-creative-engine.web.app/creative-generator/api/importPrompt', {
  method: 'POST',
  body: JSON.stringify({
    prompt: finalizedPrompt,
    country: selectedMarket
  })
});

// Stored in Firestore: prompt_transfers/{transferId}
// Creative Generator polls and displays in prompt input
```

**Intel Hub Integration** (Future):
- Query weekly topics via MCP
- Semantic search for trend insights
- Auto-populate agent context with latest trends

#### 5.3.6 Chat History & Archives

**Session Management**:
- In-memory chat history during session
- "Archive & Export" button saves to Firestore
- Archives stored in: `chat_archives/{archiveId}`

**Archive Document**:
```typescript
interface ChatArchive {
  marketId: string;
  activeAgents: string[];  // Array of agent names
  messages: Array<{
    role: 'user' | 'agent';
    agentName?: string;
    content: string;
    timestamp: number;
  }>;
  protocol: string;  // Protocol text at time of archive
  archivedAt: Timestamp;
}
```

---

### 5.4 Template Stamper

**Purpose**: Professional video template rendering with asset slot system

#### 5.4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend (React + TypeScript)                   │
├─────────────────────────────────────────────────────────────────┤
│  Templates Page  │  Jobs Page  │  MCP Receiver                 │
│  • Template list │  • Job list │  • Asset import               │
│  • Asset upload  │  • Status   │  • Creative Gen integration   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Firebase SDK (REST API)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Cloud Functions (TypeScript)                    │
├─────────────────────────────────────────────────────────────────┤
│  API Functions:                                                  │
│  • tsGetTemplates - List available templates                    │
│  • tsGetTemplate - Get template details                         │
│  • tsCreateJob - Create rendering job                           │
│  • tsGetJob - Get job status                                    │
│  • tsGetJobHistory - List recent jobs                           │
│  • tsReceiveAssets - MCP bridge                                 │
│  • tsPreprocessAsset - Generate signed URLs                     │
│                                                                  │
│  Job Processing:                                                │
│  • tsTriggerRemotionRender (Firestore trigger)                  │
│    └─> Calls Cloud Run rendering service                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cloud Run (Remotion)                         │
├─────────────────────────────────────────────────────────────────┤
│  Endpoint: POST /render                                          │
│  • Loads Remotion bundle from Cloud Storage                     │
│  • Renders composition with Puppeteer                           │
│  • Encodes video with FFmpeg                                    │
│  • Returns base64-encoded MP4                                   │
│                                                                  │
│  Specifications:                                                 │
│  • Memory: 8GB                                                  │
│  • CPU: 4 cores                                                 │
│  • Timeout: 15 minutes                                          │
│  • Max instances: 10                                            │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.4.2 Template System

**Template Structure**:
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  assetSlots: AssetSlot[];
  outputSpecs: {
    format: '9:16' | '16:9';
    resolution: { width: number; height: number };
    duration: number;  // seconds
    fps: 30 | 60;
  };
}

interface AssetSlot {
  id: string;
  name: string;
  type: 'image' | 'video' | 'text';
  constraints: {
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: string;
    maxDuration?: number;  // for video
    maxLength?: number;    // for text
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timing: {
    start: number;  // seconds
    end: number;    // seconds
  };
}
```

**Example Template: Veo Shorts V1**:
```json
{
  "id": "veo-shorts-v1",
  "name": "Veo Shorts V1",
  "description": "9:16 vertical video with 3-scene structure",
  "assetSlots": [
    {
      "id": "section1_grid_01",
      "name": "Section 1 - Grid Image 1",
      "type": "image",
      "constraints": {
        "minWidth": 720,
        "minHeight": 1280,
        "aspectRatio": "9:16"
      },
      "timing": { "start": 0, "end": 3 }
    },
    {
      "id": "section2_selected_image",
      "name": "Section 2 - Selected Image",
      "type": "image",
      "constraints": {
        "minWidth": 400,
        "minHeight": 400,
        "aspectRatio": "1:1"
      },
      "timing": { "start": 3, "end": 6 }
    },
    {
      "id": "section2_prompt_text",
      "name": "Section 2 - Prompt Text",
      "type": "text",
      "constraints": {
        "maxLength": 200
      },
      "timing": { "start": 3, "end": 6 }
    }
  ],
  "outputSpecs": {
    "format": "9:16",
    "resolution": { "width": 1080, "height": 1920 },
    "duration": 6,
    "fps": 30
  }
}
```

#### 5.4.3 Rendering Pipeline

**Job Creation Flow**:
```
1. User selects template and uploads assets
   │
   ├─> Frontend calls tsCreateJob
   │   POST /api/createJob
   │   Body: {
   │     templateId: "veo-shorts-v1",
   │     assets: {
   │       section1_grid_01: { url: "gs://..." },
   │       section2_selected_image: { url: "gs://..." },
   │       section2_prompt_text: "A futuristic cityscape"
   │     }
   │   }
   │
2. Cloud Function creates job in Firestore
   │
   ├─> Document created: jobs/{jobId}
   │   {
   │     type: "render",
   │     templateId: "veo-shorts-v1",
   │     assets: { ... },
   │     status: "pending"
   │   }
   │
3. Firestore Trigger (tsTriggerRemotionRender)
   │
   ├─> Generate signed URLs for all assets
   │   • 1-hour expiry
   │   • Public read access
   │
   ├─> Call Cloud Run rendering service
   │   POST https://remotion-render-XXX.us-central1.run.app/render
   │   Body: {
   │     serveUrl: "https://storage.googleapis.com/.../index.html",
   │     composition: "VeoShortsV1",
   │     inputProps: {
   │       section1_grid_01: "https://storage.googleapis.com/...?...",
   │       section2_selected_image: "https://...",
   │       section2_prompt_text: "A futuristic cityscape"
   │     }
   │   }
   │
4. Cloud Run Rendering
   │
   ├─> Load Remotion bundle
   ├─> Launch Puppeteer (headless Chromium)
   ├─> Render React components frame-by-frame
   ├─> Encode with FFmpeg (H.264, AAC)
   ├─> Return base64-encoded video
   │
5. Upload & Finalize
   │
   ├─> Cloud Function receives base64 video
   ├─> Upload to Cloud Storage: renders/{jobId}.mp4
   ├─> Generate signed URL (1-year expiry)
   ├─> Update job document
       {
         status: "completed",
         result: {
           url: "https://storage.googleapis.com/...?Expires=..."
         },
         completedAt: timestamp
       }
```

**Rendering Performance**:
- Average render time: 30-60 seconds for 6-second video
- Cost per render: ~$0.05 (Cloud Run + Storage)
- Concurrency: Up to 10 parallel renders

#### 5.4.4 MCP Bridge (Creative Generator Integration)

**Asset Transfer Flow**:
```
1. User selects assets in Creative Generator gallery
   │
   ├─> Click "Send to Template Stamper"
   │
2. Creative Generator calls MCP endpoint
   │
   ├─> POST /api/mcp/receiveAssets
   │   Body: {
   │     assets: [
   │       { url: "gs://...", type: "image", metadata: {...} },
   │       { url: "gs://...", type: "video", metadata: {...} }
   │     ],
   │     country: "korea"
   │   }
   │
3. Template Stamper stores transfer
   │
   ├─> Create document: template_stamper_transfers/{transferId}
   │   {
   │     assets: [...],
   │     country: "korea",
   │     processed: false,
   │     transferredAt: timestamp
   │   }
   │
4. Template Stamper frontend polls for new transfers
   │
   ├─> Real-time listener on template_stamper_transfers
   ├─> Display notification: "3 new assets received"
   ├─> Pre-populate asset slots
   │
5. User confirms template and creates job
```

#### 5.4.5 Remotion Composition

**VeoShortsV1 Composition** (React Component):
```tsx
import { AbsoluteFill, Img, Sequence, useVideoConfig } from 'remotion';

export const VeoShortsV1: React.FC<{
  section1_grid_01: string;
  section2_selected_image: string;
  section2_prompt_text: string;
}> = ({ section1_grid_01, section2_selected_image, section2_prompt_text }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Section 1: Grid Layout (0-3s) */}
      <Sequence from={0} durationInFrames={3 * fps}>
        <Img src={section1_grid_01} style={{ width: '100%', height: '100%' }} />
      </Sequence>

      {/* Section 2: Selected Image + Prompt (3-6s) */}
      <Sequence from={3 * fps} durationInFrames={3 * fps}>
        <AbsoluteFill>
          <Img src={section2_selected_image} style={{ width: '50%', margin: 'auto' }} />
          <div style={{ position: 'absolute', bottom: 100, width: '100%', textAlign: 'center' }}>
            <p style={{ color: 'white', fontSize: 32 }}>{section2_prompt_text}</p>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
```

---

### 5.5 Shorts Intel Hub

**Purpose**: Weekly trending topics dashboard with semantic search

#### 5.5.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend (React + TypeScript)                   │
├─────────────────────────────────────────────────────────────────┤
│  Topics Dashboard  │  Search Interface  │  Analytics            │
│  • Weekly topics   │  • Semantic search │  • Trend charts       │
│  • Masonry layout  │  • Filters         │  • Insights           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Cloud Functions (Express API)                   │
├─────────────────────────────────────────────────────────────────┤
│  GET /api/topics                                                 │
│  • List topics by week                                           │
│  • Pagination support                                            │
│                                                                  │
│  GET /api/topics/:id                                             │
│  • Get topic details                                             │
│                                                                  │
│  POST /api/search                                                │
│  • Semantic similarity search                                    │
│  • Uses pgvector cosine distance                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Cloud SQL Connector
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Cloud SQL (PostgreSQL + pgvector)               │
├─────────────────────────────────────────────────────────────────┤
│  Table: weekly_topics                                            │
│  • id (serial)                                                   │
│  • week_start (date)                                             │
│  • title (text)                                                  │
│  • description (text)                                            │
│  • sources (jsonb)                                               │
│  • embedding (vector(768))  ← Gemini text embedding              │
│  • created_at (timestamp)                                        │
│                                                                  │
│  Index: ivfflat (embedding vector_cosine_ops)                    │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.5.2 Weekly Refresh Process

**Scheduled Job** (Cloud Scheduler):
```
Trigger: Every Monday at 9:00 AM UTC
PubSub Topic: shorts-intel-weekly-refresh
Function: shortsIntelWeeklyRefresh
```

**Refresh Workflow**:
```
1. Fetch trending data from sources
   │
   ├─> YouTube Trending API
   ├─> Google Trends
   ├─> Social media APIs
   │
2. Aggregate and deduplicate
   │
   ├─> Group by topic similarity
   ├─> Rank by engagement metrics
   ├─> Select top 20 topics
   │
3. Generate embeddings
   │
   ├─> For each topic:
   │   └─> Call Gemini embedContent API
   │       Input: title + description
   │       Output: 768-dim vector
   │
4. Store in database
   │
   ├─> INSERT INTO weekly_topics
   │   (week_start, title, description, sources, embedding)
   │   VALUES (...)
   │
5. Sync to Firestore (for frontend caching)
   │
   └─> Create document: weekly_topics/{topicId}
```

#### 5.5.3 Semantic Search

**Search Algorithm**:
```sql
-- 1. Generate query embedding
const queryEmbedding = await gemini.embedContent(searchQuery);

-- 2. Find similar topics using cosine distance
SELECT
  id,
  title,
  description,
  sources,
  1 - (embedding <=> $1::vector) AS similarity
FROM weekly_topics
WHERE week_start >= $2
ORDER BY embedding <=> $1::vector
LIMIT 10;

-- Parameters:
-- $1: queryEmbedding (768-dim vector)
-- $2: startDate (e.g., last 12 weeks)
```

**Similarity Threshold**: 0.7 (70% similarity)

#### 5.5.4 MCP Integration (Future)

**Agent Collective Integration**:
- MCP endpoint: `GET /api/mcp/topics`
- Agent context injection: "Recent trending topics"
- Auto-refresh agent knowledge base weekly

---

### 5.6 Shorts Brain

**Purpose**: Campaign performance analysis and data repository

#### 5.6.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Vanilla JS)                         │
├─────────────────────────────────────────────────────────────────┤
│  Dataset Manager  │  Analysis View  │  Memory System            │
│  • CRUD datasets  │  • Visualize    │  • Persistent context     │
│  • Pause/Relive   │  • Insights     │  • Session history        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Firebase SDK
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Firestore                                │
├─────────────────────────────────────────────────────────────────┤
│  artifacts/animac-app/public/data/                               │
│  ├── datasets/                  # Active campaign data           │
│  │   └── {datasetId}                                             │
│  ├── pauseReliveDatasets/       # Archived campaigns            │
│  │   └── {datasetId}                                             │
│  └── persistentMemory/          # Session context                │
│      └── {memoryId}                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Future migration)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    campaigns/ & analysis_results/                │
│  (New collection structure for v2)                               │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.6.2 Data Structure

**Legacy Structure** (Current):
```
artifacts/
└── animac-app/
    └── public/
        └── data/
            ├── datasets/                      # Active campaigns
            │   ├── {datasetId}/
            │   │   ├── name: string
            │   │   ├── metrics: object
            │   │   ├── createdAt: timestamp
            │   │   └── ...campaign data
            │
            ├── pauseReliveDatasets/           # Archived campaigns
            │   └── {datasetId}/  (same structure)
            │
            └── persistentMemory/              # Session context
                └── {memoryId}/
                    ├── context: string
                    ├── insights: array
                    └── timestamp: timestamp
```

**Future Structure** (v2):
```
campaigns/
└── {campaignId}/
    ├── name: string
    ├── market: string
    ├── startDate: timestamp
    ├── endDate: timestamp
    ├── metrics: {
    │   views: number,
    │   clicks: number,
    │   conversions: number,
    │   ctr: number,
    │   cpa: number
    │ }
    ├── creatives: array
    └── status: "active" | "paused" | "completed"

analysis_results/
└── {resultId}/
    ├── campaignId: string
    ├── analysisType: string
    ├── insights: array
    ├── recommendations: array
    └── analyzedAt: timestamp
```

#### 5.6.3 Key Features

**Dataset Management**:
- Create, read, update, delete campaign datasets
- Pause/Relive system: Archive datasets and restore later
- Bulk operations

**Analysis**:
- Gemini API integration for insights
- Performance visualization
- Trend detection

**Memory System**:
- Persistent conversation context
- Session history across page reloads
- Context-aware analysis

#### 5.6.4 Gemini Integration

**Analysis Workflow**:
```javascript
// User requests analysis
const analysis = await callGeminiAgent({
  prompt: "Analyze campaign performance for dataset X",
  context: {
    dataset: campaignData,
    previousInsights: memoryContext
  }
});

// Store result
await firestore.collection('analysis_results').add({
  campaignId: datasetId,
  insights: analysis.insights,
  analyzedAt: new Date()
});
```

---

## 6. Data Models

### 6.1 Firestore Collections

#### 6.1.1 Jobs Collection
```typescript
interface Job {
  // Common fields
  type: 'image' | 'video' | 'render' | 'upscale' | 'iterate' | 'expand' | 'i2v';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Generation jobs (Creative Generator)
  prompt?: string;
  format?: '9:16' | '16:9' | '1:1' | '4:3';
  result?: {
    url: string;
    data?: string;
    metadata?: any;
  };
  context?: {
    referenceImageUrl?: string;
    expandMode?: boolean;
    operationId?: string;
    parentJobId?: string;
  };

  // Render jobs (Template Stamper)
  templateId?: string;
  assets?: Record<string, { url: string }>;

  // Error handling
  error?: {
    message: string;
    code: string;
    stack?: string;
  };
  retryCount?: number;
}
```

#### 6.1.2 Gallery Collection
```typescript
interface GalleryItem {
  country: 'korea' | 'japan' | 'indonesia' | 'india';
  url: string;
  type: 'image' | 'video';
  prompt: string;
  metadata: {
    jobId?: string;
    format?: string;
    source: 'generated' | 'uploaded';
    originalName?: string;
    fileSize?: number;
  };
  savedAt: Timestamp;
}
```

#### 6.1.3 Template Stamper Transfers
```typescript
interface TemplateStamperTransfer {
  assets: Array<{
    url: string;
    type: 'image' | 'video';
    metadata: any;
  }>;
  country: string;
  processed: boolean;
  transferredAt: Timestamp;
}
```

#### 6.1.4 Agent Markets
```typescript
interface AgentMarket {
  marketId: 'korea' | 'japan' | 'indonesia' | 'india';
  protocol: string;  // Markdown text
  knowledgeFiles: Array<{
    name: string;
    url: string;
    uploadedAt: Timestamp;
    size: number;
  }>;
  updatedAt: Timestamp;
}
```

#### 6.1.5 Chat Archives
```typescript
interface ChatArchive {
  marketId: string;
  activeAgents: string[];
  messages: Array<{
    role: 'user' | 'agent';
    agentName?: string;
    content: string;
    timestamp: number;
  }>;
  protocol: string;
  archivedAt: Timestamp;
}
```

#### 6.1.6 Weekly Topics
```typescript
interface WeeklyTopic {
  weekStart: Timestamp;
  title: string;
  description: string;
  sources: Array<{
    platform: string;
    url: string;
    engagement: number;
  }>;
  category: string;
  createdAt: Timestamp;
}
```

### 6.2 Cloud SQL Schema

```sql
-- Weekly Topics Table
CREATE TABLE weekly_topics (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sources JSONB,
  category VARCHAR(50),
  embedding VECTOR(768),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_week_start ON weekly_topics(week_start DESC);
CREATE INDEX idx_embedding ON weekly_topics USING ivfflat (embedding vector_cosine_ops);

-- Vector search function
CREATE OR REPLACE FUNCTION search_similar_topics(
  query_embedding VECTOR(768),
  similarity_threshold FLOAT DEFAULT 0.7,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  id INT,
  title TEXT,
  description TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM weekly_topics t
  WHERE 1 - (t.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. API Specifications

### 7.1 Creative Generator APIs

#### 7.1.1 Job Creation
```http
POST /processJob (Firestore Trigger)
Automatically triggered when job document is created

Document Path: jobs/{jobId}
Document Data:
{
  "type": "image",
  "prompt": "A futuristic cityscape at sunset",
  "format": "9:16"
}

Response: Updates document with result
{
  "status": "completed",
  "result": {
    "url": "https://storage.googleapis.com/...",
    "metadata": { ... }
  }
}
```

#### 7.1.2 Upscale Job
```http
POST /upscaleJob (HTTP Callable)
Content-Type: application/json

Request:
{
  "data": {
    "jobId": "abc123",
    "factor": 2  // 2x or 4x
  }
}

Response:
{
  "result": {
    "newJobId": "xyz789",
    "status": "pending"
  }
}
```

#### 7.1.3 Import Prompt (MCP)
```http
POST /importPrompt
Content-Type: application/json

Request:
{
  "prompt": "A futuristic cityscape",
  "country": "korea",
  "source": "agent-collective"
}

Response:
{
  "transferId": "abc123",
  "success": true
}
```

### 7.2 Template Stamper APIs

#### 7.2.1 Get Templates
```http
GET /tsGetTemplates

Response:
{
  "templates": [
    {
      "id": "veo-shorts-v1",
      "name": "Veo Shorts V1",
      "description": "9:16 vertical video template",
      "assetSlots": [ ... ],
      "outputSpecs": { ... }
    }
  ]
}
```

#### 7.2.2 Create Job
```http
POST /tsCreateJob
Content-Type: application/json

Request:
{
  "templateId": "veo-shorts-v1",
  "assets": {
    "section1_grid_01": { "url": "gs://..." },
    "section2_selected_image": { "url": "gs://..." },
    "section2_prompt_text": "A futuristic cityscape"
  }
}

Response:
{
  "jobId": "abc123",
  "status": "pending"
}
```

#### 7.2.3 Get Job Status
```http
GET /tsGetJob?jobId=abc123

Response:
{
  "jobId": "abc123",
  "type": "render",
  "status": "completed",
  "result": {
    "url": "https://storage.googleapis.com/renders/abc123.mp4?Expires=..."
  },
  "createdAt": "2026-02-16T10:00:00Z",
  "completedAt": "2026-02-16T10:01:30Z"
}
```

#### 7.2.4 MCP Receive Assets
```http
POST /tsReceiveAssets
Content-Type: application/json

Request:
{
  "assets": [
    {
      "url": "gs://...",
      "type": "image",
      "metadata": { ... }
    }
  ],
  "country": "korea"
}

Response:
{
  "transferId": "xyz789",
  "assetCount": 3,
  "success": true
}
```

### 7.3 Shorts Intel Hub APIs

#### 7.3.1 Get Topics
```http
GET /shorts-intel-hub/api/topics?week=2026-W07&limit=20

Response:
{
  "topics": [
    {
      "id": 123,
      "weekStart": "2026-02-10",
      "title": "AI-generated music trends",
      "description": "...",
      "sources": [ ... ],
      "category": "technology"
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 5
  }
}
```

#### 7.3.2 Search Topics
```http
POST /shorts-intel-hub/api/search
Content-Type: application/json

Request:
{
  "query": "fashion trends in Korea",
  "limit": 10,
  "threshold": 0.7
}

Response:
{
  "results": [
    {
      "id": 456,
      "title": "K-fashion revival",
      "description": "...",
      "similarity": 0.89
    }
  ]
}
```

### 7.4 Cloud Run (Remotion) API

#### 7.4.1 Render Video
```http
POST /render
Content-Type: application/json

Request:
{
  "serveUrl": "https://storage.googleapis.com/.../index.html",
  "composition": "VeoShortsV1",
  "inputProps": {
    "section1_grid_01": "https://...",
    "section2_selected_image": "https://...",
    "section2_prompt_text": "A futuristic cityscape"
  }
}

Response:
{
  "success": true,
  "videoBase64": "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21p...",
  "duration": 6,
  "fps": 30
}
```

#### 7.4.2 List Compositions
```http
POST /compositions
Content-Type: application/json

Request:
{
  "serveUrl": "https://storage.googleapis.com/.../index.html"
}

Response:
{
  "compositions": [
    {
      "id": "VeoShortsV1",
      "width": 1080,
      "height": 1920,
      "fps": 30,
      "durationInFrames": 180
    }
  ]
}
```

---

## 8. Infrastructure & Deployment

### 8.1 Firebase Project Configuration

**Project ID**: `v3-creative-engine`
**Region**: us-central1 (primary), multi-region (Firestore, Storage)

**Services Enabled**:
- Firebase Hosting
- Cloud Functions v2
- Firestore (Native mode)
- Cloud Storage
- Firebase Authentication (Anonymous auth)

### 8.2 Hosting Configuration

**`firebase.json`**:
```json
{
  "hosting": {
    "public": "public",
    "rewrites": [
      {
        "source": "/shorts-intel-hub/api/**",
        "function": "shortsIntelApi"
      },
      {
        "source": "/shorts-intel-hub/**",
        "destination": "/shorts-intel-hub/index.html"
      },
      {
        "source": "/shorts-brain/**",
        "destination": "/shorts-brain/index.html"
      },
      {
        "source": "/agent-collective/**",
        "destination": "/agent-collective/index.html"
      },
      {
        "source": "/creative-generator/**",
        "destination": "/creative-generator/index.html"
      },
      {
        "source": "/template-stamper/**",
        "destination": "/template-stamper/index.html"
      },
      {
        "source": "**",
        "destination": "/hub.html"
      }
    ]
  }
}
```

**CDN Configuration**:
- Global CDN with edge caching
- Auto SSL certificates
- Custom domain support ready

### 8.3 Cloud Functions Deployment

**Deployment Command**:
```bash
cd functions
npm install
firebase deploy --only functions
```

**Environment Variables** (`.env`):
```bash
GEMINI_API_KEY=AIzaSy...
GCP_PROJECT_ID=v3-creative-engine
VERTEX_AI_LOCATION=us-central1
CLOUD_SQL_CONNECTION_NAME=v3-creative-engine:asia-southeast1:shorts-intel-hub-5c45f
DB_USER=postgres
DB_PASSWORD=***
DB_NAME=shorts_intel
```

**Function Naming Convention**:
- Creative Generator: Direct exports (processJob, upscaleJob, etc.)
- Template Stamper: Prefixed with `ts` (tsGetTemplates, tsCreateJob, etc.)
- Shorts Intel Hub: Direct exports (shortsIntelApi, shortsIntelWeeklyRefresh)

### 8.4 Cloud Run Deployment

**Service**: remotion-render
**Repository**: us-central1-docker.pkg.dev/template-stamper-d7045/remotion-templates/render

**Build & Deploy**:
```bash
# Build Docker image
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/template-stamper-d7045/remotion-templates/render:latest \
  --project=template-stamper-d7045

# Deploy to Cloud Run
gcloud run deploy remotion-render \
  --image us-central1-docker.pkg.dev/template-stamper-d7045/remotion-templates/render:latest \
  --region us-central1 \
  --memory 8Gi \
  --cpu 4 \
  --timeout 900 \
  --max-instances 10 \
  --allow-unauthenticated \
  --project template-stamper-d7045
```

### 8.5 Firestore & Storage Rules Deployment

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

### 8.6 CI/CD Pipeline (Future)

**Proposed GitHub Actions Workflow**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build Template Stamper
        run: |
          cd tools/template-stamper
          npm install
          npm run build

      - name: Build Shorts Intel Hub
        run: |
          cd tools/shorts-intel-hub/frontend
          npm install
          npm run build

      - name: Deploy to Firebase
        run: |
          npm install -g firebase-tools
          firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

---

## 9. Security & Authentication

### 9.1 Current Security Model

**Authentication**: Currently open access (no authentication required)
**Justification**: Internal tool for APAC team only
**Future Plan**: Implement Firebase Authentication + Google Sign-In

### 9.2 Firestore Security Rules

**Philosophy**: Liberal read access, restricted write access

```javascript
// jobs/ - Anyone can read/create, only Cloud Functions can update
match /jobs/{jobId} {
  allow read: if true;
  allow create: if true;
  allow update, delete: if false;  // Only via Cloud Functions (admin SDK)
}

// gallery/ - Open read/write for now
match /gallery/{galleryId} {
  allow read, create, delete: if true;
}

// weekly_topics/ - Read-only for clients
match /weekly_topics/{topicId} {
  allow read: if true;
  allow write: if false;  // Only via Cloud Functions
}

// agent_markets/ - Open read/write
match /agent_markets/{marketId} {
  allow read, write: if true;
}
```

### 9.3 Cloud Storage Security Rules

**Philosophy**: Public read, controlled write

```javascript
// Public read access for CDN
match /{allPaths=**} {
  allow read: if true;
}

// uploads/ - Size and type restrictions
match /uploads/{country}/{fileName} {
  allow write: if request.resource.size < 10 * 1024 * 1024  // Max 10MB
               && request.resource.contentType.matches('image/.*');
}

// renders/ - Cloud Functions only
match /renders/{fileName} {
  allow write: if false;  // Only Cloud Functions
}

// knowledge/ - Document uploads
match /knowledge/{market}/{fileName} {
  allow write: if request.resource.size < 50 * 1024 * 1024  // Max 50MB
               && request.resource.contentType.matches('application/pdf|application/vnd.openxmlformats-officedocument.*');
}
```

### 9.4 API Security

**CORS Configuration**:
```javascript
const cors = require('cors');
app.use(cors({ origin: true }));  // Allow all origins
```

**Rate Limiting** (Future):
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // Limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

**Helmet Security Headers**:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 9.5 Secrets Management

**Storage**: Google Cloud Secret Manager (planned) + Firebase Functions Config

**Current Approach**:
- `.env` file for local development (git-ignored)
- Environment variables in Cloud Functions

**Secrets**:
- `GEMINI_API_KEY` - Google Gemini API key
- `DB_PASSWORD` - Cloud SQL password
- `FIREBASE_SERVICE_ACCOUNT` - Service account JSON (for admin SDK)

---

## 10. Integration Patterns

### 10.1 MCP (Model Context Protocol) Bridges

**Purpose**: Enable seamless data transfer between tools

#### 10.1.1 Agent Collective → Creative Generator
```
Flow:
1. Agent Collective finalizes creative prompt
2. User clicks "Send to Creative Generator"
3. POST /creative-generator/api/importPrompt
4. Document created in prompt_transfers/
5. Creative Generator polls and auto-populates prompt input
```

#### 10.1.2 Creative Generator → Template Stamper
```
Flow:
1. User selects assets in Creative Generator gallery
2. User clicks "Send to Template Stamper"
3. POST /template-stamper/api/mcp/receiveAssets
4. Document created in template_stamper_transfers/
5. Template Stamper displays notification
6. Assets pre-populate template slots
```

#### 10.1.3 Shorts Intel Hub → Agent Collective (Future)
```
Flow:
1. Agent Collective requests trending topics
2. MCP query to Shorts Intel Hub API
3. Semantic search for relevant topics
4. Topics injected into agent context
5. Agent generates insights based on trends
```

### 10.2 Real-time Synchronization

**Firestore Real-time Listeners**:
```javascript
// Creative Generator - Job status updates
db.collection('jobs').doc(jobId).onSnapshot((doc) => {
  const status = doc.data().status;
  updateUI(status);
});

// Template Stamper - MCP asset transfers
db.collection('template_stamper_transfers')
  .where('processed', '==', false)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        showNotification('New assets received!');
      }
    });
  });
```

### 10.3 Asset URL Management

**Signed URLs**:
```javascript
// Generate 1-hour signed URL for rendering
const bucket = admin.storage().bucket();
const file = bucket.file(filePath);
const [url] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 60 * 60 * 1000  // 1 hour
});

// Generate 1-year signed URL for final renders
const [longUrl] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 365 * 24 * 60 * 60 * 1000  // 1 year
});
```

**Public URLs** (for CDN):
```javascript
const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
```

---

## 11. Performance & Scalability

### 11.1 Performance Metrics

**Frontend Load Times**:
| Tool | Bundle Size | First Load | Time to Interactive |
|------|-------------|------------|---------------------|
| Hub | ~50KB | <500ms | <1s |
| Creative Generator | ~300KB | <1s | <2s |
| Agent Collective | ~200KB | <800ms | <1.5s |
| Template Stamper | ~704KB | <2s | <3s |
| Shorts Intel Hub | ~1.2MB | <3s | <4s |
| Shorts Brain | ~250KB | <1s | <2s |

**API Response Times**:
| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| Image Generation | 3s | 5s | 8s |
| Video Generation | 180s | 300s | 420s |
| Template Render | 45s | 90s | 120s |
| Firestore Read | 50ms | 150ms | 300ms |
| Storage Download | 200ms | 1s | 2s |

### 11.2 Scalability Considerations

**Concurrent Users**: Designed for 10-50 concurrent users (internal team)

**Bottlenecks**:
1. **Gemini API Rate Limits**:
   - Image generation: 60 requests/minute
   - Video generation: 10 requests/minute
   - Mitigation: Queue system with exponential backoff

2. **Cloud Run Concurrency**:
   - Max instances: 10
   - Renders per instance: 1 (sequential)
   - Max parallel renders: 10
   - Mitigation: Job queuing in Firestore

3. **Firestore Writes**:
   - Max writes/second/document: 1
   - Mitigation: Use separate documents for status updates

### 11.3 Caching Strategy

**Frontend Caching**:
- Service Worker for static assets (future)
- LocalStorage for user preferences
- IndexedDB for large datasets (Shorts Brain)

**CDN Caching**:
- Static assets: Cache-Control: public, max-age=31536000
- HTML files: Cache-Control: public, max-age=3600
- API responses: No caching (always fresh)

**Backend Caching**:
- Firestore query results: In-memory LRU cache (5 minutes)
- Cloud SQL query results: Connection pooling + query caching
- Cloud Storage signed URLs: Cache URLs for 1 hour

### 11.4 Cost Optimization

**Monthly Cost Breakdown** (Estimated):
| Service | Cost |
|---------|------|
| Cloud Functions | $2-3 |
| Cloud Run | $1-2 |
| Firestore | $1 |
| Cloud Storage | $0.50 |
| Cloud SQL | $7 (db-f1-micro) |
| Gemini API | $5-10 (depends on usage) |
| **Total** | **$16-24/month** |

**Cost Reduction Strategies**:
1. **Firestore**: Efficient queries, composite indexes
2. **Storage**: Lifecycle policies (delete old renders after 90 days)
3. **Functions**: Optimize cold start times, use smaller memory allocations
4. **Gemini API**: Batch requests, cache common prompts

---

## 12. Monitoring & Observability

### 12.1 Logging

**Cloud Functions Logging**:
```javascript
console.log('[JobProcessor] Processing job', jobId);
console.error('[JobProcessor] Error:', error);

// Structured logging
functions.logger.info('Job processed', {
  jobId,
  duration: elapsed,
  status: 'completed'
});
```

**Viewing Logs**:
```bash
# Real-time logs
firebase functions:log --only processJob -n 20

# Cloud Run logs
gcloud run services logs read remotion-render --region us-central1 --limit 50
```

### 12.2 Error Tracking

**Error Handling Pattern**:
```javascript
try {
  // Operation
} catch (error) {
  console.error('Error:', error);
  await jobRef.update({
    status: 'failed',
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    }
  });
  throw error;
}
```

**Error Monitoring** (Future):
- Google Cloud Error Reporting
- Sentry integration for frontend errors

### 12.3 Performance Monitoring

**Metrics to Track**:
- Job completion times (by type)
- API response times
- Error rates
- Resource utilization (memory, CPU)

**Tools**:
- Cloud Monitoring dashboards
- Firebase Performance Monitoring (frontend)
- Custom metrics via Cloud Functions

### 12.4 Alerting (Future)

**Alert Conditions**:
- Error rate > 5% in 5 minutes
- Job failure rate > 10% in 15 minutes
- API latency P95 > 10 seconds
- Cloud Run memory > 90% for 5 minutes

**Notification Channels**:
- Email
- Slack
- PagerDuty (for critical alerts)

---

## 13. Development Workflow

### 13.1 Local Development

**Setup**:
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

**Running Locally**:
```bash
# Firebase emulators (Cloud Functions + Firestore + Storage)
firebase emulators:start

# Template Stamper dev server
cd tools/template-stamper
npm run dev  # Vite dev server on localhost:5173

# Shorts Intel Hub dev server
cd tools/shorts-intel-hub/frontend
npm run dev  # Vite dev server on localhost:3001
```

### 13.2 Build Process

**Template Stamper**:
```bash
cd tools/template-stamper
npm run build
# Output: public/template-stamper/
```

**Shorts Intel Hub**:
```bash
cd tools/shorts-intel-hub/frontend
npm run build
# Output: public/shorts-intel-hub/
```

### 13.3 Deployment Workflow

**Standard Deployment**:
```bash
# 1. Build all Vite apps
cd tools/template-stamper && npm run build && cd ../..
cd tools/shorts-intel-hub/frontend && npm run build && cd ../../..

# 2. Deploy everything
firebase deploy

# 3. Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

**Cloud Run Deployment**:
```bash
# 1. Build Docker image
gcloud builds submit remotion-templates/ \
  --tag us-central1-docker.pkg.dev/template-stamper-d7045/remotion-templates/render:latest

# 2. Deploy to Cloud Run
gcloud run deploy remotion-render \
  --image us-central1-docker.pkg.dev/template-stamper-d7045/remotion-templates/render:latest \
  --region us-central1 \
  --memory 8Gi --cpu 4 --timeout 900
```

### 13.4 Git Workflow

**Branch Strategy**: Main branch only (small team)

**Commit Message Format**:
```
<type>: <description>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: feat, fix, docs, refactor, perf, test, chore

---

## 14. Future Roadmap

### 14.1 Short-term (Q1 2026)

**Authentication & Authorization**:
- [ ] Implement Firebase Authentication
- [ ] Google Sign-In for APAC team
- [ ] Role-based access control (Admin, Editor, Viewer)

**Campaign Learnings Tool**:
- [ ] Performance correlation analysis
- [ ] A/B testing framework
- [ ] Automated optimization recommendations

**Enhanced MCP Integrations**:
- [ ] Shorts Intel Hub → Agent Collective
- [ ] Shorts Brain → Campaign Learnings
- [ ] Bidirectional sync between all tools

### 14.2 Mid-term (Q2 2026)

**Advanced Analytics**:
- [ ] Real-time dashboards
- [ ] Custom report builder
- [ ] Export to Google Sheets/Data Studio

**Template Stamper Enhancements**:
- [ ] More video templates
- [ ] Custom branding uploads
- [ ] Batch rendering (multiple videos at once)

**Agent Collective v2**:
- [ ] Multi-model support (Claude, GPT-4)
- [ ] Custom agent creation
- [ ] Agent performance metrics

### 14.3 Long-term (Q3-Q4 2026)

**Multi-region Support**:
- [ ] Expand beyond APAC (EMEA, Americas)
- [ ] Localized UI translations
- [ ] Region-specific Gemini models

**API Platform**:
- [ ] Public API for external integrations
- [ ] Webhooks for event notifications
- [ ] API key management

**Advanced Video Rendering**:
- [ ] Longer video templates (15s, 30s, 60s)
- [ ] Real-time preview before rendering
- [ ] Custom transitions and effects

**ML-Powered Insights**:
- [ ] Predictive campaign performance
- [ ] Creative scoring system
- [ ] Automated creative optimization

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **MCP** | Model Context Protocol - Data transfer protocol between tools |
| **Gemini** | Google's multimodal AI model (text, image, video generation) |
| **Imagen 3** | Google's latest text-to-image model |
| **Veo 2** | Google's text-to-video generation model |
| **Remotion** | React-based video rendering framework |
| **pgvector** | PostgreSQL extension for vector similarity search |
| **SPA** | Single-page application |
| **Firestore** | Google Cloud NoSQL document database |
| **Cloud Run** | Google Cloud serverless container platform |
| **Cloud Functions** | Google Cloud serverless compute (FaaS) |
| **Signed URL** | Time-limited URL for accessing Cloud Storage files |

---

## Appendix B: Contact & Support

**Project Owner**: YouTube Marketing APAC Team
**Repository**: https://github.com/ivanivanho-work/v3-creative-engine
**Live Hub**: https://v3-creative-engine.web.app/

**For Issues**: Create GitHub issue or contact team directly

---

**Document End**
