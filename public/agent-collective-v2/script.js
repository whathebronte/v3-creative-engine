/**
 * YTM Agent Collective V2 - Frontend
 * ====================================
 * ADK pipeline UI with dark theme, chat archive, and MCP bridge.
 *
 * Connects to the Cloud Run backend (FastAPI + embedded ADK) via SSE.
 * Filters events by presenter author, renders markdown, tracks phases.
 */

// =========================================================================
// Configuration
// =========================================================================

// Backend URL — Cloud Run service (update after deployment)
// For local dev, set to "http://localhost:8080"
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8080"
  : "https://agent-collective-v2-964100659393.us-central1.run.app";

// Firebase config (same as v3-creative-engine)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBwtQBAZ_IewB2TYCkew3ctzB4HMs9Gyn0",
  authDomain: "v3-creative-engine.firebaseapp.com",
  projectId: "v3-creative-engine",
  storageBucket: "v3-creative-engine.firebasestorage.app",
  messagingSenderId: "1044107949498",
  appId: "1:1044107949498:web:ba89c7e43b18c23db8f816",
};

// =========================================================================
// Firebase init
// =========================================================================

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// =========================================================================
// State
// =========================================================================

let sessionId = null;
let isProcessing = false;
let pendingFile = null;
let firstMessageSent = false;
let lastManifestData = null;  // For MCP bridge

const TYPING_SPEED_MS = 18;

// Phase tracking
let completedPresenters = new Set();

// Authors we render
const RENDER_AUTHORS = new Set([
  "concept_presenter", "brief_presenter", "creative_presenter", "results_presenter",
  "adapt_analysis_presenter", "adapt_strategy_presenter", "adapt_results_presenter",
  "fc_analysis_presenter", "fc_strategy_presenter", "fc_results_presenter",
]);

const PHASE_COMPLETE_AUTHORS = new Set([...RENDER_AUTHORS]);

const PHASE_AFTER_PRESENTER = {
  "concept_presenter": 2, "brief_presenter": 3, "creative_presenter": 4, "results_presenter": 5,
  "adapt_analysis_presenter": 2, "adapt_strategy_presenter": 3, "adapt_results_presenter": 5,
  "fc_analysis_presenter": 5, "fc_strategy_presenter": 5, "fc_results_presenter": 5,
};

const PHASE_LABELS = {
  1: "Analyzing...", 2: "Generating...",
  3: "Developing creative concepts...", 4: "Creating production prompts...", 5: "Processing...",
};

const AUTHOR_PHASE_LABEL = {
  "kb_analyzer": "Diving into the market data...",
  "concept_generator": "Diving into the market data...",
  "concept_presenter": "Diving into the market data...",
  "brief_generator": "Pulling the brief together...",
  "brief_reviser": "Pulling the brief together...",
  "brief_quality_loop": "Pulling the brief together...",
  "brief_quality_checker": "Pulling the brief together...",
  "brief_presenter": "Pulling the brief together...",
  "creative_director": "Dreaming up the storyboards...",
  "creative_presenter": "Dreaming up the storyboards...",
  "creative_prompter": "Writing the generation prompts...",
  "prompt_quality_loop": "Writing the generation prompts...",
  "prompt_quality_checker": "Writing the generation prompts...",
  "results_presenter": "Writing the generation prompts...",
  "adapt_preprocessor": "Taking the asset apart...",
  "adapt_deconstructor": "Taking the asset apart...",
  "adapt_audience_mapper": "Understanding the audience...",
  "adapt_analysis_presenter": "Understanding the audience...",
  "adapt_strategy_generator": "Working out the adaptation plan...",
  "adapt_strategy_presenter": "Working out the adaptation plan...",
  "adapt_variation_generator_0": "Writing the variations...",
  "adapt_variation_generator_1": "Writing the variations...",
  "adapt_variation_generator_2": "Writing the variations...",
  "adapt_variation_generator_3": "Writing the variations...",
  "adapt_consistency_checker": "Checking everything lines up...",
  "adapt_variation_regenerator": "Checking everything lines up...",
  "adapt_results_presenter": "Preparing the results...",
  "fc_creative_bridge": "Mapping your audiences...",
  "fc_kb_analyzer": "Mapping your audiences...",
  "fc_audience_mapper": "Mapping your audiences...",
  "fc_analysis_presenter": "Mapping your audiences...",
  "fc_strategy_generator": "Building audience strategies...",
  "fc_strategy_presenter": "Building audience strategies...",
  "fc_variation_generator_0": "Creating audience variations...",
  "fc_variation_generator_1": "Creating audience variations...",
  "fc_variation_generator_2": "Creating audience variations...",
  "fc_variation_generator_3": "Creating audience variations...",
  "fc_consistency_checker": "Checking everything lines up...",
  "fc_variation_regenerator": "Checking everything lines up...",
  "fc_results_presenter": "Preparing the full campaign...",
};

