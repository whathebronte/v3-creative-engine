# V3 Creative Engine

> A standalone "Creative Factory" for generating images and videos using Gemini & Veo APIs

## Project Overview

**Framework:** Simple, Lovable, Complete (SLC)

V3 Creative Engine is a fully decoupled creative generation system that receives finalized prompts from the V2 Prompter application via Model Context Protocol (MCP) and produces creative assets.

## Architecture

```
┌─────────────────────┐
│   V2 Prompter       │  (ytm-agent-collective-f4f71)
│   Control Panel     │
└──────────┬──────────┘
           │ MCP Bridge (One-way)
           │ Cloud Function
           ▼
┌─────────────────────┐
│   V3 Producer       │  (v3-creative-engine)
│   Creative Factory  │
└─────────────────────┘
```

## Components

### 1. The Producer (V3)
- **Role:** Self-contained creative generation engine
- **Responsibilities:**
  - Receive jobs from MCP Bridge
  - Track job states (pending, processing, complete, error)
  - Process jobs using Gemini Flash & Veo APIs
  - Store assets in Cloud Storage
  - Present results in Factory Floor UI

### 2. The MCP Bridge
- **Role:** Secure intake endpoint
- **Responsibilities:**
  - Receive finalized prompts from V2
  - Create pending jobs in V3 Firestore
  - Return job ID to V2

### 3. The Factory Floor UI
- **Role:** Creative team dashboard
- **Responsibilities:**
  - Display job gallery
  - Show job status and progress
  - Provide asset preview and download
  - Enable variations and regeneration

## Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Firebase Cloud Functions (Node.js)
- **Database:** Cloud Firestore
- **Storage:** Cloud Storage with CDN
- **APIs:** Google Gemini (Flash & Pro), Veo
- **Auth:** Firebase Authentication
- **Hosting:** Firebase Hosting

## Development Phases

### Phase 1: Simple & Complete Factory ✅ (Current)
- [ ] Firebase project setup
- [ ] Core database schema
- [ ] Basic web app (gallery UI)
- [ ] Job processing pipeline
- [ ] Gemini API integration
- [ ] Cloud Storage integration
- [ ] Test job creation

### Phase 2: Lovable UX
- [ ] Modal lightbox for assets
- [ ] Gallery filtering (All, Images, Videos, Errors)
- [ ] Card actions (Copy, Regenerate)
- [ ] Variation generation
- [ ] Format/aspect ratio controls

### Phase 3: MCP Bridge
- [ ] Cloud Function intake endpoint
- [ ] V2 handoff integration
- [ ] Secure job creation
- [ ] End-to-end workflow testing

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI
- Google Gemini API key
- Firebase project with Blaze plan (for Cloud Functions)

### Setup
```bash
# Clone repository
git clone <repo-url>
cd v3-creative-engine

# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create Firebase project
firebase projects:create v3-creative-engine

# Initialize Firebase
firebase init

# Deploy
firebase deploy
```

## Project Structure

```
v3-creative-engine/
├── public/              # Frontend application
│   ├── index.html       # Main UI
│   ├── script.js        # Client-side logic
│   └── style.css        # Styling
├── functions/           # Cloud Functions
│   ├── src/
│   │   ├── index.js     # MCP Bridge & Job Processor
│   │   └── gemini.js    # Gemini API client
│   └── package.json
├── docs/                # Documentation
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
├── firebase.json        # Firebase configuration
└── README.md
```

## Database Schema

### Collections

**jobs**
```javascript
{
  id: string,              // Auto-generated
  status: string,          // 'pending' | 'processing' | 'complete' | 'error'
  type: string,            // 'image' | 'video'
  prompt: string,          // Creative prompt
  context: object,         // Additional context from V2
  result: {
    url: string,           // Cloud Storage URL
    metadata: object
  },
  error: string,           // Error message if failed
  createdAt: timestamp,
  updatedAt: timestamp,
  processedAt: timestamp
}
```

## API Endpoints

### MCP Bridge (Cloud Function)
- **POST** `/intake` - Receive job from V2 Prompter
- **GET** `/status/:jobId` - Check job status

## Security

- API keys stored in Firebase Config
- Firestore rules enforce authentication
- Storage rules restrict public access
- MCP Bridge validates incoming requests

## License

TBD

---

**Status:** 🚧 Phase 1 - In Development
**Created:** 2025-10-27
