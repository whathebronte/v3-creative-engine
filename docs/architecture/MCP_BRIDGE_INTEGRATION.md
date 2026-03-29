# MCP Bridge Integration Guide

## Overview

This document provides the integration code to connect YTM Agent Collective to YTM Creative Generator via the MCP Bridge.

## YTM Creative Generator Side (Already Implemented)

The following has been implemented in v3-creative-engine:

1. **Cloud Function Endpoint** (`functions/src/importPrompt.js`)
   - HTTP endpoint with CORS enabled
   - Accepts POST requests with prompt data
   - Returns redirect URL with encoded prompt

2. **Frontend Prompt Import** (`public/script.js`)
   - Checks for `?prompt=` URL parameter on load
   - Auto-populates the "Carried over prompt" field
   - Shows toast notification confirming import
   - Cleans the URL after import

3. **Toast Notification Styling** (`public/style.css`)
   - Red-themed toast with checkmark icon
   - Smooth slide-in animation

## YTM Agent Collective Side (Integration Code)

Add the following code to your YTM Agent Collective HTML file:

### 1. Add "Send to Generator" Button (after Creative Prompter chat area)

```html
<!-- Add this button in the Creative Prompter agent section -->
<button id="sendToGeneratorBtn" class="send-to-generator-btn" style="display: none;">
  <span class="btn-icon">🚀</span>
  <span>Send to YTM Creative Generator</span>
</button>
```

### 2. Add CSS Styling

```css
.send-to-generator-btn {
  background: linear-gradient(135deg, #FF0000, #CC0000);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
}

.send-to-generator-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 0, 0, 0.4);
}

.send-to-generator-btn:active {
  transform: translateY(0);
}

.send-to-generator-btn:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.send-to-generator-btn .btn-icon {
  font-size: 20px;
}
```

### 3. Add JavaScript Integration

```javascript
// MCP Bridge Configuration
const MCP_BRIDGE_CONFIG = {
  // Cloud Function endpoint URL (will be available after deployment)
  importEndpoint: 'https://us-central1-v3-creative-engine.cloudfunctions.net/importPrompt',
  // Direct URL with prompt parameter (alternative method)
  generatorBaseUrl: 'https://v3-creative-engine.web.app'
};

// Track the last finalized prompt from Creative Prompter
let lastFinalizedPrompt = null;

/**
 * Show the "Send to Generator" button after Creative Prompter finalizes a prompt
 * Call this after the Creative Prompter agent completes its task
 */
function showSendToGeneratorButton(finalizedPrompt) {
  lastFinalizedPrompt = finalizedPrompt;
  const btn = document.getElementById('sendToGeneratorBtn');
  if (btn) {
    btn.style.display = 'flex';
    btn.disabled = false;
  }
}

/**
 * Send prompt to YTM Creative Generator via MCP Bridge
 */
async function sendToGenerator() {
  if (!lastFinalizedPrompt) {
    alert('No prompt available. Please have Creative Prompter finalize a prompt first.');
    return;
  }

  const btn = document.getElementById('sendToGeneratorBtn');
  const originalText = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span><span>Sending...</span>';

    // Method 1: Direct URL with prompt parameter (simpler, no CORS)
    const encodedPrompt = encodeURIComponent(lastFinalizedPrompt);
    const redirectUrl = `${MCP_BRIDGE_CONFIG.generatorBaseUrl}?prompt=${encodedPrompt}`;

    // Open in new tab
    window.open(redirectUrl, '_blank');

    // Reset button
    btn.innerHTML = '<span class="btn-icon">✓</span><span>Sent! Opening Generator...</span>';

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 3000);

    /*
    // Method 2: Via Cloud Function (for logging/analytics)
    const response = await fetch(MCP_BRIDGE_CONFIG.importEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: lastFinalizedPrompt,
        source: 'ytm-agent-collective',
        metadata: {
          timestamp: new Date().toISOString(),
          agentVersion: '1.0'
        }
      })
    });

    const result = await response.json();

    if (result.success) {
      window.open(result.redirectUrl, '_blank');
      btn.innerHTML = '<span class="btn-icon">✓</span><span>Sent!</span>';
    } else {
      throw new Error(result.error || 'Failed to send prompt');
    }
    */

  } catch (error) {
    console.error('Error sending to generator:', error);
    alert('Failed to send prompt: ' + error.message);
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Add click listener
document.getElementById('sendToGeneratorBtn')?.addEventListener('click', sendToGenerator);

/**
 * Integration with Creative Prompter Agent
 *
 * In your Creative Prompter's response handler, after the agent produces
 * the final prompt, call:
 *
 * showSendToGeneratorButton(finalPromptText);
 *
 * Example integration point:
 */

// Example: After Creative Prompter responds
function onCreativePrompterResponse(responseText) {
  // Parse the response to extract the final prompt
  // Assuming the agent outputs a clear, final prompt text

  // Check if this is a final prompt (you may need to adjust this logic)
  if (responseText.includes('Final Prompt:') ||
      responseText.includes('Sharpened Prompt:') ||
      responseText.includes('Here is your optimized prompt:')) {

    // Extract just the prompt part (customize based on your agent's output format)
    const promptMatch = responseText.match(/(?:Final Prompt:|Sharpened Prompt:|optimized prompt:)\s*(.+)/is);
    if (promptMatch) {
      const cleanPrompt = promptMatch[1].trim();
      showSendToGeneratorButton(cleanPrompt);
    } else {
      // If no specific pattern found, use the entire response
      showSendToGeneratorButton(responseText.trim());
    }
  }
}
```

