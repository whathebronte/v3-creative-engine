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

    let jobType = 'image';
    let jobFormat = '1:1';
    let jobPrompt = 'Upscale';
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
      console.log(`[UpscaleJob] Job ${jobId} not found in jobs collection, checking gallery...`);

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

        console.log(`[UpscaleJob] Found asset in gallery: type=${jobType}, format=${jobFormat}`);
      } else {
        throw new Error('Asset not found in jobs or gallery collections');
      }
    }

    // Create new job with upscale request
    const newJobRef = await db.collection('jobs').add({
      status: 'pending',
      type: jobType,
      prompt: jobPrompt,
      format: jobFormat,
      country: jobCountry,
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