const PHASE_SUB_STEPS = {
  "Diving into the market data...": ["Reading between the lines...", "Picking up the nuances...", "Connecting the dots..."],
  "Pulling the brief together...": ["Thinking it through...", "Getting the words right...", "Almost there..."],
  "Dreaming up the storyboards...": ["Picturing the scenes...", "Finding the angle...", "Building it out..."],
  "Writing the generation prompts...": ["Getting specific...", "Adding the detail...", "Nearly ready..."],
  "Taking the asset apart...": ["Looking at what's working...", "Finding the key bits...", "Getting the picture..."],
  "Understanding the audience...": ["Thinking about who's watching...", "Mapping the segments...", "Finding the fit..."],
  "Working out the adaptation plan...": ["Thinking through the options...", "Figuring out what changes...", "Lining things up..."],
  "Writing the variations...": ["Tailoring each version...", "Getting the tone right...", "Working through the segments..."],
  "Checking everything lines up...": ["Looking for inconsistencies...", "Running through the details...", "Almost done..."],
  "Preparing the results...": ["Putting it all together...", "Nearly there...", "Won't be long..."],
  "Mapping your audiences...": ["Looking at the creative...", "Identifying audience hooks...", "Matching insights to segments..."],
  "Building audience strategies...": ["Finding each angle...", "Working out the creative shifts...", "Lining things up..."],
  "Creating audience variations...": ["Tailoring each version...", "Getting the tone right...", "Working through the segments..."],
  "Preparing the full campaign...": ["Pulling it all together...", "Nearly there...", "Won't be long..."],
};

const SUB_STEP_INITIAL_DELAY_MS = 5000;
const SUB_STEP_INTERVAL_MS = 5000;
let activeSubStepCycler = null;

// All agents in pipeline order (for sidebar display)
const ALL_AGENTS = [
  "kb_analyzer", "concept_generator", "concept_presenter",
  "brief_generator", "brief_quality_checker", "brief_reviser", "brief_presenter",
  "creative_director", "creative_presenter",
  "creative_prompter", "prompt_quality_checker", "results_presenter",
  "adapt_preprocessor", "adapt_deconstructor", "adapt_audience_mapper",
  "adapt_analysis_presenter", "adapt_strategy_generator", "adapt_strategy_presenter",
  "adapt_variation_generator_0", "adapt_variation_generator_1",
  "adapt_variation_generator_2", "adapt_variation_generator_3",
  "adapt_consistency_checker", "adapt_variation_regenerator", "adapt_results_presenter",
  "fc_creative_bridge", "fc_kb_analyzer", "fc_audience_mapper",
  "fc_analysis_presenter", "fc_strategy_generator", "fc_strategy_presenter",
  "fc_variation_generator_0", "fc_variation_generator_1",
  "fc_variation_generator_2", "fc_variation_generator_3",
  "fc_consistency_checker", "fc_variation_regenerator", "fc_results_presenter",
];

const AGENT_DISPLAY_NAMES = {};
ALL_AGENTS.forEach(a => {
  AGENT_DISPLAY_NAMES[a] = a.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
});

const MARKET_NAMES = { kr: "Korea", in: "India", jp: "Japan", id: "Indonesia" };

// Conversation messages for archive
let currentMessages = [];

// =========================================================================
// DOM refs
// =========================================================================

const conversationEl = document.getElementById("conversationInner");
const emptyState = document.getElementById("emptyState");
const inputBar = document.getElementById("inputBar");
const inputField = document.getElementById("inputField");
const sendBtn = document.getElementById("sendBtn");
const errorOverlay = document.getElementById("errorOverlay");
const errorRestart = document.getElementById("errorRestart");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");
const filePreview = document.getElementById("filePreview");
const filePreviewName = document.getElementById("filePreviewName");
const filePreviewRemove = document.getElementById("filePreviewRemove");
const marketSelect = document.getElementById("marketSelect");
const clearChatBtn = document.getElementById("clearChatBtn");
const saveArchiveBtn = document.getElementById("saveArchiveBtn");
const archiveSelect = document.getElementById("archiveSelect");
const pipelineBadge = document.getElementById("pipelineBadge");
const agentStatusList = document.getElementById("agentStatusList");
const phaseTimeline = document.getElementById("phaseTimeline");
const mcpSendBtn = document.getElementById("mcpSendBtn");
const mcpHint = document.getElementById("mcpHint");
const toastContainer = document.getElementById("toastContainer");

