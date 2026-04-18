/**
 * Agent Collective - Demo UI Frontend
 * ========================================
 *
 * Manages the chat interface, sends messages to the backend (which proxies
 * to ADK), filters events by author, and renders only user-facing output.
 *
 * Uses Server-Sent Events (SSE) so the user sees progress in real time
 * instead of waiting several minutes for each phase to complete.
 *
 * Pipeline phases (mapped to user interactions):
 *   0 = waiting for first user input
 *   1 = discovery (KB analysis + concept generation)
 *   2 = brief (generation + quality check)
 *   3 = creative (storyboard development)
 *   4 = production (prompt engineering + quality check)
 *   5 = done
 */

// -------------------------------------------------------------------------
// State
// -------------------------------------------------------------------------

let sessionId = null;
let isProcessing = false;

// Typing animation speed in ms per word (lower = faster)
const TYPING_SPEED_MS = 18;

// Phase tracking: determined by which presenter agents we have seen
let completedPresenters = new Set();

// Authors we render (everything else is silently ignored)
// Includes both campaign creation presenters and adaptation presenters.
const RENDER_AUTHORS = new Set([
  // Campaign creation path
  "concept_presenter",
  "brief_presenter",
  "creative_presenter",
  "results_presenter",
  // Asset adaptation path
  "adapt_analysis_presenter",
  "adapt_strategy_presenter",
  "adapt_results_presenter",
  // Full Campaign (Create + Adapt) path
  "fc_analysis_presenter",
  "fc_strategy_presenter",
  "fc_results_presenter",
]);

// Subset of RENDER_AUTHORS whose first output should trigger the phase
// indicator to complete and fade. Progress reporters (e.g. variation_progress)
// render text but should NOT fade the indicator -- it should stay alive until
// the terminal presenter for that phase fires.
const PHASE_COMPLETE_AUTHORS = new Set([
  "concept_presenter",
  "brief_presenter",
  "creative_presenter",
  "results_presenter",
  "adapt_analysis_presenter",
  "adapt_strategy_presenter",
  "adapt_results_presenter",
  "fc_analysis_presenter",
  "fc_strategy_presenter",
  "fc_results_presenter",
]);

// Map each presenter to the phase that comes AFTER it completes.
// Before any presenter is seen, we are in phase 1 (discovery/analysis).
const PHASE_AFTER_PRESENTER = {
  // Campaign creation path
  "concept_presenter": 2,
  "brief_presenter": 3,
  "creative_presenter": 4,
  "results_presenter": 5,
  // Asset adaptation path
  "adapt_analysis_presenter": 2,
  "adapt_strategy_presenter": 3,
  "adapt_results_presenter": 5,
  // Full Campaign (Create + Adapt) path
  "fc_analysis_presenter": 5,
  "fc_strategy_presenter": 5,
  "fc_results_presenter": 5,
};

// Phase indicator labels shown while agents are working
const PHASE_LABELS = {
  1: "Analyzing...",
  2: "Generating...",
  3: "Developing creative concepts...",
  4: "Creating production prompts...",
  5: "Processing...",
};

