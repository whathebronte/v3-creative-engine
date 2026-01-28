/**
 * Expand Image Job Function for V3 Creative Engine
 * Creates a zoomed-out version of an image to show more context
 */

const admin = require('firebase-admin');

async function expandImageJob(data, context) {
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

    if (originalJob.type !== 'image') {
      throw new Error('Can only expand images');
    }

    // Modify prompt to request zoomed-out view
    const expandedPrompt = `${originalJob.prompt}, zoomed out perspective, wider view showing more context and surroundings`;

    // Create new job with expanded view
    const newJobRef = await db.collection('jobs').add({
      status: 'pending',
      type: 'image',
      prompt: expandedPrompt,
      format: originalJob.format,
      country: originalJob.country || 'korea',  // Preserve country from original job
      context: {
        source: 'expand',
        originalJobId: jobId,
        instruction: 'Expand frame to show more of the scene'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[ExpandImage] Created expanded job ${newJobRef.id} from ${jobId}`);

    return {
      success: true,
      newJobId: newJobRef.id,
      message: `Expanded image job created`
    };

  } catch (error) {
    console.error('[ExpandImage] Error:', error);
    throw new Error(error.message);
  }
}

module.exports = { expandImageJob };