// KB DOM refs
const kbToggle = document.getElementById("kbToggle");
const kbPanel = document.getElementById("kbPanel");
const kbGlobalList = document.getElementById("kbGlobalList");
const kbMarketList = document.getElementById("kbMarketList");
const kbMarketLabel = document.getElementById("kbMarketLabel");
const kbUploadGlobal = document.getElementById("kbUploadGlobal");
const kbUploadMarket = document.getElementById("kbUploadMarket");
const kbFileInput = document.getElementById("kbFileInput");
const kbViewOverlay = document.getElementById("kbViewOverlay");
const kbViewFilename = document.getElementById("kbViewFilename");
const kbViewContent = document.getElementById("kbViewContent");
const kbViewClose = document.getElementById("kbViewClose");
const kbConfirmOverlay = document.getElementById("kbConfirmOverlay");
const kbConfirmFilename = document.getElementById("kbConfirmFilename");
const kbConfirmCancel = document.getElementById("kbConfirmCancel");
const kbConfirmDelete = document.getElementById("kbConfirmDelete");

// =========================================================================
// Markdown setup
// =========================================================================

marked.setOptions({ breaks: false, gfm: true });

// =========================================================================
// Helpers
// =========================================================================

function getCurrentPhase() {
  let maxPhase = 1;
  for (const presenter of completedPresenters) {
    const p = PHASE_AFTER_PRESENTER[presenter];
    if (p && p > maxPhase) maxPhase = p;
  }
  return maxPhase;
}

const DOWNLOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function scrollToBottom() {
  const container = document.getElementById("conversation");
  requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-out");
    toast.addEventListener("animationend", () => toast.remove());
  }, 3000);
}

const isArtifactNoise = (text) => {
  const lower = text.toLowerCase();
  return lower.includes("saved marketing_brief") || lower.includes("saved creative_package") ||
    lower.includes("saved generation_manifest") || lower.includes("saved full_campaign_manifest") ||
    lower.includes("saved variation_output") || lower.includes("saved as") ||
    lower.includes("downloadable artifact") || lower.includes("_artifact");
};

// =========================================================================
// Session
// =========================================================================

let sessionPromise = null;

async function createSession() {
  const market = marketSelect.value;
  const resp = await fetch(`${API_BASE}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ market }),
  });
  if (!resp.ok) throw new Error("Session creation failed");
  const data = await resp.json();
  sessionId = data.session_id;
  marketSelect.disabled = true;
}

// Eagerly pre-create session so first send has zero wait
function ensureSession() {
  if (sessionId) return Promise.resolve();
  if (!sessionPromise) sessionPromise = createSession().catch(() => { sessionPromise = null; });
  return sessionPromise;
}

// Pre-create on load
ensureSession();

// =========================================================================
// Event listeners
// =========================================================================

sendBtn.addEventListener("click", handleSend);
inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
});

errorRestart.addEventListener("click", () => {
  sessionId = null;
  marketSelect.disabled = false;
  window.location.reload();
});

attachBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (file.size > 50 * 1024 * 1024) {
    alert(`File is ${(file.size / (1024 * 1024)).toFixed(1)} MB, exceeds 50 MB limit.`);
    fileInput.value = "";
    return;
  }
  pendingFile = file;
  filePreviewName.textContent = file.name;
  filePreview.hidden = false;
});

filePreviewRemove.addEventListener("click", () => {
  pendingFile = null;
  fileInput.value = "";
  filePreview.hidden = true;
});

clearChatBtn.addEventListener("click", () => {
  sessionId = null;
  sessionPromise = null;
  completedPresenters.clear();
  currentMessages = [];
  lastManifestData = null;
  marketSelect.disabled = false;
  firstMessageSent = false;
  conversationEl.innerHTML = "";
  conversationEl.appendChild(emptyState);
  emptyState.style.display = "";
  resetPhaseTimeline();
  updatePipelineBadge("Ready");
  resetAgentList();
  mcpSendBtn.disabled = true;
  mcpHint.textContent = "Complete the pipeline to send manifests to Creative Generator.";
  inputField.placeholder = "Create a new campaign or adapt from an existing asset.";
  showToast("Chat cleared");
});

// =========================================================================
// Send message
// =========================================================================

async function handleSend() {
  if (isProcessing) return;
  const text = inputField.value.trim();
  const hasFile = pendingFile !== null;
  if (!text && !hasFile) return;

  // Show UI feedback immediately — don't wait for session
  if (!firstMessageSent) {
    firstMessageSent = true;
    inputField.placeholder = "";
    if (emptyState) emptyState.style.display = "none";
  }

  const displayText = hasFile
    ? (text ? `${text}\n[Attached: ${pendingFile.name}]` : `[Attached: ${pendingFile.name}]`)
    : text;
  appendUserMessage(displayText);
  currentMessages.push({ type: "user", text: displayText });

  const currentPhase = getCurrentPhase();
  const phaseLabel = PHASE_LABELS[currentPhase] || "Processing...";
  const indicatorEl = appendPhaseIndicator(phaseLabel);
  startSubStepCycler(indicatorEl, phaseLabel);

  updatePipelineBadge("Running", "active");
  setInputDisabled(true);
  inputField.value = "";

  const fileToSend = pendingFile;
  pendingFile = null;
  fileInput.value = "";
  filePreview.hidden = true;

  // Ensure session exists (usually pre-created, so instant)
  try { await ensureSession(); }
  catch (err) { console.error("Session failed:", err); showError(); return; }

  try {
    if (fileToSend) {
      await sendWithUpload(fileToSend, text, indicatorEl);
    } else {
      const streamed = await sendWithStream(text, indicatorEl);
      if (!streamed) {
        const resp = await fetch(`${API_BASE}/api/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, message: text }),
        });
        if (!resp.ok) throw new Error(`Run failed: ${resp.status}`);
        completeAndFadeIndicator(indicatorEl);
        await processEventsBlocking(await resp.json());
      }
    }

    setInputDisabled(false);
    inputField.focus();
    updatePipelineBadge(getCurrentPhase() >= 5 ? "Complete" : "Waiting", getCurrentPhase() >= 5 ? "done" : "");
  } catch (err) {
    console.error("Pipeline error:", err);
    showError();
  }
}

