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
  allJobs: [],                  // All jobs for debugging
  currentCountry: 'korea',      // Currently selected country folder
  selectedAssets: new Set(),    // Selected gallery assets for Template Stamper transfer
  referenceCharacters: [],      // Reference characters library
  selectedReferences: new Set() // Selected reference characters for generation
};

// Store snapshot listeners so we can unsubscribe when changing countries
let jobsListener = null;
let galleryListener = null;
let referencesListener = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[YTM Generator] Initializing...');

  // Check if country is already selected (stored in localStorage)
  const storedCountry = localStorage.getItem('ytm_selected_country');
  const urlParams = new URLSearchParams(window.location.search);
  const importedMarket = urlParams.get('market');

  if (importedMarket) {
    // If coming from Agent Collective with a market parameter, use it
    console.log(`[YTM Generator] Imported market from URL: ${importedMarket}`);
    state.currentCountry = importedMarket;
    localStorage.setItem('ytm_selected_country', importedMarket);
    initializeApp();
  } else if (storedCountry) {
    // Use stored country from previous session
    console.log(`[YTM Generator] Using stored country: ${storedCountry}`);
    state.currentCountry = storedCountry;
    initializeApp();
  } else {
    // First time user - show country selection modal
    console.log('[YTM Generator] First time user - showing country selection');
    showInitialCountryModal();
  }

  console.log('[YTM Generator] Ready');
});

// ============================================================================
// INITIAL APP SETUP
// ============================================================================

function initializeApp() {
  setupEventListeners();
  setupRealtimeListeners();
  initializeUI();
  checkForImportedPrompt();
  updateCountryBanner(state.currentCountry);

  // Add click handler to country banner for changing country
  const countryBanner = document.getElementById('countryBanner');
  if (countryBanner) {
    countryBanner.addEventListener('click', () => {
      const currentCountry = state.currentCountry.toUpperCase();
      const confirmed = confirm(
        `You are currently locked to ${currentCountry}.\n\n` +
        `Do you want to change your country selection?\n\n` +
        `Note: This will reload all data for the new country.`
      );

      if (confirmed) {
        // Clear localStorage and show country selection modal
        localStorage.removeItem('ytm_selected_country');
        location.reload();
      }
    });
  }
}

function showInitialCountryModal() {
  const modal = document.getElementById('initialCountryModal');
  modal.style.display = 'flex';

  // Add click handlers for country selection buttons
  document.querySelectorAll('.country-selection-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedCountry = btn.dataset.country;
      console.log(`[YTM Generator] Country selected: ${selectedCountry}`);

      // Save to localStorage
      localStorage.setItem('ytm_selected_country', selectedCountry);
      state.currentCountry = selectedCountry;

      // Hide modal
      modal.style.display = 'none';

      // Initialize the app
      initializeApp();
    });
  });
}

// ============================================================================
// EVENT LISTENERS SETUP
// ============================================================================

function setupEventListeners() {
  // Generation buttons
  document.getElementById('generateImage').addEventListener('click', generateImage);
  document.getElementById('generateVideo').addEventListener('click', generateVideo);

  // Aspect ratio selector
  document.getElementById('aspectRatio').addEventListener('change', changeAspectRatio);

  // Action buttons
  document.getElementById('upscaleBtn').addEventListener('click', upscaleAsset);
  document.getElementById('iterateBtn').addEventListener('click', randomIterateAsset);
  document.getElementById('promptIterateBtn').addEventListener('click', promptIterateAsset);
  document.getElementById('expandBtn').addEventListener('click', expandAsset);
  document.getElementById('animateBtn').addEventListener('click', animateAsset);

  // Bottom buttons
  document.getElementById('saveToGallery').addEventListener('click', saveToCurrentCountry);
  document.getElementById('downloadBtn').addEventListener('click', downloadAsset);

  // Gallery Upload button
  document.getElementById('uploadBtn').addEventListener('click', uploadToCurrentCountry);

  // Modal buttons (for save to gallery - no longer needed but keep for backwards compatibility)
  document.querySelectorAll('.country-select-btn').forEach(btn => {
    btn.addEventListener('click', () => saveToCountry(btn.dataset.country));
  });

  document.querySelectorAll('.country-upload-btn').forEach(btn => {
    btn.addEventListener('click', () => uploadToCountry(btn.dataset.country));
  });

  document.querySelectorAll('.modal-cancel-btn').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });

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
  // Unsubscribe from existing listeners if any
  if (jobsListener) {
    jobsListener();
  }
  if (galleryListener) {
    galleryListener();
  }

  console.log(`[YTM Generator] Setting up listeners for country: ${state.currentCountry}`);

  // Listen to jobs collection for generation updates (FILTERED BY COUNTRY)
  jobsListener = db.collection('jobs')
    .where('country', '==', state.currentCountry)  // FILTER BY COUNTRY
    .orderBy('createdAt', 'desc')
    .limit(100)
    .onSnapshot((snapshot) => {
      state.allJobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`[YTM Generator] Jobs updated for ${state.currentCountry}: ${state.allJobs.length} total`);

      // Check for completed jobs we're tracking
      checkActiveJobs();

      // Update status indicator
      updateStatusIndicator();
    }, (error) => {
      console.error('[YTM Generator] Error listening to jobs:', error);
    });

  // Listen to gallery collection for saved assets (FILTERED BY COUNTRY)
  galleryListener = db.collection('gallery')
    .where('country', '==', state.currentCountry)  // FILTER BY COUNTRY
    .orderBy('savedAt', 'desc')
    .limit(50)
    .onSnapshot((snapshot) => {
      state.savedGallery = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`[YTM Generator] Gallery updated for ${state.currentCountry}: ${state.savedGallery.length} assets`);
      renderGallery();
    }, (error) => {
      console.error('[YTM Generator] Error listening to gallery:', error);
    });

  // Initialize reference characters listener
  setupReferencesListener();
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
/**
 * Generate Image - Creates a single image from the prompt
 */
