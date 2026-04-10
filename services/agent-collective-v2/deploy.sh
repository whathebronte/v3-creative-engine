#!/bin/bash
# Deploy Agent Collective V2 backend to Cloud Run
#
# Usage:
#   cd services/agent-collective-v2
#   ./deploy.sh

set -euo pipefail

PROJECT_ID="v3-creative-engine"
REGION="us-central1"
SERVICE_NAME="agent-collective-v2"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "==> Building Docker image..."
gcloud builds submit --tag "${IMAGE}" --project "${PROJECT_ID}"

echo "==> Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 600 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "MARKET=kr,GOOGLE_API_KEY=${GOOGLE_API_KEY:?Set GOOGLE_API_KEY env var}"

echo "==> Getting service URL..."
URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --format "value(status.url)")

echo ""
echo "Deployed! Backend URL: ${URL}"
echo ""
echo "Next: firebase deploy --only hosting"
