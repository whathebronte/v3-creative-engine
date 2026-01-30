/**
 * Regenerate Job Function for V3 Creative Engine
 * Creates a duplicate job from an existing one
 */

const admin = require('firebase-admin');

async function regenerateJob(data, context) {
  try {
    const { jobId, newPrompt } = data;

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

    // Use newPrompt if provided, otherwise use original prompt
    const promptToUse = newPrompt || originalJob.prompt;
    const source = newPrompt ? 'prompt-iterate' : 'regenerate';

    console.log(`[RegenerateJob] Creating job with source: ${source}`);
    if (newPrompt) {
      console.log(`[RegenerateJob] Using new prompt: ${newPrompt}`);
    }

    // Create new job with same parameters (or updated prompt)
    const newJobRef = await db.collection('jobs').add({
      status: 'pending',
      type: originalJob.type,
      prompt: promptToUse,
      format: originalJob.format,
      country: originalJob.country || 'korea',  // Preserve country from original job
      context: {
        source: source,
        originalJobId: jobId,
        ...(newPrompt && { originalPrompt: originalJob.prompt })  // Store original prompt if modified
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
