/**
 * Image to Video Job Function for V3 Creative Engine
 * Creates a 5-second video animation from an image
 */

const admin = require('firebase-admin');

async function imageToVideoJob(data, context) {
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
      throw new Error('Can only convert images to video');
    }

    // Create new video job with image reference
    // For image-to-video, use a simple motion prompt instead of the original image prompt
    const videoPrompt = 'Animate this image with subtle, natural movement. Add gentle camera motion and atmospheric effects.';

    const newJobRef = await db.collection('jobs').add({
      status: 'pending',
      type: 'video',
      prompt: videoPrompt,
      format: originalJob.format || '16:9',
      sourceImageUrl: originalJob.result?.url, // Pass the image URL
      sourceImageJobId: jobId, // Reference to original image job
      originalImagePrompt: originalJob.prompt, // Store original prompt for reference
      context: {
        source: 'image-to-video',
        originalJobId: jobId,
        duration: '5s',
        instruction: 'Create 5-second animation with subtle movement'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[ImageToVideo] Created video job ${newJobRef.id} from image ${jobId}`);

    return {
      success: true,
      newJobId: newJobRef.id,
      message: `Video job created from image`
    };

  } catch (error) {
    console.error('[ImageToVideo] Error:', error);
    throw new Error(error.message);
  }
}

module.exports = { imageToVideoJob };
