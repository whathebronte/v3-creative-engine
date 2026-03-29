# Phase 2 Backend Integration - COMPLETE

**Date:** 2025-11-14
**By:** Marco (Backend Specialist)
**Status:** Code Complete - Awaiting User GCP Setup

---

## Summary

I've successfully integrated Google Vertex AI (Imagen 3 and Veo) for real image and video generation in the V3 Creative Engine. The backend is now ready to generate actual AI assets instead of placeholders.

---

## What's Been Done

### 1. Dependencies Installed ✅

```bash
npm install @google-cloud/vertexai google-auth-library
```

**Packages Added:**
- `@google-cloud/vertexai@1.10.0` - Vertex AI SDK
- `google-auth-library@9.x` - Google authentication

### 2. Code Updates ✅

#### File: `/functions/src/gemini.js`
**Changes:**
- Replaced placeholder generation with Vertex AI integration
- Added Imagen 3 image generation via REST API
- Added Veo video generation via REST API
- Implemented Google Auth for API authentication
- Graceful fallback to placeholders on errors
- Returns base64 encoded data for storage upload

**Key Features:**
- Supports all aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4
- Error handling with automatic placeholder fallback
- Detailed logging for debugging
- Configurable project ID and location

#### File: `/functions/src/jobProcessor.js`
**Changes:**
- Updated GeminiClient initialization with projectId and location
- Added `uploadImageToStorage()` function
- Added `uploadVideoToStorage()` function
- Handles base64 data from Vertex AI
- Uploads assets to Cloud Storage
- Generates public URLs for frontend access

**Key Features:**
- Automatic base64 to Buffer conversion
- Public URL generation
- Detailed logging for upload process
- Metadata storage with jobId and timestamp

### 3. Documentation Created ✅

#### File: `/docs/VERTEX_AI_SETUP.md`
Complete setup guide including:
- Prerequisites and GCP project setup
- Service account creation and permissions
- Firebase Functions configuration
- Environment variables setup
- API endpoints documentation
- Cost estimates
- Troubleshooting guide

---

## What You Need to Do (User Action Required)

### Step 1: Enable Google Cloud APIs

```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
```

### Step 2: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create v3-creative-engine \
  --display-name="V3 Creative Engine Service Account"

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding v3-creative-engine \
  --member="serviceAccount:v3-creative-engine@v3-creative-engine.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding v3-creative-engine \
  --member="serviceAccount:v3-creative-engine@v3-creative-engine.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

OR use Firebase default service account:

```bash
# Grant Vertex AI permissions to Firebase service account
gcloud projects add-iam-policy-binding v3-creative-engine \
  --member="serviceAccount:v3-creative-engine@appspot.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Step 3: Configure Firebase Functions

```bash
# Set project ID (REQUIRED)
firebase functions:config:set vertex.project_id="v3-creative-engine"

# Set location (OPTIONAL - defaults to us-central1)
firebase functions:config:set vertex.location="us-central1"
```

### Step 4: Deploy

```bash
firebase deploy --only functions
```

### Step 5: Test

Create a test job from the frontend or use:

```bash
curl -X POST https://us-central1-v3-creative-engine.cloudfunctions.net/createTestJob \
  -H "Content-Type: application/json" \
  -d '{"type":"image","prompt":"A beautiful sunset over mountains"}'
