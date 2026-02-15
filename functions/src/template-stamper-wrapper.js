/**
 * Template Stamper Functions Wrapper
 * Bridges TypeScript ES modules with CommonJS main index
 */

const functions = require('firebase-functions');

// MCP Bridge - Receive assets from Creative Generator
exports.mcpReceiveAssets = functions.https.onRequest(async (req, res) => {
  try {
    const { mcpReceiveAssets } = await import('./template-stamper/index.js');
    return mcpReceiveAssets(req, res);
  } catch (error) {
    console.error('Error loading Template Stamper MCP function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API - Get all templates
exports.getTemplates = functions.https.onRequest(async (req, res) => {
  try {
    const { getTemplates } = await import('./template-stamper/index.js');
    return getTemplates(req, res);
  } catch (error) {
    console.error('Error loading Template Stamper getTemplates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API - Get single template
exports.getTemplate = functions.https.onRequest(async (req, res) => {
  try {
    const { getTemplate } = await import('./template-stamper/index.js');
    return getTemplate(req, res);
  } catch (error) {
    console.error('Error loading Template Stamper getTemplate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API - Create job
exports.createJob = functions.https.onRequest(async (req, res) => {
  try {
    const { createJob } = await import('./template-stamper/index.js');
    return createJob(req, res);
  } catch (error) {
    console.error('Error loading Template Stamper createJob:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API - Get job
exports.getJob = functions.https.onRequest(async (req, res) => {
  try {
    const { getJob } = await import('./template-stamper/index.js');
    return getJob(req, res);
  } catch (error) {
    console.error('Error loading Template Stamper getJob:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API - Get job history
exports.getJobHistory = functions.https.onRequest(async (req, res) => {
  try {
    const { getJobHistory } = await import('./template-stamper/index.js');
    return getJobHistory(req, res);
  } catch (error) {
    console.error('Error loading Template Stamper getJobHistory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Job Processing - Trigger Remotion Render (Firestore trigger)
exports.triggerRemotionRender = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    try {
      const { triggerRemotionRender } = await import('./template-stamper/index.js');
      return triggerRemotionRender(snap, context);
    } catch (error) {
      console.error('Error loading Template Stamper triggerRemotionRender:', error);
      throw error;
    }
  });

// Asset Processing - Preprocess asset
exports.preprocessAsset = functions.https.onRequest(async (req, res) => {
  try {
    const { preprocessAsset } = await import('./template-stamper/index.js');
    return preprocessAsset(req, res);
  } catch (error) {
    console.error('Error loading Template Stamper preprocessAsset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