// Maps every agent author to the label that should show while that phase runs.
// Used to correct the indicator in real time when the pipeline routes backward.
const AUTHOR_PHASE_LABEL = {
  // Campaign creation agents
  "kb_analyzer":            "Diving into the market data...",
  "concept_generator":      "Diving into the market data...",
  "concept_presenter":      "Diving into the market data...",
  "brief_generator":        "Pulling the brief together...",
  "brief_reviser":          "Pulling the brief together...",
  "brief_quality_loop":     "Pulling the brief together...",
  "brief_quality_checker":  "Pulling the brief together...",
  "brief_presenter":        "Pulling the brief together...",
  "creative_director":      "Dreaming up the storyboards...",
  "creative_presenter":     "Dreaming up the storyboards...",
  "creative_prompter":      "Writing the generation prompts...",
  "prompt_quality_loop":    "Writing the generation prompts...",
  "prompt_quality_checker": "Writing the generation prompts...",
  "results_presenter":      "Writing the generation prompts...",
  // Asset adaptation agents
  "adapt_preprocessor":           "Taking the asset apart...",
  "adapt_deconstructor":          "Taking the asset apart...",
  "adapt_audience_mapper":        "Understanding the audience...",
  "adapt_analysis_presenter":     "Understanding the audience...",
  "adapt_strategy_generator":     "Working out the adaptation plan...",
  "adapt_strategy_presenter":     "Working out the adaptation plan...",
  "adapt_variation_generator_0":  "Writing the variations...",
  "adapt_variation_generator_1":  "Writing the variations...",
  "adapt_variation_generator_2":  "Writing the variations...",
  "adapt_variation_generator_3":  "Writing the variations...",
  "adapt_consistency_checker":    "Checking everything lines up...",
  "adapt_variation_regenerator":  "Checking everything lines up...",
  "adapt_results_presenter":      "Preparing the results...",
  // Full Campaign (Create + Adapt) agents
  "fc_creative_bridge":           "Mapping your audiences...",
  "fc_kb_analyzer":               "Mapping your audiences...",
  "fc_audience_mapper":           "Mapping your audiences...",
  "fc_analysis_presenter":        "Mapping your audiences...",
  "fc_strategy_generator":        "Building audience strategies...",
  "fc_strategy_presenter":        "Building audience strategies...",
  "fc_variation_generator_0":     "Creating audience variations...",
  "fc_variation_generator_1":     "Creating audience variations...",
  "fc_variation_generator_2":     "Creating audience variations...",
  "fc_variation_generator_3":     "Creating audience variations...",
  "fc_consistency_checker":       "Checking everything lines up...",
  "fc_variation_regenerator":     "Checking everything lines up...",
  "fc_results_presenter":         "Preparing the full campaign...",
};

// Sub-messages that cycle after the first label fires for each phase.
// Keyed by the first label string so all agents in a phase share the same pool.
// These loop among themselves - the first label never comes back.
const PHASE_SUB_STEPS = {
  "Diving into the market data...":      ["Reading between the lines...", "Picking up the nuances...", "Connecting the dots..."],
  "Pulling the brief together...":       ["Thinking it through...", "Getting the words right...", "Almost there..."],
  "Dreaming up the storyboards...":      ["Picturing the scenes...", "Finding the angle...", "Building it out..."],
  "Writing the generation prompts...":   ["Getting specific...", "Adding the detail...", "Nearly ready..."],
  "Taking the asset apart...":           ["Looking at what's working...", "Finding the key bits...", "Getting the picture..."],
  "Understanding the audience...":       ["Thinking about who's watching...", "Mapping the segments...", "Finding the fit..."],
  "Working out the adaptation plan...":  ["Thinking through the options...", "Figuring out what changes...", "Lining things up..."],
  "Writing the variations...":           ["Tailoring each version...", "Getting the tone right...", "Working through the segments..."],
  "Checking everything lines up...":     ["Looking for inconsistencies...", "Running through the details...", "Almost done..."],
  "Preparing the results...":            ["Putting it all together...", "Nearly there...", "Won't be long..."],
  "Mapping your audiences...":           ["Looking at the creative...", "Identifying audience hooks...", "Matching insights to segments..."],
  "Building audience strategies...":     ["Finding each angle...", "Working out the creative shifts...", "Lining things up..."],
  "Creating audience variations...":     ["Tailoring each version...", "Getting the tone right...", "Working through the segments..."],
  "Preparing the full campaign...":      ["Pulling it all together...", "Nearly there...", "Won't be long..."],
};

// Timings for the sub-step cycler
const SUB_STEP_INITIAL_DELAY_MS = 5000;  // wait before first sub-message
const SUB_STEP_INTERVAL_MS      = 5000;  // interval between sub-messages

// Active cycler handle (only one phase indicator runs at a time)
let activeSubStepCycler = null;

/**
 * Determine the current phase based on which presenters have completed.
 * If no presenters have run yet, we are in phase 1 (discovery).
 */
function getCurrentPhase() {
  let maxPhase = 1;
  for (const presenter of completedPresenters) {
    const p = PHASE_AFTER_PRESENTER[presenter];
    if (p && p > maxPhase) maxPhase = p;
  }
  return maxPhase;
}

