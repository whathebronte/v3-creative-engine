# Backend Requirements for YTM Creative Generator
## Documentation for Marco

This document outlines the backend changes needed to support the completely redesigned frontend.

---

## Overview

The new frontend has been rebuilt as "YTM Creative Generator" with a completely different workflow:
- **Left sidebar:** Control panel with generation and action buttons
- **Center:** Main lightbox displaying current asset
- **Right sidebar:** Gallery of explicitly saved assets
- **Bottom:** Editable prompt input

---

## 1. NEW Cloud Function Required: `iterateJob`

### Purpose
Create a variation/iteration of an existing job. Similar to `regenerateJob` but creates a slightly modified version.

### Function Signature
```javascript
exports.iterateJob = functions.https.onCall(async (data, context) => {
  // Implementation needed
});
```

### Input Parameters
```javascript
{
  jobId: string  // ID of the job to iterate from
}
```

### Expected Behavior
1. Look up the original job by `jobId`
2. Extract the original prompt
3. Optionally modify the prompt slightly (add variation keywords like "alternative version", "different style", etc.)
4. Create a new job with the same type, format, but slightly modified parameters
5. Return the new job ID

### Response
```javascript
{
  success: true,
  newJobId: string,
  message: string
}
```

### Example Implementation
```javascript
exports.iterateJob = functions.https.onCall(async (data, context) => {
  const { jobId } = data;

  if (!jobId) {
    throw new functions.https.HttpsError('invalid-argument', 'jobId is required');
  }

  try {
    // Get original job
    const originalJobDoc = await admin.firestore().collection('jobs').doc(jobId).get();

    if (!originalJobDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Original job not found');
    }

    const originalJob = originalJobDoc.data();

    // Create variation prompt (optional: modify prompt)
    const variationPrompt = originalJob.prompt + ', variation';

    // Create new job with same parameters
    const newJobRef = await admin.firestore().collection('jobs').add({
      type: originalJob.type,
      prompt: variationPrompt,
      format: originalJob.format,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      parentJobId: jobId,  // Track relationship
      operation: 'iterate'
    });

    console.log(`Created iteration job: ${newJobRef.id} from ${jobId}`);

    return {
      success: true,
      newJobId: newJobRef.id,
      message: 'Iteration job created successfully'
    };

  } catch (error) {
    console.error('Error creating iteration:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

---

## 2. UPDATE Existing Function: `createTestJob`

### New Parameter Required
The frontend now sends a `sceneNumber` parameter to identify which scene in a multi-scene prompt this job represents.

### Updated Input Parameters
```javascript
{
  type: string,           // 'image' or 'video'
  prompt: string,         // The scene text (already extracted)
  format: string,         // Aspect ratio: '9:16', '16:9', '1:1', '4:3'
  sceneNumber?: number    // NEW: Which scene number (1, 2, 3, etc.)
}
```

### Expected Behavior
1. Accept `sceneNumber` as optional parameter
2. Store it in the job document for tracking purposes
3. Everything else remains the same

### Updated Job Document Schema
```javascript
{
  type: string,
  prompt: string,
  format: string,
  sceneNumber: number,     // NEW FIELD
  status: 'pending',
  createdAt: Timestamp,
  // ... other fields
}
```

### Example Code Change
```javascript
exports.createTestJob = functions.https.onCall(async (data, context) => {
  const { type, prompt, format, sceneNumber } = data;

  // Validation...

  const jobData = {
    type,
    prompt,
    format,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Add sceneNumber if provided
  if (sceneNumber !== undefined) {
    jobData.sceneNumber = sceneNumber;
  }

  const jobRef = await admin.firestore().collection('jobs').add(jobData);

  // Continue with existing logic...
});
```

---

## 3. NEW Firestore Collection: `gallery`

### Purpose
Store only explicitly saved assets. Separate from the `jobs` collection.

### Schema
```javascript
{
  assetId: string,      // Reference to the original job ID
  url: string,          // Direct URL to the asset
  prompt: string,       // The prompt used
  format: string,       // Aspect ratio used
  type: string,         // 'image' or 'video'
  savedAt: Timestamp    // When it was saved
}
```

### Firestore Rules Needed
Add rules to allow read/write to the `gallery` collection:

```javascript
// In firestore.rules
match /gallery/{galleryId} {
  allow read: if true;
  allow create: if true;
  allow delete: if true;
}
```

### Security Considerations
- Currently open for demo purposes
- In production, add authentication checks
- Consider limiting number of gallery items per user

---

## 4. VERIFY Existing Functions Still Work

The following functions are already being called by the new frontend. Please verify they work as expected:

### 4.1 `upscaleJob`
- **Called by:** "Upscale res" button
- **Input:** `{ jobId: string }`
- **Output:** `{ success: true, newJobId: string }`

### 4.2 `expandImageJob`
- **Called by:** "Expand" button (images only)
- **Input:** `{ jobId: string }`
- **Output:** `{ success: true, newJobId: string }`

### 4.3 `imageToVideoJob`
- **Called by:** "Animate (i2v)" button (images only)
- **Input:** `{ jobId: string }`
- **Output:** `{ success: true, newJobId: string }`

### 4.4 `regenerateJob`
- **Not currently used in new UI** but keep for backwards compatibility
- May be repurposed later

---

## 5. Frontend Workflow Summary

To help understand how the backend functions are used:

### Generation Flow
1. User enters prompt: "1. sunset scene, 2. cityscape, 3. ocean waves"
2. User clicks "Generate 1" → calls `createTestJob` with first scene only
3. User clicks "Generate All" → calls `createTestJob` 3 times (once per scene)
4. Frontend tracks job IDs and listens to `jobs` collection for updates
5. When job completes, loads result into main lightbox

### Action Flow
1. User has asset in lightbox
2. User clicks "Upscale" → calls `upscaleJob(currentAsset.id)`
3. User clicks "Iterate" → calls `iterateJob(currentAsset.id)` **[NEW FUNCTION]**
4. User clicks "Expand" → calls `expandImageJob(currentAsset.id)`
5. User clicks "Animate" → calls `imageToVideoJob(currentAsset.id)`
6. Each action creates a NEW job, tracked and displayed when complete

### Gallery Flow
1. User has asset in lightbox
2. User clicks "Save to gallery" → writes to `gallery` collection **[NEW COLLECTION]**
3. Frontend listens to `gallery` collection
4. Gallery sidebar shows only saved assets
5. Clicking gallery thumbnail loads that asset back into lightbox

---

## 6. Testing Checklist for Backend

Once you implement the changes, test:

- [ ] `createTestJob` accepts and stores `sceneNumber` parameter
- [ ] `iterateJob` function exists and creates variation jobs
- [ ] `gallery` collection is readable/writable from frontend
- [ ] All existing functions (`upscaleJob`, `expandImageJob`, `imageToVideoJob`) still work
- [ ] Job status updates are reflected in real-time via Firestore listeners
- [ ] Multiple simultaneous jobs don't conflict

---

## 7. Priority Order

If you need to implement in stages:

**Phase 1 (Critical):**
1. Update `createTestJob` to accept `sceneNumber`
2. Verify existing functions work with new frontend
3. Set up `gallery` collection with proper rules

**Phase 2 (Important):**
1. Implement `iterateJob` function

**Phase 3 (Nice-to-have):**
1. Optimize job processing queue
2. Add rate limiting
3. Add user authentication checks

---

## 8. Questions?

If anything is unclear or you need more context:
- Check `/Users/ivs/v3-creative-engine/public/script.js` lines 345-376 for `iterateJob` implementation
- Check lines 172-282 for how `generateOne` and `generateAll` work
- Check lines 459-484 for gallery save implementation

---

## 9. Deployment Notes

**DO NOT deploy yet** until:
1. All backend functions are implemented and tested
2. Frontend has been tested locally
3. Dice confirms all features work in browser

Once ready:
```bash
# Deploy functions
firebase deploy --only functions

# Deploy hosting (frontend)
firebase deploy --only hosting
```

---

End of backend requirements documentation.