// =========================================================================
// SSE streaming
// =========================================================================

async function sendWithStream(text, phaseIndicatorEl) {
  const response = await fetch(`${API_BASE}/api/run/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message: text }),
  });
  if (!response.ok) return false;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hasRendered = false;
  const pendingDownloads = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;

      let event;
      try { event = JSON.parse(jsonStr); } catch { continue; }
      const author = event.author || "";

      // Update phase indicator and agent status
      const authorLabel = AUTHOR_PHASE_LABEL[author];
      if (authorLabel) {
        updateAgentStatus(author, "active");
        if (!hasRendered) {
          const labelEl = phaseIndicatorEl.querySelector(".phase-label");
          if (labelEl && authorLabel !== labelEl.textContent) {
            updatePhaseLabel(phaseIndicatorEl, authorLabel);
            startSubStepCycler(phaseIndicatorEl, authorLabel);
          }
        }
      }

      // Update right sidebar phase timeline
      updatePhaseTimelineFromAuthor(author);

      if (!RENDER_AUTHORS.has(author)) continue;
      completedPresenters.add(author);

      const parts = event.content?.parts || [];
      for (const part of parts) {
        if (!part.text) continue;
        const t = part.text.trim();
        if (!t || isArtifactNoise(t)) continue;
        if (!hasRendered && PHASE_COMPLETE_AUTHORS.has(author)) {
          completeAndFadeIndicator(phaseIndicatorEl);
          hasRendered = true;
        }
        await appendPipelineMessage(t);
        currentMessages.push({ type: "pipeline", author, text: t });
      }

      for (const part of parts) {
        if (!part.functionCall) continue;
        const fnName = part.functionCall.name || "";
        collectDownload(fnName, pendingDownloads);
      }
    }
  }

  appendDownloadButtons(pendingDownloads);
  if (!hasRendered) {
    stopSubStepCycler(phaseIndicatorEl);
    phaseIndicatorEl.classList.add("stalled");
    const label = phaseIndicatorEl.querySelector(".phase-label");
    if (label) label.textContent = "No response received -- the pipeline may have stalled";
  }
  return true;
}

async function sendWithUpload(file, text, phaseIndicatorEl) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("message", text || "");
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/run/upload`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hasRendered = false;
  const pendingDownloads = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;

      let event;
      try { event = JSON.parse(jsonStr); } catch { continue; }
      const author = event.author || "";

      const authorLabel = AUTHOR_PHASE_LABEL[author];
      if (authorLabel) {
        updateAgentStatus(author, "active");
        if (!hasRendered) {
          const labelEl = phaseIndicatorEl.querySelector(".phase-label");
          if (labelEl && authorLabel !== labelEl.textContent) {
            updatePhaseLabel(phaseIndicatorEl, authorLabel);
            startSubStepCycler(phaseIndicatorEl, authorLabel);
          }
        }
      }

      updatePhaseTimelineFromAuthor(author);

      if (!RENDER_AUTHORS.has(author)) continue;
      completedPresenters.add(author);

      const parts = event.content?.parts || [];
      for (const part of parts) {
        if (!part.text) continue;
        const t = part.text.trim();
        if (!t || isArtifactNoise(t)) continue;
        if (!hasRendered && PHASE_COMPLETE_AUTHORS.has(author)) {
          completeAndFadeIndicator(phaseIndicatorEl);
          hasRendered = true;
        }
        await appendPipelineMessage(t);
        currentMessages.push({ type: "pipeline", author, text: t });
      }

      for (const part of parts) {
        if (!part.functionCall) continue;
        collectDownload(part.functionCall.name || "", pendingDownloads);
      }
    }
  }

  appendDownloadButtons(pendingDownloads);
  if (!hasRendered) {
    stopSubStepCycler(phaseIndicatorEl);
    phaseIndicatorEl.classList.add("stalled");
    const label = phaseIndicatorEl.querySelector(".phase-label");
    if (label) label.textContent = "No response received -- the pipeline may have stalled";
  }
  return true;
}

