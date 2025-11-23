/**
 * YTM Creative Generator - Client Logic
 * Complete redesign for YTM Creative Engine workflow
 */

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBwtQBAZ_IewB2TYCkew3ctzB4HMs9Gyn0",
  authDomain: "v3-creative-engine.firebaseapp.com",
  projectId: "v3-creative-engine",
  storageBucket: "v3-creative-engine.firebasestorage.app",
  messagingSenderId: "964100659393",
  appId: "1:964100659393:web:bc6aa41fce9a8770d55c40"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const functions = firebase.functions();

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let state = {
  currentAsset: null,           // Asset currently displayed in lightbox
  savedGallery: [],             // Only explicitly saved assets
  currentAspectRatio: '9:16',   // Default aspect ratio
  currentPrompt: '',            // Current prompt text
  activeJobs: new Map(),        // Track active generation jobs
  allJobs: []                   // All jobs for debugging
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[YTM Generator] Initializing...');

  setupEventListeners();
  setupRealtimeListeners();
  initializeUI();
  checkForImportedPrompt();

  console.log('[YTM Generator] Ready');
});

// ============================================================================
// EVENT LISTENERS SETUP
// ============================================================================

function setupEventListeners() {
  // Generation buttons
  document.getElementById('generateOne').addEventListener('click', generateOne);
  document.getElementById('generateAll').addEventListener('click', generateAll);

  // Aspect ratio selector
  document.getElementById('aspectRatio').addEventListener('change', changeAspectRatio);

  // Action buttons
  document.getElementById('upscaleBtn').addEventListener('click', upscaleAsset);
  document.getElementById('iterateBtn').addEventListener('click', iterateAsset);
  document.getElementById('expandBtn').addEventListener('click', expandAsset);
  document.getElementById('animateBtn').addEventListener('click', animateAsset);

  // Bottom buttons
  document.getElementById('saveToGallery').addEventListener('click', saveToGallery);
  document.getElementById('downloadBtn').addEventListener('click', downloadAsset);

  // Prompt input
  document.getElementById('promptInput').addEventListener('input', updatePrompt);

  // Custom resize handle for prompt input (top-right corner)
  setupPromptResize();
}

function setupPromptResize() {
  const resizeHandle = document.getElementById('resizeHandle');
  const promptInput = document.getElementById('promptInput');

  if (!resizeHandle || !promptInput) return;

  let isResizing = false;
  let startY = 0;
  let startHeight = 0;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startY = e.clientY;
    startHeight = promptInput.offsetHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    // Classic resize: dragging UP expands, dragging DOWN reduces
    const deltaY = startY - e.clientY;
    const newHeight = Math.max(60, startHeight + deltaY);
    promptInput.style.height = newHeight + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

// ============================================================================
// FIREBASE REALTIME LISTENERS
// ============================================================================

function setupRealtimeListeners() {
  // Listen to jobs collection for generation updates
  db.collection('jobs')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .onSnapshot((snapshot) => {
      state.allJobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`[YTM Generator] Jobs updated: ${state.allJobs.length} total`);

      // Check for completed jobs we're tracking
      checkActiveJobs();

      // Update status indicator
      updateStatusIndicator();
    }, (error) => {
      console.error('[YTM Generator] Error listening to jobs:', error);
    });

  // Listen to gallery collection for saved assets
  db.collection('gallery')
    .orderBy('savedAt', 'desc')
    .limit(50)
    .onSnapshot((snapshot) => {
      state.savedGallery = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`[YTM Generator] Gallery updated: ${state.savedGallery.length} assets`);
      renderGallery();
    }, (error) => {
      console.error('[YTM Generator] Error listening to gallery:', error);
    });
}

// ============================================================================
// UI INITIALIZATION
// ============================================================================

function initializeUI() {
  // Set default aspect ratio
  const ratioSelect = document.getElementById('aspectRatio');
  ratioSelect.value = state.currentAspectRatio;

  // Initialize empty gallery
  renderGallery();

  // Disable action buttons initially (no asset loaded)
  disableActionButtons();
}

