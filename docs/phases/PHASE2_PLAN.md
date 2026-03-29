# V3 Creative Engine - Phase 2 Plan

**Status:** Ready to Begin
**Phase 1 Completion Date:** 2025-11-11
**Phase 2 Goal:** Real AI Generation + Lovable UX

---

## Overview

Phase 2 has **TWO parallel tracks**:

### Track A: Real AI Generation (Marco - Backend)
Integrate actual Vertex AI Imagen 3 and Veo APIs to generate real images and videos.

### Track B: Lovable UX (Dice - Frontend)
Add delightful user experience features: modals, actions, filtering, and polish.

---

## Phase 2A: Real AI Generation

### Prerequisites

#### 1. Google Cloud Project Setup
- [ ] Enable Vertex AI API in Google Cloud Console
- [ ] Enable Cloud Storage API
- [ ] Set up billing (Vertex AI requires paid account)
- [ ] Create service account with Vertex AI permissions
- [ ] Download service account key JSON

#### 2. API Access
- **Imagen 3**: Available via Vertex AI API
- **Veo**: Available via Vertex AI API (paid preview)
- **Authentication**: Service account or Application Default Credentials

#### 3. Node.js Dependencies
```bash
npm install @google-cloud/vertexai
# OR
npm install @ai-sdk/google-vertex
```

---

## Track A: Marco's Backend Tasks

### Task A1: Set Up Vertex AI Client
**Priority:** HIGH
**Estimated Time:** 2-3 hours

- [ ] Install Vertex AI SDK: `npm install @google-cloud/vertexai`
- [ ] Configure service account authentication
- [ ] Add project ID and location to Firebase config
- [ ] Test basic Vertex AI connection
- [ ] Create `functions/src/vertexai.js` client wrapper

**Deliverable:** Working Vertex AI client that can authenticate and connect

---

### Task A2: Integrate Imagen 3 for Real Image Generation
**Priority:** HIGH
**Estimated Time:** 3-4 hours

**Update `functions/src/gemini.js`:**

