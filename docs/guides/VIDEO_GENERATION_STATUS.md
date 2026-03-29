# Video Generation Status - Veo 3

## Current Status

⚠️ **Video generation (Animate button) uses placeholders for now**

## Why Placeholders?

Veo 3 video generation works differently from image generation:

### Key Differences

1. **Long-Running Operation**: Veo 3 uses `predictLongRunning` endpoint
   - Returns an operation ID, not immediate results
   - Requires polling to check completion status
   - Video generation takes 3-5 minutes

2. **Asynchronous Processing**: Cannot wait in Cloud Function
   - Cloud Functions have 60-second default timeout (540s max)
   - Video takes 3-5 minutes to generate
   - Need different architecture for async operations

3. **Different API Pattern**:
   - Image: Synchronous, returns in ~30-60 seconds
   - Video: Async, returns operation ID, poll for status

## What's Implemented

✅ **Animate Button UI**: Fully functional
✅ **Job Creation**: Creates video jobs correctly
✅ **Veo 3 Endpoint**: Configured for `veo-3.0-generate-preview`
✅ **Aspect Ratio Handling**: Falls back to 16:9 for unsupported 9:16
✅ **Fallback System**: Shows placeholder when video not ready

## What's Needed for Real Video

To implement real Veo 3 video generation, we need:

### 1. Long-Running Operation Handler

```javascript
// Start video generation
const response = await fetch(veo3Endpoint, { /* ... */ });
const operation = await response.json();
const operationId = operation.name; // e.g., "projects/123/operations/456"

// Poll for completion (every 30 seconds)
while (true) {
  const statusResponse = await fetch(`${operationId}`, { /* ... */ });
  const status = await statusResponse.json();

  if (status.done) {
    // Extract video from status.response
    return status.response.predictions[0].bytesBase64Encoded;
  }

  await sleep(30000); // Wait 30 seconds
}
```

### 2. Background Job System

**Option A: Firebase Cloud Tasks**
- Schedule periodic checks for operation status
- Update Firestore when video is ready
- Frontend listens for Firestore updates

**Option B: Pub/Sub + Cloud Functions**
- Trigger background function to poll operation
- Store operation ID in Firestore
- Update job status when complete

**Option C: Firestore Triggers + Schedulers**
- Create operation document
- Cloud Scheduler checks status periodically
- Update job when done

### 3. Frontend Changes

```javascript
// Show "Generating video... 3-5 minutes remaining"
// Poll Firestore for job status updates
// Display video when status changes to 'complete'
```

## Recommended Implementation Path

### Phase 1: Basic Async Support (2-3 hours)
1. Create Cloud Function to start Veo operation
2. Store operation ID in Firestore
3. Create polling Cloud Function (triggered every minute)
4. Check operation status and update job
5. Frontend shows "Processing..." message

### Phase 2: Better UX (1-2 hours)
1. Estimate time remaining
2. Show progress indicator
3. Email notification when complete
4. Handle failures gracefully

## Current Workaround

The system currently:
1. ✅ Creates video job
2. ✅ Attempts Veo 3 API call
3. ✅ Falls back to placeholder gracefully
4. ✅ Shows placeholder in UI
5. ✅ Logs clear explanation in Cloud Functions logs

**User sees:** Placeholder video with message explaining video generation is not yet fully configured.

**Benefits:**
- Full workflow is testable
- UI works end-to-end
- No errors shown to users
- Real implementation can be added later

## Cost Considerations

**Veo 3 Pricing** (estimated):
- ~$0.10-0.30 per 5-second video
- 10x more expensive than images
- Should implement with caution

**Recommendation:**
- Keep placeholders for testing
- Implement real video generation when there's specific need
- Consider if static images are sufficient for MVP

## Model Details

**Current Configuration:**
- Model: `veo-3.0-generate-preview`
- Endpoint: `predictLongRunning` (async)
- Region: `us-central1`
- Aspect Ratios: 16:9, 1:1, 4:3 (NOT 9:16)
- Duration: 5 seconds
- Status: Preview/Allowlist access may be required

## Testing Real Video (If Needed)

If you want to implement real video generation:

1. Check allowlist status: https://console.cloud.google.com/vertex-ai/generative?project=v3-creative-engine
2. Request Veo 3 access if not available
3. Implement long-running operation polling
4. Test with simple prompts
5. Monitor costs carefully

## Resources

- Veo 3 Documentation: https://cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-0-generate
- Long-Running Operations: https://cloud.google.com/vertex-ai/docs/predictions/online-predictions-long-running
- Firebase Cloud Tasks: https://firebase.google.com/docs/functions/task-functions

---

**TL;DR**: Video generation requires async operation polling (3-5 min wait time). Current implementation uses placeholders. Real video generation can be added if needed, but requires additional architecture for long-running operations.
