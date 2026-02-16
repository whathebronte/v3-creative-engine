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

    let originalJob = null;
    let jobType = 'image';
    let jobFormat = '1:1';
    let jobPrompt = 'Regenerated asset';
    let jobCountry = 'korea';

    // Try to get original job from jobs collection
    const originalJobDoc = await db.collection('jobs').doc(jobId).get();

    if (originalJobDoc.exists) {
      // Job document found
      originalJob = originalJobDoc.data();
      jobType = originalJob.type;
      jobFormat = originalJob.format;
      jobPrompt = originalJob.prompt;
      jobCountry = originalJob.country || 'korea';
    } else {
      // Job not found - try to find it in gallery collection
      console.log(`[RegenerateJob] Job ${jobId} not found in jobs collection, checking gallery...`);

      const gallerySnapshot = await db.collection('gallery')
        .where('assetId', '==', jobId)
        .limit(1)
        .get();

      if (!gallerySnapshot.empty) {
        const galleryDoc = gallerySnapshot.docs[0];
        const galleryData = galleryDoc.data();

        jobType = galleryData.type || 'image';
        jobFormat = galleryData.format || '1:1';
        jobPrompt = galleryData.prompt || 'Uploaded asset';
        jobCountry = galleryData.country || 'korea';

        console.log(`[RegenerateJob] Found asset in gallery: type=${jobType}, format=${jobFormat}`);
      } else {
        throw new Error('Asset not found in jobs or gallery collections');
      }
    }

    // Use newPrompt if provided, otherwise use original prompt
    const promptToUse = newPrompt || jobPrompt;
    const source = newPrompt ? 'prompt-iterate' : 'regenerate';

    console.log(`[RegenerateJob] Creating job with source: ${source}`);
    if (newPrompt) {
      console.log(`[RegenerateJob] Using new prompt: ${newPrompt}`);
    }

    // Create new job with same parameters (or updated prompt)
    const newJobRef = await db.collection('jobs').add({
      status: 'pending',
      type: jobType,
      prompt: promptToUse,
      format: jobFormat,
      country: jobCountry,
      context: {
        source: source,
        originalJobId: jobId,
        ...(newPrompt && { originalPrompt: jobPrompt })  // Store original prompt if modified
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
