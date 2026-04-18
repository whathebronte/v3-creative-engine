#!/usr/bin/env bash
# Deploy Creative Generator V2 backend to Cloud Run
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - Cloud Run API enabled
#   - Vertex AI API enabled
#   - Service account has: Vertex AI User, Storage Object Admin
#
# Usage:
#   cd services/creative-generator-v2
#   ./deploy.sh

set -euo pipefail

PROJECT_ID="v3-creative-engine"
SERVICE_NAME="creative-generator-v2"
REGION="us-central1"

echo "=== Deploying ${SERVICE_NAME} to Cloud Run ==="
echo "Project:  ${PROJECT_ID}"
echo "Region:   ${REGION}"
echo ""

# Build and deploy
gcloud run deploy "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --source . \
  --cpu 2 \
  --memory 2Gi \
  --timeout 600 \
  --max-instances 3 \
  --min-instances 0 \
  --set-env-vars "GCS_BUCKET=v3-creative-engine.firebasestorage.app,GCP_PROJECT_ID=${PROJECT_ID},VERTEX_AI_LOCATION=${REGION},GOOGLE_API_KEY=AIzaSyCMZ8JowGvVB3ywxAv7esCsHdFRkBD8jeg" \
  --allow-unauthenticated

echo ""
echo "=== Deployment complete ==="
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --format "value(status.url)")

echo "Service URL: ${SERVICE_URL}"
echo ""
echo "Next steps:"
echo "  1. Update frontend config: VITE_API_BASE=${SERVICE_URL}"
echo "  2. Rebuild frontend: cd ../../tools/creative-generator-v2 && npm run build"
echo "  3. Deploy frontend: cd ../.. && firebase deploy --only hosting"