### 4. Integration Points in Your Agent Code

Find where the Creative Prompter agent returns its response and add:

```javascript
// After receiving Creative Prompter's message
// In your existing addMessage or displayAgentResponse function:

function displayAgentMessage(agentType, message) {
  // Your existing code to display the message...

  // Add this for Creative Prompter agent
  if (agentType === 'creative-prompter' || agentType === 'Creative Prompter') {
    // Extract and store the prompt
    showSendToGeneratorButton(message);
  }
}
```

## Testing the Integration

1. **Deploy the Cloud Function:**
   ```bash
   cd /Users/ivs/v3-creative-engine
   firebase deploy --only functions
   firebase deploy --only hosting
   ```

2. **Test the endpoint:**
   ```bash
   curl -X POST https://us-central1-v3-creative-engine.cloudfunctions.net/importPrompt \
     -H "Content-Type: application/json" \
     -d '{"prompt": "A vibrant sunset over Tokyo skyline with neon lights", "source": "test"}'
   ```

3. **Test direct URL import:**
   Open: `https://v3-creative-engine.web.app?prompt=Test%20prompt%20from%20Agent%20Collective`

## Flow Diagram

```
YTM Agent Collective                    YTM Creative Generator
┌─────────────────────┐                 ┌─────────────────────┐
│ 1. Marketing Manager│                 │                     │
│    creates brief    │                 │                     │
└─────────┬───────────┘                 │                     │
          ▼                             │                     │
┌─────────────────────┐                 │                     │
│ 2. Creative Prompter│                 │                     │
│    sharpens prompt  │                 │                     │
└─────────┬───────────┘                 │                     │
          ▼                             │                     │
┌─────────────────────┐                 │                     │
│ 3. "Send to         │──── URL ────▶  │ 4. Prompt appears   │
│     Generator" btn  │   Redirect      │    in input field   │
└─────────────────────┘                 └─────────┬───────────┘
                                                  ▼
                                        ┌─────────────────────┐
                                        │ 5. User clicks      │
                                        │    Generate         │
                                        └─────────────────────┘
```

## Security Notes

- The Cloud Function endpoint allows any origin (CORS enabled) for initial testing
- Consider adding authentication in production
- Prompts are not stored in the bridge (pass-through only)
- URL parameters are cleaned after import to prevent re-imports on refresh