// ============================================================================
// PROMPT PARSING
// ============================================================================

/**
 * Parse numbered scenes from prompt
 * Example: "1. sunset scene, 2. cityscape, 3. ocean waves"
 * Returns: ["sunset scene", "cityscape", "ocean waves"]
 */
function parsePromptScenes(prompt) {
  if (!prompt || typeof prompt !== 'string') return [];

  // Match patterns like:
  // "1. scene" or "1) scene" - numbered with period or parenthesis
  // "#1 scene" - hashtag number format
  // "A) scene" or "A. scene" - lettered format
  const scenes = [];

  // Try numbered patterns first: "1. text", "1) text", "#1 text"
  const numberedPattern = /(?:^|\n)\s*(?:#?(\d+)[\.\)]\s*|#(\d+)\s+)([^\n]+)/g;
  let match;

  while ((match = numberedPattern.exec(prompt)) !== null) {
    const sceneText = match[3].trim();
    if (sceneText) {
      scenes.push(sceneText);
    }
  }

  // If no numbered scenes, try lettered patterns: "A) text", "A. text"
  if (scenes.length === 0) {
    const letteredPattern = /(?:^|\n)\s*([A-Z])[\.\)]\s*([^\n]+)/g;
    while ((match = letteredPattern.exec(prompt)) !== null) {
      const sceneText = match[2].trim();
      if (sceneText) {
        scenes.push(sceneText);
      }
    }
  }

  // If no numbered scenes found, return entire prompt as single scene
  if (scenes.length === 0) {
    return [prompt.trim()];
  }

  return scenes;
}

// ============================================================================
// GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate 1 - Generates only the first scene from the prompt
 */
async function generateOne() {
  try {
    const promptInput = document.getElementById('promptInput');
    const prompt = promptInput.value.trim();

    if (!prompt) {
      alert('Please enter a prompt first');
      return;
    }

    console.log('[YTM Generator] Generate One clicked');

    // Parse scenes and get first one
    const scenes = parsePromptScenes(prompt);
    const firstScene = scenes[0];

    console.log(`[YTM Generator] Extracted first scene: "${firstScene}"`);

    // Show loading in lightbox
    showLightboxLoading('Generating first scene...');

    // Call backend to create job
    const createTestJobFn = functions.httpsCallable('createTestJob');
    const result = await createTestJobFn({
      type: 'image',
      prompt: firstScene,
      format: state.currentAspectRatio,
      sceneNumber: 1
    });

    const jobId = result.data.jobId;
    console.log(`[YTM Generator] Job created: ${jobId}`);

    // Track this job
    state.activeJobs.set(jobId, {
      type: 'generation',
      scene: 1,
      prompt: firstScene
    });

    // Provide feedback
    showTemporaryMessage('generateOne', 'Generating...');

  } catch (error) {
    console.error('[YTM Generator] Generate One failed:', error);
    alert('Failed to generate: ' + error.message);
    hideLightboxLoading();
  }
}

/**
 * Generate All - Generates all numbered scenes from the prompt
 */
async function generateAll() {
  try {
    const promptInput = document.getElementById('promptInput');
    const prompt = promptInput.value.trim();

    if (!prompt) {
      alert('Please enter a prompt first');
      return;
    }

    console.log('[YTM Generator] Generate All clicked');

    // Parse all scenes
    const scenes = parsePromptScenes(prompt);

    if (scenes.length === 0) {
      alert('No scenes found in prompt. Use numbered format like "1. scene, 2. scene"');
      return;
    }

    console.log(`[YTM Generator] Found ${scenes.length} scenes to generate`);

    // Show loading in lightbox
    showLightboxLoading(`Generating ${scenes.length} scenes...`);

    // Create a job for each scene
    const createTestJobFn = functions.httpsCallable('createTestJob');
    const jobPromises = scenes.map((scene, index) => {
      return createTestJobFn({
        type: 'image',
        prompt: scene,
        format: state.currentAspectRatio,
        sceneNumber: index + 1
      });
    });

    // Wait for all jobs to be created
    const results = await Promise.all(jobPromises);

    // Track all jobs
    results.forEach((result, index) => {
      const jobId = result.data.jobId;
      state.activeJobs.set(jobId, {
        type: 'generation',
        scene: index + 1,
        prompt: scenes[index]
      });
      console.log(`[YTM Generator] Job ${index + 1} created: ${jobId}`);
    });

    showTemporaryMessage('generateAll', `${scenes.length} jobs created!`);

  } catch (error) {
    console.error('[YTM Generator] Generate All failed:', error);
    alert('Failed to generate all: ' + error.message);
    hideLightboxLoading();
  }
}