// =========================================================================
// Download collection helper
// =========================================================================

function collectDownload(fnName, pendingDownloads) {
  if (fnName === "save_marketing_brief_artifact") {
    pendingDownloads.push({ href: `${API_BASE}/api/brief`, artifact: "marketing_brief.json", filename: "marketing_brief.md", label: "Download marketing brief" });
  }
  if (fnName === "save_creative_package_artifact") {
    pendingDownloads.push({ href: `${API_BASE}/api/creative-package`, artifact: "creative_package.md", filename: "creative_package.md", label: "Download creative package" });
  }
  if (fnName === "save_generation_manifest_artifact") {
    pendingDownloads.push({ href: `${API_BASE}/api/manifest`, artifact: "generation_manifest.json", filename: "generation_manifest.json", label: "Download generation manifest" });
    enableMcpBridge();
  }
  if (fnName === "save_variation_artifact") {
    pendingDownloads.push({ href: `${API_BASE}/api/creative-package`, artifact: "creative_package.md", filename: "creative_package.md", label: "Download creative package" });
    pendingDownloads.push({ href: `${API_BASE}/api/manifest`, artifact: "generation_manifest.json", filename: "generation_manifest.json", label: "Download generation manifest" });
    enableMcpBridge();
  }
  if (fnName === "save_full_campaign_manifest_artifact") {
    pendingDownloads.push({ href: `${API_BASE}/api/full-campaign-manifest`, artifact: "full_campaign_manifest.json", filename: "full_campaign_manifest.json", label: "Download full campaign manifest" });
    enableMcpBridge();
  }
}

// =========================================================================
// Blocking event processing (fallback)
// =========================================================================

async function processEventsBlocking(events) {
  if (!Array.isArray(events)) return;
  const pendingDownloads = [];
  for (const event of events) {
    const author = event.author || "";
    if (!RENDER_AUTHORS.has(author)) continue;
    completedPresenters.add(author);
    const parts = event.content?.parts || [];
    for (const part of parts) {
      if (part.text) {
        const t = part.text.trim();
        if (!t || isArtifactNoise(t)) continue;
        await appendPipelineMessage(t);
        currentMessages.push({ type: "pipeline", author, text: t });
      }
      if (part.functionCall) collectDownload(part.functionCall.name || "", pendingDownloads);
    }
  }
  appendDownloadButtons(pendingDownloads);
  scrollToBottom();
}

// =========================================================================
// DOM helpers
// =========================================================================

function appendUserMessage(text) {
  const div = document.createElement("div");
  div.className = "msg msg-user";
  const p = document.createElement("p");
  p.textContent = text;
  div.appendChild(p);
  conversationEl.appendChild(div);
  scrollToBottom();
}

async function appendPipelineMessage(markdownText) {
  const div = document.createElement("div");
  div.className = "msg msg-pipeline";
  conversationEl.appendChild(div);
  scrollToBottom();

  const tokens = markdownText.split(/(\s+)/);
  let accumulated = "";
  for (const token of tokens) {
    accumulated += token;
    div.innerHTML = marked.parse(accumulated);
    scrollToBottom();
    if (token.trim()) await sleep(TYPING_SPEED_MS);
  }
  div.innerHTML = marked.parse(markdownText);
  scrollToBottom();
}

function appendPhaseIndicator(label, completed = false) {
  const div = document.createElement("div");
  div.className = "phase-indicator" + (completed ? " completed" : "");
  div.innerHTML = `<div class="phase-dot"></div><span class="phase-label">${escapeHtml(label)}</span>`;
  conversationEl.appendChild(div);
  scrollToBottom();
  return div;
}

function completeAndFadeIndicator(el) {
  stopSubStepCycler(el);
  el.classList.add("completed");
  setTimeout(() => {
    el.classList.add("fading");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, 1500);
}

function appendDownloadButtons(downloads) {
  if (!downloads.length) return;
  const seen = new Set();
  const row = document.createElement("div");
  row.className = "download-row";
  for (const dl of downloads) {
    const key = dl.href + dl.filename;
    if (seen.has(key)) continue;
    seen.add(key);
    const btn = document.createElement("button");
    btn.className = "download-btn";
    btn.innerHTML = DOWNLOAD_ICON + " " + escapeHtml(dl.label);
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.style.opacity = "0.6";
      try {
        // Try file endpoint first
        let resp = await fetch(dl.href);
        // If file endpoint fails, try ADK artifact
        if (!resp.ok && dl.artifact && sessionId) {
          resp = await fetch(`${API_BASE}/api/artifact/${sessionId}/${dl.artifact}`);
        }
        if (!resp.ok) { alert("File not available yet. The pipeline may still be writing it."); return; }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = dl.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Download error:", err);
        alert("Download failed.");
      } finally {
        btn.disabled = false;
        btn.style.opacity = "";
      }
    });
    row.appendChild(btn);
  }
  conversationEl.appendChild(row);
  scrollToBottom();
}

