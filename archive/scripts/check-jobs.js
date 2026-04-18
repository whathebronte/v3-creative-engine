/**
 * Quick script to check job status in Firestore
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkJobs() {
  try {
    console.log('🔍 Checking jobs in Firestore...\n');

    const snapshot = await db.collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (snapshot.empty) {
      console.log('No jobs found.');
      return;
    }

    snapshot.forEach(doc => {
      const job = doc.data();
      console.log(`📋 Job ID: ${doc.id}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Type: ${job.type}`);
      console.log(`   Prompt: ${job.prompt}`);
      console.log(`   Format: ${job.format}`);
      if (job.result) {
        console.log(`   Result: ${JSON.stringify(job.result.metadata || job.result, null, 2)}`);
      }
      if (job.error) {
        console.log(`   Error: ${job.error}`);
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkJobs();