async function generateImage() {
  try {
    const promptInput = document.getElementById('promptInput');
    const prompt = promptInput.value.trim();

    if (!prompt) {
      alert('Please enter a prompt first');
      return;
    }

    console.log('[YTM Generator] Generate Image clicked');

    // Show loading in lightbox
    showLightboxLoading('Generating image...');

    // Get selected reference characters
    const selectedRefs = Array.from(state.selectedReferences);
    const referenceCharacters = selectedRefs.map(refId => {
      const char = state.referenceCharacters.find(c => c.id === refId);
      return char ? { id: char.id, imageUrl: char.imageUrl, type: char.type || 'subject' } : null;
    }).filter(Boolean);

    console.log(`[YTM Generator] Using ${referenceCharacters.length} reference character(s)`);

    // Call backend to create job
    const createTestJobFn = functions.httpsCallable('createTestJob');
    const result = await createTestJobFn({
      type: 'image',
      prompt: prompt,
      format: state.currentAspectRatio,
      country: state.currentCountry,  // Add country field
      referenceCharacters: referenceCharacters  // Include reference characters
    });

    const jobId = result.data.jobId;
    console.log(`[YTM Generator] Image job created: ${jobId}`);

    // Track this job
    state.activeJobs.set(jobId, {
      type: 'generation',
      prompt: prompt
    });

    // Provide feedback
    showTemporaryMessage('generateImage', 'Generating...');

  } catch (error) {
    console.error('[YTM Generator] Generate Image failed:', error);
    alert('Failed to generate image: ' + error.message);
    hideLightboxLoading();
  }
}

/**
 * Generate Video - Creates a text-to-video from the prompt
 */
