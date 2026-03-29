# Vertex AI Setup Guide for V3 Creative Engine

## Overview
This guide walks you through setting up Google Vertex AI (Imagen 3 and Veo) integration for real image and video generation in the V3 Creative Engine.

## Phase 2 Integration Complete

The backend code has been updated with:
- Vertex AI SDK integration (@google-cloud/vertexai)
- Imagen 3 for real image generation
- Veo for real video generation
- Cloud Storage upload for generated assets
- Graceful fallback to placeholders on errors

## Prerequisites

### 1. Google Cloud Project Setup

You need a Google Cloud Project with the following:

1. **Active GCP Project**
   - Project ID: `v3-creative-engine` (or your custom project ID)
   - Billing must be enabled (Vertex AI requires a paid account)

2. **Enable Required APIs**

   Run these commands or enable via Google Cloud Console:

   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable storage.googleapis.com
   gcloud services enable firestore.googleapis.com
   ```

3. **Service Account Setup**

   Create a service account with Vertex AI permissions:

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

   # Download service account key
   gcloud iam service-accounts keys create ./service-account-key.json \
     --iam-account=v3-creative-engine@v3-creative-engine.iam.gserviceaccount.com
   ```

### 2. Firebase Functions Configuration

Set environment variables for your Firebase Functions:

```bash
# Navigate to functions directory
cd functions

# Set GCP Project ID
firebase functions:config:set vertex.project_id="v3-creative-engine"

# Set Vertex AI location (us-central1 is recommended for Imagen/Veo)
firebase functions:config:set vertex.location="us-central1"

# Optional: Set Gemini API key if using legacy Gemini API
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

### 3. Service Account Authentication

You have two options for authentication:

#### Option A: Application Default Credentials (Recommended for Firebase)

Firebase Functions automatically use the default Firebase service account. Ensure it has Vertex AI permissions:

```bash
# Grant Vertex AI permissions to Firebase service account
gcloud projects add-iam-policy-binding v3-creative-engine \
  --member="serviceAccount:v3-creative-engine@appspot.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

#### Option B: Custom Service Account Key

1. Download service account key (see step 1.3 above)
2. Upload to Firebase Functions:

```bash
# Set service account key path
firebase functions:config:set vertex.credentials="$(cat service-account-key.json | base64)"
```

## Code Changes Summary

### 1. Dependencies Installed

```json
{
  "@google-cloud/vertexai": "^1.10.0",
  "google-auth-library": "^9.0.0"
}
```

### 2. Files Modified

#### `/functions/src/gemini.js`
- Replaced placeholder generation with Vertex AI integration
- Added Imagen 3 image generation via REST API
- Added Veo video generation via REST API
- Implemented graceful fallback to placeholders on errors
- Uses Google Auth for API authentication

#### `/functions/src/jobProcessor.js`
- Updated to pass `projectId` and `location` to GeminiClient
- Added `uploadImageToStorage()` function for image uploads
- Added `uploadVideoToStorage()` function for video uploads
- Handles base64 data from Vertex AI and uploads to Cloud Storage
- Generates public URLs for generated assets

## Environment Variables

The following environment variables are used:

| Variable | Default | Description |
|----------|---------|-------------|
| `GCP_PROJECT_ID` | `v3-creative-engine` | Google Cloud Project ID |
| `VERTEX_AI_LOCATION` | `us-central1` | Vertex AI region |
| `GEMINI_API_KEY` | - | Legacy Gemini API key (optional) |

Set these in Firebase Functions config:

```bash
firebase functions:config:set vertex.project_id="YOUR_PROJECT_ID"
firebase functions:config:set vertex.location="us-central1"
```

Access in code:
```javascript
const projectId = process.env.GCP_PROJECT_ID || functions.config().vertex.project_id;
const location = process.env.VERTEX_AI_LOCATION || functions.config().vertex.location;
```

## API Endpoints Used

### Imagen 3 (Image Generation)
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict
```

**Request Body:**
```json
{
  "instances": [{ "prompt": "your prompt here" }],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "1:1",
    "safetyFilterLevel": "block_some",
    "personGeneration": "allow_adult"
  }
}
```

**Response:**
```json
{
  "predictions": [{
    "bytesBase64Encoded": "base64_image_data..."
  }]
}
```

### Veo (Video Generation)
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/veo-001:predict
```

