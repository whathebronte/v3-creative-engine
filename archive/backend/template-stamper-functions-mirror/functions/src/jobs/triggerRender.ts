import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const storage = admin.storage();

const CLOUD_RUN_URL = 'https://remotion-render-846225698038.us-central1.run.app';

/**
 * Trigger Remotion rendering when a job is created
 * Firestore trigger: onCreate('jobs/{jobId}')
 *
 * Calls Cloud Run service to render videos
 */
export const triggerRemotionRender = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes max for Cloud Functions
    memory: '2GB', // Reduced since we're just making HTTP calls
  })
  .firestore.document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const jobId = context.params.jobId;
    const jobData = snap.data();

    functions.logger.info('Job created, triggering render', {jobId, jobData});

    try {
      // 1. Fetch template configuration
      const templateDoc = await db
        .collection('templates')
        .doc(jobData.templateId)
        .get();

      if (!templateDoc.exists) {
        throw new Error(`Template ${jobData.templateId} not found`);
      }

      const template = templateDoc.data();

      if (!template) {
        throw new Error(`Template ${jobData.templateId} has no data`);
      }

      // 2. Prepare input props from assetMappings
      const inputProps = await prepareInputProps(
        jobData.assetMappings,
        template
      );

      // 3. Generate signed URLs for assets (valid for 1 hour)
      const assetsWithSignedUrls = await generateSignedUrls(
        jobData.assetMappings
      );

      // 4. Update job status to 'rendering'
      await db.collection('jobs').doc(jobId).update({
        status: 'rendering',
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info('Calling Cloud Run render service', {
        jobId,
        composition: template.remotionCompositionId,
        serveUrl: template.remotionServeUrl,
        cloudRunUrl: CLOUD_RUN_URL,
      });

      // 5. Call Cloud Run service to render
      const response = await fetch(`${CLOUD_RUN_URL}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serveUrl: template.remotionServeUrl,
          composition: template.remotionCompositionId,
          inputProps: {
            ...inputProps,
            ...assetsWithSignedUrls,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloud Run render failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      functions.logger.info('Render completed, uploading to storage', {
        jobId,
        videoSize: result.size,
      });

      // 6. Convert base64 video to buffer
      const videoBuffer = Buffer.from(result.video, 'base64');

      // 7. Upload rendered video to Cloud Storage
      const firebaseStoragePath = `videos/${jobId}/output.mp4`;
      const bucket = storage.bucket();
      const file = bucket.file(firebaseStoragePath);

      await file.save(videoBuffer, {
        metadata: {
          contentType: 'video/mp4',
          metadata: {
            jobId,
            templateId: template.id,
            renderedAt: new Date().toISOString(),
          },
        },
      });

      // 8. Get signed URL for the video (1 year expiry)
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });

      // 9. Update job as completed
      await db.collection('jobs').doc(jobId).update({
        status: 'completed',
        progress: 100,
        outputVideoUrl: `gs://${bucket.name}/${firebaseStoragePath}`,
        outputVideoPublicUrl: signedUrl,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info('Job completed successfully', {
        jobId,
        outputVideoUrl: signedUrl,
      });
    } catch (error) {
      functions.logger.error('Error triggering render', {jobId, error});

      await db.collection('jobs').doc(jobId).update({
        status: 'failed',
        error: {
          code: 'render_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
    }
  });

/**
 * Prepare input props for Remotion template from asset mappings
 */
async function prepareInputProps(
  assetMappings: any[],
  template: any
): Promise<Record<string, any>> {
  const props: Record<string, any> = {};

  for (const mapping of assetMappings) {
    const slot = template.slots.find((s: any) => s.id === mapping.slotId);
    if (slot) {
      props[slot.id] = mapping.assetUrl;
    }
  }

  return props;
}

/**
 * Generate signed URLs for assets (valid for 1 hour)
 * Only processes assets that start with gs:// (Cloud Storage URLs)
 */
async function generateSignedUrls(
  assetMappings: any[]
): Promise<Record<string, string>> {
  const bucket = storage.bucket();
  const signedUrls: Record<string, string> = {};

  for (const mapping of assetMappings) {
    // Skip if not a Cloud Storage URL (e.g., text values or direct URLs)
    if (!mapping.assetUrl || !mapping.assetUrl.startsWith('gs://')) {
      continue;
    }

    const filePath = mapping.assetUrl.replace('gs://' + bucket.name + '/', '');
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    signedUrls[mapping.slotId] = url;
  }

  return signedUrls;
}
