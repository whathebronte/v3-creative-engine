# Template Stamper - Technical Design Document (TDD)

**Project:** Template Stamper - Vertical Video Ad Automation Tool
**Version:** 1.0
**Date:** 2026-01-28
**Status:** Design Approved

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Component Design](#3-component-design)
4. [Data Models](#4-data-models)
5. [API Specifications](#5-api-specifications)
6. [MCP Bridge Design](#6-mcp-bridge-design)
7. [Template System Design](#7-template-system-design)
8. [Video Rendering Pipeline](#8-video-rendering-pipeline)
9. [Storage Strategy](#9-storage-strategy)
10. [Security Design](#10-security-design)
11. [Deployment Strategy](#11-deployment-strategy)
12. [Monitoring & Logging](#12-monitoring--logging)
13. [Technology Stack](#13-technology-stack)
14. [Development Standards](#14-development-standards)

---

## 1. System Overview

### 1.1 System Purpose
Template Stamper automates the creation of branded vertical video advertisements by combining consistent template designs with variable content assets (images and videos) through a one-click batch generation process.

### 1.2 System Context
```
┌─────────────────────────┐
│ YTM Creative Generator  │
│ (External System)       │
└───────────┬─────────────┘
            │ MCP Bridge
            │ (JPEG/MPEG Assets)
            ↓
┌──────────────────────────────────────────┐
│       Template Stamper System            │
│  ┌────────────────────────────────────┐  │
│  │  Frontend (React)                  │  │
│  │  - Template selection              │  │
│  │  - Asset management                │  │
│  │  - Job monitoring                  │  │
│  │  (Firebase Hosting)                │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────┴───────────────────────┐  │
│  │  Backend (Firebase Functions)      │  │
│  │  - MCP server                      │  │
│  │  - Job queue                       │  │
│  │  - Asset preprocessing             │  │
│  │  - Remotion trigger                │  │
│  └────────┬──────────────┬────────────┘  │
│           │              │                │
│  ┌────────┴────────┐  ┌─┴──────────────┐ │
│  │ Firebase        │  │  Firestore DB  │ │
│  │ Storage         │  │  - Jobs        │ │
│  │ - Input assets  │  │  - Templates   │ │
│  │ - Output videos │  │  - History     │ │
│  └────────┬────────┘  └────────────────┘ │
└───────────┼──────────────────────────────┘
            │
            ↓
┌───────────────────────────┐
│  Remotion Lambda (AWS)    │
│  - Download assets        │
│  - Render video           │
│  - Upload to Firebase     │
└───────────────────────────┘
```

### 1.3 Design Principles
- **Separation of Concerns:** Frontend, backend, rendering isolated
- **Scalability:** Parallel rendering, async job queue
- **Reliability:** Error handling, retry logic, job tracking
- **Maintainability:** Modular components, clear interfaces
- **Cost Efficiency:** Optimized rendering, pay-per-use services

---

## 2. Architecture

### 2.1 Architectural Style
**Hybrid Serverless Architecture** combining:
- Firebase serverless platform (Google Cloud)
- AWS Lambda for specialized video rendering
- Event-driven job queue
- RESTful API for MCP integration

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Frontend (TypeScript)                             │   │
│  │  - Template Gallery                                      │   │
│  │  - Asset Upload/Preview                                  │   │
│  │  - Job Dashboard                                         │   │
│  │  - Template Management                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────┴──────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Firebase Cloud Functions (Node.js/TypeScript)          │    │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │    │
│  │  │ MCP Server │  │ Job Queue  │  │ Asset Processor  │  │    │
│  │  └────────────┘  └────────────┘  └──────────────────┘  │    │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │    │
│  │  │ API Routes │  │ Remotion   │  │ Webhook Handler  │  │    │
│  │  │            │  │ Trigger    │  │                  │  │    │
│  │  └────────────┘  └────────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
┌───────────────┴──────────────┐  ┌───────────┴──────────────────┐
│    DATA LAYER                │  │   RENDERING LAYER            │
│  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │
│  │  Firestore Database    │  │  │  │  Remotion Lambda (AWS) │  │
│  │  - jobs collection     │  │  │  │  - Lambda function     │  │
│  │  - templates collection│  │  │  │  - Chromium renderer   │  │
│  │  - assets metadata     │  │  │  │  - FFmpeg encoding     │  │
│  └────────────────────────┘  │  │  └────────────────────────┘  │
│  ┌────────────────────────┐  │  │                              │
│  │  Firebase Storage      │  │  │  Triggered via SDK           │
│  │  /assets/{id}          │  │  │  Returns video to Firebase   │
│  │  /videos/{id}          │  │  │                              │
│  │  /templates/{version}  │  │  │                              │
│  └────────────────────────┘  │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
```

### 2.3 Technology Decisions

#### 2.3.1 Chosen: Firebase + Remotion Lambda (Hybrid Approach)

**Rationale:**
- Firebase provides 95% of infrastructure (hosting, storage, DB, functions)
- Remotion Lambda optimized specifically for video rendering
- Fastest time to market (4-5 weeks vs 5-6 weeks)
- Best performance (1-2 min render time vs 2-4 min)
- Lowest complexity for initial build
- Cost-effective ($15/month total)

**Trade-offs Accepted:**
- Need AWS account in addition to Google Cloud
- Cross-cloud data transfer (mitigated by optimized asset handling)
- Two cloud provider relationships (simplified by Remotion SDK handling AWS)

---

## 3. Component Design

### 3.1 Frontend Components

#### 3.1.1 Component Tree
```
App
├── Router
│   ├── HomePage
│   ├── TemplatePage
│   │   ├── TemplateGallery
│   │   │   └── TemplateCard
│   │   ├── TemplateDetail
│   │   └── TemplateUploadForm
│   ├── GeneratePage
│   │   ├── TemplateSelector
│   │   ├── AssetUploader
│   │   │   ├── AssetPreview
│   │   │   └── AssetSlotMapping
│   │   ├── GenerationControls
│   │   └── BatchConfiguration
│   └── JobsPage
│       ├── JobList
│       │   └── JobCard
│       └── JobDetail
│           ├── JobStatus
│           ├── JobProgress
│           └── VideoPlayer
├── Header
├── Navigation
└── Providers
    ├── AuthProvider (future)
    ├── FirebaseProvider
    └── ToastProvider
```

#### 3.1.2 Key Component Specifications

**TemplateGallery Component**
```typescript
interface TemplateGalleryProps {
  templates: Template[];
  onSelect: (templateId: string) => void;
  selectedTemplateId?: string;
}

// Features:
// - Grid display of templates with preview thumbnails
// - Template metadata (name, slots, duration)
// - Search/filter capability
// - Responsive design
```

**AssetUploader Component**
```typescript
interface AssetUploaderProps {
  templateSlots: TemplateSlot[];
  onAssetsUploaded: (assets: AssetMapping[]) => void;
  maxFileSize: number; // 100MB default
}

// Features:
// - Drag-and-drop upload
// - File validation (format, size)
// - Preview thumbnails
// - Slot mapping interface
// - Progress indicators
```

**JobDashboard Component**
```typescript
interface JobDashboardProps {
  jobs: Job[];
  onRefresh: () => void;
  onDownload: (jobId: string) => void;
}

// Features:
// - Real-time job status updates
// - Progress bars for active jobs
// - Download completed videos
// - Retry failed jobs
// - Job history with filtering
```

### 3.2 Backend Components

#### 3.2.1 Firebase Cloud Functions

**Function: mcpReceiveAssets**
```typescript
// HTTP endpoint for MCP bridge
export const mcpReceiveAssets = functions.https.onRequest(async (req, res) => {
  // Validate MCP protocol
  // Receive assets (base64 or multipart)
  // Upload to Firebase Storage
  // Return asset IDs
});

// Trigger: HTTP POST from YTM Creative Generator
// Input: MCP-formatted asset data
// Output: Asset IDs and storage URLs
```

**Function: createJobQueue**
```typescript
// HTTP endpoint to create video generation job
export const createJob = functions.https.onCall(async (data, context) => {
  // Validate template and assets
  // Create job document in Firestore
  // Trigger asset preprocessing
  // Trigger Remotion Lambda
  // Return job ID
});

// Trigger: Client-side call from frontend
// Input: { templateId, assetMappings, options }
// Output: { jobId, status }
```

**Function: triggerRemotionRender**
```typescript
// Firestore-triggered function
export const triggerRemotionRender = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const job = snap.data();

    // Prepare Remotion input props
    // Call Remotion Lambda SDK
    // Update job status to 'rendering'
    // Set up webhook for completion
  });

// Trigger: New job document created
// Action: Initiates Remotion Lambda render
```

**Function: handleRenderComplete**
```typescript
// Webhook from Remotion Lambda
export const handleRenderComplete = functions.https.onRequest(async (req, res) => {
  const { jobId, videoUrl, status, error } = req.body;

  // Download video from S3
  // Upload to Firebase Storage
  // Update job status in Firestore
  // Clean up temporary assets
  // Notify client (via Firestore update)
});

// Trigger: Remotion Lambda completion webhook
// Action: Finalize job and store video
```

**Function: preprocessAssets**
```typescript
// Storage-triggered function
export const preprocessAssets = functions.storage
  .object()
  .onFinalize(async (object) => {
    // Check if preprocessing needed
    // Resize/transcode if necessary
    // Update asset metadata
    // Optimize for rendering
  });

// Trigger: New asset uploaded to /assets/
// Action: Optimize asset for rendering (30-40% speed improvement)
```

### 3.3 Component Communication

#### 3.3.1 Frontend ↔ Backend
- **Protocol:** Firebase SDK (native) + HTTPS REST for MCP
- **Authentication:** Firebase Auth (future), open for initial build
- **State Management:** React Context + Firebase real-time listeners

#### 3.3.2 Backend ↔ Remotion Lambda
- **Protocol:** Remotion Lambda SDK (abstracts AWS API Gateway + Lambda)
- **Data Transfer:**
  - Send: Signed URLs to Firebase Storage assets
  - Receive: Webhook callback with S3 video URL

#### 3.3.3 YTM ↔ Template Stamper
- **Protocol:** MCP (Model Context Protocol) bridge
- **Transport:** HTTPS with JSON payload
- **Assets:** Base64-encoded or multipart/form-data

---

## 4. Data Models

### 4.1 Firestore Collections

#### 4.1.1 `templates` Collection
```typescript
interface Template {
  id: string;                    // Auto-generated
  name: string;                  // e.g., "Veo on Shorts - Pet Skydiving"
  description: string;
  version: string;               // Semantic versioning: "1.0.0"
  previewImageUrl: string;       // Firebase Storage URL
  remotionCompositionId: string; // Remotion composition name
  slots: TemplateSlot[];         // Content slot definitions
  duration: number;              // Total video duration in seconds
  metadata: {
    createdAt: Timestamp;
    updatedBy: string;
    tags: string[];
  };
  status: 'draft' | 'active' | 'archived';
}

interface TemplateSlot {
  id: string;                    // e.g., "gridImage1", "generatedVideo"
  name: string;                  // Human-readable
  type: 'image' | 'video' | 'text';
  required: boolean;
  constraints: {
    aspectRatio?: string;        // e.g., "16:9", "1:1"
    maxDuration?: number;        // For videos (seconds)
    maxFileSize?: number;        // Bytes
    formats?: string[];          // e.g., ["jpeg", "png"]
  };
  defaultValue?: string;         // Optional default asset
}
```

**Example Document:**
```json
{
  "id": "veo-shorts-v1",
  "name": "Veo on Shorts - Pet Skydiving",
  "version": "1.0.0",
  "slots": [
    { "id": "gridImage1", "type": "image", "required": true, "constraints": { "formats": ["jpeg"] } },
    { "id": "gridImage2", "type": "image", "required": true },
    // ... 7 more
    { "id": "generatedVideo", "type": "video", "required": true, "constraints": { "maxDuration": 15 } }
  ],
  "duration": 17,
  "status": "active"
}
```

#### 4.1.2 `jobs` Collection
```typescript
interface Job {
  id: string;
  userId?: string;               // Future: user who created job
  templateId: string;            // Reference to templates collection
  templateVersion: string;       // Snapshot of version used
  assetMappings: AssetMapping[]; // Maps slots to assets
  status: JobStatus;
  progress: number;              // 0-100
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  outputVideoUrl?: string;       // Firebase Storage URL
  error?: JobError;
  metadata: {
    renderTime?: number;         // Seconds
    remotionRendererId?: string;
    cost?: number;               // For tracking
  };
}

type JobStatus =
  | 'queued'        // Waiting to start
  | 'preprocessing' // Optimizing assets
  | 'rendering'     // Remotion Lambda processing
  | 'uploading'     // Uploading final video to Firebase
  | 'completed'     // Success
  | 'failed';       // Error occurred

interface AssetMapping {
  slotId: string;                // References TemplateSlot.id
  assetUrl: string;              // Firebase Storage URL
  assetType: 'image' | 'video' | 'text';
  originalFilename: string;
  metadata: {
    size: number;
    duration?: number;           // For videos
    dimensions?: { width: number; height: number };
  };
}

interface JobError {
  code: string;
  message: string;
  details?: any;
  timestamp: Timestamp;
}
```

**Example Document:**
```json
{
  "id": "job-abc123",
  "templateId": "veo-shorts-v1",
  "templateVersion": "1.0.0",
  "status": "rendering",
  "progress": 65,
  "createdAt": "2026-01-28T10:00:00Z",
  "assetMappings": [
    {
      "slotId": "gridImage1",
      "assetUrl": "gs://template-stamper/assets/img1.jpg",
      "assetType": "image",
      "originalFilename": "cat-photo.jpg"
    }
    // ... more mappings
  ]
}
```

#### 4.1.3 `assets` Collection (Metadata Only)
```typescript
interface Asset {
  id: string;
  filename: string;
  storageUrl: string;            // Firebase Storage path
  type: 'image' | 'video';
  format: string;                // jpeg, mp4, etc.
  size: number;                  // Bytes
  dimensions?: { width: number; height: number };
  duration?: number;             // For videos
  uploadedAt: Timestamp;
  uploadedBy?: string;           // Future: user reference
  source: 'mcp' | 'manual';      // How it was uploaded
  preprocessed: boolean;         // Has optimization been applied
  metadata: {
    originalFilename: string;
    checksumMD5: string;
  };
}
```

### 4.2 Firebase Storage Structure

```
gs://template-stamper-bucket/
├── assets/
│   ├── {jobId}/
│   │   ├── original/
│   │   │   ├── {assetId}.jpg
│   │   │   └── {assetId}.mp4
│   │   └── preprocessed/
│   │       ├── {assetId}_optimized.jpg
│   │       └── {assetId}_transcoded.mp4
├── videos/
│   └── {jobId}/
│       └── {videoId}.mp4         // Final rendered video
├── templates/
│   └── {templateId}/
│       ├── {version}/
│       │   ├── preview.png
│       │   └── bundle.zip       // Template code package
└── temp/
    └── {jobId}/                  // Cleaned up after job completion
```

---

## 5. API Specifications

### 5.1 REST API Endpoints (Firebase Functions)

#### 5.1.1 Template Management

**GET /api/templates**
```
Description: List all active templates
Auth: None (future: required)
Response: 200 OK
{
  "templates": [
    {
      "id": "veo-shorts-v1",
      "name": "Veo on Shorts - Pet Skydiving",
      "version": "1.0.0",
      "previewImageUrl": "...",
      "slots": [...],
      "duration": 17
    }
  ]
}
```

**GET /api/templates/:id**
```
Description: Get template details
Response: 200 OK
{
  "template": { /* full template object */ }
}
```

**POST /api/templates/upload**
```
Description: Upload new template package
Content-Type: multipart/form-data
Body:
  - templateZip: file (template bundle)
  - metadata: JSON string
Response: 201 Created
{
  "templateId": "new-template-v1",
  "status": "draft"
}
```

#### 5.1.2 Asset Management

**POST /api/assets/upload**
```
Description: Upload assets manually
Content-Type: multipart/form-data
Body:
  - files: file[] (images/videos)
  - metadata: JSON (optional)
Response: 200 OK
{
  "assets": [
    {
      "assetId": "asset-123",
      "storageUrl": "gs://...",
      "type": "image"
    }
  ]
}
```

**POST /api/assets/mcp-receive**
```
Description: MCP bridge endpoint for YTM Creative Generator
Content-Type: application/json
Body:
{
  "protocol": "mcp-v1",
  "assets": [
    {
      "filename": "image1.jpg",
      "data": "base64-encoded-data",
      "type": "image/jpeg"
    }
  ],
  "metadata": {
    "source": "ytm-creative-generator",
    "project": "market-q1-campaign"
  }
}
Response: 200 OK
{
  "assetIds": ["asset-456", "asset-457"],
  "storageUrls": ["gs://...", "gs://..."]
}
```

#### 5.1.3 Job Management

**POST /api/jobs/create**
```
Description: Create video generation job
Content-Type: application/json
Body:
{
  "templateId": "veo-shorts-v1",
  "assetMappings": [
    { "slotId": "gridImage1", "assetId": "asset-123" },
    { "slotId": "gridImage2", "assetId": "asset-124" }
    // ... 8 mappings total
  ],
  "options": {
    "priority": "normal",
    "webhook": "https://callback-url.com" // Optional
  }
}
Response: 201 Created
{
  "jobId": "job-abc123",
  "status": "queued",
  "estimatedCompletion": "2026-01-28T10:05:00Z"
}
```

**POST /api/jobs/batch-create**
```
Description: Create multiple jobs at once
Body:
{
  "templateId": "veo-shorts-v1",
  "jobs": [
    { "assetMappings": [...] },  // Job 1
    { "assetMappings": [...] }   // Job 2
    // ... up to 16 jobs
  ]
}
Response: 201 Created
{
  "jobIds": ["job-abc123", "job-abc124", ...],
  "batchId": "batch-xyz789"
}
```

**GET /api/jobs/:id**
```
Description: Get job status and details
Response: 200 OK
{
  "job": {
    "id": "job-abc123",
    "status": "rendering",
    "progress": 65,
    "createdAt": "...",
    "outputVideoUrl": null
  }
}
```

**GET /api/jobs/:id/video**
```
Description: Download generated video
Response: 302 Redirect to Firebase Storage signed URL
```

**GET /api/jobs/history**
```
Description: List job history
Query params:
  - limit: number (default 50)
  - offset: number
  - status: JobStatus (filter)
Response: 200 OK
{
  "jobs": [...],
  "total": 150,
  "hasMore": true
}
```

### 5.2 Remotion Lambda Integration

**Remotion Lambda SDK Usage:**
```typescript
import { renderMediaOnLambda } from "@remotion/lambda/client";

const result = await renderMediaOnLambda({
  region: "us-east-1",
  functionName: "remotion-render-main",
  composition: "VeoShortsTemplate",
  serveUrl: "https://remotion-bundle.s3.amazonaws.com/template-v1",
  codec: "h264",
  inputProps: {
    // Template-specific props
    gridImages: [
      "https://storage.googleapis.com/template-stamper/assets/img1.jpg",
      // ... 8 more
    ],
    selectedImages: [...],
    generatedVideo: "...",
    promptText: "Show me and my cat skydiving",
    brandLogo: "..."
  },
  webhook: {
    url: "https://us-central1-template-stamper.cloudfunctions.net/handleRenderComplete",
    secret: process.env.WEBHOOK_SECRET
  }
});

// result contains:
// - renderId: string
// - bucketName: string (S3)
// Status is tracked via webhook callback
```

---

## 6. MCP Bridge Design

### 6.1 MCP Protocol Implementation

**Protocol:** Model Context Protocol (MCP) for app-to-app communication

**Architecture:**
```
YTM Creative Generator          Template Stamper
(MCP Client)                    (MCP Server)
     │                               │
     │  1. Establish connection      │
     ├──────────────────────────────>│
     │                               │
     │  2. Transfer assets           │
     │     POST /api/assets/mcp-receive
     ├──────────────────────────────>│
     │     { assets: [...] }         │
     │                               │
     │  3. Response with asset IDs   │
     │<──────────────────────────────┤
     │     { assetIds: [...] }       │
     │                               │
     │  4. (Optional) Status updates │
     │<──────────────────────────────┤
     │     { status: "uploaded" }    │
```

### 6.2 MCP Server Implementation

**Firebase Function: mcpServer**
```typescript
import { MCPServer } from '@modelcontextprotocol/sdk';
import { Storage } from '@google-cloud/storage';

export const mcpServer = functions.https.onRequest(async (req, res) => {
  // Validate MCP protocol headers
  if (!validateMCPProtocol(req)) {
    return res.status(400).json({ error: 'Invalid MCP protocol' });
  }

  const { assets, metadata } = req.body;

  try {
    // Process each asset
    const uploadedAssets = await Promise.all(
      assets.map(async (asset) => {
        // Decode base64 data
        const buffer = Buffer.from(asset.data, 'base64');

        // Upload to Firebase Storage
        const assetId = generateAssetId();
        const storagePath = `assets/${metadata.project}/${assetId}`;
        await uploadToStorage(storagePath, buffer, asset.type);

        // Create Firestore record
        await db.collection('assets').doc(assetId).set({
          filename: asset.filename,
          storageUrl: storagePath,
          type: getAssetType(asset.type),
          uploadedAt: FieldValue.serverTimestamp(),
          source: 'mcp',
          metadata: metadata
        });

        return { assetId, storageUrl: storagePath };
      })
    );

    res.status(200).json({
      success: true,
      assets: uploadedAssets
    });
  } catch (error) {
    console.error('MCP receive error:', error);
    res.status(500).json({ error: 'Failed to process assets' });
  }
});
```

### 6.3 MCP Client (YTM Creative Generator Side)

**Implementation Guide for YTM Team:**
```typescript
// YTM Creative Generator - MCP Client Example
import { MCPClient } from '@modelcontextprotocol/sdk';

async function transferAssetsToTemplateStamper(assets: File[]) {
  const mcpClient = new MCPClient({
    serverUrl: 'https://template-stamper.web.app/api/assets/mcp-receive',
    protocol: 'mcp-v1'
  });

  // Convert files to base64
  const encodedAssets = await Promise.all(
    assets.map(async (file) => ({
      filename: file.name,
      data: await fileToBase64(file),
      type: file.type
    }))
  );

  // Send via MCP
  const response = await mcpClient.send({
    assets: encodedAssets,
    metadata: {
      source: 'ytm-creative-generator',
      project: currentProject.id
    }
  });

  return response.assetIds;
}
```

### 6.4 MCP Security Considerations

**Initial Build (No Auth):**
- MCP endpoint is open
- Rate limiting via Firebase Functions (1000 req/day)
- Input validation (file size, format)

**Future Launch Phase:**
- Shared secret / API key authentication
- OAuth 2.0 for user-level permissions
- Request signing for integrity

---

## 7. Template System Design

### 7.1 Template Structure

**Remotion Template Anatomy:**
```
template-package/
├── package.json              # Dependencies
├── src/
│   ├── index.tsx            # Composition registration
│   ├── compositions/
│   │   └── VeoShortsTemplate.tsx  # Main template component
│   ├── components/
│   │   ├── GridScreen.tsx         # Recents grid UI
│   │   ├── PromptScreen.tsx       # Prompt input UI
│   │   ├── ResultScreen.tsx       # Generated video display
│   │   └── BrandingEndCard.tsx    # End card with logo
│   ├── assets/
│   │   ├── logo.svg               # Brand logo
│   │   ├── fonts/                 # Custom fonts
│   │   └── ui-elements.svg        # UI mockup assets
│   └── types/
│       └── props.ts               # TypeScript interfaces
├── remotion.config.ts        # Remotion configuration
└── README.md                 # Template documentation
```

### 7.2 Template Code Example

**VeoShortsTemplate.tsx**
```typescript
import { AbsoluteFill, Sequence, Video, Img } from 'remotion';
import { GridScreen } from '../components/GridScreen';
import { PromptScreen } from '../components/PromptScreen';
import { ResultScreen } from '../components/ResultScreen';
import { BrandingEndCard } from '../components/BrandingEndCard';

export interface VeoShortsTemplateProps {
  gridImages: string[];           // 9 image URLs
  selectedImages: string[];       // 2 image URLs
  promptText: string;
  generatedVideo: string;         // Video URL
  brandLogo: string;              // Logo URL
}

export const VeoShortsTemplate: React.FC<VeoShortsTemplateProps> = ({
  gridImages,
  selectedImages,
  promptText,
  generatedVideo,
  brandLogo,
}) => {
  const fps = 24;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Section 1: Grid Screen (0-60 frames = 2.5 seconds) */}
      <Sequence from={0} durationInFrames={60}>
        <GridScreen images={gridImages} />
      </Sequence>

      {/* Section 2: Prompt Screen (60-150 frames = 3.75 seconds) */}
      <Sequence from={60} durationInFrames={90}>
        <PromptScreen
          selectedImages={selectedImages}
          promptText={promptText}
        />
      </Sequence>

      {/* Section 3: Result Full Screen (150-330 frames = 7.5 seconds) */}
      <Sequence from={150} durationInFrames={180}>
        <ResultScreen videoUrl={generatedVideo} />
      </Sequence>

      {/* Section 4: Result with Frame (330-360 frames = 1.25 seconds) */}
      <Sequence from={330} durationInFrames={30}>
        <ResultScreen videoUrl={generatedVideo} withFrame={true} />
      </Sequence>

      {/* Section 5: Branding End Card (360-420 frames = 2.5 seconds) */}
      <Sequence from={360} durationInFrames={60}>
        <BrandingEndCard logo={brandLogo} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Register composition
export const composition = {
  id: 'VeoShortsTemplate',
  component: VeoShortsTemplate,
  durationInFrames: 420,
  fps: 24,
  width: 720,
  height: 1280,
};
```

**GridScreen Component:**
```typescript
import { useCurrentFrame, interpolate, spring } from 'remotion';

export const GridScreen: React.FC<{ images: string[] }> = ({ images }) => {
  const frame = useCurrentFrame();
  const fps = 24;

  // Fade in animation
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ opacity, padding: '20px' }}>
      <div style={{
        color: 'white',
        fontSize: '24px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Recents ▼</span>
        <span>✕</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
      }}>
        {images.map((img, i) => {
          // Stagger animation for each image
          const delay = i * 2;
          const scale = spring({
            frame: frame - delay,
            fps,
            config: { damping: 20 }
          });

          return (
            <img
              key={i}
              src={img}
              style={{
                width: '100%',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '8px',
                transform: `scale(${scale})`,
              }}
            />
          );
        })}
      </div>

      <button style={{
        position: 'absolute',
        bottom: '40px',
        left: '20px',
        right: '20px',
        padding: '15px',
        backgroundColor: 'white',
        border: 'none',
        borderRadius: '25px',
        fontSize: '18px',
        fontWeight: 'bold',
      }}>
        Done
      </button>
    </div>
  );
};
```

### 7.3 Template Deployment Process

**Step-by-Step:**
1. **Designer creates in Figma**
   - Design all screens (grid, prompt, result, end card)
   - Export static assets as SVG
   - Document timing and animations

2. **Developer converts to React**
   - Create component structure
   - Import SVG assets
   - Implement animations with Remotion
   - Define prop interface for content slots

3. **Test locally**
   ```bash
   npm run dev          # Preview in browser
   npm run render       # Test rendering
   ```

4. **Bundle and deploy**
   ```bash
   npm run build
   npx remotion lambda sites create src/index.tsx --site-name=veo-shorts-v1
   ```
   - Outputs: S3 URL of template bundle

5. **Register in Template Stamper**
   - Upload via Template Management UI
   - Provide: name, version, slots definition, S3 URL
   - Generate preview thumbnail
   - Set status to 'active'

### 7.4 Template Versioning Strategy

**Semantic Versioning:**
- **Major (1.0.0 → 2.0.0):** Breaking changes (slot structure changes)
- **Minor (1.0.0 → 1.1.0):** New features (new animations, optional slots)
- **Patch (1.0.0 → 1.0.1):** Bug fixes (visual corrections)

**Version Management:**
- All versions retained in Firestore
- Jobs reference specific version for reproducibility
- Users can select version or use "latest"

---

## 8. Video Rendering Pipeline

### 8.1 End-to-End Flow

```
User Action → Job Created → Assets Preprocessed → Remotion Render → Video Stored
     │              │               │                     │                │
     └─────────┬────┴───────────────┴─────────────────────┴────────────────┘
               │
        ┌──────┴──────┐
        │  Firestore  │  (Job status updates)
        └─────────────┘
```

**Detailed Pipeline:**

1. **Job Creation (Frontend)**
   ```typescript
   const jobId = await createJob({
     templateId: 'veo-shorts-v1',
     assetMappings: [...]
   });
   // Returns immediately with jobId
   ```

2. **Job Queuing (Firebase Function)**
   ```typescript
   // createJob function
   const jobDoc = await db.collection('jobs').add({
     templateId,
     assetMappings,
     status: 'queued',
     createdAt: FieldValue.serverTimestamp()
   });
   // Firestore onCreate trigger fires
   ```

3. **Asset Preprocessing (Firebase Function)**
   ```typescript
   // Triggered by job creation
   for (const mapping of job.assetMappings) {
     if (needsOptimization(mapping)) {
       await optimizeAsset(mapping.assetUrl);
       // Resize images to template dimensions
       // Transcode videos to H.264 if needed
     }
   }
   await updateJob(jobId, { status: 'preprocessing' });
   ```

4. **Remotion Trigger (Firebase Function)**
   ```typescript
   const template = await getTemplate(job.templateId);

   // Prepare input props
   const inputProps = mapAssetsToProps(job.assetMappings, template.slots);

   // Trigger Remotion Lambda
   const { renderId } = await renderMediaOnLambda({
     composition: template.remotionCompositionId,
     inputProps,
     webhook: {
       url: `${functionsUrl}/handleRenderComplete`,
       secret: process.env.WEBHOOK_SECRET
     }
   });

   await updateJob(jobId, {
     status: 'rendering',
     remotionRendererId: renderId
   });
   ```

5. **Remotion Lambda Rendering (AWS)**
   - Downloads assets from Firebase Storage (via signed URLs)
   - Launches Chromium instance
   - Renders React components frame-by-frame
   - Encodes to H.264 video
   - Uploads to S3
   - Calls webhook

6. **Render Completion (Firebase Function)**
   ```typescript
   export const handleRenderComplete = functions.https.onRequest(async (req, res) => {
     const { jobId, videoUrl, status, renderTime } = req.body;

     if (status === 'success') {
       // Download from S3
       const videoBuffer = await downloadFromS3(videoUrl);

       // Upload to Firebase Storage
       const firebaseUrl = await uploadToFirebase(
         `videos/${jobId}/output.mp4`,
         videoBuffer
       );

       // Update job
       await updateJob(jobId, {
         status: 'completed',
         outputVideoUrl: firebaseUrl,
         completedAt: FieldValue.serverTimestamp(),
         metadata: { renderTime }
       });

       // Clean up S3 temporary file
       await deleteFromS3(videoUrl);
     } else {
       // Handle error
       await updateJob(jobId, {
         status: 'failed',
         error: { message: req.body.error }
       });
     }

     res.status(200).send('OK');
   });
   ```

7. **Client Notification (Firestore Realtime)**
   ```typescript
   // Frontend listens to job updates
   useEffect(() => {
     const unsubscribe = db.collection('jobs')
       .doc(jobId)
       .onSnapshot((snapshot) => {
         const job = snapshot.data();
         setJobStatus(job.status);
         if (job.status === 'completed') {
           // Show download button
           setVideoUrl(job.outputVideoUrl);
         }
       });
     return unsubscribe;
   }, [jobId]);
   ```

### 8.2 Optimization Strategies

**Asset Preprocessing:**
```typescript
async function optimizeAsset(assetUrl: string, targetSpecs: AssetSpecs) {
  const asset = await downloadAsset(assetUrl);

  // Images: Resize to template dimensions
  if (asset.type === 'image') {
    return sharp(asset.buffer)
      .resize(targetSpecs.width, targetSpecs.height, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  // Videos: Transcode to H.264, compress if large
  if (asset.type === 'video') {
    return ffmpeg(asset.buffer)
      .videoCodec('libx264')
      .size(`${targetSpecs.width}x${targetSpecs.height}`)
      .videoBitrate('2000k')
      .toFormat('mp4')
      .toBuffer();
  }
}
```

**Parallel Batch Rendering:**
```typescript
// For batch jobs (16 videos)
async function createBatchJob(templateId, batchAssets) {
  const jobIds = await Promise.all(
    batchAssets.map(assets => createJob(templateId, assets))
  );

  // All jobs render in parallel on Remotion Lambda
  // Each completes in ~1-2 minutes
  // Total batch time: ~2-3 minutes (not 16-32 minutes!)

  return { batchId: generateBatchId(), jobIds };
}
```

### 8.3 Error Handling

**Retry Strategy:**
```typescript
async function triggerRemotionRender(job: Job, retryCount = 0) {
  const MAX_RETRIES = 3;

  try {
    await renderMediaOnLambda({...});
  } catch (error) {
    if (retryCount < MAX_RETRIES && isRetryableError(error)) {
      console.log(`Retry ${retryCount + 1}/${MAX_RETRIES}`);
      await delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
      return triggerRemotionRender(job, retryCount + 1);
    } else {
      // Mark job as failed
      await updateJob(job.id, {
        status: 'failed',
        error: { code: error.code, message: error.message }
      });
    }
  }
}
```

**Retryable Errors:**
- Network timeouts
- S3 temporary unavailability
- Lambda cold start failures

**Non-Retryable Errors:**
- Invalid asset URLs
- Malformed template props
- Out of memory (asset too large)

---

## 9. Storage Strategy

### 9.1 Firebase Storage Configuration

**Bucket Structure:**
```
gs://template-stamper-{env}/
├── assets/           # User-uploaded content
├── videos/           # Rendered outputs
├── templates/        # Template packages
└── temp/             # Cleanup after 24 hours
```

**Lifecycle Policies:**
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "Delete" },
        "condition": {
          "age": 1,
          "matchesPrefix": ["temp/"]
        }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "COLDLINE" },
        "condition": {
          "age": 90,
          "matchesPrefix": ["videos/"]
        }
      }
    ]
  }
}
```

### 9.2 Storage Optimization

**Cost Management:**
- **Original assets:** Keep for 30 days, then delete (user can re-upload if needed)
- **Preprocessed assets:** Delete after job completion
- **Output videos:** Keep indefinitely, move to Coldline after 90 days
- **Temp files:** Auto-delete after 24 hours

**Estimated Costs (64 videos/month):**
```
Assets (8 per video × 5MB avg × 64 videos): 2.5GB
Output videos (17s × 2MB × 64 videos): 128MB
Total active storage: ~3GB

Firebase Storage: $0.026/GB/month × 3GB = $0.08/month
Extremely cheap!
```

### 9.3 Signed URL Strategy

**Security:**
- Generate signed URLs with 1-hour expiration for Remotion Lambda
- Use Firebase Admin SDK for server-side signing
- No public access to assets

```typescript
async function getSignedAssetUrl(storagePath: string): Promise<string> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(storagePath);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return url;
}
```

---

## 10. Security Design

### 10.1 Current Security Model (Initial Build)

**No Authentication Required:**
- Open access to upload and generate videos
- Rate limiting via Firebase Functions quotas
- Input validation for all uploads

**Security Measures:**
- **File validation:** Check MIME types, magic bytes
- **Size limits:** 100MB per file
- **Rate limiting:** 100 uploads/hour per IP
- **CORS:** Restrict to known origins
- **Content scanning:** Basic malware scanning (Firebase built-in)

### 10.2 Future Security Model (Launch Phase)

**Firebase Authentication:**
```typescript
// Protect all endpoints
functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  // Proceed with authorized request
});
```

**Role-Based Access Control:**
- **Viewer:** Download videos only
- **Creator:** Upload assets, generate videos
- **Admin:** Manage templates, view all jobs

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Jobs: Users can only access their own
    match /jobs/{jobId} {
      allow read, write: if request.auth != null
                         && resource.data.userId == request.auth.uid;
    }

    // Templates: Read-only for all, write for admins
    match /templates/{templateId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### 10.3 MCP Bridge Security

**Initial: Shared Secret**
```typescript
const MCP_SECRET = process.env.MCP_SHARED_SECRET;

// Validate request
if (req.headers['x-mcp-secret'] !== MCP_SECRET) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

**Future: API Key + Request Signing**
```typescript
// YTM Creative Generator gets API key
const apiKey = generateAPIKey(appId: 'ytm-creative-generator');

// Request signing
const signature = hmacSHA256(requestBody, apiKey);
req.headers['x-signature'] = signature;

// Validation
if (!verifySignature(req.body, req.headers['x-signature'])) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

---

## 11. Deployment Strategy

### 11.1 Environments

**Development:**
- Firebase project: `template-stamper-dev`
- Remotion Lambda: `dev` stage
- No cost controls, unlimited testing

**Production:**
- Firebase project: `template-stamper-prod`
- Remotion Lambda: `prod` stage
- Cost alerts, monitoring enabled

### 11.2 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy Template Stamper

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          npm install
          npm run build

      - name: Deploy Frontend to Firebase Hosting
        run: npx firebase deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}

      - name: Deploy Cloud Functions
        run: npx firebase deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}

      - name: Deploy Firestore Rules
        run: npx firebase deploy --only firestore:rules

      - name: Deploy Storage Rules
        run: npx firebase deploy --only storage
```

### 11.3 Remotion Lambda Deployment

**Initial Setup:**
```bash
# One-time AWS setup
npx remotion lambda regions enable us-east-1
npx remotion lambda functions deploy

# Deploy template bundle
cd templates/veo-shorts-v1
npm run build
npx remotion lambda sites create src/index.tsx --site-name=veo-shorts-v1
```

**Output:**
```
✅ Deployed to S3: https://remotion-bundle.s3.amazonaws.com/veo-shorts-v1
✅ Lambda function: remotion-render-prod
```

### 11.4 Rollback Strategy

**Firebase:**
- Firebase Hosting: Automatic rollback via console
- Cloud Functions: Deploy previous version via Git tag

**Remotion:**
- Template bundles are versioned in S3
- Revert by updating template `serveUrl` in Firestore

---

## 12. Monitoring & Logging

### 12.1 Logging Strategy

**Frontend:**
- Google Analytics for user interactions
- Error tracking: Sentry or Firebase Crashlytics
- Performance monitoring: Firebase Performance

**Backend:**
- Cloud Functions logs: Firebase Console
- Structured logging:
  ```typescript
  logger.info('Job created', {
    jobId,
    templateId,
    userId,
    timestamp: Date.now()
  });
  ```

**Remotion Lambda:**
- CloudWatch logs automatically created
- Render metrics (time, cost) logged to Firestore

### 12.2 Metrics to Monitor

**Business Metrics:**
- Videos generated per day/week/month
- Success rate (completed / total jobs)
- Average render time
- Template usage distribution
- User engagement (repeat usage)

**Technical Metrics:**
- API response times
- Function execution times
- Storage usage growth
- Error rates by type
- Remotion Lambda cold starts

**Cost Metrics:**
- Firebase costs (storage, functions, bandwidth)
- Remotion Lambda costs (per render, per month)
- Cost per video generated

### 12.3 Alerting

**Critical Alerts:**
- Job failure rate > 10%
- Average render time > 5 minutes
- Storage costs > $50/month (anomaly)
- API error rate > 5%

**Warning Alerts:**
- Render queue depth > 50 jobs
- Storage approaching quota
- Unusual traffic patterns

**Implementation:**
```typescript
// Cloud Function monitoring
export const checkSystemHealth = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const metrics = await gatherMetrics();

    if (metrics.failureRate > 0.10) {
      await sendAlert('Critical: High failure rate', metrics);
    }

    if (metrics.avgRenderTime > 300) {
      await sendAlert('Warning: Slow render times', metrics);
    }
  });
```

---

## 13. Technology Stack

### 13.1 Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context + Firebase realtime listeners
- **UI Components:** Headless UI / Radix UI
- **File Upload:** react-dropzone
- **Video Player:** video.js or native HTML5

### 13.2 Backend
- **Platform:** Firebase (Google Cloud)
  - Hosting: Static site hosting
  - Functions: Node.js 18 serverless functions
  - Firestore: NoSQL database
  - Storage: Object storage
- **Language:** TypeScript
- **Framework:** Express.js (within Cloud Functions)

### 13.3 Rendering
- **Engine:** Remotion Lambda (AWS)
- **Chromium:** Bundled with Remotion Lambda
- **Video Encoding:** FFmpeg (bundled)
- **Output Format:** H.264 MP4

### 13.4 Integration
- **MCP Protocol:** Custom implementation (Model Context Protocol)
- **Asset Transfer:** Base64 encoding or multipart/form-data

### 13.5 Development Tools
- **Version Control:** Git + GitHub
- **Package Manager:** npm
- **Linting:** ESLint + Prettier
- **Testing:**
  - Unit: Jest
  - E2E: Playwright
- **CI/CD:** GitHub Actions
- **Monitoring:** Firebase Console, Google Cloud Logging

### 13.6 Dependencies

**Frontend (package.json):**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.7.0",
    "react-router-dom": "^6.20.0",
    "react-dropzone": "^14.2.3",
    "@headlessui/react": "^1.7.17",
    "tailwindcss": "^3.3.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

**Backend (functions/package.json):**
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0",
    "@remotion/lambda": "^4.0.0",
    "express": "^4.18.2",
    "sharp": "^0.33.0",
    "fluent-ffmpeg": "^2.1.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "typescript": "^5.3.0"
  }
}
```

**Template (Remotion):**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "remotion": "^4.0.0"
  }
}
```

---

## 14. Development Standards

### 14.1 Code Style

**TypeScript:**
- Strict mode enabled
- Explicit return types for functions
- No `any` types (use `unknown` if necessary)
- Interfaces for all data structures

**React:**
- Functional components only
- Custom hooks for reusable logic
- Prop interfaces defined
- Error boundaries for error handling

**Naming Conventions:**
- Components: PascalCase (`TemplateGallery`)
- Functions: camelCase (`createJob`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- Files: kebab-case (`template-gallery.tsx`)

### 14.2 Git Workflow

**Branching:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes

**Commit Messages:**
```
type(scope): brief description

Longer description if needed

Types: feat, fix, docs, refactor, test, chore
```

**Example:**
```
feat(templates): add veo shorts template

- Implement grid screen component
- Add prompt input UI
- Configure Remotion composition

Closes #123
```

### 14.3 Testing Strategy

**Unit Tests:**
- All utility functions
- React hooks
- Data validation functions
- Target: 80% coverage

**Integration Tests:**
- API endpoints
- Firebase Functions
- MCP bridge
- Job creation flow

**E2E Tests:**
- Upload assets → generate video → download
- Template selection flow
- Error handling scenarios

### 14.4 Documentation Standards

**Code Comments:**
```typescript
/**
 * Creates a video generation job and triggers rendering
 *
 * @param templateId - ID of the template to use
 * @param assetMappings - Maps template slots to asset URLs
 * @param options - Additional rendering options
 * @returns Promise resolving to job ID
 * @throws {ValidationError} If template or assets are invalid
 */
export async function createJob(
  templateId: string,
  assetMappings: AssetMapping[],
  options?: JobOptions
): Promise<string> {
  // Implementation
}
```

**README Requirements:**
- Setup instructions
- Environment variables
- Development workflow
- Deployment process
- Troubleshooting guide

---

## 15. Risks & Mitigation

### 15.1 Technical Risks

**Risk: Cross-Cloud Latency (Firebase ↔ AWS)**
- **Impact:** Slower asset transfer
- **Probability:** Low
- **Mitigation:**
  - Use signed URLs (no data passing through functions)
  - Preprocessed assets reduce file size
  - Remotion Lambda in us-east-1 (close to Firebase)

**Risk: Remotion Lambda Cold Starts**
- **Impact:** First render takes 30s longer
- **Probability:** Medium
- **Mitigation:**
  - Keep Lambda warm with scheduled pings
  - Set reserved concurrency for prod
  - Communicate expected time to users

**Risk: Template Complexity Causing Render Failures**
- **Impact:** Jobs fail, user frustration
- **Probability:** Low
- **Mitigation:**
  - Thorough template testing before deployment
  - Error boundaries in React components
  - Retry logic with detailed error messages

### 15.2 Business Risks

**Risk: Higher Than Expected Usage**
- **Impact:** Costs exceed budget
- **Probability:** Low
- **Mitigation:**
  - Set up cost alerts at $25, $50, $100/month
  - Implement usage quotas per user (future)
  - Architecture supports scaling without code changes

### 15.3 Integration Risks

**Risk: YTM Creative Generator MCP Integration Delays**
- **Impact:** Launch timeline affected
- **Probability:** Medium
- **Mitigation:**
  - Build manual upload fallback first
  - MCP development in parallel
  - Clear API contract defined upfront

---

## 16. Future Enhancements

**Out of scope for initial build, potential future features:**

1. **Visual Template Editor**
   - Drag-and-drop template builder
   - No-code template creation
   - Estimated effort: 6-8 weeks

2. **Real-time Collaboration**
   - Multiple users working on same project
   - Live preview updates
   - Estimated effort: 3-4 weeks

3. **Advanced Analytics**
   - Template performance metrics
   - Usage patterns dashboard
   - Cost optimization recommendations
   - Estimated effort: 2-3 weeks

4. **Social Media Integration**
   - Direct publishing to YouTube, TikTok, Instagram
   - Scheduled posting
   - Estimated effort: 4-6 weeks

5. **AI-Powered Features**
   - Auto-suggest template for content type
   - Intelligent asset cropping/framing
   - Caption generation
   - Estimated effort: 8-12 weeks

---

## 17. Glossary

See Build Requirements Document Section 14 for shared glossary terms.

**Additional Technical Terms:**
- **Cold Start:** First invocation of serverless function after idle period, slower due to initialization
- **Signed URL:** Temporary URL with authentication token for secure asset access
- **Webhook:** HTTP callback triggered by external system (Remotion → Firebase)
- **Composition:** Remotion term for a video template configuration
- **Props:** React properties passed to components, used for template variables
- **Serverless:** Cloud functions that run on-demand without managing servers

---

## 18. Approval & Sign-off

This Technical Design Document has been reviewed and approved for implementation.

**Approved By:** Project Stakeholders
**Date:** 2026-01-28
**Version:** 1.0 - Initial Design

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-28 | Claude Code | Initial technical design document |

---

**END OF TECHNICAL DESIGN DOCUMENT**
