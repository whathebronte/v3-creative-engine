# MCP Bridge Receiver — Integration Spec for Creative Generator V2

## Overview

Agent Collective V2 sends a **generation manifest** (structured jobs with prompts) and a **creative package** (full storyboard context in markdown) to Creative Generator via Firestore. Creative Generator V2 needs to receive this transfer, display a job queue, and make the creative package available as context.

---

## 1. How the Transfer Arrives

Agent Collective V2 writes a document to `prompt_transfers_v2` in Firestore, then opens Creative Generator V2 with URL params:

```
/creative-generator-v2/?transfer={docId}&market={market}
```

### Firestore Document Structure (`prompt_transfers_v2/{docId}`)

```json
{
  "market": "kr",
  "manifest": {
    "jobs": [
      {
        "deliverable_id": "D1-YT_Shorts_15s",
        "scene_id": "scene_01",
        "prompt": "A vibrant Korean street food market at night, neon lights reflecting...",
        "aspect_ratio": "9:16",
        "style": "photorealistic",
        "negative_prompt": "text, watermark, blurry..."
      },
      {
        "deliverable_id": "D1-YT_Shorts_15s",
        "scene_id": "scene_02",
        "prompt": "Close-up of sizzling tteokbokki in a street vendor's pan..."
      }
    ]
  },
  "creativePackage": "# Creative Package\n\n**Brief ID:** KB-001\n**Market:** Korea\n\n---\n\n## D1 - Street Food Discovery\n\n**Format:** YouTube Shorts (15s)\n\n### Concept\nA fast-paced visual journey through...\n\n### Hook\nOpen with an extreme close-up of...\n\n### Audio Direction\nUpbeat K-pop instrumental...\n\n### Scene 1\n...",
  "jobCount": 8,
  "timestamp": "2026-04-10T..."
}
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `manifest.jobs` | Array | Each job has a `prompt`, optional `deliverable_id`, `scene_id`, `aspect_ratio`, `style`, `negative_prompt` |
| `creativePackage` | String (markdown) | Full creative context — concepts, hooks, audio direction, visual composition, scene breakdowns |
| `market` | String | Market code: `kr`, `in`, `jp`, `id` |
| `jobCount` | Number | Count of jobs for display |

---

## 2. Firebase Configuration

Creative Generator V2 must initialize Firebase with the same project:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBwtQBAZ_IewB2TYCkew3ctzB4HMs9Gyn0",
  authDomain: "v3-creative-engine.firebaseapp.com",
  projectId: "v3-creative-engine",
  storageBucket: "v3-creative-engine.firebasestorage.app",
  messagingSenderId: "964100659393",
  appId: "1:964100659393:web:bc6aa41fce9a8770d55c40"
};
```

Use `firebase/firestore` (modular SDK) or `firebase-firestore-compat` — whichever the V2 build uses.

---

## 3. Receiver Logic (Pseudocode / Reference Implementation)

### On App Load

```javascript
// Check URL params on mount
const urlParams = new URLSearchParams(window.location.search);
const transferId = urlParams.get('transfer');
const importedMarket = urlParams.get('market');

if (importedMarket) {
  // Switch to the imported market
  switchMarket(importedMarket);
}

if (transferId) {
  loadTransfer(transferId);
}

// Clean URL after reading params
if (transferId || importedMarket) {
  window.history.replaceState({}, document.title, window.location.pathname);
}
```

### Load Transfer Function

```javascript
async function loadTransfer(transferId) {
  const doc = await db.collection('prompt_transfers_v2').doc(transferId).get();
  if (!doc.exists) {
    showToast('Transfer not found');
    return;
  }

  const data = doc.data();
  const manifest = data.manifest || {};
  const creativePackage = data.creativePackage || null;
  const jobs = manifest.jobs || [];

  if (!jobs.length) {
    showToast('Transfer received but no jobs found');
    return;
  }

  // Store in app state
  setTransferState({
    manifest,
    creativePackage,
    jobs,
    activeJobIndex: 0,
  });

  // Auto-load first job's prompt into the prompt input
  setPrompt(jobs[0].prompt);

  showToast(`Pipeline transfer loaded: ${jobs.length} jobs`);
}
```

---

