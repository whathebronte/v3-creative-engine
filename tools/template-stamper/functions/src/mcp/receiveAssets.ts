import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

const storage = admin.storage();
const db = admin.firestore();

interface MCPAsset {
  filename: string;
  data: string; // base64-encoded
  type: string; // MIME type: image/jpeg or video/mpeg
}

interface MCPRequest {
  protocol: string; // "mcp-v1"
  assets: MCPAsset[];
  metadata?: {
    source?: string;
    project?: string;
    [key: string]: any;
  };
}

/**
 * MCP Bridge Endpoint
 * Receives assets from YTM Creative Generator via Model Context Protocol
 *
 * Endpoint: POST /mcpReceiveAssets
 * Body: JSON with protocol, assets[], metadata{}
 */
export const mcpReceiveAssets = functions.https.onRequest(
  async (req: Request, res: Response) => {
    // CORS headers for development
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-mcp-secret');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const requestData = req.body as MCPRequest;

      // Validate MCP protocol
      if (!requestData.protocol || requestData.protocol !== 'mcp-v1') {
        res.status(400).json({
          error: 'Invalid MCP protocol',
          message: 'Expected protocol: "mcp-v1"',
        });
        return;
      }

      // Validate assets array
      if (!requestData.assets || !Array.isArray(requestData.assets)) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'assets array is required',
        });
        return;
      }

      // TODO: Add MCP secret validation in launch phase
      // const mcpSecret = req.headers['x-mcp-secret'];
      // if (mcpSecret !== process.env.MCP_SHARED_SECRET) {
      //   res.status(401).json({ error: 'Unauthorized' });
      //   return;
      // }

      functions.logger.info('MCP receive assets request', {
        assetCount: requestData.assets.length,
        source: requestData.metadata?.source,
      });

      // Process each asset
      const uploadedAssets = await Promise.all(
        requestData.assets.map(async (asset) => {
          return processAsset(asset, requestData.metadata);
        })
      );

      res.status(200).json({
        success: true,
        protocol: 'mcp-v1',
        assetsReceived: uploadedAssets.length,
        assets: uploadedAssets,
      });
    } catch (error) {
      functions.logger.error('MCP receive assets error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Process individual asset: upload to Firebase Storage and create Firestore record
 */
async function processAsset(
  asset: MCPAsset,
  metadata?: MCPRequest['metadata']
): Promise<{
  assetId: string;
  filename: string;
  storageUrl: string;
  type: string;
}> {
  // Validate asset
  if (!asset.filename || !asset.data || !asset.type) {
    throw new Error('Invalid asset: filename, data, and type are required');
  }

  // Validate MIME type
  const allowedTypes = ['image/jpeg', 'image/png', 'video/mpeg', 'video/mp4'];
  if (!allowedTypes.includes(asset.type)) {
    throw new Error(`Unsupported asset type: ${asset.type}`);
  }

  // Generate asset ID
  const assetId = db.collection('assets').doc().id;
  const timestamp = Date.now();

  // Determine file extension
  const ext = getFileExtension(asset.type);
  const safeFilename = sanitizeFilename(asset.filename);

  // Storage path
  const project = metadata?.project || 'default';
  const storagePath = `assets/${project}/original/${assetId}_${timestamp}.${ext}`;

  // Decode base64 data
  const buffer = Buffer.from(asset.data, 'base64');

  // Validate file size (max 100MB)
  const maxSize = 100 * 1024 * 1024;
  if (buffer.length > maxSize) {
    throw new Error(`File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (max 100MB)`);
  }

  // Upload to Firebase Storage
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  await file.save(buffer, {
    contentType: asset.type,
    metadata: {
      metadata: {
        originalFilename: safeFilename,
        source: metadata?.source || 'mcp',
        uploadedAt: new Date().toISOString(),
      },
    },
  });

  functions.logger.info('Asset uploaded to storage', {
    assetId,
    path: storagePath,
    size: buffer.length,
  });

  // Create Firestore record
  await db.collection('assets').doc(assetId).set({
    filename: safeFilename,
    storageUrl: storagePath,
    type: getAssetType(asset.type),
    format: ext,
    size: buffer.length,
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    source: 'mcp',
    preprocessed: false,
    metadata: {
      originalFilename: safeFilename,
      project: project,
      mimeType: asset.type,
      ...metadata,
    },
  });

  return {
    assetId,
    filename: safeFilename,
    storageUrl: `gs://${bucket.name}/${storagePath}`,
    type: getAssetType(asset.type),
  };
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const map: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'video/mpeg': 'mpg',
    'video/mp4': 'mp4',
  };
  return map[mimeType] || 'bin';
}

/**
 * Get asset type (image or video)
 */
function getAssetType(mimeType: string): 'image' | 'video' {
  return mimeType.startsWith('image/') ? 'image' : 'video';
}

/**
 * Sanitize filename to prevent path traversal
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}