function setInputDisabled(disabled) {
  isProcessing = disabled;
  inputBar.classList.toggle("disabled", disabled);
}

function showError() { errorOverlay.hidden = false; }

// =========================================================================
// Sub-step cycler
// =========================================================================

function startSubStepCycler(phaseIndicatorEl, firstLabel) {
  stopSubStepCycler();
  const steps = PHASE_SUB_STEPS[firstLabel];
  if (!steps || !steps.length) return;
  let index = 0;
  const initialTimer = setTimeout(() => {
    updatePhaseLabel(phaseIndicatorEl, steps[index]);
    activeSubStepCycler = setInterval(() => {
      index = (index + 1) % steps.length;
      updatePhaseLabel(phaseIndicatorEl, steps[index]);
    }, SUB_STEP_INTERVAL_MS);
  }, SUB_STEP_INITIAL_DELAY_MS);
  phaseIndicatorEl._cyclerInitial = initialTimer;
}

function stopSubStepCycler(phaseIndicatorEl) {
  if (activeSubStepCycler !== null) { clearInterval(activeSubStepCycler); activeSubStepCycler = null; }
  if (phaseIndicatorEl && phaseIndicatorEl._cyclerInitial != null) {
    clearTimeout(phaseIndicatorEl._cyclerInitial);
    phaseIndicatorEl._cyclerInitial = null;
  }
}

function updatePhaseLabel(phaseIndicatorEl, newLabel) {
  const labelEl = phaseIndicatorEl.querySelector(".phase-label");
  if (!labelEl || labelEl.textContent === newLabel) return;
  labelEl.classList.add("phase-label-out");
  setTimeout(() => { labelEl.textContent = newLabel; labelEl.classList.remove("phase-label-out"); }, 250);
}

// =========================================================================
// UI state updates
// =========================================================================

function updatePipelineBadge(text, cls = "") {
  pipelineBadge.textContent = text;
  pipelineBadge.className = "pipeline-badge" + (cls ? " " + cls : "");
}

let activeAgentName = null;
let doneAgents = new Set();

