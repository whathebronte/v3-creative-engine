/**
 * Iterate Job Function for V3 Creative Engine
 * Creates a variation of an existing job using AI variation parameter
 */

const admin = require('firebase-admin');

async function iterateJob(data, context) {
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

    // Create new job with variation instruction
    // The AI will create a variation while keeping the same general concept
    const newJobRef = await db.collection('jobs').add({
      status: 'pending',
      type: originalJob.type,
      prompt: originalJob.prompt,
      format: originalJob.format,
      country: originalJob.country || 'korea',  // Preserve country from original job
      context: {
        source: 'iterate',
        originalJobId: jobId,
        variation: true,
        instruction: 'Create a variation of this content with similar theme but different details'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[IterateJob] Created variation job ${newJobRef.id} from ${jobId}`);

    return {
      success: true,
      newJobId: newJobRef.id,
      message: `Variation job created`
    };

  } catch (error) {
    console.error('[IterateJob] Error:', error);
    throw new Error(error.message);
  }
}

module.exports = { iterateJob };
