/**
 * Upscale Job Function for V3 Creative Engine
 * Creates a new job with upscaled resolution
 */

const admin = require('firebase-admin');

async function upscaleJob(data, context) {
  try {
    const { jobId } = data;

    if (!jobId) {
      throw new Error('jobId is required');
    }

    const db = admin.firestore();

    // Get original job
    const originalJobDoc = await db.collection('jobs').doc(jobId).get();

    if (!originalJobDoc.exists) {
      throw new Error('Job not found');
    }

    const originalJob = originalJobDoc.data();

    // Create new job with upscale request
    const newJobRef = await db.collection('jobs').add({
      status: 'pending',
      type: originalJob.type,
      prompt: originalJob.prompt,
      format: originalJob.format,
      context: {
        source: 'upscale',
        originalJobId: jobId,
        instruction: 'Upscale resolution while keeping content identical'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[UpscaleJob] Created upscaled job ${newJobRef.id} from ${jobId}`);

    return {
      success: true,
      newJobId: newJobRef.id,
      message: `Upscaled job created`
    };

  } catch (error) {
    console.error('[UpscaleJob] Error:', error);
    throw new Error(error.message);
  }
}

module.exports = { upscaleJob };
