# V3 Creative Engine - Implementation Plan

## Multi-Agent Team Assignment

### Gus (Coordinator)
- **Role:** Project orchestration and integration
- **Responsibilities:**
  - Define component interfaces
  - Coordinate between Marco and Dice
  - Manage phase transitions
  - Ensure SLC principles are followed
  - Integration testing

### Marco (Backend Specialist)
- **Role:** All backend infrastructure and APIs
- **Responsibilities:**
  - Firebase project configuration
  - Firestore schema design
  - Cloud Functions development
  - Gemini & Veo API integration
  - Job processing pipeline
  - Storage and CDN setup
  - Security rules

### Dice (Frontend Specialist)
- **Role:** All user interface and client-side logic
- **Responsibilities:**
  - Factory Floor UI design
  - Gallery implementation
  - Job status visualization
  - Card interactions
  - Modal lightbox
  - Filtering and search
  - Client-side state management

---

## Phase 1: Simple & Complete V3 Factory

**Goal:** Build a standalone, working V3 system that can create and process jobs independently.

### Marco's Tasks (Backend)

#### Task 1.1: Firebase Project Setup
- [ ] Create new Firebase project: `v3-creative-engine`
- [ ] Enable required services:
  - [ ] Firestore Database
  - [ ] Cloud Storage
  - [ ] Cloud Functions
  - [ ] Firebase Hosting
  - [ ] Firebase Authentication
- [ ] Upgrade to Blaze plan (required for Cloud Functions)
- [ ] Configure Firebase config locally (`firebase init`)

#### Task 1.2: Firestore Schema
- [ ] Create `jobs` collection with indexes
- [ ] Define job document structure:
  ```javascript
  {
    id: auto,
    status: 'pending' | 'processing' | 'complete' | 'error',
    type: 'image' | 'video',
    prompt: string,
    context: object,
    format: string, // e.g., '16:9', '9:16', '1:1'
    result: {
      url: string,
      thumbnailUrl: string,
      metadata: {
        width: number,
        height: number,
        size: number,
        mimeType: string
      }
    },
    error: string,
    createdAt: timestamp,
    updatedAt: timestamp,
    processedAt: timestamp,
    processingTimeMs: number
  }
  ```
- [ ] Create composite indexes:
  - `status` + `createdAt` (desc)
  - `type` + `status` + `createdAt` (desc)
- [ ] Write firestore.rules

#### Task 1.3: Gemini API Integration
- [ ] Create `functions/src/gemini.js`
- [ ] Implement `GeminiClient` class:
  - [ ] `generateImage(prompt, format)` - Imagen 3 via Gemini
  - [ ] `generateVideo(prompt, format)` - Veo via Gemini
  - [ ] Error handling and retries
  - [ ] Rate limiting logic
- [ ] Store API key in Firebase Config:
  ```bash
  firebase functions:config:set gemini.api_key="YOUR_KEY"
  ```

#### Task 1.4: Job Processing Function
- [ ] Create `functions/src/jobProcessor.js`
- [ ] Implement Cloud Function triggered by Firestore:
  ```javascript
  exports.processJob = functions.firestore
    .document('jobs/{jobId}')
    .onCreate(async (snap, context) => {
      // 1. Update status to 'processing'
      // 2. Call Gemini API based on job.type
      // 3. Upload result to Cloud Storage
      // 4. Update job with result URL and status 'complete'
      // 5. Handle errors, update status to 'error'
    });
  ```
- [ ] Implement retry logic for API failures
- [ ] Add logging for debugging

#### Task 1.5: Cloud Storage Setup
- [ ] Configure storage bucket with public CDN access
- [ ] Create folder structure:
  - `/images/` - Generated images
  - `/videos/` - Generated videos
  - `/thumbnails/` - Video thumbnails
- [ ] Write storage.rules:
  - Public read access for completed assets
  - Function-only write access
- [ ] Implement upload helper in jobProcessor

#### Task 1.6: Test Job Creation Function
- [ ] Create `functions/src/testJob.js`
- [ ] Implement HTTP Cloud Function for testing:
  ```javascript
  exports.createTestJob = functions.https.onRequest((req, res) => {
    // Create a sample job in Firestore
    // Return job ID
  });
  ```
- [ ] Deploy all functions

### Dice's Tasks (Frontend)

#### Task 1.7: Factory Floor UI Structure
- [ ] Create `public/index.html`:
  - Header with title and "+ Test Job" buttons
  - Gallery grid container
  - Status filter buttons (All, Images, Videos, Errors)
  - Loading states
- [ ] Create `public/style.css`:
  - Responsive grid layout
  - Card styling (status badges, thumbnails)
  - Color scheme (success: green, error: red, processing: blue)
  - Animations (fade-in, pulse for processing)

#### Task 1.8: Firebase Client Integration
- [ ] Add Firebase SDK to index.html
- [ ] Initialize Firebase app in `public/script.js`
- [ ] Configure Firestore client
- [ ] Set up real-time listener on `jobs` collection:
  ```javascript
  db.collection('jobs')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(querySnapshot => {
      // Update gallery in real-time
    });
  ```

#### Task 1.9: Gallery Rendering
- [ ] Implement `renderGallery(jobs)` function:
  - Loop through jobs
  - Create card elements dynamically
  - Show status badge
  - Display thumbnail or placeholder
  - Show timestamp and processing time
- [ ] Implement `renderJobCard(job)` helper:
  - Different layouts for image vs video
  - Status-specific styling
  - Error message display

#### Task 1.10: Test Job Buttons
- [ ] Implement "+ Test Image Job" button:
  - Call Cloud Function to create test image job
  - Show feedback (loading spinner, success message)