**Request Body:**
```json
{
  "instances": [{ "prompt": "your prompt here" }],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "16:9",
    "duration": "5s"
  }
}
```

## Supported Aspect Ratios

Both Imagen 3 and Veo support:
- `1:1` - Square (1024x1024 for images)
- `16:9` - Landscape (1920x1080)
- `9:16` - Portrait (1080x1920)
- `4:3` - Classic (1024x768)
- `3:4` - Classic Portrait (768x1024)

## Cloud Storage Structure

Generated assets are stored in Firebase Cloud Storage:

```
gs://v3-creative-engine.appspot.com/
├── images/
│   ├── {jobId1}.png
│   ├── {jobId2}.png
│   └── ...
└── videos/
    ├── {jobId1}.mp4
    ├── {jobId2}.mp4
    └── ...
```

Public URLs:
```
https://storage.googleapis.com/v3-creative-engine.appspot.com/images/{jobId}.png
https://storage.googleapis.com/v3-creative-engine.appspot.com/videos/{jobId}.mp4
```

## Testing the Integration

### Local Testing (with Service Account)

1. Set service account credentials:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
   export GCP_PROJECT_ID="v3-creative-engine"
   export VERTEX_AI_LOCATION="us-central1"
   ```

2. Start Firebase emulator:
   ```bash
   cd functions
   npm run serve
   ```

3. Create test job via HTTP:
   ```bash
   curl http://localhost:5001/v3-creative-engine/us-central1/createTestJob
   ```

### Production Testing

1. Deploy functions:
   ```bash
   firebase deploy --only functions
   ```

2. Monitor logs:
   ```bash
   firebase functions:log
   ```

3. Check for errors in logs:
   - `[VertexAI] Initialized with project: ...` - Success
   - `[VertexAI] Imagen 3 generation failed: ...` - Check API permissions
   - `[JobProcessor] Uploading image to Cloud Storage` - Upload in progress

## Error Handling

The integration includes graceful fallback:

1. **Vertex AI API Errors**: Falls back to placeholder images/videos
2. **Authentication Errors**: Check service account permissions
3. **Storage Upload Errors**: Check storage permissions

All errors are logged to Firebase Functions logs.

## Cost Estimates

### Vertex AI Pricing (as of 2024)

- **Imagen 3**: ~$0.02-0.08 per image (varies by resolution)
- **Veo**: ~$0.10-0.50 per video (varies by duration/quality)
- **Cloud Storage**: ~$0.02/GB/month
- **Cloud Functions**: Minimal (included in Firebase free tier for low volume)

### Monthly Estimate (100 jobs)
- 50 images × $0.05 = $2.50
- 50 videos × $0.30 = $15.00
- Storage (10GB) = $0.20
- **Total: ~$17.70/month**

Set up budget alerts in Google Cloud Console to monitor costs.

## Next Steps

1. **Complete GCP Setup**
   - Enable Vertex AI API
   - Create service account
   - Grant permissions

2. **Configure Firebase Functions**
   - Set environment variables
   - Upload service account key (if using Option B)

3. **Deploy**
   ```bash
   firebase deploy --only functions
   ```

4. **Test**
   - Create test jobs from frontend
   - Monitor Firebase Functions logs
   - Verify assets in Cloud Storage

5. **Monitor Costs**
   - Set up budget alerts in GCP Console
   - Track API usage in Vertex AI console

## Troubleshooting

### "Permission denied" errors
- Check service account has `roles/aiplatform.user` role
- Verify API is enabled: `gcloud services list --enabled`

### "Model not found" errors
- Verify Imagen 3 / Veo are available in your region
- Try different location (e.g., us-central1, europe-west4)

### Placeholder images still showing
- Check Firebase Functions logs for errors
- Verify environment variables are set correctly
- Test authentication with `gcloud auth application-default print-access-token`

### Storage upload failures
- Check service account has `roles/storage.admin` role
- Verify Cloud Storage bucket exists
- Check Firebase Storage rules allow writes

## Support

For issues or questions:
1. Check Firebase Functions logs: `firebase functions:log`
2. Review Vertex AI quota: https://console.cloud.google.com/iam-admin/quotas
3. Check API status: https://status.cloud.google.com/

## References

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Imagen 3 API](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)
- [Veo API](https://cloud.google.com/vertex-ai/docs/generative-ai/video/overview)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [Cloud Storage](https://cloud.google.com/storage/docs)
