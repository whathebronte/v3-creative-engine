/**
 * Video Operation Poller for V3 Creative Engine
 * Checks status of long-running Veo 3 video generation operations
 * Runs every minute via Cloud Scheduler
 */

const admin = require('firebase-admin');
const GeminiClient = require('../general-context/gemini');

/**
 * Poll all 'generating' video jobs and check their operation status
 * Triggered by Cloud Scheduler (PubSub)
 */
async function pollVideoOperations(message, context) {
  console.log('[VideoPoller] Starting video operation poll');

  const db = admin.firestore();

  try {
    // Get all jobs with status 'generating'
    const generatingJobs = await db.collection('jobs')
      .where('status', '==', 'generating')
      .where('type', '==', 'video')
      .get();

    if (generatingJobs.empty) {
      console.log('[VideoPoller] No generating videos found');
      return { success: true, processed: 0 };
    }

    console.log(`[VideoPoller] Found ${generatingJobs.size} generating videos`);

    // Initialize Gemini client
    const apiKey = process.env.GEMINI_API_KEY;
    const projectId = process.env.GCP_PROJECT_ID || 'v3-creative-engine';
    const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
    const gemini = new GeminiClient(apiKey, projectId, location);

    // Check each operation
    let completed = 0;
    let errors = 0;

    for (const doc of generatingJobs.docs) {
      const jobId = doc.id;
      const job = doc.data();
      const operationId = job.operationId;

      if (!operationId) {
        console.error(`[VideoPoller] Job ${jobId} has no operationId`);
        continue;
      }

      try {
        console.log(`[VideoPoller] Checking operation for job ${jobId}`);

        // Check operation status
        const status = await gemini.checkVideoOperationStatus(operationId);

        if (status.done) {
          if (status.error) {
            // Operation failed
            console.error(`[VideoPoller] Job ${jobId} failed: ${status.error}`);
            await doc.ref.update({
              status: 'error',
              error: status.error,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            errors++;

          } else if (status.videoUri) {
            // Operation succeeded - download from Gemini API and upload to Cloud Storage
            console.log(`[VideoPoller] Job ${jobId} completed! Downloading video from: ${status.videoUri}`);

            try {
              const storageUrl = await downloadAndUploadVideo(jobId, status.videoUri, gemini.apiKey);

              await doc.ref.update({
                status: 'complete',
                result: {
                  url: storageUrl,
                  metadata: job.result.metadata
                },
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });

              console.log(`[VideoPoller] Job ${jobId} video uploaded to: ${storageUrl}`);
              completed++;
            } catch (downloadError) {
              console.error(`[VideoPoller] Failed to download/upload video:`, downloadError);
              await doc.ref.update({
                status: 'error',
                error: `Failed to download video: ${downloadError.message}`,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              errors++;
            }

          } else {
            // Unexpected state
            console.error(`[VideoPoller] Job ${jobId} done but no video URI or error`);
            await doc.ref.update({
              status: 'error',
              error: 'Operation completed but no video URI found',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            errors++;
          }
        } else {
          // Still processing
          console.log(`[VideoPoller] Job ${jobId} still processing...`);

          // Update last checked timestamp
          await doc.ref.update({
            lastPolled: admin.firestore.FieldValue.serverTimestamp()
          });
        }

      } catch (error) {
        console.error(`[VideoPoller] Error checking job ${jobId}:`, error);

        // If 404 error, the operation likely expired or was cleaned up
        const is404 = error.message && error.message.includes('404');

        // Check if job is older than 10 minutes
        const jobAge = job.createdAt ? (Date.now() - job.createdAt.toMillis()) : 0;
        const isOld = jobAge > 10 * 60 * 1000; // 10 minutes

        if (is404 && isOld) {
          // Mark as expired
          console.log(`[VideoPoller] Job ${jobId} operation not found (404) and job is old (${Math.floor(jobAge / 60000)}min). Marking as expired.`);
          await doc.ref.update({
            status: 'error',
            error: 'Video generation operation expired or not found',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        errors++;
      }
    }

    console.log(`[VideoPoller] Poll complete - Completed: ${completed}, Errors: ${errors}, Still processing: ${generatingJobs.size - completed - errors}`);

    return {
      success: true,
      processed: generatingJobs.size,
      completed,
      errors
    };

  } catch (error) {
    console.error('[VideoPoller] Poll failed:', error);
    throw error;
  }
}

/**
 * Upload video to Cloud Storage
 * @param {string} jobId - Job ID
 * @param {string} base64Data - Base64 encoded video data
 * @returns {string} Public URL of uploaded video
 */
async function uploadVideoToStorage(jobId, base64Data) {
  const bucket = admin.storage().bucket();
  const fileName = `videos/${jobId}.mp4`;
  const file = bucket.file(fileName);

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');

  console.log(`[VideoPoller] Uploading video: ${fileName} (${buffer.length} bytes)`);

  await file.save(buffer, {
    metadata: {
      contentType: 'video/mp4',
      metadata: {
        jobId: jobId,
        generatedAt: new Date().toISOString()
      }
    },
    public: true,
    validation: false
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  console.log(`[VideoPoller] Video uploaded: ${publicUrl}`);

  return publicUrl;
}

/**
 * Download video from Gemini API URI and upload to Cloud Storage
 * @param {string} jobId - Job ID
 * @param {string} videoUri - Gemini API video download URI
 * @param {string} apiKey - Gemini API key for authentication
 * @returns {string} Public URL of uploaded video
 */
async function downloadAndUploadVideo(jobId, videoUri, apiKey) {
  console.log(`[VideoPoller] Downloading video from Gemini API: ${videoUri}`);

  // Download video from Gemini API
  // Add API key to the request (use & since URL already has ?alt=media)
  const downloadUrl = `${videoUri}&key=${apiKey}`;

  console.log(`[VideoPoller] Download URL: ${downloadUrl}`);

  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }

  const videoBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(videoBuffer);

  console.log(`[VideoPoller] Video downloaded: ${buffer.length} bytes`);

  // Upload to Cloud Storage
  const bucket = admin.storage().bucket();
  const fileName = `videos/${jobId}.mp4`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: {
      contentType: 'video/mp4',
      metadata: {
        jobId: jobId,
        generatedAt: new Date().toISOString(),
        source: 'gemini-api-veo'
      }
    },
    public: true,
    validation: false
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  console.log(`[VideoPoller] Video uploaded to Cloud Storage: ${publicUrl}`);

  return publicUrl;
}

module.exports = { pollVideoOperations };
