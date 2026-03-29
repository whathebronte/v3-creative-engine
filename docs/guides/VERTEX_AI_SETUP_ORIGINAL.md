# Vertex AI Setup Guide for YTM Creative Generator

## Overview
This guide will help you enable Vertex AI APIs (Imagen 3 and Veo) for the YTM Creative Generator to actually generate images and videos.

## Prerequisites
- Firebase project: `v3-creative-engine`
- Google Cloud Console access
- Billing must be enabled (Vertex AI requires billing)

## Step 1: Enable Required APIs

Visit the Google Cloud Console and enable these APIs:

### Option A: Enable via Console UI
1. Go to: https://console.cloud.google.com/apis/library?project=v3-creative-engine
2. Search for and enable each API:
   - **Vertex AI API**: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=v3-creative-engine
   - **Cloud Storage API**: https://console.cloud.google.com/apis/library/storage.googleapis.com?project=v3-creative-engine (should already be enabled)
   - **Cloud Functions API**: https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=v3-creative-engine (should already be enabled)

### Option B: Enable via gcloud CLI (if installed)
```bash
gcloud config set project v3-creative-engine

gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
```

## Step 2: Verify Billing is Enabled

Vertex AI requires billing to be enabled:

1. Go to: https://console.cloud.google.com/billing?project=v3-creative-engine
2. Ensure a billing account is linked
3. If not, link a billing account or create one

**Important:** Vertex AI image and video generation incurs costs:
- Imagen 3: ~$0.02-0.04 per image
- Veo: Video pricing varies by duration

## Step 3: Request Access to Imagen 3 and Veo (if needed)

Some Vertex AI models may require early access approval:

1. Go to: https://console.cloud.google.com/vertex-ai/generative?project=v3-creative-engine
2. Check if Imagen 3 and Veo are available in your region
3. If not available, request access or check regional availability

**Available Regions:**
- `us-central1` (recommended, default)
- `us-west1`
- `europe-west4`

## Step 4: Test API Access

You can test if APIs are working by checking API status:

1. Go to: https://console.cloud.google.com/apis/dashboard?project=v3-creative-engine
2. Verify "Vertex AI API" shows "Enabled"
3. Check for any quota or permission errors

## Step 5: Deploy Updated Cloud Functions

The environment variables are already configured in `.env`:
```
GCP_PROJECT_ID=v3-creative-engine
VERTEX_AI_LOCATION=us-central1
```

Deploy the functions:
```bash
firebase deploy --only functions
```

## Step 6: Test Creative Generation

1. Open the YTM Creative Generator: https://v3-creative-engine.web.app/
2. Enter a prompt in the prompt field
3. Click "Generate 1" or "Generate All"
4. Monitor the Cloud Functions logs: `firebase functions:log`

## Troubleshooting

### Error: "Vertex AI API not enabled"
- Solution: Enable Vertex AI API in Step 1

### Error: "Permission denied" or "403 Forbidden"
- Solution: Ensure the Firebase service account has Vertex AI permissions
- Go to: https://console.cloud.google.com/iam-admin/iam?project=v3-creative-engine
- Find the service account ending in `@appspot.gserviceaccount.com`
- Add role: "Vertex AI User" (`roles/aiplatform.user`)

### Error: "Imagen/Veo model not found"
- Solution: Check if models are available in your region
- Try different region in VERTEX_AI_LOCATION
- Request access to preview features if needed

### Error: "Quota exceeded"
- Solution: Request quota increase
- Go to: https://console.cloud.google.com/iam-admin/quotas?project=v3-creative-engine
- Search for "Vertex AI" quotas
- Request increase for your region

## Current Implementation Status

The code is already set up to use:
- **Imagen 3** (`imagen-3.0-generate-001`) for image generation
- **Veo** (`veo-001`) for video generation
- **Fallback placeholders** if APIs are not configured

## Files Configured

- `functions/src/gemini.js` - Vertex AI client implementation
- `functions/src/jobProcessor.js` - Job processing with Vertex AI calls
- `functions/.env` - Environment variables (not committed to git)

## Next Steps After Setup

Once APIs are enabled:
1. Test image generation with simple prompts
2. Test video generation (note: may take several minutes)
3. Monitor costs in Cloud Console billing
4. Adjust safety filters and parameters in `gemini.js` if needed

## Support Resources

- Vertex AI Documentation: https://cloud.google.com/vertex-ai/docs
- Imagen 3 Guide: https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview
- Veo Guide: https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview
- Firebase Functions Logs: `firebase functions:log` or Console

---

**Note:** This setup guide was generated to help enable actual AI generation. The Creative Generator will fall back to placeholder images until Vertex AI APIs are properly configured and enabled.