- [ ] Implement "+ Test Video Job" button:
  - Call Cloud Function to create test video job
  - Show feedback
- [ ] Add client-side validation

#### Task 1.11: Status Filtering
- [ ] Implement filter button handlers
- [ ] Filter jobs client-side by status
- [ ] Update active button styling
- [ ] Show job count per filter

### Gus's Tasks (Coordination)

#### Task 1.12: Integration & Testing
- [ ] Verify Marco's functions are deployed
- [ ] Verify Dice's UI is hosted
- [ ] End-to-end test:
  1. Visit V3 app URL
  2. Click "+ Test Image Job"
  3. Verify job appears in gallery as "processing"
  4. Verify job completes and shows image
  5. Click "+ Test Video Job"
  6. Verify video generation works
- [ ] Document any issues
- [ ] Confirm Phase 1 completion criteria met

---

## Phase 2: Lovable V3 UX

**Goal:** Transform the functional V3 factory into a polished, delightful tool.

### Dice's Tasks (Frontend)

#### Task 2.1: Modal Lightbox
- [ ] Create modal overlay component
- [ ] Implement click handler on completed job cards
- [ ] Show full-size image/video in modal
- [ ] Add close button and ESC key handler
- [ ] Add navigation (prev/next) through gallery

#### Task 2.2: Enhanced Card Actions
- [ ] Add "Copy Prompt" button to each card
- [ ] Implement clipboard API for copy
- [ ] Add "Download" button for asset
- [ ] Add "View Details" to show full job metadata

#### Task 2.3: Regenerate Action
- [ ] Add "Regenerate" button to completed jobs
- [ ] Call Cloud Function to create duplicate job
- [ ] Link new job to original (optional: track variations)

#### Task 2.4: Generate Variation Action
- [ ] Add "Generate Variation" button
- [ ] Show mini-prompt editor to adjust prompt
- [ ] Create new job with modified prompt

#### Task 2.5: Format Controls
- [ ] Add format selector UI (dropdown or buttons)
- [ ] Options: 16:9, 9:16, 1:1, 4:3
- [ ] Pass format to job creation
- [ ] Display format badge on cards

### Marco's Tasks (Backend)

#### Task 2.6: Regenerate Function
- [ ] Create Cloud Function `regenerateJob(jobId)`
- [ ] Fetch original job
- [ ] Create new job with same prompt
- [ ] Link jobs (optional: add `originalJobId` field)

#### Task 2.7: Format Support in Gemini
- [ ] Update `GeminiClient` to accept format parameter
- [ ] Map format to Gemini API aspect ratio
- [ ] Test different formats

### Gus's Tasks (Coordination)

#### Task 2.8: UX Polish Review
- [ ] Test all new features
- [ ] Verify interactions are smooth
- [ ] Check responsive design on mobile
- [ ] Confirm Phase 2 completion

---

## Phase 3: MCP Handoff Bridge

**Goal:** Connect V2 Prompter to V3 Producer via secure MCP.

### Marco's Tasks (Backend)

#### Task 3.1: MCP Intake Function
- [ ] Create Cloud Function `mcpIntake`:
  ```javascript
  exports.mcpIntake = functions.https.onRequest((req, res) => {
    // 1. Validate request (auth token, payload structure)
    // 2. Extract prompt and context from V2
    // 3. Create job in V3 Firestore
    // 4. Return { jobId, status: 'pending' }
  });
  ```
- [ ] Add authentication (API key or Firebase token)
- [ ] Add request validation
- [ ] Add CORS configuration for V2 domain
- [ ] Deploy and get public URL

#### Task 3.2: Job Status Endpoint
- [ ] Create Cloud Function `getJobStatus(jobId)`:
  ```javascript
  exports.getJobStatus = functions.https.onRequest((req, res) => {
    // Return job status and result URL if complete
  });
  ```
- [ ] Add polling logic for V2

### Dice's Tasks (Frontend)

#### Task 3.3: V2 Handoff Update (when V2 code is available)
- [ ] Update V2's `script.js` "Generate" button
- [ ] Replace Firestore write with HTTP call to MCP Intake
- [ ] Show job submitted confirmation
- [ ] Optional: Link to V3 Factory Floor to view progress

### Gus's Tasks (Coordination)

#### Task 3.4: End-to-End Integration Test
- [ ] Test V2 → V3 handoff:
  1. Finalize prompt in V2
  2. Click "Generate" in V2
  3. Verify job created in V3 Firestore
  4. Verify job processes and completes
  5. Verify result appears in V3 Factory Floor
- [ ] Document complete workflow
- [ ] Create user guide
- [ ] Confirm system is production-ready

---

## Success Criteria

### Phase 1 Complete When:
- ✅ V3 app is live at Firebase Hosting URL
- ✅ User can create test jobs via UI
- ✅ Jobs are processed by Gemini API
- ✅ Results appear in gallery with correct status
- ✅ Images/videos are stored in Cloud Storage
- ✅ Real-time updates work

### Phase 2 Complete When:
- ✅ Modal lightbox works
- ✅ All card actions functional (Copy, Regenerate, Variation, Download)
- ✅ Format selector works
- ✅ Filtering works (All, Images, Videos, Errors)
- ✅ UI is polished and responsive

### Phase 3 Complete When:
- ✅ V2 can send jobs to V3 via MCP
- ✅ Jobs process successfully
- ✅ End-to-end workflow is tested
- ✅ Documentation is complete
- ✅ System is ready for production use

---

**Next Step:** Begin Phase 1, Task 1.1 (Marco: Firebase Project Setup)