function renderAgentList() {
  agentStatusList.innerHTML = "";
  for (const agent of ALL_AGENTS) {
    const item = document.createElement("div");
    item.className = "agent-status-item";
    item.id = "agent-" + agent;
    let dotClass = "agent-dot-idle";
    if (agent === activeAgentName) dotClass = "agent-dot-active";
    else if (doneAgents.has(agent)) dotClass = "agent-dot-done";
    item.innerHTML = `<span class="agent-dot ${dotClass}"></span><span class="agent-name">${escapeHtml(AGENT_DISPLAY_NAMES[agent])}</span>`;
    agentStatusList.appendChild(item);
  }
  // Scroll active agent into view
  if (activeAgentName) {
    const el = document.getElementById("agent-" + activeAgentName);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function updateAgentStatus(name, state) {
  if (state === "active") {
    if (activeAgentName && activeAgentName !== name) doneAgents.add(activeAgentName);
    activeAgentName = name;
  } else if (state === "idle") {
    activeAgentName = null;
    doneAgents.clear();
  }
  renderAgentList();
}

function resetAgentList() {
  activeAgentName = null;
  doneAgents.clear();
  renderAgentList();
}

// Phase timeline mapping: author → phase number
const AUTHOR_TO_PHASE = {};
Object.entries(AUTHOR_PHASE_LABEL).forEach(([author, label]) => {
  if (label.includes("market data") || label.includes("asset apart") || label.includes("audience")) AUTHOR_TO_PHASE[author] = 1;
  else if (label.includes("brief") || label.includes("adaptation plan") || label.includes("strategies")) AUTHOR_TO_PHASE[author] = 2;
  else if (label.includes("storyboard") || label.includes("variations") || label.includes("audience variations")) AUTHOR_TO_PHASE[author] = 3;
  else if (label.includes("generation prompts") || label.includes("lines up") || label.includes("results") || label.includes("full campaign")) AUTHOR_TO_PHASE[author] = 4;
});

function updatePhaseTimelineFromAuthor(author) {
  const phase = AUTHOR_TO_PHASE[author];
  if (!phase) return;
  const steps = phaseTimeline.querySelectorAll(".phase-step");
  steps.forEach(step => {
    const p = parseInt(step.dataset.phase);
    if (p < phase) { step.classList.add("completed"); step.classList.remove("active"); }
    else if (p === phase) { step.classList.add("active"); step.classList.remove("completed"); }
    else { step.classList.remove("active", "completed"); }
  });
}

function resetPhaseTimeline() {
  phaseTimeline.querySelectorAll(".phase-step").forEach(s => s.classList.remove("active", "completed"));
}

// =========================================================================
// Chat Archive (Firestore)
// =========================================================================

saveArchiveBtn.addEventListener("click", async () => {
  if (!currentMessages.length) { showToast("Nothing to save"); return; }
  const market = marketSelect.value;
  const name = `${MARKET_NAMES[market]} - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
  try {
    await db.collection("chat_archives_v2").add({
      market,
      name,
      messages: currentMessages,
      savedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    showToast("Chat saved to archive");
    loadArchiveList();
  } catch (err) {
    console.error("Archive save error:", err);
    showToast("Failed to save archive");
  }
});

archiveSelect.addEventListener("change", async () => {
  const docId = archiveSelect.value;
  if (!docId) return;
  try {
    const doc = await db.collection("chat_archives_v2").doc(docId).get();
    if (!doc.exists) { showToast("Archive not found"); return; }
    const data = doc.data();
    // Reset UI
    sessionId = null;
    completedPresenters.clear();
    lastManifestData = null;
    currentMessages = data.messages || [];
    conversationEl.innerHTML = "";
    if (emptyState) emptyState.style.display = "none";

    // Render messages
    for (const msg of currentMessages) {
      if (msg.type === "user") appendUserMessage(msg.text);
      else {
        const div = document.createElement("div");
        div.className = "msg msg-pipeline";
        div.innerHTML = marked.parse(msg.text);
        conversationEl.appendChild(div);
      }
    }
    scrollToBottom();
    showToast("Archive loaded");
  } catch (err) {
    console.error("Archive load error:", err);
    showToast("Failed to load archive");
  }
  archiveSelect.value = "";
});

async function loadArchiveList() {
  const market = marketSelect.value;
  try {
    const snap = await db.collection("chat_archives_v2")
      .where("market", "==", market)
      .orderBy("savedAt", "desc")
      .limit(20)
      .get();
    archiveSelect.innerHTML = '<option value="">Load Archive...</option>';
    snap.forEach(doc => {
      const opt = document.createElement("option");
      opt.value = doc.id;
      opt.textContent = doc.data().name || doc.id;
      archiveSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Archive list error:", err);
  }
}

marketSelect.addEventListener("change", () => {
  // Reset session for new market and pre-create eagerly
  if (!marketSelect.disabled) {
    sessionId = null;
    sessionPromise = null;
    ensureSession();
  }
  loadArchiveList();
});

// Initial load
loadArchiveList();
renderAgentList();

// =========================================================================
// MCP Bridge
// =========================================================================

function enableMcpBridge() {
  mcpSendBtn.disabled = false;
  mcpHint.textContent = "Manifest ready. Click to send to Creative Generator.";
}

mcpSendBtn.addEventListener("click", async () => {
  const market = marketSelect.value;
  mcpSendBtn.disabled = true;
  mcpHint.textContent = "Sending...";
  try {
    // Fetch manifest
    let manifestResp = await fetch(`${API_BASE}/api/full-campaign-manifest`);
    if (!manifestResp.ok) manifestResp = await fetch(`${API_BASE}/api/manifest`);
    if (!manifestResp.ok) { showToast("No manifest available"); mcpSendBtn.disabled = false; return; }
    const manifestData = await manifestResp.json();

    // Fetch creative package (optional — don't block if unavailable)
    let creativePackage = null;
    try {
      const cpResp = await fetch(`${API_BASE}/api/creative-package`);
      if (cpResp.ok) creativePackage = await cpResp.text();
    } catch {}

    // Store both in Firestore transfer doc
    const transferDoc = await db.collection("prompt_transfers_v2").add({
      market,
      manifest: manifestData,
      creativePackage: creativePackage,
      jobCount: manifestData.jobs?.length || 0,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Open Creative Generator with transfer doc ID
    const url = `/creative-generator-v2/?transfer=${transferDoc.id}&market=${market}`;
    window.open(url, "_blank");
    showToast("Manifest + creative package sent to Creative Generator");
    mcpHint.textContent = "Transfer sent. Click again to resend.";
    mcpSendBtn.disabled = false;
  } catch (err) {
    console.error("MCP bridge error:", err);
    showToast("Failed to send to generator");
    mcpSendBtn.disabled = false;
    mcpHint.textContent = "Transfer failed. Try again.";
  }
});

// =========================================================================
// KB panel (same logic as ADK demo)
// =========================================================================

let kbCurrentMarket = "kr";
let kbPendingScope = null;
let kbConfirmPending = null;

kbToggle.addEventListener("click", () => {
  const opening = kbPanel.hidden;
  kbPanel.hidden = !opening;
  kbToggle.setAttribute("aria-expanded", String(opening));
  if (opening) loadKbFiles();
});

marketSelect.addEventListener("change", () => {
  kbCurrentMarket = marketSelect.value;
  if (kbMarketLabel) kbMarketLabel.textContent = MARKET_NAMES[kbCurrentMarket] || kbCurrentMarket;
  if (kbUploadMarket) kbUploadMarket.dataset.scope = kbCurrentMarket;
  if (!kbPanel.hidden) loadKbFiles();
});

async function loadKbFiles() {
  const market = marketSelect.value;
  kbCurrentMarket = market;
  kbGlobalList.innerHTML = '<li class="kb-file-loading">Loading...</li>';
  kbMarketList.innerHTML = '<li class="kb-file-loading">Loading...</li>';

  try {
    const resp = await fetch(`${API_BASE}/api/kb?market=${encodeURIComponent(market)}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    renderFileList(kbGlobalList, "global", data.global || []);
    renderFileList(kbMarketList, market, data.market || []);
    if (kbMarketLabel) kbMarketLabel.textContent = MARKET_NAMES[market] || market;
    if (kbUploadMarket) kbUploadMarket.dataset.scope = market;
  } catch (err) {
    console.error("KB load error:", err);
    kbGlobalList.innerHTML = '<li class="kb-file-error">Failed to load</li>';
    kbMarketList.innerHTML = '<li class="kb-file-error">Failed to load</li>';
  }
}

function renderFileList(listEl, scope, filenames) {
  listEl.innerHTML = "";
  if (!filenames.length) { listEl.innerHTML = '<li class="kb-file-empty">No files</li>'; return; }
  for (const filename of filenames) {
    const li = document.createElement("li");
    li.className = "kb-file-item";
    const nameBtn = document.createElement("button");
    nameBtn.className = "kb-file-name";
    nameBtn.textContent = filename;
    nameBtn.title = filename;
    nameBtn.addEventListener("click", () => openFileView(scope, filename));
    const delBtn = document.createElement("button");
    delBtn.className = "kb-delete-btn";
    delBtn.title = "Delete";
    delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    delBtn.addEventListener("click", () => handleKbDelete(scope, filename));
    li.appendChild(nameBtn);
    li.appendChild(delBtn);
    listEl.appendChild(li);
  }
}

async function openFileView(scope, filename) {
  kbViewFilename.textContent = filename;
  kbViewContent.textContent = "Loading...";
  kbViewOverlay.hidden = false;
  try {
    const resp = await fetch(`${API_BASE}/api/kb/file?scope=${encodeURIComponent(scope)}&filename=${encodeURIComponent(filename)}`);
    if (!resp.ok) throw new Error();
    kbViewContent.textContent = await resp.text();
  } catch { kbViewContent.textContent = "Failed to load file."; }
}

kbViewClose.addEventListener("click", () => { kbViewOverlay.hidden = true; });
kbViewOverlay.addEventListener("click", (e) => { if (e.target === kbViewOverlay) kbViewOverlay.hidden = true; });

kbUploadGlobal.addEventListener("click", () => handleKbUpload("global"));
kbUploadMarket.addEventListener("click", () => handleKbUpload(kbCurrentMarket));

async function handleKbUpload(scope) {
  kbPendingScope = scope;
  kbFileInput.value = "";
  kbFileInput.click();
}

kbFileInput.addEventListener("change", async () => {
  const file = kbFileInput.files[0];
  if (!file || !kbPendingScope) return;
  const formData = new FormData();
  formData.append("scope", kbPendingScope);
  formData.append("file", file);
  kbPendingScope = null;
  try {
    const resp = await fetch(`${API_BASE}/api/kb/upload`, { method: "POST", body: formData });
    if (!resp.ok) { const b = await resp.json().catch(() => ({})); alert(b.detail || "Upload failed."); return; }
    await loadKbFiles();
    showToast("File uploaded");
  } catch (err) { console.error("KB upload error:", err); alert("Upload failed."); }
});

async function handleKbDelete(scope, filename) {
  const confirmed = await confirmDelete(filename);
  if (!confirmed) return;
  try {
    const resp = await fetch(`${API_BASE}/api/kb/file`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, filename }),
    });
    if (!resp.ok) { const b = await resp.json().catch(() => ({})); alert(b.detail || "Delete failed."); return; }
    await loadKbFiles();
    showToast("File deleted");
  } catch (err) { console.error("KB delete error:", err); alert("Delete failed."); }
}

function confirmDelete(filename) {
  return new Promise((resolve) => {
    kbConfirmPending = resolve;
    kbConfirmFilename.textContent = filename;
    kbConfirmOverlay.hidden = false;
  });
}

kbConfirmDelete.addEventListener("click", () => {
  kbConfirmOverlay.hidden = true;
  if (kbConfirmPending) { kbConfirmPending(true); kbConfirmPending = null; }
});

kbConfirmCancel.addEventListener("click", () => {
  kbConfirmOverlay.hidden = true;
  if (kbConfirmPending) { kbConfirmPending(false); kbConfirmPending = null; }
});

kbConfirmOverlay.addEventListener("click", (e) => {
  if (e.target === kbConfirmOverlay) kbConfirmCancel.click();
});