async function generateVideo() {
  try {
    const promptInput = document.getElementById('promptInput');
    const prompt = promptInput.value.trim();

    if (!prompt) {
      alert('Please enter a prompt first');
      return;
    }

    console.log('[YTM Generator] Generate Video clicked');

    // Show loading in lightbox
    showLightboxLoading('Generating video...');

    // Get selected reference characters
    const selectedRefs = Array.from(state.selectedReferences);
    const referenceCharacters = selectedRefs.map(refId => {
      const char = state.referenceCharacters.find(c => c.id === refId);
      return char ? { id: char.id, imageUrl: char.imageUrl, type: char.type || 'subject' } : null;
    }).filter(Boolean);

    console.log(`[YTM Generator] Using ${referenceCharacters.length} reference character(s) for video`);

    // Call backend to create video job
    const createTestJobFn = functions.httpsCallable('createTestJob');
    const result = await createTestJobFn({
      type: 'video',
      prompt: prompt,
      format: state.currentAspectRatio || '9:16',  // Default to 9:16 for videos
      country: state.currentCountry,  // Add country field
      referenceCharacters: referenceCharacters  // Include reference characters
    });

    const jobId = result.data.jobId;
    console.log(`[YTM Generator] Video job created: ${jobId}`);

    // Track this job
    state.activeJobs.set(jobId, {
      type: 'video-generation',
      prompt: prompt
    });

    // Provide feedback
    showTemporaryMessage('generateVideo', 'Generating video...');

  } catch (error) {
    console.error('[YTM Generator] Generate Video failed:', error);
    alert('Failed to generate video: ' + error.message);
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
        sceneNumber: index + 1,
        country: state.currentCountry  // Add country field
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
/**
 * Random Iterate - Creates random variation of current asset
 */
async function randomIterateAsset() {
  if (!state.currentAsset) return;

  try {
    console.log('[YTM Generator] Random iterating asset:', state.currentAsset.id);

    showTemporaryMessage('iterateBtn', 'Creating variation...');
    showLightboxLoading('Creating random variation...');

    const iterateFn = functions.httpsCallable('iterateJob');
    const result = await iterateFn({
      jobId: state.currentAsset.id
    });

    const newJobId = result.data.newJobId;
    console.log(`[YTM Generator] Random iterate job created: ${newJobId}`);

    // Track this job
    state.activeJobs.set(newJobId, {
      type: 'random-iterate',
      originalId: state.currentAsset.id
    });

    showTemporaryMessage('iterateBtn', 'Job created!');

  } catch (error) {
    console.error('[YTM Generator] Random iterate failed:', error);
    alert('Failed to iterate: ' + error.message);
    hideLightboxLoading();
  }
}

/**
 * Prompt-based Iterate - Creates variation based on prompt input
 */
async function promptIterateAsset() {
  if (!state.currentAsset) return;

  const promptInput = document.getElementById('promptInput');
  const prompt = promptInput.value.trim();

  if (!prompt) {
    alert('Please enter a prompt to guide the iteration');
    return;
  }

  try {
    console.log('[YTM Generator] Prompt iterating asset:', state.currentAsset.id);
    console.log('[YTM Generator] Iteration prompt:', prompt);

    showTemporaryMessage('promptIterateBtn', 'Iterating with prompt...');
    showLightboxLoading('Creating prompt-guided variation...');

    // Call regenerate with the new prompt
    const regenerateFn = functions.httpsCallable('regenerateJob');
    const result = await regenerateFn({
      jobId: state.currentAsset.id,
      newPrompt: prompt  // Use the prompt from input field
    });

    const newJobId = result.data.newJobId;
    console.log(`[YTM Generator] Prompt iterate job created: ${newJobId}`);

    // Track this job
    state.activeJobs.set(newJobId, {
      type: 'prompt-iterate',
      originalId: state.currentAsset.id,
      prompt: prompt
    });

    showTemporaryMessage('promptIterateBtn', 'Job created!');

  } catch (error) {
    console.error('[YTM Generator] Prompt iterate failed:', error);
    alert('Failed to iterate with prompt: ' + error.message);
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

    // Prepare parameters - include imageUrl for uploaded images
    const params = {
      jobId: state.currentAsset.id
    };

    // If this is an uploaded image, also pass the imageUrl
    if (state.currentAsset.id.startsWith('upload_')) {
      params.imageUrl = state.currentAsset.result?.url;
      console.log('[YTM Generator] Including imageUrl for uploaded image:', params.imageUrl);
    }

    const result = await animateFn(params);

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
 * Show country selection modal for saving to gallery
 */
function showCountryModal() {
  if (!state.currentAsset) return;
  document.getElementById('countryModal').style.display = 'flex';
}

/**
 * Save current lightbox asset to gallery with country selection
 */
// Save to current country directly (no modal)
async function saveToCurrentCountry() {
  if (!state.currentAsset) return;
  await saveToCountry(state.currentCountry);
}

async function saveToCountry(country) {
  if (!state.currentAsset) return;

  try {
    console.log('[YTM Generator] Saving to gallery:', state.currentAsset.id, 'Country:', country);

    // Close modal
    closeModals();

    const btn = document.getElementById('saveToGallery');
    const originalText = btn.querySelector('.btn-text').textContent;
    btn.querySelector('.btn-text').textContent = 'Saving...';
    btn.disabled = true;

    // Save to gallery collection with country field
    await db.collection('gallery').add({
      assetId: state.currentAsset.id,
      url: state.currentAsset.result.url,
      prompt: state.currentAsset.prompt || '',
      format: state.currentAsset.format || state.currentAspectRatio,
      type: state.currentAsset.type,
      country: country,  // Add country field
      savedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log('[YTM Generator] Saved to gallery in', country);
    btn.querySelector('.btn-text').textContent = 'Saved!';

    setTimeout(() => {
      btn.querySelector('.btn-text').textContent = originalText;
      btn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('[YTM Generator] Save to gallery failed:', error);
    alert('Failed to save: ' + error.message);
    const btn = document.getElementById('saveToGallery');
    const originalText = btn.querySelector('.btn-text').textContent;
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

    // Use Cloud Function proxy for proper download with CORS headers
    const downloadUrl = `https://us-central1-v3-creative-engine.cloudfunctions.net/downloadAsset?url=${encodeURIComponent(url)}`;

    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

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
// COUNTRY FOLDER MANAGEMENT
// ============================================================================

/**
 * Switch active country tab and re-establish listeners
 */
function switchCountry(country) {
  console.log('[YTM Generator] Switching to country:', country);

  // Update state
  state.currentCountry = country;

  // Clear selected assets when switching countries
  state.selectedAssets.clear();

  // Update active tab
  document.querySelectorAll('.country-tab').forEach(tab => {
    if (tab.dataset.country === country) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update country banner
  updateCountryBanner(country);

  // Re-establish Firestore listeners with new country filter
  setupRealtimeListeners();

  // Clear lightbox to avoid showing wrong country's content
  clearLightbox();
}

/**
 * Update country banner to show current market
 */
function updateCountryBanner(country) {
  const banner = document.getElementById('countryBanner');
  const countryName = document.getElementById('countryName');
  const countryFlag = document.getElementById('countryFlag');

  const countryData = {
    korea: { name: 'KOREA', flag: '🇰🇷' },
    japan: { name: 'JAPAN', flag: '🇯🇵' },
    india: { name: 'INDIA', flag: '🇮🇳' },
    indonesia: { name: 'INDONESIA', flag: '🇮🇩' }
  };

  // Remove all country classes
  banner.classList.remove('korea', 'japan', 'india', 'indonesia');

  // Add new country class
  banner.classList.add(country);

  // Update text and flag
  const data = countryData[country];
  if (data) {
    countryName.textContent = data.name;
    countryFlag.textContent = data.flag;
  }
}

// ============================================================================
// UPLOAD FUNCTIONALITY
// ============================================================================

/**
 * Show upload modal
 */
function showUploadModal() {
  document.getElementById('uploadModal').style.display = 'flex';
}

/**
 * Upload image to Firebase Storage and save to gallery
 */
// Upload to current country directly (show file picker)
async function uploadToCurrentCountry() {
  // Create a temporary file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';

  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadFileToCountry(file, state.currentCountry);
    }
  };

  fileInput.click();
}

/**
 * Detect image aspect ratio from file
 */
async function detectImageAspectRatio(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = function() {
      const width = this.width;
      const height = this.height;
      const aspectRatio = width / height;

      URL.revokeObjectURL(url);

      // Determine closest standard aspect ratio
      if (aspectRatio > 1.5) {
        resolve('16:9'); // Landscape
      } else if (aspectRatio < 0.7) {
        resolve('9:16'); // Portrait
      } else if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
        resolve('1:1'); // Square
      } else if (aspectRatio >= 1.2 && aspectRatio <= 1.4) {
        resolve('4:3'); // Classic
      } else if (aspectRatio >= 0.7 && aspectRatio < 0.9) {
        resolve('3:4'); // Portrait classic
      } else {
        // Default to closest match
        resolve(aspectRatio > 1 ? '16:9' : '9:16');
      }
    };

    img.onerror = function() {
      URL.revokeObjectURL(url);
      resolve('1:1'); // Fallback to square on error
    };

    img.src = url;
  });
}

async function uploadToCountry(country) {
  const fileInput = document.getElementById('uploadFileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select an image or video file first');
    return;
  }

  await uploadFileToCountry(file, country);
}

async function uploadFileToCountry(file, country) {
  if (!file) {
    alert('Please select an image or video file first');
    return;
  }

  // Determine file type
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    alert('Please select a valid image or video file');
    return;
  }

  const fileType = isImage ? 'image' : 'video';
  const fileInput = document.getElementById('uploadFileInput');

  try {
    console.log(`[YTM Generator] Uploading ${fileType} to country:`, country);

    // Show loading toast
    showImportToast(`Uploading ${fileType}...`);

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `uploads/${country}/${timestamp}_${file.name}`;

    // Upload to Firebase Storage
    const storage = firebase.storage();
    const storageRef = storage.ref();
    const fileRef = storageRef.child(fileName);

    const uploadTask = await fileRef.put(file);
    const downloadUrl = await uploadTask.ref.getDownloadURL();

    console.log(`[YTM Generator] ${fileType} uploaded:`, downloadUrl);

    // Create a unique job ID for uploaded assets
    const uploadJobId = `upload_${timestamp}`;

    // Determine aspect ratio - detect from actual image/video dimensions
    let detectedFormat = isVideo ? '9:16' : '1:1';

    if (isImage) {
      // Detect image aspect ratio from actual dimensions
      detectedFormat = await detectImageAspectRatio(file);
      console.log(`[YTM Generator] Detected aspect ratio: ${detectedFormat}`);
    }

    // Create job document in jobs collection (so edit features work)
    await db.collection('jobs').doc(uploadJobId).set({
      status: 'complete',
      type: fileType,
      prompt: `Uploaded ${fileType}: ${file.name}`,
      format: detectedFormat,
      country: country,
      isUploaded: true,  // Flag to identify uploaded assets
      result: {
        url: downloadUrl
      },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Save to gallery collection
    await db.collection('gallery').add({
      assetId: uploadJobId,
      url: downloadUrl,
      prompt: `Uploaded ${fileType}: ${file.name}`,
      format: detectedFormat,
      type: fileType,
      country: country,
      isUploaded: true,  // Flag to identify uploaded assets
      savedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[YTM Generator] Upload saved to jobs and gallery in`, country);

    // Show success toast
    showImportToast(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} uploaded to ${country.charAt(0).toUpperCase() + country.slice(1)}`);

    // Clear file input
    fileInput.value = '';

    // Switch to the country we uploaded to
    switchCountry(country);

  } catch (error) {
    console.error('[YTM Generator] Upload failed:', error);
    alert(`Failed to upload ${fileType}: ` + error.message);
  }
}

/**
 * Close all modals
 */
function closeModals() {
  document.getElementById('countryModal').style.display = 'none';
  document.getElementById('uploadModal').style.display = 'none';
  document.getElementById('templateStamperModal').style.display = 'none';
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

    if (job.status === 'complete') {
      if (job.result?.url) {
        console.log(`[YTM Generator] Job completed: ${jobId} (${job.type})`);

        // Reference characters don't get loaded into lightbox - they appear in the References tab
        if (job.type === 'reference_character') {
          console.log(`[YTM Generator] Reference character created: ${job.name}`);
          // The References tab will automatically update via the Firestore listener
        } else {
          // Load regular images/videos into lightbox
          loadAssetToLightbox(job);
          // Hide loading state
          hideLightboxLoading();
        }

        // Remove from tracking
        state.activeJobs.delete(jobId);
      } else {
        // Job completed but no result URL - likely blocked by content filter
        console.error(`[YTM Generator] Job completed without result: ${jobId}`);
        alert(`Generation failed: Content may have been blocked by safety filters. Try a different prompt.`);

        state.activeJobs.delete(jobId);
        hideLightboxLoading();
      }
    } else if (job.status === 'error') {
      console.error(`[YTM Generator] Job failed: ${jobId}`, job.error);
      alert(`Job failed: ${job.error || 'Unknown error'}`);

      state.activeJobs.delete(jobId);
      hideLightboxLoading();
    } else if (job.status === 'cancelled') {
      console.log(`[YTM Generator] Job cancelled: ${jobId}`);

      // Remove from tracking
      state.activeJobs.delete(jobId);

      // Hide loading state
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
  if (currentJob.type === 'reference_character') {
    // Reference character generation - 30-60 seconds (same as image)
    statusIndicator.className = 'status-indicator processing';

    if (currentJob.status === 'pending') {
      statusMessage.textContent = `Creating ${currentJob.name || 'character'}...`;
      statusTime.textContent = 'Estimated: 30-60 seconds';
    } else {
      statusMessage.textContent = `Generating ${currentJob.name || 'character'}...`;
      statusTime.textContent = 'Estimated: 30-60 seconds';
    }

  } else if (currentJob.type === 'image') {
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

/**
 * Cancel the current active job
 */
async function cancelCurrentJob() {
  try {
    // Find active jobs (pending, processing, or generating)
    const activeJobs = state.allJobs.filter(job =>
      job.status === 'pending' ||
      job.status === 'processing' ||
      job.status === 'generating'
    );

    if (activeJobs.length === 0) {
      console.log('[YTM Generator] No active jobs to cancel');
      return;
    }

    // Get the most recent active job
    const currentJob = activeJobs[0];
    console.log(`[YTM Generator] Cancelling job: ${currentJob.id}`);

    // Update job status to 'cancelled' in Firestore
    await db.collection('jobs').doc(currentJob.id).update({
      status: 'cancelled',
      cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Remove from active jobs tracking
    state.activeJobs.delete(currentJob.id);

    // Hide loading indicators
    hideLightboxLoading();

    // Show success message
    showImportToast('Job cancelled successfully');

    console.log('[YTM Generator] Job cancelled successfully');
  } catch (error) {
    console.error('[YTM Generator] Failed to cancel job:', error);
    showImportToast('Failed to cancel job');
  }
}

// ============================================================================
// LIGHTBOX RENDERING
// ============================================================================

/**
 * Load an asset into the main lightbox
 */
function loadAssetToLightbox(asset) {
  if (!asset || !asset.result?.url) {
    console.warn('[YTM Generator] Cannot load asset: missing data', asset);
    alert('Cannot load asset: Missing image/video URL. The generation may have been blocked by content filters.');
    hideLightboxLoading();
    return;
  }

  console.log('[YTM Generator] Loading asset to lightbox:', asset.id);
  console.log('[YTM Generator] Asset URL:', asset.result.url);
  console.log('[YTM Generator] Asset type:', asset.type);
  console.log('[YTM Generator] Full asset:', asset);

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
    mediaHtml = `<video src="${asset.result.url}" controls autoplay loop onerror="alert('Failed to load video. URL may be invalid.')"></video>`;
  } else {
    mediaHtml = `<img src="${asset.result.url}" alt="${asset.prompt || 'Generated image'}" onerror="alert('Failed to load image. URL may be invalid or content was filtered.')" />`;
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

/**
 * Clear lightbox and reset to empty state
 */
function clearLightbox() {
  // Clear current asset from state
  state.currentAsset = null;

  // Show empty state
  const lightboxEmpty = document.querySelector('.lightbox-empty');
  const lightboxContent = document.getElementById('lightboxContent');

  if (lightboxEmpty && lightboxContent) {
    lightboxEmpty.classList.remove('hidden');
    lightboxContent.classList.add('hidden');
    lightboxContent.innerHTML = '';
  }

  // Disable action buttons
  disableActionButtons();

  console.log('[YTM Generator] Lightbox cleared');
}

// ============================================================================
// GALLERY RENDERING
// ============================================================================

/**
 * Render gallery thumbnails (already filtered by Firestore query)
 */
function renderGallery() {
  const galleryGrid = document.getElementById('galleryGrid');

  // No need for client-side filtering - Firestore query already filters by country
  const countryAssets = state.savedGallery;

  if (countryAssets.length === 0) {
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
    updateTemplateStamperButton();
    return;
  }

  // Render saved assets for current country
  galleryGrid.innerHTML = countryAssets.map((asset, index) => {
    const isVideo = asset.type === 'video';
    const mediaTag = isVideo
      ? `<video src="${asset.url}" muted></video>`
      : `<img src="${asset.url}" alt="Asset ${index + 1}" />`;

    const isSelected = state.selectedAssets.has(asset.id);

    return `
      <div class="gallery-item ${isSelected ? 'selected' : ''}" onclick="loadGalleryAsset('${asset.id}')">
        <input
          type="checkbox"
          class="gallery-checkbox"
          ${isSelected ? 'checked' : ''}
          onclick="event.stopPropagation(); toggleAssetSelection('${asset.id}')"
        />
        ${mediaTag}
        <button class="gallery-delete-btn" onclick="event.stopPropagation(); deleteGalleryAsset('${asset.id}')" title="Delete from gallery">×</button>
      </div>
    `;
  }).join('');

  updateTemplateStamperButton();
}

/**
 * Toggle asset selection for Template Stamper transfer
 */
window.toggleAssetSelection = function(galleryId) {
  if (state.selectedAssets.has(galleryId)) {
    state.selectedAssets.delete(galleryId);
  } else {
    state.selectedAssets.add(galleryId);
  }
  renderGallery();
}

/**
 * Update Template Stamper button state and text
 */
function updateTemplateStamperButton() {
  const btn = document.getElementById('sendToTemplateStamperBtn');
  const btnText = document.getElementById('stamperBtnText');
  if (!btn || !btnText) return;

  const count = state.selectedAssets.size;

  if (count === 0) {
    // No selection - show instructional text
    btn.disabled = true;
    btnText.textContent = 'Select from gallery for template stamping';
  } else {
    // Assets selected - show count
    btn.disabled = false;
    btnText.textContent = `Send ${count} to Template Stamper`;
  }
}

/**
 * Send selected assets to Template Stamper
 */
async function sendToTemplateStamper() {
  if (state.selectedAssets.size === 0) {
    alert('Please select at least one asset to send to Template Stamper');
    return;
  }

  // Get the selected assets with full data
  const selectedAssetData = state.savedGallery.filter(asset =>
    state.selectedAssets.has(asset.id)
  );

  // Show confirmation modal
  showTemplateStamperModal(selectedAssetData);
}

/**
 * Show confirmation modal before sending to Template Stamper
 */
function showTemplateStamperModal(assets) {
  const modal = document.getElementById('templateStamperModal');
  const assetsList = document.getElementById('templateStamperAssetsList');
  const countSpan = document.getElementById('templateStamperCount');

  countSpan.textContent = assets.length;

  // Render list of assets
  assetsList.innerHTML = assets.map((asset, index) => {
    const typeIcon = asset.type === 'video' ? '🎬' : '🖼️';
    const formatLabel = asset.type === 'video' ? 'MP4' : 'JPEG';
    return `
      <div class="transfer-asset-item">
        <span class="asset-icon">${typeIcon}</span>
        <span class="asset-info">${formatLabel} - ${asset.format || '9:16'}</span>
        <span class="asset-prompt">${(asset.prompt || 'Uploaded asset').substring(0, 40)}...</span>
      </div>
    `;
  }).join('');

  modal.style.display = 'flex';
}

/**
 * Confirm and execute transfer to Template Stamper
 */
async function confirmTemplateStamperTransfer() {
  const btn = document.getElementById('templateStamperConfirmBtn');
  const originalText = btn.textContent;

  try {
    btn.textContent = 'Transferring...';
    btn.disabled = true;

    // Get the selected assets with full data
    const selectedAssetData = state.savedGallery.filter(asset =>
      state.selectedAssets.has(asset.id)
    );

    console.log('[YTM Generator] Selected assets for transfer:', selectedAssetData.length);
    console.log('[YTM Generator] Selected asset IDs:', Array.from(state.selectedAssets));
    console.log('[YTM Generator] Gallery assets:', state.savedGallery.length);

    if (selectedAssetData.length === 0) {
      alert('No assets selected. Please select assets from the gallery first.');
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }

    // Prepare asset data for transfer
    const transferAssets = selectedAssetData.map(asset => ({
      url: asset.url,
      type: asset.type, // 'image' or 'video'
      format: asset.type === 'video' ? 'mp4' : 'jpeg',
      aspectRatio: asset.format || '9:16',
      prompt: asset.prompt || 'Uploaded asset',
      assetId: asset.assetId,
      savedAt: asset.savedAt
    }));

    console.log('[YTM Generator] Transfer assets prepared:', transferAssets.length);

    // Create transfer document in Firestore
    const transferDoc = await db.collection('template_stamper_transfers').add({
      country: state.currentCountry,
      assets: transferAssets,
      assetCount: transferAssets.length,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      templateStamperUrl: null, // Will be populated when Template Stamper is built
      processedAt: null
    });

    console.log('[YTM Generator] Transfer created:', transferDoc.id, 'with', transferAssets.length, 'assets');

    // Save asset count before clearing selection
    const assetCount = transferAssets.length;

    // Close modal immediately - use direct reference to ensure it closes
    const modal = document.getElementById('templateStamperModal');
    if (modal) {
      modal.style.display = 'none';
    }

    // Show success toast BEFORE clearing selection
    showImportToast(`${assetCount} asset(s) sent to Template Stamper queue`);

    // Clear selection
    state.selectedAssets.clear();
    renderGallery();

    // Reset button
    btn.textContent = originalText;
    btn.disabled = false;

  } catch (error) {
    console.error('[YTM Generator] Transfer failed:', error);
    alert('Failed to transfer assets: ' + error.message);
    btn.textContent = originalText;
    btn.disabled = false;
  }
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
  document.getElementById('promptIterateBtn').disabled = false;
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
  document.getElementById('promptIterateBtn').disabled = true;
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
  const importedMarket = urlParams.get('market');

  // Auto-switch to imported market if provided
  if (importedMarket) {
    console.log(`[YTM Generator] Auto-switching to market: ${importedMarket}`);
    switchCountry(importedMarket);
    showImportToast(`Switched to ${importedMarket.toUpperCase()} market`);
  }

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

      console.log(`[YTM Generator] Prompt imported: "${decodedPrompt.substring(0, 50)}..."`);
    }
  }

  // Clean the URL (remove the parameters)
  if (importedPrompt || importedMarket) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
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
        <h2>YTM Creative Generator Guide</h2>
        <button class="help-close-btn" onclick="this.closest('.help-modal').remove()">×</button>
      </div>
      <div class="help-modal-body">
        <div class="help-section">
          <h3>🌍 Country/Market Selection</h3>
          <div class="help-text">
            <p>On first visit, select your market: Korea 🇰🇷, Japan 🇯🇵, Indonesia 🇮🇩, or India 🇮🇳. Each country has its own separate gallery and assets. Click the country banner at the top to switch markets anytime.</p>
          </div>
        </div>

        <div class="help-section">
          <h3>🎨 Generation Buttons</h3>
          <div class="help-item">
            <span class="help-icon">🖼️</span>
            <div class="help-text">
              <strong>Generate Image</strong>
              <p>Creates a still image from your prompt using AI. Appears in the main lightbox when complete (30-60 seconds).</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">🎬</span>
            <div class="help-text">
              <strong>Generate Video</strong>
              <p>Creates a video from your prompt using Gemini Veo 3.1. Takes 3-5 minutes to complete.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">×</span>
            <div class="help-text">
              <strong>Cancel Button</strong>
              <p>Click the × button in the status indicator to cancel an ongoing generation if it's taking too long or you've changed your mind.</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>📤 Upload Assets</h3>
          <div class="help-item">
            <span class="help-icon">📤</span>
            <div class="help-text">
              <strong>Upload Button</strong>
              <p>Upload your own images or videos from your device. Select the file, choose the country folder, and it will appear in the gallery. All edit features (upscale, iterate, expand, animate) work on uploaded assets just like generated ones.</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>📐 Aspect Ratio</h3>
          <div class="help-item">
            <span class="help-icon">📐</span>
            <div class="help-text">
              <strong>Aspect Ratio Selector</strong>
              <p>Choose dimensions for your content:<br/>
              • 9:16 (Portrait) - TikTok, Shorts, Reels<br/>
              • 16:9 (Landscape) - YouTube, traditional video<br/>
              • 1:1 (Square) - Instagram posts<br/>
              • 4:3 (Classic) - Old-school format</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>✨ Edit Actions</h3>
          <div class="help-item">
            <span class="help-icon">⊕</span>
            <div class="help-text">
              <strong>Upscale res</strong>
              <p>Increases resolution and definition while keeping content identical. Works on both images and videos, including uploaded assets.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">🔄</span>
            <div class="help-text">
              <strong>Random Iterate</strong>
              <p>Creates a random variation using the same prompt. AI generates a different interpretation while maintaining the theme. Works on all assets.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">✏️</span>
            <div class="help-text">
              <strong>Prompt Iterate</strong>
              <p>Modify the asset with a new prompt. Edit the prompt text below, then click this to create a variation with your changes. Works on all assets.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">↗️</span>
            <div class="help-text">
              <strong>Expand</strong>
              <p>Expands the image beyond its frame, zooming out to reveal more of the scene. <strong>Images only</strong>.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">🎬</span>
            <div class="help-text">
              <strong>Animate (i2v)</strong>
              <p>Converts an image into a 5-second video with subtle animation and movement. <strong>Images only</strong>. Works on both generated and uploaded images.</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>💾 Save & Export</h3>
          <div class="help-item">
            <span class="help-icon">💾</span>
            <div class="help-text">
              <strong>Save to Gallery</strong>
              <p>Saves the current lightbox asset to your permanent gallery (right sidebar). Uploaded assets are automatically saved.</p>
            </div>
          </div>
          <div class="help-item">
            <span class="help-icon">⬇️</span>
            <div class="help-text">
              <strong>Download</strong>
              <p>Downloads the asset to your device. Images save as JPEG, videos save as MP4.</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>🚀 Template Stamper Transfer</h3>
          <div class="help-item">
            <span class="help-icon">☑️</span>
            <div class="help-text">
              <strong>Multi-Select & Transfer</strong>
              <p>Check the boxes on gallery assets to select multiple items. Click "Send to Template Stamper" button to transfer selected assets to the branding tool for final creative assembly.</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>💡 Tips</h3>
          <div class="help-text">
            <ul>
              <li>Be specific in prompts: "A red sports car racing at sunset on a highway" works better than "car"</li>
              <li>All country galleries are separate - switch countries to access different assets</li>
              <li>Uploaded assets have all the same features as generated content</li>
              <li>Videos take longer to generate (3-5 min) - use the cancel button if needed</li>
              <li>Save important variations to gallery before generating new content</li>
              <li>Prompt Iterate allows you to refine and adjust existing assets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================================================
// REFERENCE CHARACTERS SYSTEM
// ============================================================================

/**
 * Switch between Gallery and References tabs
 */
function switchTab(tabName) {
  console.log(`[YTM Generator] Switching to ${tabName} tab`);

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  const targetTab = tabName === 'gallery' ? 'galleryTab' : 'referencesTab';
  document.getElementById(targetTab).classList.add('active');
}

/**
 * Setup realtime listener for reference characters
 */
function setupReferencesListener() {
  // Unsubscribe from existing listener if any
  if (referencesListener) {
    referencesListener();
  }

  console.log(`[YTM Generator] Setting up references listener for country: ${state.currentCountry}`);

  // Listen to reference_characters collection (FILTERED BY COUNTRY)
  referencesListener = db.collection('reference_characters')
    .where('country', '==', state.currentCountry)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot((snapshot) => {
      state.referenceCharacters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`[YTM Generator] References updated for ${state.currentCountry}: ${state.referenceCharacters.length} characters`);
      renderReferencesGrid();
    }, (error) => {
      console.error('[YTM Generator] Error listening to references:', error);
    });
}

/**
 * Render the references grid
 */
function renderReferencesGrid() {
  const grid = document.getElementById('referencesGrid');

  if (!grid) {
    console.error('[YTM Generator] References grid element not found');
    return;
  }

  // Empty state
  if (state.referenceCharacters.length === 0) {
    grid.innerHTML = `
      <div class="references-empty">
        <div class="references-empty-icon">👤</div>
        <div class="references-empty-title">No Reference Characters</div>
        <div class="references-empty-text">
          Create your first reference character to maintain consistency across your creative assets
        </div>
      </div>
    `;
    return;
  }

  // Render character cards
  grid.innerHTML = state.referenceCharacters.map(char => {
    const isSelected = state.selectedReferences.has(char.id);
    const charPrompt = char.prompt || '';
    return `
      <div class="reference-card ${isSelected ? 'selected' : ''}"
           onclick="toggleReferenceSelection('${char.id}')"
           data-ref-id="${char.id}">
        <div class="reference-image-wrapper">
          <img src="${char.imageUrl}" alt="${char.name}" class="reference-image" />
          <div class="reference-type-badge ${char.type}">${char.type}</div>
        </div>
        <div class="reference-card-info">
          <div class="reference-name">${char.name}</div>
          <div class="reference-description">${charPrompt}</div>
        </div>
        <div class="reference-actions">
          <button class="reference-action-btn" onclick="event.stopPropagation(); viewReferenceDetails('${char.id}')">
            View
          </button>
          <button class="reference-action-btn delete" onclick="event.stopPropagation(); deleteReference('${char.id}')">
            Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Toggle reference character selection
 */
function toggleReferenceSelection(refId) {
  if (state.selectedReferences.has(refId)) {
    state.selectedReferences.delete(refId);
  } else {
    state.selectedReferences.add(refId);
  }
  renderReferencesGrid();
  console.log(`[YTM Generator] Selected references:`, Array.from(state.selectedReferences));
}

/**
 * View reference character details
 */
function viewReferenceDetails(refId) {
  const ref = state.referenceCharacters.find(r => r.id === refId);
  if (!ref) return;

  alert(`Reference Character: ${ref.name}\n\nType: ${ref.type}\n\nPrompt: ${ref.prompt}\n\nCreated: ${new Date(ref.createdAt).toLocaleString()}`);
}

/**
 * Delete reference character
 */
async function deleteReference(refId) {
  if (!confirm('Are you sure you want to delete this reference character?')) {
    return;
  }

  try {
    await db.collection('reference_characters').doc(refId).delete();
    console.log(`[YTM Generator] Reference character ${refId} deleted`);
  } catch (error) {
    console.error('[YTM Generator] Error deleting reference:', error);
    alert('Failed to delete reference character. Please try again.');
  }
}

/**
 * Show Create Character Modal
 */
document.getElementById('createCharacterBtn').addEventListener('click', () => {
  const modal = document.getElementById('createCharacterModal');
  modal.style.display = 'flex';

  // Reset form
  document.getElementById('characterName').value = '';
  document.getElementById('characterType').value = 'person';
  document.getElementById('characterPrompt').value = '';
  document.getElementById('characterAspectRatio').value = '9:16';
  updateCharacterCount();
});

/**
 * Update character prompt character count
 */
function updateCharacterCount() {
  const prompt = document.getElementById('characterPrompt').value;
  document.getElementById('promptCharCount').textContent = prompt.length;
}

// Add character count listener
document.getElementById('characterPrompt').addEventListener('input', updateCharacterCount);

/**
 * Generate Reference Character
 */
async function generateReferenceCharacter() {
  const name = document.getElementById('characterName').value.trim();
  const type = document.getElementById('characterType').value;
  const prompt = document.getElementById('characterPrompt').value.trim();
  const aspectRatio = document.getElementById('characterAspectRatio').value;

  // Validation
  if (!name) {
    alert('Please enter a character name');
    return;
  }

  if (!prompt) {
    alert('Please enter a character description');
    return;
  }

  if (prompt.length > 1000) {
    alert('Character description must be 1000 characters or less');
    return;
  }

  console.log(`[YTM Generator] Creating reference character: ${name}`);

  // Close modal
  closeModals();

  try {
    // Create job in Firestore
    const jobData = {
      type: 'reference_character',
      name: name,
      characterType: type,
      prompt: prompt,
      aspectRatio: aspectRatio,
      country: state.currentCountry,
      status: 'pending',
      createdAt: Date.now(),
      model: 'imagen-3.0-generate-001' // Will be updated to Nano Banana Pro later
    };

    const jobRef = await db.collection('jobs').add(jobData);
    console.log(`[YTM Generator] Reference character job created: ${jobRef.id}`);

    // Track the job
    state.activeJobs.set(jobRef.id, {
      type: 'reference_character',
      name: name,
      startTime: Date.now()
    });

    // Status indicator will automatically update via updateStatusIndicator()
    console.log(`[YTM Generator] Reference character generation started. Watch the status indicator at the top.`);

  } catch (error) {
    console.error('[YTM Generator] Error creating reference character:', error);
    alert('Failed to create reference character. Please try again.');
  }
}

/**
 * Update the closeModals function to include character modal
 */
const originalCloseModals = window.closeModals || function() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
};

window.closeModals = function() {
  originalCloseModals();
  const characterModal = document.getElementById('createCharacterModal');
  if (characterModal) {
    characterModal.style.display = 'none';
  }
};

// Make functions globally accessible
window.switchTab = switchTab;
window.toggleReferenceSelection = toggleReferenceSelection;
window.viewReferenceDetails = viewReferenceDetails;
window.deleteReference = deleteReference;
window.generateReferenceCharacter = generateReferenceCharacter;
window.updateCharacterCount = updateCharacterCount;

// Initialize references listener when app starts
// (This will be called from the main initialization function)
console.log('[YTM Generator] Reference Characters system loaded');
