const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'template-stamper-d7045',
});

const db = admin.firestore();
const storage = admin.storage();

async function createTestJob() {
  // Use placeholder images (will be replaced with actual assets later)
  const placeholderImage = 'https://placehold.co/720x1280/4A90E2/FFFFFF/png?text=Test+Image';
  const placeholderSquare = 'https://placehold.co/400x400/4A90E2/FFFFFF/png?text=Test+Image';
  const placeholderVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const jobData = {
    templateId: 'veo-shorts-v1',
    status: 'pending',
    progress: 0,

    // Asset mappings (using placeholder URLs)
    assetMappings: [
      { slotId: 'gridImage1', assetUrl: placeholderImage },
      { slotId: 'gridImage2', assetUrl: placeholderImage },
      { slotId: 'gridImage3', assetUrl: placeholderImage },
      { slotId: 'gridImage4', assetUrl: placeholderImage },
      { slotId: 'gridImage5', assetUrl: placeholderImage },
      { slotId: 'gridImage6', assetUrl: placeholderImage },
      { slotId: 'gridImage7', assetUrl: placeholderImage },
      { slotId: 'gridImage8', assetUrl: placeholderImage },
      { slotId: 'gridImage9', assetUrl: placeholderImage },
      { slotId: 'selectedImage1', assetUrl: placeholderSquare },
      { slotId: 'selectedImage2', assetUrl: placeholderSquare },
      { slotId: 'promptText', assetUrl: 'A futuristic city with flying cars and neon lights' },
      { slotId: 'generatedVideo', assetUrl: placeholderVideo },
    ],

    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const jobRef = await db.collection('jobs').add(jobData);
    console.log('✅ Test job created successfully');
    console.log('Job ID:', jobRef.id);
    console.log('Template:', jobData.templateId);
    console.log('Status:', jobData.status);
    console.log('\nMonitor job progress:');
    console.log(`firebase firestore:get jobs/${jobRef.id}`);
    console.log('\nOr watch the logs:');
    console.log('firebase functions:log --only triggerRemotionRender');
  } catch (error) {
    console.error('❌ Error creating test job:', error);
    process.exit(1);
  }

  // Don't exit immediately - wait a bit to see if the function triggers
  console.log('\nWaiting 5 seconds for Cloud Function to trigger...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  process.exit(0);
}

createTestJob();
