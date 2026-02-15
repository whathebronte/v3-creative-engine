# Template Stamper - Remotion Templates

This directory contains Remotion video templates for Template Stamper, designed to run on Google Cloud Run.

## Templates

### Veo Shorts V1
- **ID:** `veo-shorts-v1`
- **Duration:** 17.5 seconds (420 frames at 24fps)
- **Resolution:** 720x1280 (9:16 vertical)
- **Sections:**
  1. Grid Screen (0:00-0:02.5): 3x3 grid of images
  2. Prompt Screen (0:02.5-0:06.25): 2 selected images + text prompt
  3. Result Display (0:06.25-0:15): Generated video playback
  4. Branding End Card (0:15-0:17.5): Logo and tagline

## Development

### Prerequisites
- Node.js 20+
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Run Remotion Studio
```bash
npm start
```

### Build for Production
```bash
npm run build
```

## Cloud Run Deployment

### Build Docker Image
```bash
docker build -t remotion-render .
```

### Test Locally
```bash
docker run -p 8080:8080 remotion-render
```

### Deploy to Google Cloud Run
```bash
# Tag image
docker tag remotion-render us-central1-docker.pkg.dev/template-stamper-d7045/remotion-templates/render:latest

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/template-stamper-d7045/remotion-templates/render:latest

# Deploy to Cloud Run
gcloud run deploy remotion-render \
  --image us-central1-docker.pkg.dev/template-stamper-d7045/remotion-templates/render:latest \
  --region us-central1 \
  --memory 8Gi \
  --cpu 4 \
  --timeout 3600 \
  --max-instances 10 \
  --allow-unauthenticated
```

## Asset Slots

### Veo Shorts V1 Props
```typescript
{
  gridImage1: string;      // 720x1280, vertical
  gridImage2: string;      // 720x1280, vertical
  gridImage3: string;      // 720x1280, vertical
  gridImage4: string;      // 720x1280, vertical
  gridImage5: string;      // 720x1280, vertical
  gridImage6: string;      // 720x1280, vertical
  gridImage7: string;      // 720x1280, vertical
  gridImage8: string;      // 720x1280, vertical
  gridImage9: string;      // 720x1280, vertical
  selectedImage1: string;  // 400x400, square
  selectedImage2: string;  // 400x400, square
  promptText: string;      // Max 100 characters
  generatedVideo: string;  // 720x1280, MP4, max 15s
}
```

## License
UNLICENSED - Internal use only
