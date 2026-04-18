const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'template-stamper-d7045',
});

const db = admin.firestore();

async function createVeoShortsV1Template() {
  const templateData = {
    id: 'veo-shorts-v1',
    name: 'Veo Shorts V1',
    description: 'Vertical video template showcasing AI-generated content with grid intro, prompt display, and branded ending',
    status: 'active',
    version: '1.0.0',

    // Remotion configuration
    remotionServeUrl: 'https://firebasestorage.googleapis.com/v0/b/template-stamper-d7045.firebasestorage.app/o/remotion-bundle%2Fbuild%2Findex.html?alt=media',
    remotionCompositionId: 'veo-shorts-v1',

    // Video specifications
    specs: {
      width: 720,
      height: 1280,
      fps: 24,
      durationInFrames: 420,
      durationInSeconds: 17.5,
    },

    // Asset slots
    slots: [
      // Section 1: Grid images (9:16)
      { id: 'gridImage1', type: 'image', required: true, aspectRatio: '9:16', minWidth: 720, minHeight: 1280, description: 'Grid image 1' },
      { id: 'gridImage2', type: 'image', required: true, aspectRatio: '9:16', minWidth: 720, minHeight: 1280, description: 'Grid image 2' },
      { id: 'gridImage3', type: 'image', required: true, aspectRatio: '9:16', minWidth: 720, minHeight: 1280, description: 'Grid image 3' },
      { id: 'gridImage4', type: 'image', required: true, aspectRatio: '9:16', minWidth: 720, minHeight: 1280, description: 'Grid image 4' },
      { id: 'gridImage5', type: 'image', required: true, aspectRatio: '9:16', minWidth: 720, minHeight: 1280, description: 'Grid image 5' },
      { id: 'gridImage6', type: 'image', required: true, aspectRatio: '9:16', minWidth: 720, minHeight: 1280, description: 'Grid image 6' },
      { id: 'gridImage7', type: 'image', required: true, aspectRatio: '9:16', minWidth: 720, minHeight: 1280, description: 'Grid image 7' },
      { id: 'gridImage8', type: 'image', required: true, aspectRatio: '9:16', minWidth: 720, minHeight: 1280, description: 'Grid image 8' },
      { id: 'gridImage9', type: 'image', required: true, aspectRatio: '9:16', minWidth: 720, minHeight: 1280, description: 'Grid image 9' },

      // Section 2: Selected images (1:1)
      { id: 'selectedImage1', type: 'image', required: true, aspectRatio: '1:1', minWidth: 400, minHeight: 400, description: 'Selected image 1' },
      { id: 'selectedImage2', type: 'image', required: true, aspectRatio: '1:1', minWidth: 400, minHeight: 400, description: 'Selected image 2' },

      // Section 2: Prompt text
      { id: 'promptText', type: 'text', required: true, maxLength: 200, description: 'Prompt text displayed on screen' },

      // Section 3-4: Generated video
      { id: 'generatedVideo', type: 'video', required: true, aspectRatio: '9:16', minWidth: 720, minHeight: 1280, description: 'AI-generated video result' },
    ],

    // Metadata
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection('templates').doc('veo-shorts-v1').set(templateData);
    console.log('✅ Template veo-shorts-v1 created successfully');
    console.log('Template ID:', templateData.id);
    console.log('Remotion Serve URL:', templateData.remotionServeUrl);
    console.log('Asset slots:', templateData.slots.length);
  } catch (error) {
    console.error('❌ Error creating template:', error);
    process.exit(1);
  }

  process.exit(0);
}

createVeoShortsV1Template();