// Download icon SVG (reused across buttons)
const DOWNLOAD_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>`;

// -------------------------------------------------------------------------
// DOM references
// -------------------------------------------------------------------------

const conversationEl  = document.getElementById("conversationInner");
const inputBar        = document.getElementById("inputBar");
const inputField      = document.getElementById("inputField");
const sendBtn         = document.getElementById("sendBtn");
const errorOverlay    = document.getElementById("errorOverlay");
const errorRestart    = document.getElementById("errorRestart");
const attachBtn       = document.getElementById("attachBtn");
const fileInput       = document.getElementById("fileInput");
const filePreview     = document.getElementById("filePreview");
const filePreviewName = document.getElementById("filePreviewName");
const filePreviewRemove = document.getElementById("filePreviewRemove");
const marketSelect    = document.getElementById("marketSelect");

// Pending file for upload (set when user picks a file, cleared on send)
let pendingFile = null;

// Track whether the first message has been sent so the placeholder is hidden after that
let firstMessageSent = false;

// -------------------------------------------------------------------------
// Markdown setup
// -------------------------------------------------------------------------

marked.setOptions({ breaks: false, gfm: true });

// -------------------------------------------------------------------------
// Session creation (deferred to first send so market selection is captured)
// -------------------------------------------------------------------------

async function createSession() {
  const market = marketSelect ? marketSelect.value : "kr";
  const resp = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ market }),
  });
  if (!resp.ok) throw new Error("Session creation failed");
  const data = await resp.json();
  sessionId = data.session_id;
  // Lock the market dropdown for the life of this session
  if (marketSelect) marketSelect.disabled = true;
}

// -------------------------------------------------------------------------
// Event listeners
// -------------------------------------------------------------------------

sendBtn.addEventListener("click", handleSend);
inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

errorRestart.addEventListener("click", () => {
  // Reset session state and re-enable market selector before reloading
  sessionId = null;
  if (marketSelect) marketSelect.disabled = false;
  window.location.reload();
});

// File upload listeners
attachBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  // Check size client-side (50 MB)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    alert(`File is ${sizeMb} MB, which exceeds the 50 MB limit.`);
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

// -------------------------------------------------------------------------
// Send message
// -------------------------------------------------------------------------

async function handleSend() {
  if (isProcessing) return;

  const text = inputField.value.trim();
  const hasFile = pendingFile !== null;
  if (!text && !hasFile) return;

  // Create the session on the first send, capturing the market selection.
  // This also locks the market dropdown for the rest of the conversation.
  if (!sessionId) {
    try {
      await createSession();
    } catch (err) {
      console.error("Failed to create session:", err);
      showError();
      return;
    }
  }

  // Remove the placeholder permanently after the first message is sent
  if (!firstMessageSent) {
    firstMessageSent = true;
    inputField.placeholder = "";
  }

  // Render user message (show filename if attached)
  const displayText = hasFile
    ? (text ? `${text}\n[Attached: ${pendingFile.name}]` : `[Attached: ${pendingFile.name}]`)
    : text;
  appendUserMessage(displayText);

  // Show phase indicator based on which presenters have completed
  const currentPhase = getCurrentPhase();
  const phaseLabel = PHASE_LABELS[currentPhase] || "Processing...";
  const indicatorEl = appendPhaseIndicator(phaseLabel);
  startSubStepCycler(indicatorEl, phaseLabel);

  // Disable input while agents work
  setInputDisabled(true);
  inputField.value = "";

  // Capture and clear the pending file
  const fileToSend = pendingFile;
  pendingFile = null;
  fileInput.value = "";
  filePreview.hidden = true;

  try {
    let streamed;

    if (fileToSend) {
      // Upload path: send file + text via multipart form
      streamed = await sendWithUpload(fileToSend, text, indicatorEl);
    } else {
      // Text-only path: SSE streaming with JSON fallback
      streamed = await sendWithStream(text, indicatorEl);
      if (!streamed) {
        console.log("SSE not available, using blocking fallback");
        const resp = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, message: text }),
        });
        if (!resp.ok) throw new Error(`Run failed: ${resp.status}`);
        const events = await resp.json();
        completeAndFadeIndicator(indicatorEl);
        await processEventsBlocking(events);
      }
    }

    // Re-enable input (unless pipeline is done)
    setInputDisabled(false);
    inputField.focus();

  } catch (err) {
    console.error("Pipeline error:", err);
    showError();
  }
}

// -------------------------------------------------------------------------
// SSE streaming
// -------------------------------------------------------------------------

/**
 * Send a text message via SSE and render events as they arrive.
 * Returns true if streaming worked, false if the endpoint was
 * unavailable (so the caller can fall back to blocking).
 */
async function sendWithStream(text, phaseIndicatorEl) {
  const response = await fetch("/api/run/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message: text }),
  });

  if (!response.ok) {
    console.warn("SSE endpoint returned", response.status);
    return false;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hasRendered = false;

  // Collect artifact tool calls so we can add download buttons AFTER
  // the stream completes (the "latest" files are written by
  // after_agent_callback, which runs after the presenter finishes).
  const pendingDownloads = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE format: lines starting with "data:" separated by blank lines
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep last (possibly incomplete) line

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;

      let event;
      try {
        event = JSON.parse(jsonStr);
      } catch {
        continue;
      }

      const author = event.author || "";

      // Update the indicator label to reflect the phase that is actually
      // running. This corrects cases where the pipeline routes backward
      // (e.g. brief feedback after the creative phase has completed) and
      // getCurrentPhase() would otherwise return a stale forward phase.
      const authorLabel = AUTHOR_PHASE_LABEL[author];
      if (authorLabel && !hasRendered) {
        const labelEl = phaseIndicatorEl.querySelector(".phase-label");
        const currentLabel = labelEl ? labelEl.textContent : "";
        if (authorLabel !== currentLabel) {
          updatePhaseLabel(phaseIndicatorEl, authorLabel);
          startSubStepCycler(phaseIndicatorEl, authorLabel);
        }
      }

      if (!RENDER_AUTHORS.has(author)) continue;

      // Track which presenters have produced output
      completedPresenters.add(author);

      const parts = event.content?.parts || [];

      // Render text parts
      for (const part of parts) {
        if (!part.text) continue;
        const t = part.text.trim();
        if (!t) continue;

        // Skip artifact confirmation lines
        if (isArtifactNoise(t)) continue;

        // Mark the phase indicator as done when a terminal presenter fires.
        // The phase indicator stays alive until the final presenter for that phase arrives.
        if (!hasRendered && PHASE_COMPLETE_AUTHORS.has(author)) {
          completeAndFadeIndicator(phaseIndicatorEl);
          hasRendered = true;
        }

        await appendPipelineMessage(t);
      }

      // Queue artifact tool calls (rendered after stream completes)
      for (const part of parts) {
        if (!part.functionCall) continue;
        const fnName = part.functionCall.name || "";

        if (fnName === "save_marketing_brief_artifact") {
          pendingDownloads.push({
            href: "/api/brief",
            filename: "marketing_brief.md",
            label: "Download marketing brief",
          });
        }
        if (fnName === "save_creative_package_artifact") {
          pendingDownloads.push({
            href: "/api/creative-package",
            filename: "creative_package.md",
            label: "Download creative package",
          });
        }
        if (fnName === "save_generation_manifest_artifact") {
          pendingDownloads.push({
            href: "/api/manifest",
            filename: "generation_manifest.json",
            label: "Download generation manifest",
          });
        }
        if (fnName === "save_variation_artifact") {
          pendingDownloads.push({
            href: "/api/creative-package",
            filename: "creative_package.md",
            label: "Download creative package",
          });
          pendingDownloads.push({
            href: "/api/manifest",
            filename: "generation_manifest.json",
            label: "Download generation manifest",
          });
        }
        if (fnName === "save_full_campaign_manifest_artifact") {
          pendingDownloads.push({
            href: "/api/full-campaign-manifest",
            filename: "full_campaign_manifest.json",
            label: "Download full campaign manifest",
          });
        }
      }
    }
  }

  // Stream is done -- after_agent_callbacks have run, files exist.
  // Now render the download buttons.
  appendDownloadButtons(pendingDownloads);

  // If nothing renderable came through, show stalled warning
  if (!hasRendered) {
    stopSubStepCycler(phaseIndicatorEl);
    phaseIndicatorEl.classList.add("stalled");
    const label = phaseIndicatorEl.querySelector(".phase-label");
    if (label) label.textContent = "No response received — the pipeline may have stalled";
  }

  return true;
}

// -------------------------------------------------------------------------
// File upload streaming
// -------------------------------------------------------------------------

/**
 * Send a file + optional text message via multipart upload.
 * The backend streams SSE events back just like sendWithStream.
 */
async function sendWithUpload(file, text, phaseIndicatorEl) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("message", text || "");
  formData.append("file", file);

  const response = await fetch("/api/run/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Upload failed:", response.status, detail);
    throw new Error(`Upload failed: ${response.status}`);
  }

  // Process SSE stream (same logic as sendWithStream)
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
      if (authorLabel && !hasRendered) {
        const labelEl = phaseIndicatorEl.querySelector(".phase-label");
        const currentLabel = labelEl ? labelEl.textContent : "";
        if (authorLabel !== currentLabel) {
          updatePhaseLabel(phaseIndicatorEl, authorLabel);
          startSubStepCycler(phaseIndicatorEl, authorLabel);
        }
      }

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
      }

      for (const part of parts) {
        if (!part.functionCall) continue;
        const fnName = part.functionCall.name || "";
        if (fnName === "save_marketing_brief_artifact") {
          pendingDownloads.push({ href: "/api/brief", filename: "marketing_brief.md", label: "Download marketing brief" });
        }
        if (fnName === "save_creative_package_artifact") {
          pendingDownloads.push({ href: "/api/creative-package", filename: "creative_package.md", label: "Download creative package" });
        }
        if (fnName === "save_generation_manifest_artifact") {
          pendingDownloads.push({ href: "/api/manifest", filename: "generation_manifest.json", label: "Download generation manifest" });
        }
        if (fnName === "save_variation_artifact") {
          pendingDownloads.push({ href: "/api/creative-package", filename: "creative_package.md", label: "Download creative package" });
          pendingDownloads.push({ href: "/api/manifest", filename: "generation_manifest.json", label: "Download generation manifest" });
        }
        if (fnName === "save_full_campaign_manifest_artifact") {
          pendingDownloads.push({ href: "/api/full-campaign-manifest", filename: "full_campaign_manifest.json", label: "Download full campaign manifest" });
        }
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


// -------------------------------------------------------------------------
// Blocking event processing (fallback)
// -------------------------------------------------------------------------

async function processEventsBlocking(events) {
  if (!Array.isArray(events)) {
    console.warn("Unexpected events format:", events);
    return;
  }

  const pendingDownloads = [];

  for (const event of events) {
    const author = event.author || "";
    if (!RENDER_AUTHORS.has(author)) continue;

    // Track which presenters have produced output
    completedPresenters.add(author);

    const parts = event.content?.parts || [];

    for (const part of parts) {
      if (part.text) {
        const text = part.text.trim();
        if (!text || isArtifactNoise(text)) continue;
        await appendPipelineMessage(text);
      }

      if (part.functionCall) {
        const fnName = part.functionCall.name || "";
        if (fnName === "save_marketing_brief_artifact") {
          pendingDownloads.push({
            href: "/api/brief",
            filename: "marketing_brief.md",
            label: "Download marketing brief",
          });
        }
        if (fnName === "save_creative_package_artifact") {
          pendingDownloads.push({
            href: "/api/creative-package",
            filename: "creative_package.md",
            label: "Download creative package",
          });
        }
        if (fnName === "save_generation_manifest_artifact") {
          pendingDownloads.push({
            href: "/api/manifest",
            filename: "generation_manifest.json",
            label: "Download generation manifest",
          });
        }
        if (fnName === "save_variation_artifact") {
          pendingDownloads.push({
            href: "/api/creative-package",
            filename: "creative_package.md",
            label: "Download creative package",
          });
          pendingDownloads.push({
            href: "/api/manifest",
            filename: "generation_manifest.json",
            label: "Download generation manifest",
          });
        }
        if (fnName === "save_full_campaign_manifest_artifact") {
          pendingDownloads.push({
            href: "/api/full-campaign-manifest",
            filename: "full_campaign_manifest.json",
            label: "Download full campaign manifest",
          });
        }
      }
    }
  }

  // Blocking mode: callbacks have already run, so files exist.
  appendDownloadButtons(pendingDownloads);

  scrollToBottom();
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

/**
 * Check if a text line is artifact tool noise that should be hidden.
 */
const isArtifactNoise = (text) => {
  const lower = text.toLowerCase();
  return (
    lower.includes("saved marketing_brief") ||
    lower.includes("saved creative_package") ||
    lower.includes("saved generation_manifest") ||
    lower.includes("saved full_campaign_manifest") ||
    lower.includes("saved variation_output") ||
    lower.includes("saved as") ||
    lower.includes("downloadable artifact") ||
    lower.includes("_artifact")
  );
};

// -------------------------------------------------------------------------
// DOM helpers
// -------------------------------------------------------------------------

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

  // Word-by-word typing animation. Split on whitespace but keep
  // whitespace tokens so spacing and newlines are preserved exactly.
  const tokens = markdownText.split(/(\s+)/);
  let accumulated = "";

  for (const token of tokens) {
    accumulated += token;
    div.innerHTML = marked.parse(accumulated);
    scrollToBottom();
    if (token.trim()) {
      await sleep(TYPING_SPEED_MS);
    }
  }

  // Final render ensures the fully-parsed markdown is correct.
  div.innerHTML = marked.parse(markdownText);
  scrollToBottom();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  // Store both handles so we can cancel either
  phaseIndicatorEl._cyclerInitial = initialTimer;
}

function stopSubStepCycler(phaseIndicatorEl) {
  if (activeSubStepCycler !== null) {
    clearInterval(activeSubStepCycler);
    activeSubStepCycler = null;
  }
  if (phaseIndicatorEl && phaseIndicatorEl._cyclerInitial != null) {
    clearTimeout(phaseIndicatorEl._cyclerInitial);
    phaseIndicatorEl._cyclerInitial = null;
  }
}

function updatePhaseLabel(phaseIndicatorEl, newLabel) {
  const labelEl = phaseIndicatorEl.querySelector(".phase-label");
  if (!labelEl || labelEl.textContent === newLabel) return;
  labelEl.classList.add("phase-label-out");
  setTimeout(() => {
    labelEl.textContent = newLabel;
    labelEl.classList.remove("phase-label-out");
  }, 250);
}

function appendPhaseIndicator(label, completed = false) {
  const div = document.createElement("div");
  div.className = "phase-indicator" + (completed ? " completed" : "");
  div.innerHTML = `
    <div class="phase-dot"></div>
    <span class="phase-label">${escapeHtml(label)}</span>
  `;
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

function appendDownloadButton(href, filename, label) {
  const row = document.createElement("div");
  row.className = "download-row";

  const btn = document.createElement("a");
  btn.className = "download-btn";
  btn.href = href;
  btn.download = filename;
  btn.innerHTML = DOWNLOAD_ICON + " " + escapeHtml(label);
  row.appendChild(btn);

  conversationEl.appendChild(row);
  scrollToBottom();
}

function appendDownloadButtons(downloads) {
  if (!downloads.length) return;
  const row = document.createElement("div");
  row.className = "download-row";
  for (const dl of downloads) {
    const btn = document.createElement("a");
    btn.className = "download-btn";
    btn.href = dl.href;
    btn.download = dl.filename;
    btn.innerHTML = DOWNLOAD_ICON + " " + escapeHtml(dl.label);
    row.appendChild(btn);
  }
  conversationEl.appendChild(row);
  scrollToBottom();
}

function setInputDisabled(disabled) {
  isProcessing = disabled;
  if (disabled) {
    inputBar.classList.add("disabled");
  } else {
    inputBar.classList.remove("disabled");
  }
}

function showError() {
  errorOverlay.hidden = false;
}

function scrollToBottom() {
  const container = document.getElementById("conversation");
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}


// =========================================================================
// KB panel
// =========================================================================

// -------------------------------------------------------------------------
// State
// -------------------------------------------------------------------------

let kbPasscode = null;       // cached after first use; cleared on 403
let kbCurrentMarket = "kr";  // mirrors the market selector
let kbPendingScope = null;   // scope waiting for file picker selection

// Promise resolve callbacks for the two modals
let kbPasscodePending = null;
let kbConfirmPending  = null;

const MARKET_NAMES = { kr: "Korea", in: "India", jp: "Japan", id: "Indonesia" };

// -------------------------------------------------------------------------
// DOM refs
// -------------------------------------------------------------------------

const kbToggle         = document.getElementById("kbToggle");
const kbPanel          = document.getElementById("kbPanel");
const kbGlobalList     = document.getElementById("kbGlobalList");
const kbMarketList     = document.getElementById("kbMarketList");
const kbMarketLabel    = document.getElementById("kbMarketLabel");
const kbUploadGlobal   = document.getElementById("kbUploadGlobal");
const kbUploadMarket   = document.getElementById("kbUploadMarket");
const kbFileInput      = document.getElementById("kbFileInput");

const kbPasscodeOverlay = document.getElementById("kbPasscodeOverlay");
const kbPasscodeInput   = document.getElementById("kbPasscodeInput");
const kbPasscodeCancel  = document.getElementById("kbPasscodeCancel");
const kbPasscodeConfirm = document.getElementById("kbPasscodeConfirm");

const kbViewOverlay   = document.getElementById("kbViewOverlay");
const kbViewFilename  = document.getElementById("kbViewFilename");
const kbViewContent   = document.getElementById("kbViewContent");
const kbViewClose     = document.getElementById("kbViewClose");

const kbConfirmOverlay  = document.getElementById("kbConfirmOverlay");
const kbConfirmFilename = document.getElementById("kbConfirmFilename");
const kbConfirmCancel   = document.getElementById("kbConfirmCancel");
const kbConfirmDelete   = document.getElementById("kbConfirmDelete");

// -------------------------------------------------------------------------
// Toggle open / close
// -------------------------------------------------------------------------

kbToggle.addEventListener("click", () => {
  const opening = kbPanel.hidden;
  kbPanel.hidden = !opening;
  kbToggle.setAttribute("aria-expanded", String(opening));
  if (opening) loadKbFiles();
});

// Refresh market section when selector changes
marketSelect.addEventListener("change", () => {
  kbCurrentMarket = marketSelect.value;
  if (kbMarketLabel) kbMarketLabel.textContent = MARKET_NAMES[kbCurrentMarket] || kbCurrentMarket;
  if (kbUploadMarket) kbUploadMarket.dataset.scope = kbCurrentMarket;
  if (!kbPanel.hidden) loadKbFiles();
});

// -------------------------------------------------------------------------
// Load and render files
// -------------------------------------------------------------------------

async function loadKbFiles() {
  const market = marketSelect ? marketSelect.value : "kr";
  kbCurrentMarket = market;

  kbGlobalList.innerHTML = '<li class="kb-file-loading">Loading...</li>';
  kbMarketList.innerHTML = '<li class="kb-file-loading">Loading...</li>';

  try {
    const resp = await fetch(`/api/kb?market=${encodeURIComponent(market)}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    renderFileList(kbGlobalList, "global", data.global || []);
    renderFileList(kbMarketList, market, data.market || []);

    if (kbMarketLabel) kbMarketLabel.textContent = MARKET_NAMES[market] || market;
    if (kbUploadMarket) kbUploadMarket.dataset.scope = market;
  } catch (err) {
    console.error("Failed to load KB files:", err);
    kbGlobalList.innerHTML = '<li class="kb-file-error">Failed to load</li>';
    kbMarketList.innerHTML = '<li class="kb-file-error">Failed to load</li>';
  }
}