```javascript
const { VertexAI } = require('@google-cloud/vertexai');

class GeminiClient {
  constructor(apiKey, projectId, location = 'us-central1') {
    this.projectId = projectId;
    this.location = location;
    this.vertexAI = new VertexAI({ project: projectId, location: location });
  }

  async generateImage(prompt, format = '1:1') {
    console.log(`[Gemini] Generating image with Imagen 3: "${prompt}"`);

    try {
      // Use Vertex AI Imagen 3 API
      const model = this.vertexAI.getGenerativeModel({
        model: 'imagen-3.0-generate-001'
      });

      const aspectRatio = this._formatToAspectRatio(format);

      const result = await model.generateImages({
        prompt: prompt,
        aspectRatio: aspectRatio,
        numberOfImages: 1
      });

      // Extract image data and metadata
      const imageData = result.images[0];

      return {
        data: imageData.bytesBase64Encoded, // Base64 image data
        metadata: {
          prompt,
          format,
          aspectRatio,
          width: imageData.width,
          height: imageData.height,
          mimeType: 'image/png'
        }
      };

    } catch (error) {
      console.error('[Gemini] Imagen 3 error:', error);
      // Fallback to placeholder on error
      return this._generatePlaceholderImage(prompt, format);
    }
  }

  _formatToAspectRatio(format) {
    const ratios = {
      '16:9': '16:9',
      '9:16': '9:16',
      '1:1': '1:1',
      '4:3': '4:3'
    };
    return ratios[format] || '1:1';
  }

  _generatePlaceholderImage(prompt, format) {
    // Fallback to Phase 1 placeholder if API fails
    const width = this._getWidth(format);
    const height = this._getHeight(format);
    return {
      url: `https://placehold.co/${width}x${height}/1a73e8/white?text=${encodeURIComponent(prompt.substring(0, 50))}`,
      metadata: { prompt, format, note: 'Fallback placeholder' }
    };
  }
}
```

**Testing:**
- [ ] Generate test image with Imagen 3
- [ ] Verify image quality and format
- [ ] Test error handling and fallback
- [ ] Test all aspect ratios (16:9, 9:16, 1:1, 4:3)

**Deliverable:** Real AI-generated images from Imagen 3

---

### Task A3: Integrate Veo for Real Video Generation
**Priority:** HIGH
**Estimated Time:** 4-5 hours

**Update `functions/src/gemini.js`:**

```javascript
async generateVideo(prompt, format = '16:9') {
  console.log(`[Gemini] Generating video with Veo: "${prompt}"`);

  try {
    // Use Vertex AI Veo API
    const model = this.vertexAI.getGenerativeModel({
      model: 'veo-3.0-generate-001'
    });

    const aspectRatio = this._formatToAspectRatio(format);

    const result = await model.generateVideos({
      prompt: prompt,
      aspectRatio: aspectRatio,
      duration: '4s' // 4 second videos
    });

    // Veo returns video data
    const videoData = result.videos[0];

    return {
      data: videoData.bytesBase64Encoded, // Base64 video data
      metadata: {
        prompt,
        format,
        aspectRatio,
        duration: '4s',
        width: videoData.width,
        height: videoData.height,
        mimeType: 'video/mp4'
      }
    };

  } catch (error) {
    console.error('[Gemini] Veo error:', error);
    // Fallback to placeholder on error
    return this._generatePlaceholderVideo(prompt, format);
  }
}
```

**Testing:**
- [ ] Generate test video with Veo
- [ ] Verify video quality and playback
- [ ] Test error handling and fallback
- [ ] Test different durations

**Deliverable:** Real AI-generated videos from Veo

---

### Task A4: Update Job Processor for Real Assets
**Priority:** HIGH
**Estimated Time:** 2-3 hours

**Update `functions/src/jobProcessor.js`:**

```javascript
async function processJob(snap, context) {
  const jobId = context.params.jobId;
  const job = snap.data();

  // ... existing code ...

  if (job.type === 'image') {
    result = await gemini.generateImage(job.prompt, job.format || '1:1');

    // Upload actual image data to Cloud Storage
    if (result.data) {
      const storageUrl = await uploadImageToStorage(jobId, result.data);
      result.url = storageUrl;
    }

  } else {
    result = await gemini.generateVideo(job.prompt, job.format || '16:9');

    // Upload actual video data to Cloud Storage
    if (result.data) {
      const storageUrl = await uploadVideoToStorage(jobId, result.data);
      result.url = storageUrl;
    }
  }

  // Update job with result
  await jobRef.update({
    status: 'complete',
    result: { url: result.url, metadata: result.metadata },
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    processingTimeMs: Date.now() - startTime,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function uploadImageToStorage(jobId, base64Data) {
  const bucket = admin.storage().bucket();
  const fileName = `images/${jobId}.png`;
  const file = bucket.file(fileName);

  const buffer = Buffer.from(base64Data, 'base64');

  await file.save(buffer, {
    metadata: { contentType: 'image/png' },
    public: true
  });

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

async function uploadVideoToStorage(jobId, base64Data) {
  const bucket = admin.storage().bucket();
  const fileName = `videos/${jobId}.mp4`;
  const file = bucket.file(fileName);

  const buffer = Buffer.from(base64Data, 'base64');

  await file.save(buffer, {
    metadata: { contentType: 'video/mp4' },
    public: true
  });

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}
```

**Testing:**
- [ ] Create test jobs
- [ ] Verify assets upload to Cloud Storage
- [ ] Verify public URLs are accessible
- [ ] Check file sizes and quality

**Deliverable:** Real images and videos stored in Cloud Storage

---

## Track B: Dice's Frontend Tasks

### Task B1: Modal Lightbox
**Priority:** HIGH
**Estimated Time:** 3-4 hours

**Create `public/modal.js`:**

```javascript
// Modal component for full-size viewing
class Modal {
  constructor() {
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    const modalHTML = `
      <div id="modal" class="modal hidden">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <button class="modal-close">&times;</button>
          <div class="modal-nav">
            <button class="modal-prev">&larr;</button>
            <button class="modal-next">&rarr;</button>
          </div>
          <div class="modal-body">
            <img id="modalImage" src="" alt="" />
            <video id="modalVideo" controls></video>
          </div>
          <div class="modal-info">
            <h3 id="modalPrompt"></h3>
            <p id="modalMeta"></p>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  show(job, jobs, currentIndex) {
    this.currentJob = job;
    this.jobs = jobs;
    this.currentIndex = currentIndex;

    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    const modalVideo = document.getElementById('modalVideo');

    if (job.type === 'image') {
      modalImage.src = job.result.url;
      modalImage.classList.remove('hidden');
      modalVideo.classList.add('hidden');
    } else {
      modalVideo.src = job.result.url;
      modalVideo.classList.remove('hidden');
      modalImage.classList.add('hidden');
    }

    document.getElementById('modalPrompt').textContent = job.prompt;
    document.getElementById('modalMeta').textContent =
      `${job.type} • ${job.format} • ${job.id.substring(0, 8)}`;

    modal.classList.remove('hidden');
  }

  hide() {
    document.getElementById('modal').classList.add('hidden');
  }

  bindEvents() {
    // Close button
    document.querySelector('.modal-close').addEventListener('click', () => this.hide());

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });

    // Overlay click
    document.querySelector('.modal-overlay').addEventListener('click', () => this.hide());

    // Navigation
    document.querySelector('.modal-prev').addEventListener('click', () => this.showPrev());
    document.querySelector('.modal-next').addEventListener('click', () => this.showNext());
  }

  showPrev() {
    if (this.currentIndex > 0) {
      this.show(this.jobs[this.currentIndex - 1], this.jobs, this.currentIndex - 1);
    }
  }

  showNext() {
    if (this.currentIndex < this.jobs.length - 1) {
      this.show(this.jobs[this.currentIndex + 1], this.jobs, this.currentIndex + 1);
    }
  }
}
```

**Update `public/style.css`:**

```css
/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal.hidden {
  display: none;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
}

.modal-nav button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
}

.modal-prev { left: 20px; }
.modal-next { right: 20px; }

.modal-body img,
.modal-body video {
  max-width: 100%;
  max-height: 80vh;
  display: block;
}

.modal-info {
  padding: 20px;
  background: white;
}
```

**Update `public/script.js`:**

```javascript
// Initialize modal
const modal = new Modal();

// Update renderJobCard to add click handler
function renderJobCard(job, index) {
  // ... existing code ...

  // Add click handler for completed jobs
  if (job.status === 'complete' && job.result?.url) {
    return `
      <div class="job-card ${statusClass}" onclick="modal.show(jobs[${index}], jobs, ${index})">
        ${existingCardHTML}
      </div>
    `;
  }
}
```

**Testing:**
- [ ] Click on completed job cards
- [ ] Verify modal opens with full-size asset
- [ ] Test close button, ESC key, overlay click
- [ ] Test prev/next navigation
- [ ] Test with both images and videos

**Deliverable:** Working modal lightbox for asset viewing

---

### Task B2: Card Actions (Copy, Download, Regenerate)
**Priority:** MEDIUM
**Estimated Time:** 2-3 hours

**Update job card HTML:**

```javascript
function renderJobCard(job) {
  // ... existing code ...

  const actionsHTML = job.status === 'complete' ? `
    <div class="job-actions">
      <button class="action-btn" onclick="copyPrompt('${job.prompt}')">
        📋 Copy
      </button>
      <button class="action-btn" onclick="downloadAsset('${job.result.url}', '${job.id}')">
        ⬇️ Download
      </button>
      <button class="action-btn" onclick="regenerateJob('${job.id}')">
        🔄 Regenerate
      </button>
    </div>
  ` : '';

  return `
    <div class="job-card ${statusClass}">
      ${existingCardHTML}
      ${actionsHTML}
    </div>
  `;
}

// Copy prompt to clipboard
async function copyPrompt(prompt) {
  await navigator.clipboard.writeText(prompt);
  alert('Prompt copied to clipboard!');
}

// Download asset
function downloadAsset(url, jobId) {
  const link = document.createElement('a');
  link.href = url;
  link.download = `v3-creative-${jobId}`;
  link.click();
}

// Regenerate job
async function regenerateJob(jobId) {
  const regenerateFn = functions.httpsCallable('regenerateJob');
  const result = await regenerateFn({ jobId });
  console.log('Regenerated:', result.data.newJobId);
}
```

**Marco's Backend Support:**

Create `functions/src/regenerateJob.js`:

```javascript
async function regenerateJob(req, res) {
  res.set('Access-Control-Allow-Origin', '*');

  const { jobId } = req.body;
  const db = admin.firestore();

  // Get original job
  const originalJob = await db.collection('jobs').doc(jobId).get();
  const job = originalJob.data();

  // Create new job with same parameters
  const newJobRef = await db.collection('jobs').add({
    status: 'pending',
    type: job.type,
    prompt: job.prompt,
    format: job.format,
    context: { source: 'regenerate', originalJobId: jobId },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.json({ success: true, newJobId: newJobRef.id });
}
```

**Testing:**
- [ ] Test copy prompt button
- [ ] Test download button
- [ ] Test regenerate button
- [ ] Verify new job appears in gallery

**Deliverable:** Functional action buttons on job cards

---

### Task B3: Filtering (All, Images, Videos, Errors)
**Priority:** MEDIUM
**Estimated Time:** 2 hours

**Update `public/index.html`:**

```html
<div class="filters">
  <button class="filter-btn active" onclick="filterJobs('all')">All</button>
  <button class="filter-btn" onclick="filterJobs('image')">Images</button>
  <button class="filter-btn" onclick="filterJobs('video')">Videos</button>
  <button class="filter-btn" onclick="filterJobs('error')">Errors</button>
</div>
```

**Update `public/script.js`:**

```javascript
let currentFilter = 'all';

function filterJobs(filter) {
  currentFilter = filter;

  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  renderGallery();
}

function renderGallery() {
  const gallery = document.getElementById('gallery');

  // Filter jobs
  let filteredJobs = jobs;
  if (currentFilter === 'image') {
    filteredJobs = jobs.filter(j => j.type === 'image');
  } else if (currentFilter === 'video') {
    filteredJobs = jobs.filter(j => j.type === 'video');
  } else if (currentFilter === 'error') {
    filteredJobs = jobs.filter(j => j.status === 'error');
  }

  if (filteredJobs.length === 0) {
    gallery.innerHTML = `<p>No ${currentFilter} jobs found.</p>`;
    return;
  }

  gallery.innerHTML = filteredJobs.map(job => renderJobCard(job)).join('');
}
```

**Testing:**
- [ ] Test each filter button
- [ ] Verify correct jobs show/hide
- [ ] Test with mixed job types
- [ ] Test empty states

**Deliverable:** Working filter system

---

## Phase 2 Success Criteria

### Track A: Real AI Generation ✅ When:
- [ ] Imagen 3 generates actual images (not placeholders)
- [ ] Veo generates actual videos (not placeholders)
- [ ] Assets are uploaded to Cloud Storage
- [ ] Public URLs work and are accessible
- [ ] Error handling falls back to placeholders gracefully

### Track B: Lovable UX ✅ When:
- [ ] Modal lightbox works for full-size viewing
- [ ] All action buttons functional (Copy, Download, Regenerate)
- [ ] Filtering works smoothly
- [ ] UI is polished and responsive
- [ ] User experience feels delightful

---

## Deployment Checklist

### Before Deploying Phase 2:

**Marco (Backend):**
- [ ] Test Vertex AI integration locally
- [ ] Update Firebase config with Vertex AI credentials
- [ ] Deploy updated Cloud Functions
- [ ] Test image generation end-to-end
- [ ] Test video generation end-to-end
- [ ] Monitor Cloud Functions logs for errors

**Dice (Frontend):**
- [ ] Test all UI features locally
- [ ] Test modal on different screen sizes
- [ ] Verify all action buttons work
- [ ] Deploy hosting
- [ ] Test live site

**Gus (Integration):**
- [ ] Full end-to-end test (image + video)
- [ ] Verify all features work together
- [ ] Check performance and loading times
- [ ] Document any issues

---

## Cost Estimates (Phase 2)

### Vertex AI Pricing:
- **Imagen 3**: ~$0.02-0.08 per image (varies by resolution)
- **Veo**: ~$0.10-0.50 per video (varies by duration/quality)
- **Cloud Storage**: ~$0.02/GB/month
- **Cloud Functions**: Minimal (already covered in Phase 1)

### Monthly Estimate (100 jobs):
- 50 images × $0.05 = $2.50
- 50 videos × $0.30 = $15.00
- Storage (10GB) = $0.20
- **Total: ~$17.70/month**

---

## Timeline Estimate

**Track A (Real AI):** 10-15 hours
**Track B (Lovable UX):** 10-12 hours
**Integration & Testing:** 3-5 hours

**Total Phase 2:** ~25-30 hours (1-2 weeks part-time)

---

## Risk Mitigation

### Risk: Vertex AI API quota limits
**Mitigation:** Implement rate limiting and queueing

### Risk: High API costs
**Mitigation:** Start with test project, monitor costs, set budget alerts

### Risk: Slow video generation
**Mitigation:** Show clear progress indicator, consider async processing

### Risk: Large file sizes
**Mitigation:** Implement compression, use CDN for delivery

---

## Next Steps to Start Phase 2

1. **Choose Track:** Start with Track A (Real AI) or Track B (UX) or both in parallel
2. **Set Up Vertex AI:** Enable APIs, create service account
3. **Assign Tasks:** Marco takes Track A, Dice takes Track B, Gus coordinates
4. **Start Development:** Follow task breakdown above
5. **Test Incrementally:** Don't wait until the end to test

---

**Ready to begin Phase 2!** 🚀

Which track do you want to start with?
- **Track A**: Real AI generation (more impactful, requires Google Cloud setup)
- **Track B**: Lovable UX (easier to start, no external dependencies)
- **Both**: Parallel development (faster but requires coordination)
