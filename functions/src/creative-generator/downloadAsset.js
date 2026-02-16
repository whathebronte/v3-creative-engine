/**
 * Download Asset Cloud Function
 * Proxies downloads from Firebase Storage with proper headers
 */

const admin = require('firebase-admin');

async function downloadAsset(req, res) {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { url } = req.query;

    if (!url) {
      res.status(400).json({ error: 'URL parameter required' });
      return;
    }

    console.log('[DownloadAsset] Downloading:', url);

    // Fetch from Firebase Storage
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Determine filename from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1].split('?')[0] || 'download';

    // Set headers for download
    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    res.set('Content-Length', buffer.byteLength.toString());

    // Send file
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('[DownloadAsset] Error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { downloadAsset };
