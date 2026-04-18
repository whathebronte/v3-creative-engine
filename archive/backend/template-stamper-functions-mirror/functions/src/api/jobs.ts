import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Create a new video generation job
 * POST /createJob
 */
export const createJob = functions.https.onCall(async (data, context) => {
  const { templateId, assetMappings } = data;

  if (!templateId || !assetMappings) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'templateId and assetMappings are required'
    );
  }

  try {
    // Create job document
    const jobRef = await db.collection('jobs').add({
      templateId,
      assetMappings,
      status: 'queued',
      progress: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info('Job created', { jobId: jobRef.id, templateId });

    return {
      jobId: jobRef.id,
      status: 'queued',
    };
  } catch (error) {
    functions.logger.error('Error creating job', error);
    throw new functions.https.HttpsError('internal', 'Failed to create job');
  }
});

/**
 * Get job status and details
 * GET /getJob
 */
export const getJob = functions.https.onCall(async (data, context) => {
  const { jobId } = data;

  if (!jobId) {
    throw new functions.https.HttpsError('invalid-argument', 'jobId is required');
  }

  try {
    const jobDoc = await db.collection('jobs').doc(jobId).get();

    if (!jobDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Job not found');
    }

    return {
      job: {
        id: jobDoc.id,
        ...jobDoc.data(),
      },
    };
  } catch (error) {
    functions.logger.error('Error fetching job', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch job');
  }
});

/**
 * Get job history
 * GET /getJobHistory
 */
export const getJobHistory = functions.https.onCall(async (data, context) => {
  const { limit = 50, status } = data;

  try {
    let query = db
      .collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (status) {
      query = query.where('status', '==', status);
    }

    const jobsSnapshot = await query.get();

    const jobs = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { jobs };
  } catch (error) {
    functions.logger.error('Error fetching job history', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch job history');
  }
});