function renderFileList(listEl, scope, filenames) {
  listEl.innerHTML = "";
  if (!filenames.length) {
    listEl.innerHTML = '<li class="kb-file-empty">No files</li>';
    return;
  }
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
    delBtn.title = "Delete file";
    delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>`;
    delBtn.addEventListener("click", () => handleKbDelete(scope, filename));

    li.appendChild(nameBtn);
    li.appendChild(delBtn);
    listEl.appendChild(li);
  }
}

// -------------------------------------------------------------------------
// File view modal
// -------------------------------------------------------------------------

async function openFileView(scope, filename) {
  kbViewFilename.textContent = filename;
  kbViewContent.textContent = "Loading...";
  kbViewOverlay.hidden = false;

  try {
    const resp = await fetch(
      `/api/kb/file?scope=${encodeURIComponent(scope)}&filename=${encodeURIComponent(filename)}`
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    kbViewContent.textContent = await resp.text();
  } catch (err) {
    kbViewContent.textContent = "Failed to load file.";
  }
}

kbViewClose.addEventListener("click", () => { kbViewOverlay.hidden = true; });
kbViewOverlay.addEventListener("click", (e) => {
  if (e.target === kbViewOverlay) kbViewOverlay.hidden = true;
});

// -------------------------------------------------------------------------
// Upload
// -------------------------------------------------------------------------

kbUploadGlobal.addEventListener("click", () => handleKbUpload("global"));
kbUploadMarket.addEventListener("click", () => handleKbUpload(kbCurrentMarket));

async function handleKbUpload(scope) {
  const passcode = await requirePasscode();
  if (!passcode) return;
  kbPendingScope = scope;
  kbFileInput.value = "";
  kbFileInput.click();
}

kbFileInput.addEventListener("change", async () => {
  const file = kbFileInput.files[0];
  if (!file || !kbPendingScope) return;

  const formData = new FormData();
  formData.append("scope", kbPendingScope);
  formData.append("passcode", kbPasscode);
  formData.append("file", file);
  kbPendingScope = null;

  try {
    const resp = await fetch("/api/kb/upload", { method: "POST", body: formData });
    if (resp.status === 403) {
      kbPasscode = null;
      alert("Incorrect passcode.");
      return;
    }
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      alert(body.detail || "Upload failed.");
      return;
    }
    await loadKbFiles();
  } catch (err) {
    console.error("KB upload error:", err);
    alert("Upload failed. Please try again.");
  }
});

// -------------------------------------------------------------------------
// Delete
// -------------------------------------------------------------------------

async function handleKbDelete(scope, filename) {
  const passcode = await requirePasscode();
  if (!passcode) return;

  const confirmed = await confirmDelete(filename);
  if (!confirmed) return;

  try {
    const resp = await fetch("/api/kb/file", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, filename, passcode }),
    });
    if (resp.status === 403) {
      kbPasscode = null;
      alert("Incorrect passcode.");
      return;
    }
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      alert(body.detail || "Delete failed.");
      return;
    }
    await loadKbFiles();
  } catch (err) {
    console.error("KB delete error:", err);
    alert("Delete failed. Please try again.");
  }
}

// -------------------------------------------------------------------------
// Passcode modal (promise-based)
// -------------------------------------------------------------------------

function requirePasscode() {
  if (kbPasscode !== null) return Promise.resolve(kbPasscode);
  return new Promise((resolve) => {
    kbPasscodePending = resolve;
    kbPasscodeInput.value = "";
    kbPasscodeOverlay.hidden = false;
    kbPasscodeInput.focus();
  });
}

kbPasscodeConfirm.addEventListener("click", () => {
  const value = kbPasscodeInput.value;
  if (!value) return;
  kbPasscode = value;
  kbPasscodeOverlay.hidden = true;
  if (kbPasscodePending) { kbPasscodePending(kbPasscode); kbPasscodePending = null; }
});

kbPasscodeCancel.addEventListener("click", () => {
  kbPasscodeOverlay.hidden = true;
  if (kbPasscodePending) { kbPasscodePending(null); kbPasscodePending = null; }
});

kbPasscodeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") kbPasscodeConfirm.click();
  if (e.key === "Escape") kbPasscodeCancel.click();
});

// -------------------------------------------------------------------------
// Delete confirm modal (promise-based)
// -------------------------------------------------------------------------

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
