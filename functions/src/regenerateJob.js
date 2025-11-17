/**
 * Regenerate Job Function for V3 Creative Engine
 * Creates a duplicate job from an existing one
 */

const admin = require('firebase-admin');

async function regenerateJob(data, context) {
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

    // Create new job with same parameters
    const newJobRef = await db.collection('jobs').add({
      status: 'pending',
      type: originalJob.type,
      prompt: originalJob.prompt,
      format: originalJob.format,
      context: {
        source: 'regenerate',
        originalJobId: jobId
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[RegenerateJob] Created new job ${newJobRef.id} from ${jobId}`);

    return {
      success: true,
      newJobId: newJobRef.id,
      message: `Regenerated job created`
    };

  } catch (error) {
    console.error('[RegenerateJob] Error:', error);
    throw new Error(error.message);
  }
}

module.exports = { regenerateJob };