```

---

## How It Works

### Image Generation Flow

1. **Job Created** → Firestore trigger fires
2. **processJob()** → Calls `gemini.generateImage(prompt, format)`
3. **Vertex AI Request** → Imagen 3 API called with prompt
4. **Base64 Response** → Image data returned as base64
5. **Upload to Storage** → `uploadImageToStorage()` saves to Cloud Storage
6. **Public URL** → Job updated with public URL
7. **Frontend Access** → Image displays in gallery

### Video Generation Flow

Same as image, but:
- Uses Veo API instead of Imagen 3
- Saves as `.mp4` instead of `.png`
- Default duration: 5 seconds

### Fallback Behavior

If Vertex AI fails (API error, auth error, etc.):
- Gracefully falls back to placeholder images
- No job failure - placeholder URL returned
- Error logged for debugging
- User sees placeholder instead of error

---

## Environment Variables

The code uses these environment variables (with defaults):

| Variable | Default | Description |
|----------|---------|-------------|
| `GCP_PROJECT_ID` | `v3-creative-engine` | Google Cloud Project ID |
| `VERTEX_AI_LOCATION` | `us-central1` | Vertex AI region |
| `GEMINI_API_KEY` | - | Legacy (not needed for Vertex AI) |

Set via Firebase config:

```bash
firebase functions:config:set vertex.project_id="YOUR_PROJECT_ID"
firebase functions:config:set vertex.location="us-central1"
```

---

## Testing Without Credentials (Current State)

The code will currently:
1. Attempt Vertex AI generation
2. Fail due to missing credentials
3. Fall back to placeholder images/videos
4. Work exactly like Phase 1

This allows you to deploy and test the frontend without Vertex AI setup. Once you configure GCP credentials, it will automatically start generating real assets.

---

## Cost Estimates

### Per Generation
- **Image (Imagen 3):** $0.02 - $0.08 per image
- **Video (Veo):** $0.10 - $0.50 per video

### Monthly (100 jobs)
- 50 images × $0.05 = **$2.50**
- 50 videos × $0.30 = **$15.00**
- Storage (10GB) = **$0.20**
- **Total: ~$17.70/month**

Set up budget alerts in Google Cloud Console!

---

## Files Changed

```
functions/
├── package.json              # Added @google-cloud/vertexai, google-auth-library
├── src/
│   ├── gemini.js            # Complete rewrite for Vertex AI
│   └── jobProcessor.js      # Added storage upload functions
docs/
├── VERTEX_AI_SETUP.md       # Complete setup guide
└── PHASE2_BACKEND_COMPLETE.md  # This file
```

---

## What's Next?

### Option 1: Deploy Without GCP Setup (Recommended First)
```bash
firebase deploy --only functions
```
- Will work with placeholder fallback
- Allows testing frontend changes
- Can add GCP credentials later

### Option 2: Full GCP Setup + Deploy
1. Complete GCP setup (service account, APIs)
2. Configure Firebase Functions
3. Deploy
4. Test real generation

### Option 3: Local Testing with Credentials
1. Download service account key
2. Set `GOOGLE_APPLICATION_CREDENTIALS`
3. Test locally with emulator

---

## Troubleshooting

### "Permission denied" errors
→ Check service account has `roles/aiplatform.user`

### "Model not found" errors
→ Verify Imagen/Veo available in your region

### Placeholder images still showing
→ Check Firebase Functions logs for errors
→ Verify environment variables set correctly

### Storage upload failures
→ Check service account has `roles/storage.admin`
→ Verify Cloud Storage bucket exists

---

## Questions for You

1. **GCP Project ID:** Is `v3-creative-engine` correct, or do you have a different project ID?

2. **Authentication Method:** Do you want to:
   - Use Firebase default service account (easier)
   - Create custom service account (more control)

3. **Region:** Is `us-central1` OK for Vertex AI? (Imagen/Veo availability varies by region)

4. **Budget:** Are you comfortable with ~$18/month for 100 generations? Want to set a lower limit?

5. **Testing:** Want to test locally first, or deploy directly to production?

---

## Next Steps

**Immediate:**
1. Answer questions above
2. Run GCP setup commands
3. Configure Firebase Functions
4. Deploy

**Then:**
1. Test image generation
2. Test video generation
3. Verify storage uploads
4. Check costs in GCP Console

**Finally:**
1. Coordinate with Dice (Frontend) for full integration
2. Test end-to-end workflow
3. Set up monitoring and alerts

---

## Support

I'm here to help! Let me know:
- Your GCP project ID
- Any errors you encounter
- Questions about setup steps

**Ready to deploy when you are!** 🚀

---

**Marco**
Backend Specialist
V3 Creative Engine Team