// ============================================================================
// ASPECT RATIO MANAGEMENT
// ============================================================================

function changeAspectRatio(event) {
  const newRatio = event.target.value;
  state.currentAspectRatio = newRatio;

  console.log(`[YTM Generator] Aspect ratio changed to: ${newRatio}`);

  // Update lightbox dimensions immediately
  const lightbox = document.getElementById('mainLightbox');
  lightbox.setAttribute('data-ratio', newRatio);

  // Update empty state text
  const emptyRatioText = document.getElementById('emptyRatioText');
  emptyRatioText.textContent = `${newRatio} aspect ratio`;
}

// ============================================================================
// ASSET ACTIONS
// ============================================================================

/**
 * Upscale current lightbox asset
 */
async function upscaleAsset() {
  if (!state.currentAsset) return;

  try {
    console.log('[YTM Generator] Upscaling asset:', state.currentAsset.id);

    showTemporaryMessage('upscaleBtn', 'Upscaling...');
    showLightboxLoading('Upscaling resolution...');

    const upscaleFn = functions.httpsCallable('upscaleJob');
    const result = await upscaleFn({
      jobId: state.currentAsset.id
    });

    const newJobId = result.data.newJobId;
    console.log(`[YTM Generator] Upscale job created: ${newJobId}`);

    // Track this job
    state.activeJobs.set(newJobId, {
      type: 'upscale',
      originalId: state.currentAsset.id
    });

    showTemporaryMessage('upscaleBtn', 'Job created!');

  } catch (error) {
    console.error('[YTM Generator] Upscale failed:', error);
    alert('Failed to upscale: ' + error.message);
    hideLightboxLoading();
  }
}

/**
 * Iterate - Create variation of current lightbox asset
 */
async function iterateAsset() {
  if (!state.currentAsset) return;

  try {
    console.log('[YTM Generator] Iterating asset:', state.currentAsset.id);

    showTemporaryMessage('iterateBtn', 'Creating variation...');
    showLightboxLoading('Creating variation...');

    // Note: This function needs to be created by Marco
    const iterateFn = functions.httpsCallable('iterateJob');
    const result = await iterateFn({
      jobId: state.currentAsset.id
    });

    const newJobId = result.data.newJobId;
    console.log(`[YTM Generator] Iterate job created: ${newJobId}`);

    // Track this job
    state.activeJobs.set(newJobId, {
      type: 'iterate',
      originalId: state.currentAsset.id
    });

    showTemporaryMessage('iterateBtn', 'Job created!');

  } catch (error) {
    console.error('[YTM Generator] Iterate failed:', error);
    alert('Failed to iterate: ' + error.message);
    hideLightboxLoading();
  }
}

/**
 * Expand current lightbox image
 */
