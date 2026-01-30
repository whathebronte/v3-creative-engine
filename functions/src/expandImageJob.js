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

    let jobType = 'image';
    let jobFormat = '1:1';
    let jobPrompt = 'Expand image';
    let jobCountry = 'korea';

    // Try to get original job from jobs collection
    const originalJobDoc = await db.collection('jobs').doc(jobId).get();

    if (originalJobDoc.exists) {
      // Job document found
      const originalJob = originalJobDoc.data();
      jobType = originalJob.type;
      jobFormat = originalJob.format;
      jobPrompt = originalJob.prompt;
      jobCountry = originalJob.country || 'korea';
    } else {
      // Job not found - try to find it in gallery collection
      console.log(`[ExpandImage] Job ${jobId} not found in jobs collection, checking gallery...`);

      const gallerySnapshot = await db.collection('gallery')
        .where('assetId', '==', jobId)
        .limit(1)
        .get();

      if (!gallerySnapshot.empty) {
        const galleryDoc = gallerySnapshot.docs[0];
        const galleryData = galleryDoc.data();

        jobType = galleryData.type || 'image';
        jobFormat = galleryData.format || '1:1';
        jobPrompt = galleryData.prompt || 'Uploaded image';
        jobCountry = galleryData.country || 'korea';

        console.log(`[ExpandImage] Found asset in gallery: type=${jobType}, format=${jobFormat}`);
      } else {
        throw new Error('Asset not found in jobs or gallery collections');
      }
    }

    if (jobType !== 'image') {
      throw new Error('Can only expand images');
    }

    // Modify prompt to request zoomed-out view
    const expandedPrompt = `${jobPrompt}, zoomed out perspective, wider view showing more context and surroundings`;

    // Create new job with expanded view
    const newJobRef = await db.collection('jobs').add({
      status: 'pending',
      type: 'image',
      prompt: expandedPrompt,
      format: jobFormat,
      country: jobCountry,
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
