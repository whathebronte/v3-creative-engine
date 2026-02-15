import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Get all templates
 * GET /getTemplates
 */
export const getTemplates = functions.https.onCall(async (data, context) => {
  try {
    const templatesSnapshot = await db
      .collection('templates')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .get();

    const templates = templatesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { templates };
  } catch (error) {
    functions.logger.error('Error fetching templates', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch templates');
  }
});

/**
 * Get single template by ID
 * GET /getTemplate
 */
export const getTemplate = functions.https.onCall(async (data, context) => {
  const { templateId } = data;

  if (!templateId) {
    throw new functions.https.HttpsError('invalid-argument', 'templateId is required');
  }

  try {
    const templateDoc = await db.collection('templates').doc(templateId).get();

    if (!templateDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Template not found');
    }

    return {
      template: {
        id: templateDoc.id,
        ...templateDoc.data(),
      },
    };
  } catch (error) {
    functions.logger.error('Error fetching template', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch template');
  }
});