async function expandAsset() {
  if (!state.currentAsset) return;
  if (state.currentAsset.type !== 'image') {
    alert('Can only expand images');
    return;
  }

  try {
    console.log('[YTM Generator] Expanding image:', state.currentAsset.id);

    showTemporaryMessage('expandBtn', 'Expanding...');
    showLightboxLoading('Expanding image...');

    const expandFn = functions.httpsCallable('expandImageJob');
    const result = await expandFn({
      jobId: state.currentAsset.id
    });

    const newJobId = result.data.newJobId;
    console.log(`[YTM Generator] Expand job created: ${newJobId}`);

    // Track this job
    state.activeJobs.set(newJobId, {
      type: 'expand',
      originalId: state.currentAsset.id
    });

    showTemporaryMessage('expandBtn', 'Job created!');

  } catch (error) {
    console.error('[YTM Generator] Expand failed:', error);
    alert('Failed to expand: ' + error.message);
    hideLightboxLoading();
  }
}

/**
 * Animate - Convert current image to video (i2v)
 * Uses Veo 3 Fast for image-to-video generation
 */
async function animateAsset() {
  if (!state.currentAsset) return;
  if (state.currentAsset.type !== 'image') {
    alert('Can only animate images');
    return;
  }

  try {
    console.log('[YTM Generator] Animating image:', state.currentAsset.id);

    showTemporaryMessage('animateBtn', 'Animating...');
    showLightboxLoading('Converting to video...');

    const animateFn = functions.httpsCallable('imageToVideoJob');
    const result = await animateFn({
      jobId: state.currentAsset.id
    });

    const newJobId = result.data.newJobId;
    console.log(`[YTM Generator] Animate job created: ${newJobId}`);

    // Track this job
    state.activeJobs.set(newJobId, {
      type: 'animate',
      originalId: state.currentAsset.id
    });

    showTemporaryMessage('animateBtn', 'Job created!');

  } catch (error) {
    console.error('[YTM Generator] Animate failed:', error);
    alert('Failed to animate: ' + error.message);
    hideLightboxLoading();
  }
}

/**
 * Save current lightbox asset to gallery
 */
