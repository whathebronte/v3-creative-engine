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
    let gallerySnapshot = null;

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

      gallerySnapshot = await db.collection('gallery')
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

    // Get the original image URL to use as reference
    let originalImageUrl = null;
    if (originalJobDoc.exists) {
      originalImageUrl = originalJobDoc.data().result?.url;
    } else if (gallerySnapshot && !gallerySnapshot.empty) {
      originalImageUrl = gallerySnapshot.docs[0].data().url;
    }

    if (!originalImageUrl) {
      throw new Error('Original image URL not found');
    }

    console.log(`[ExpandImage] Using original image URL: ${originalImageUrl}`);

    // Keep original prompt - don't modify it
    // The AI processor should use the reference image and expand outward
    const expandedPrompt = `${jobPrompt}`;

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
        referenceImageUrl: originalImageUrl,
        instruction: 'Keep the original image in the center exactly as is, and expand outward to show more surrounding context. Maintain the exact same subject and composition in the center, only add new content around the edges to create a zoomed-out view.',
        expandMode: true
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