## 4. UI Components Needed

### Transfer Queue Bar

A horizontal bar shown when a transfer is active. Contains:

1. **Header row**: Title ("Agent Collective Pipeline Transfer") + "Creative Package" toggle button + dismiss (×) button
2. **Job list**: Horizontal scrolling row of clickable job chips
3. **Creative Package panel**: Collapsible panel showing the full creative package markdown

#### Job Chip Behavior
- Click a job chip → loads that job's `prompt` into the prompt input field
- Active job is highlighted (red border)
- After generating from a job, mark it as "done" (cyan border, dimmed)
- Each chip shows: `deliverable_id` or `scene_id` as label, truncated prompt as subtitle

#### Creative Package Panel
- Toggled by "Creative Package" button
- Renders the markdown string (or displays as preformatted text)
- Scrollable, max-height ~200px
- This gives the user full creative context (concept descriptions, hooks, audio direction, visual composition) while they generate individual scenes

### Suggested Component Structure (React)

```
<TransferQueue>            — wrapper, hidden when no transfer
  <TransferHeader>         — title + toggle + dismiss
  <TransferJobList>        — horizontal scrolling job chips
    <TransferJobChip />    — one per job
  <CreativePackagePanel>   — collapsible markdown viewer
</TransferQueue>
```

### Placement

The transfer queue should appear **above the prompt input area**, so users see the job list and can click through jobs before generating.

---

## 5. Styling Reference

Match the dark theme. Key colors:

```css
--bg: #000000;
--surface: #1a1a1a;
--surface-raised: #2a2a2a;
--border: #3a3a3a;
--accent: #FF0000;        /* Red — active/brand */
--cyan: #00BFFF;           /* Cyan — done/info */
--text: #ffffff;
--text-secondary: #888888;
```

Transfer queue has a `border-top: 2px solid #FF0000` to visually separate it.

---

## 6. Agent Collective V2 Sender Code (Already Deployed)

For reference, here's what the sender does (`script.js` in agent-collective-v2):

```javascript
mcpSendBtn.addEventListener("click", async () => {
  const market = marketSelect.value;

  // Fetch manifest (tries full campaign first, then standard)
  let manifestResp = await fetch(`${API_BASE}/api/full-campaign-manifest`);
  if (!manifestResp.ok) manifestResp = await fetch(`${API_BASE}/api/manifest`);
  const manifestData = await manifestResp.json();

  // Fetch creative package (optional)
  let creativePackage = null;
  try {
    const cpResp = await fetch(`${API_BASE}/api/creative-package`);
    if (cpResp.ok) creativePackage = await cpResp.text();
  } catch {}

  // Store both in Firestore
  const transferDoc = await db.collection("prompt_transfers_v2").add({
    market,
    manifest: manifestData,
    creativePackage: creativePackage,
    jobCount: manifestData.jobs?.length || 0,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });

  // Open Creative Generator V2 with transfer doc ID
  const url = `/creative-generator-v2/?transfer=${transferDoc.id}&market=${market}`;
  window.open(url, "_blank");
});
```

---

## 7. Update Agent Collective V2 Link Target

Once Creative Generator V2 is ready to receive, update the MCP bridge URL in Agent Collective V2 from:

```javascript
const url = `/creative-generator/?transfer=${transferDoc.id}&market=${market}`;
```

to:

```javascript
const url = `/creative-generator-v2/?transfer=${transferDoc.id}&market=${market}`;
```

**Let me know when V2 is ready and I'll update the link.**

---

## 8. Firestore Security Rules

Already deployed — `prompt_transfers_v2` allows read and create:

```
match /prompt_transfers_v2/{docId} {
  allow read, create: if true;
}
```

---

## 9. Quick Checklist

- [ ] Firebase initialized in V2 app
- [ ] Read `transfer` and `market` URL params on mount
- [ ] Fetch Firestore doc from `prompt_transfers_v2/{transferId}`
- [ ] Render transfer queue bar with job chips
- [ ] Click job chip → load prompt into prompt input
- [ ] Toggle creative package panel (markdown viewer)
- [ ] Dismiss button hides the transfer queue
- [ ] Auto-load first job on arrival
- [ ] Clean URL params after reading
