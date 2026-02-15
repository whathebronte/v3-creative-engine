const admin = require('firebase-admin');

// Initialize Firebase Admin (reuse existing app)
try {
  admin.app();
} catch (e) {
  admin.initializeApp({
    projectId: 'template-stamper-d7045',
  });
}

const db = admin.firestore();

async function checkJobStatus() {
  const jobId = process.argv[2] || 'bSCQpz0ax6Wsk2khGtFw';

  try {
    const jobDoc = await db.collection('jobs').doc(jobId).get();

    if (!jobDoc.exists) {
      console.log('❌ Job not found');
      process.exit(1);
    }

    const job = jobDoc.data();
    console.log('\n📋 Job Status:');
    console.log('  ID:', jobId);
    console.log('  Status:', job.status);
    console.log('  Progress:', job.progress || 0, '%');
    console.log('  Template:', job.templateId);

    if (job.startedAt) {
      console.log('  Started:', job.startedAt.toDate());
    }

    if (job.completedAt) {
      console.log('  Completed:', job.completedAt.toDate());
    }

    if (job.outputVideoPublicUrl) {
      console.log('  Output URL:', job.outputVideoPublicUrl);
    }

    if (job.error) {
      console.log('\n❌ Error:');
      console.log('  Code:', job.error.code);
      console.log('  Message:', job.error.message);
    }

    console.log('');
  } catch (error) {
    console.error('❌ Error checking job:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkJobStatus();