async function saveToGallery() {
  if (!state.currentAsset) return;

  const btn = document.getElementById('saveToGallery');
  const originalText = btn.querySelector('.btn-text').textContent;

  try {
    console.log('[YTM Generator] Saving to gallery:', state.currentAsset.id);

    btn.querySelector('.btn-text').textContent = 'Saving...';
    btn.disabled = true;

    // Save to gallery collection
    await db.collection('gallery').add({
      assetId: state.currentAsset.id,
      url: state.currentAsset.result.url,
      prompt: state.currentAsset.prompt || '',
      format: state.currentAsset.format || state.currentAspectRatio,
      type: state.currentAsset.type,
      savedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log('[YTM Generator] Saved to gallery');
    btn.querySelector('.btn-text').textContent = 'Saved!';

    setTimeout(() => {
      btn.querySelector('.btn-text').textContent = originalText;
      btn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('[YTM Generator] Save to gallery failed:', error);
    alert('Failed to save: ' + error.message);
    btn.querySelector('.btn-text').textContent = originalText;
    btn.disabled = false;
  }
}

/**
 * Download current lightbox asset
 */
async function downloadAsset() {
  if (!state.currentAsset || !state.currentAsset.result?.url) return;

  const btn = document.getElementById('downloadBtn');
  const originalText = btn.querySelector('.btn-text').textContent;

  try {
    console.log('[YTM Generator] Downloading asset:', state.currentAsset.id);
    btn.querySelector('.btn-text').textContent = 'Downloading...';
    btn.disabled = true;

    const url = state.currentAsset.result.url;

    // Add proper file extension based on type
    const extension = state.currentAsset.type === 'image' ? '.jpg' : '.mp4';
    const filename = `ytm-creative-${state.currentAsset.type}-${state.currentAsset.id.substring(0, 8)}${extension}`;

    // Fetch the file and create a blob URL for proper download
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);

    btn.querySelector('.btn-text').textContent = 'Downloaded!';

    setTimeout(() => {
      btn.querySelector('.btn-text').textContent = originalText;
      btn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('[YTM Generator] Download failed:', error);
    alert('Failed to download: ' + error.message);
    btn.querySelector('.btn-text').textContent = originalText;
    btn.disabled = false;
  }
}

// ============================================================================
// ACTIVE JOBS MONITORING
// ============================================================================

/**
 * Check if any tracked jobs have completed
 */
function checkActiveJobs() {
  if (state.activeJobs.size === 0) return;

  state.activeJobs.forEach((jobInfo, jobId) => {
    const job = state.allJobs.find(j => j.id === jobId);

    if (!job) return;

    if (job.status === 'complete' && job.result?.url) {
      console.log(`[YTM Generator] Job completed: ${jobId} (${jobInfo.type})`);

      // Load this asset into lightbox
      loadAssetToLightbox(job);

      // Remove from tracking
      state.activeJobs.delete(jobId);

      // Hide loading state
      hideLightboxLoading();
    } else if (job.status === 'error') {
      console.error(`[YTM Generator] Job failed: ${jobId}`, job.error);
      alert(`Job failed: ${job.error || 'Unknown error'}`);

      state.activeJobs.delete(jobId);
      hideLightboxLoading();
    }
  });
}

// ============================================================================
// LIVE STATUS INDICATOR
// ============================================================================

/**
 * Update the status indicator based on active jobs
 */
function updateStatusIndicator() {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusMessage = document.getElementById('statusMessage');
  const statusTime = document.getElementById('statusTime');

  if (!statusIndicator || !statusMessage || !statusTime) return;

  // Find active jobs (pending, processing, or generating)
  const activeJobs = state.allJobs.filter(job =>
    job.status === 'pending' ||
    job.status === 'processing' ||
    job.status === 'generating'
  );

  // If no active jobs, hide the indicator
  if (activeJobs.length === 0) {
    statusIndicator.classList.add('hidden');
    return;
  }

  // Show indicator
  statusIndicator.classList.remove('hidden');

  // Get the most recent active job
  const currentJob = activeJobs[0];

  // Update status based on job type and status
  if (currentJob.type === 'image') {
    // Image generation - 30-60 seconds
    statusIndicator.className = 'status-indicator processing';

    if (currentJob.status === 'pending') {
      statusMessage.textContent = 'Starting image generation...';
      statusTime.textContent = 'Estimated: 30-60 seconds';
    } else {
      statusMessage.textContent = 'Generating image...';
      statusTime.textContent = 'Estimated: 30-60 seconds';
    }

  } else if (currentJob.type === 'video') {
    // Video generation - 3-5 minutes
    statusIndicator.className = 'status-indicator generating';

    if (currentJob.status === 'pending') {
      statusMessage.textContent = 'Starting video generation...';
      statusTime.textContent = 'Estimated: 3-5 minutes';
    } else if (currentJob.status === 'generating') {
      statusMessage.textContent = 'Generating video...';

      // Calculate elapsed time if we have createdAt
      if (currentJob.createdAt) {
        const elapsed = getElapsedTime(currentJob.createdAt);
        const remaining = Math.max(0, 180 - elapsed); // 3 minutes = 180 seconds
        statusTime.textContent = `Estimated: ${formatRemainingTime(remaining)} remaining`;
      } else {
        statusTime.textContent = 'Estimated: 3-5 minutes';
      }
    } else {
      statusMessage.textContent = 'Processing video...';
      statusTime.textContent = 'Estimated: 3-5 minutes';
    }
  } else {
    // Other job types
    statusIndicator.className = 'status-indicator processing';
    statusMessage.textContent = 'Processing...';
    statusTime.textContent = 'Please wait...';
  }

  // If multiple jobs, show count
  if (activeJobs.length > 1) {
    statusMessage.textContent += ` (${activeJobs.length} jobs)`;
  }
}

/**
 * Get elapsed time in seconds since job creation
 */
function getElapsedTime(timestamp) {
  if (!timestamp) return 0;

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return Math.floor((new Date() - date) / 1000);
}

/**
 * Format remaining time in a human-readable way
 */
function formatRemainingTime(seconds) {
  if (seconds <= 0) return 'Almost done';
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

// ============================================================================
// LIGHTBOX RENDERING
// ============================================================================

/**
 * Load an asset into the main lightbox
 */
function loadAssetToLightbox(asset) {
  if (!asset || !asset.result?.url) {
    console.warn('[YTM Generator] Cannot load asset: missing data');
    return;
  }

  console.log('[YTM Generator] Loading asset to lightbox:', asset.id);

  // Update state
  state.currentAsset = asset;

  // Get containers
  const lightboxEmpty = document.querySelector('.lightbox-empty');
  const lightboxContent = document.getElementById('lightboxContent');

  // Hide empty state, show content
  lightboxEmpty.classList.add('hidden');
  lightboxContent.classList.remove('hidden');

  // Create media element
  const isVideo = asset.type === 'video';
  let mediaHtml;

  if (isVideo) {
    mediaHtml = `<video src="${asset.result.url}" controls autoplay loop></video>`;
  } else {
    mediaHtml = `<img src="${asset.result.url}" alt="${asset.prompt || 'Generated image'}" />`;
  }

  lightboxContent.innerHTML = mediaHtml;

  // Enable action buttons
  enableActionButtons(asset.type);

  // Update prompt input if asset has prompt
  if (asset.prompt) {
    document.getElementById('promptInput').value = asset.prompt;
    state.currentPrompt = asset.prompt;
  }

  console.log('[YTM Generator] Asset loaded successfully');
}

/**
 * Show loading state in lightbox
 */
function showLightboxLoading(message = 'Processing...') {
  const lightboxEmpty = document.querySelector('.lightbox-empty');
  const lightboxContent = document.getElementById('lightboxContent');

  lightboxEmpty.classList.add('hidden');
  lightboxContent.classList.remove('hidden');

  lightboxContent.innerHTML = `
    <div class="lightbox-loading">
      <div class="spinner"></div>
      <p class="loading-text">${message}</p>
    </div>
  `;

  // Disable action buttons during loading
  disableActionButtons();
}

/**
 * Hide loading state in lightbox
 */
function hideLightboxLoading() {
  // If we have a current asset, reload it
  if (state.currentAsset) {
    loadAssetToLightbox(state.currentAsset);
  } else {
    // Show empty state
    const lightboxEmpty = document.querySelector('.lightbox-empty');
    const lightboxContent = document.getElementById('lightboxContent');

    lightboxEmpty.classList.remove('hidden');
    lightboxContent.classList.add('hidden');
    lightboxContent.innerHTML = '';
  }
}

// ============================================================================
// GALLERY RENDERING
// ============================================================================

/**
 * Render gallery thumbnails
 */
function renderGallery() {
  const galleryGrid = document.getElementById('galleryGrid');

  if (state.savedGallery.length === 0) {
    // Show empty slots
    galleryGrid.innerHTML = `
      <div class="gallery-item">
        <span class="gallery-item-empty">Asset 1</span>
      </div>
      <div class="gallery-item">
        <span class="gallery-item-empty">Asset 2</span>
      </div>
      <div class="gallery-item">
        <span class="gallery-item-empty">Asset 3</span>
      </div>
      <div class="gallery-item">
        <span class="gallery-item-empty">Asset 4</span>
      </div>
    `;
    return;
  }

  // Render saved assets
  galleryGrid.innerHTML = state.savedGallery.map((asset, index) => {
    const isVideo = asset.type === 'video';
    const mediaTag = isVideo
      ? `<video src="${asset.url}" muted></video>`
      : `<img src="${asset.url}" alt="Asset ${index + 1}" />`;

    return `
      <div class="gallery-item" onclick="loadGalleryAsset('${asset.id}')">
        ${mediaTag}
        <button class="gallery-delete-btn" onclick="event.stopPropagation(); deleteGalleryAsset('${asset.id}')" title="Delete from gallery">×</button>
      </div>
    `;
  }).join('');
}

/**
 * Delete an asset from the gallery
 */
window.deleteGalleryAsset = async function(galleryId) {
  if (!confirm('Delete this asset from gallery?')) return;

  try {
    console.log('[YTM Generator] Deleting gallery asset:', galleryId);

    await db.collection('gallery').doc(galleryId).delete();

    console.log('[YTM Generator] Asset deleted from gallery');

    // If this was the current lightbox asset, clear it
    if (state.currentAsset && state.savedGallery.find(a => a.id === galleryId && a.assetId === state.currentAsset.id)) {
      state.currentAsset = null;
      hideLightboxContent();
      disableActionButtons();
    }

  } catch (error) {
    console.error('[YTM Generator] Delete failed:', error);
    alert('Failed to delete: ' + error.message);
  }
}

/**
 * Load a gallery asset into the main lightbox
 */
window.loadGalleryAsset = function(galleryId) {
  const galleryAsset = state.savedGallery.find(a => a.id === galleryId);
  if (!galleryAsset) return;

  console.log('[YTM Generator] Loading gallery asset:', galleryId);

  // Find the original job in allJobs
  const originalJob = state.allJobs.find(j => j.id === galleryAsset.assetId);

  if (originalJob) {
    loadAssetToLightbox(originalJob);
  } else {
    // If original job not found, construct a minimal asset object
    const syntheticAsset = {
      id: galleryAsset.assetId,
      type: galleryAsset.type,
      format: galleryAsset.format,
      prompt: galleryAsset.prompt,
      result: {
        url: galleryAsset.url
      },
      status: 'complete'
    };

    loadAssetToLightbox(syntheticAsset);
  }
};

// ============================================================================
// BUTTON STATE MANAGEMENT
// ============================================================================

function enableActionButtons(assetType) {
  document.getElementById('upscaleBtn').disabled = false;
  document.getElementById('iterateBtn').disabled = false;
  document.getElementById('saveToGallery').disabled = false;
  document.getElementById('downloadBtn').disabled = false;

  // Expand and Animate only work on images
  if (assetType === 'image') {
    document.getElementById('expandBtn').disabled = false;
    document.getElementById('animateBtn').disabled = false;
  } else {
    document.getElementById('expandBtn').disabled = true;
    document.getElementById('animateBtn').disabled = true;
  }
}

function disableActionButtons() {
  document.getElementById('upscaleBtn').disabled = true;
  document.getElementById('iterateBtn').disabled = true;
  document.getElementById('expandBtn').disabled = true;
  document.getElementById('animateBtn').disabled = true;
  document.getElementById('saveToGallery').disabled = true;
  document.getElementById('downloadBtn').disabled = true;
}

// ============================================================================
// PROMPT MANAGEMENT
// ============================================================================

function updatePrompt(event) {
  state.currentPrompt = event.target.value;
}

// ============================================================================
// UI FEEDBACK HELPERS
// ============================================================================

/**
 * Show temporary message on button
 */
function showTemporaryMessage(buttonId, message, duration = 2000) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  const originalHTML = btn.innerHTML;
  const btnText = btn.querySelector('.btn-text');

  if (btnText) {
    btnText.textContent = message;
  }

  setTimeout(() => {
    btn.innerHTML = originalHTML;
  }, duration);
}

// ============================================================================
// MCP BRIDGE - PROMPT IMPORT
// ============================================================================

/**
 * Check URL parameters for imported prompt from MCP Bridge
 * Called on page load to auto-populate prompt field
 */
function checkForImportedPrompt() {
  const urlParams = new URLSearchParams(window.location.search);
  const importedPrompt = urlParams.get('prompt');

  if (importedPrompt) {
    console.log('[YTM Generator] Imported prompt from MCP Bridge');

    // Decode and populate the prompt input
    const decodedPrompt = decodeURIComponent(importedPrompt);
    const promptInput = document.getElementById('promptInput');

    if (promptInput) {
      promptInput.value = decodedPrompt;
      state.currentPrompt = decodedPrompt;

      // Show success toast
      showImportToast('Prompt imported from YTM Agent Collective');

      // Clean the URL (remove the prompt parameter)
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      console.log(`[YTM Generator] Prompt imported: "${decodedPrompt.substring(0, 50)}..."`);
    }
  }
}

/**
 * Show toast notification for imported prompt
 */
function showImportToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'import-toast';
  toast.innerHTML = `
    <div class="toast-icon">✓</div>
    <div class="toast-message">${message}</div>
  `;

  // Add to page
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown time';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp) {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ============================================================================
// DEBUG HELPERS
// ============================================================================

// Expose state for debugging in console
window.ytmState = state;
window.ytmDebug = {
  state,
  parsePromptScenes,
  loadAssetToLightbox,
  renderGallery
};

console.log('[YTM Generator] Debug tools available at window.ytmDebug');

// ============================================================================
// HELP MODAL
// ============================================================================

/**
 * Show help modal with action button explanations
 */
function showHelpModal() {
  const modal = document.createElement('div');
  modal.className = 'help-modal';
  modal.innerHTML = `
    <div class="help-modal-overlay" onclick="this.parentElement.remove()"></div>
    <div class="help-modal-content">
      <div class="help-modal-header">
        <h2>Action Button Guide</h2>
        <button class="help-close-btn" onclick="this.closest('.help-modal').remove()">×</button>
      </div>
      <div class="help-modal-body">
        <div class="help-section">
          <h3>Generation</h3>
          <div class="help-item">
            <span class="help-icon">⚙️</span>
            <div class="help-text">
              <strong>Generate 1</strong>
              <p>Creates only the first scene from your prompt. If your prompt contains multiple numbered scenes (e.g., "1. sunset, 2. cityscape"), this generates only the first one.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">🎨</span>
            <div class="help-text">
              <strong>Generate All</strong>
              <p>Creates all numbered scenes from your prompt. Each scene becomes a separate job that appears in the gallery.</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>Aspect Ratio</h3>
          <div class="help-item">
            <span class="help-icon">📐</span>
            <div class="help-text">
              <strong>Aspect Ratio Selector</strong>
              <p>Choose the dimensions for your generated content. Options: 9:16 (Portrait/TikTok), 16:9 (Landscape/YouTube), 1:1 (Square/Instagram), 4:3 (Classic). Changes apply immediately to the lightbox display and all future generations.</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>Actions</h3>
          <div class="help-item">
            <span class="help-icon">⊕</span>
            <div class="help-text">
              <strong>Upscale res</strong>
              <p>Increases the resolution and definition of the current asset in the lightbox while keeping the content exactly the same.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">🔄</span>
            <div class="help-text">
              <strong>Iterate</strong>
              <p>Creates a variation of the current asset using the same prompt. The AI generates a different interpretation while maintaining the same theme.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">↗️</span>
            <div class="help-text">
              <strong>Expand</strong>
              <p>Expands the current image beyond its frame, zooming out to reveal more of the scene. Only available for images.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">🎬</span>
            <div class="help-text">
              <strong>Animate (i2v)</strong>
              <p><em>Temporarily unavailable</em> - Converts the current image into a 5-second video with subtle animation and movement. Google's Veo video API is not yet publicly accessible. Feature will be enabled when API becomes available.</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>Save & Export</h3>
          <div class="help-item">
            <span class="help-icon">💾</span>
            <div class="help-text">
              <strong>Save to gallery</strong>
              <p>Saves the current lightbox asset to your permanent gallery. Only saved assets appear in the Gallery View on the right.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">⬇️</span>
            <div class="help-text">
              <strong>Download</strong>
              <p>Downloads the current asset to your device. Images save as JPEG, videos save as MP4.</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>Prompt Format</h3>
          <div class="help-text">
            <p>You can write prompts with multiple scenes using these formats:</p>
            <ul>
              <li><code>1. scene text</code> - Numbered with period</li>
              <li><code>1) scene text</code> - Numbered with parenthesis</li>
              <li><code>#1 scene text</code> - Hashtag number</li>
              <li><code>A) scene text</code> - Lettered format</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}
