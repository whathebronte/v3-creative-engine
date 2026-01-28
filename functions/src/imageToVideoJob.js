/**
 * Image to Video Job Function for V3 Creative Engine
 * Creates a 5-second video animation from an image
 */

const admin = require('firebase-admin');

async function imageToVideoJob(data, context) {
  try {
    const { jobId, imageUrl } = data;

    if (!jobId && !imageUrl) {
      throw new Error('Either jobId or imageUrl is required');
    }

    const db = admin.firestore();

    let sourceImageUrl;
    let originalFormat = '16:9';
    let originalPrompt = '';
    let country = 'korea';  // Default country

    // Check if this is an uploaded image (jobId starts with 'upload_')
    if (jobId && jobId.startsWith('upload_')) {
      console.log(`[ImageToVideo] Processing uploaded image: ${jobId}`);

      // For uploaded images, we need to get the URL from the gallery or use the provided imageUrl
      if (imageUrl) {
        sourceImageUrl = imageUrl;
      } else {
        // Try to find the image in gallery collection
        const gallerySnapshot = await db.collection('gallery')
          .where('assetId', '==', jobId)
          .limit(1)
          .get();

        if (gallerySnapshot.empty) {
          throw new Error('Uploaded image not found in gallery');
        }

        const galleryDoc = gallerySnapshot.docs[0];
        const galleryData = galleryDoc.data();
        sourceImageUrl = galleryData.url;
        originalFormat = galleryData.format || '1:1';
        originalPrompt = galleryData.prompt || 'Uploaded image';
        country = galleryData.country || 'korea';  // Get country from gallery
      }

    } else {
      // This is a generated image with a job document
      const originalJobDoc = await db.collection('jobs').doc(jobId).get();

      if (!originalJobDoc.exists) {
        throw new Error('Job not found');
      }

      const originalJob = originalJobDoc.data();

      if (originalJob.type !== 'image') {
        throw new Error('Can only convert images to video');
      }

      sourceImageUrl = originalJob.result?.url;
      originalFormat = originalJob.format || '16:9';
      originalPrompt = originalJob.prompt || '';
      country = originalJob.country || 'korea';  // Get country from original job
    }

    if (!sourceImageUrl) {
      throw new Error('Source image URL not found');
    }

    // Convert unsupported aspect ratios for video generation
    // Gemini API Veo doesn't support 1:1, convert to 9:16 (portrait) as fallback
    let videoFormat = originalFormat;
    if (originalFormat === '1:1' || originalFormat === '4:3' || originalFormat === '3:4') {
      videoFormat = '9:16'; // Default to portrait for square/unusual ratios
      console.log(`[ImageToVideo] Converting unsupported aspect ratio ${originalFormat} to ${videoFormat} for video generation`);
    }

    // Create new video job with image reference
    // For image-to-video, use a simple motion prompt instead of the original image prompt
    const videoPrompt = 'Animate this image with subtle, natural movement. Add gentle camera motion and atmospheric effects.';

    const newJobRef = await db.collection('jobs').add({
      status: 'pending',
      type: 'video',
      prompt: videoPrompt,
      format: videoFormat,
      country: country,  // Preserve country from original image
      sourceImageUrl: sourceImageUrl, // Pass the image URL
      sourceImageJobId: jobId, // Reference to original image job
      originalImagePrompt: originalPrompt, // Store original prompt for reference
      originalImageFormat: originalFormat, // Store original format for reference
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
