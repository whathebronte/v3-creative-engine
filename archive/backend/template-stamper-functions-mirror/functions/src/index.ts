import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export MCP Bridge Functions
export { mcpReceiveAssets } from './mcp/receiveAssets';

// Export API Functions
export { getTemplates, getTemplate } from './api/templates';
export { createJob, getJob, getJobHistory } from './api/jobs';

// Export Job Processing Functions
export { triggerRemotionRender } from './jobs/triggerRender';

// Export Asset Processing Functions
export { preprocessAsset } from './jobs/preprocessAsset';
