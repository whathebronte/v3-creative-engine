# Video Polling Scheduler Setup

## Overview

The video generation system uses Cloud Scheduler to poll for video completion every minute.

## Setup Steps

### 1. Create Pub/Sub Topic

Run this command to create the topic:

```bash
gcloud pubsub topics create video-operations-poll --project=v3-creative-engine
```

Or create via console:
https://console.cloud.google.com/cloudpubsub/topic/list?project=v3-creative-engine

### 2. Create Cloud Scheduler Job

Run this command:

```bash
gcloud scheduler jobs create pubsub video-poller \
  --schedule="* * * * *" \
  --topic=video-operations-poll \
  --message-body='{"trigger":"scheduled"}' \
  --location=us-central1 \
  --project=v3-creative-engine \
  --description="Poll Veo 3 video generation operations every minute"
```

Or create via console:
https://console.cloud.google.com/cloudscheduler?project=v3-creative-engine

**Settings:**
- Name: `video-poller`
- Frequency: `* * * * *` (every minute)
- Timezone: Your preferred timezone
- Target: Pub/Sub
- Topic: `video-operations-poll`
- Payload: `{"trigger":"scheduled"}`

### 3. Deploy Functions

The poller function is already registered in `functions/src/index.js`:

```bash
firebase deploy --only functions
```

### 4. Verify Setup

Check that the scheduler is created:
```bash
gcloud scheduler jobs list --project=v3-creative-engine
```

Check that the topic exists:
```bash
gcloud pubsub topics list --project=v3-creative-engine
```

### 5. Manual Test (Optional)

Trigger the poller manually to test:
```bash
gcloud scheduler jobs run video-poller --location=us-central1 --project=v3-creative-engine
```

Then check Cloud Functions logs:
```bash
firebase functions:log --only pollVideoOperations
```

## How It Works

1. **Video Job Created**: When user clicks "Animate", system creates video job
2. **Operation Started**: Cloud Function calls Veo 3 API, gets operation ID
3. **Job Status**: Job marked as `status: 'generating'` with operation ID stored
4. **Scheduled Polling**: Every minute, Cloud Scheduler triggers Pub/Sub
5. **Poller Function**: `pollVideoOperations` checks all `generating` jobs
6. **Status Check**: For each job, queries Google's operation endpoint
7. **Video Ready**: When done, downloads video and uploads to Cloud Storage
8. **Job Complete**: Updates job to `status: 'complete'` with video URL
9. **Frontend Updates**: Realtime listener shows video in UI

## Timeline

- User clicks Animate: Instant
- Operation starts: 1-2 seconds
- Video generates: 3-5 minutes
- Poller checks: Every 60 seconds
- Video appears: Within 1 minute of completion

So total time: **4-6 minutes** from click to video display.

## Monitoring

Watch the poller in action:
```bash
firebase functions:log --only pollVideoOperations
```

Check all video jobs:
```bash
firebase firestore:query jobs --where status==generating --where type==video
```

## Cost Estimate

- Cloud Scheduler: Free for 3 jobs/month, $0.10/job after
- Pub/Sub: First 10GB free
- Cloud Functions: ~$0.40 per million invocations
- Total scheduler cost: ~$0 for testing, ~$0.50/month for production

Video generation cost (Veo 3): ~$0.10-0.30 per 5-second video

## Troubleshooting

**Scheduler not triggering:**
- Check Cloud Scheduler is enabled: https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com?project=v3-creative-engine
- Verify timezone is correct
- Check Pub/Sub topic exists

**Poller function not receiving messages:**
- Check function is deployed: `firebase functions:list`
- Verify Pub/Sub topic name matches

**Videos stuck in 'generating':**
- Check Cloud Functions logs for errors
- Manually trigger poller to debug
- Verify Vertex AI permissions

**Operation status check fails:**
- Ensure service account has `roles/aiplatform.user` permission
- Check operation ID is valid
- Verify region is correct

## Alternative: HTTP Scheduled Function

If Pub/Sub approach has issues, you can use HTTP scheduling instead:

```bash
gcloud scheduler jobs create http video-poller-http \
  --schedule="* * * * *" \
  --uri="https://us-central1-v3-creative-engine.cloudfunctions.net/pollVideoOperations" \
  --http-method=POST \
  --location=us-central1 \
  --project=v3-creative-engine
```

And update the function to use `functions.https.onRequest` instead of Pub/Sub.
