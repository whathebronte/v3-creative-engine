const express = require('express');
const {bundle} = require('@remotion/bundler');
const {renderMedia, getCompositions, ensureBrowser} = require('@remotion/renderer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
app.use(express.json({limit: '50mb'}));

const PORT = process.env.PORT || 8080;
const BUNDLE_CACHE = new Map();

// Browser configuration for @remotion/renderer
// Let Remotion use its own downloaded Chrome (supports new headless mode)
const BROWSER_CONFIG = {
  chromiumOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  },
};

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({status: 'healthy', timestamp: new Date().toISOString()});
});

/**
 * Render video endpoint
 * POST /render
 * Body: {
 *   serveUrl: string,
 *   composition: string,
 *   inputProps: object
 * }
 */
app.post('/render', async (req, res) => {
  const {serveUrl, composition, inputProps} = req.body;

  if (!serveUrl || !composition || !inputProps) {
    return res.status(400).json({
      error: 'Missing required fields: serveUrl, composition, inputProps',
    });
  }

  console.log('Render request received', {
    serveUrl,
    composition,
    inputPropsKeys: Object.keys(inputProps),
  });

  try {
    // Create temporary directory for output
    const tmpDir = os.tmpdir();
    const outputPath = path.join(tmpDir, `${Date.now()}.mp4`);

    console.log('Starting render', {outputPath, serveUrl, composition});

    // First, verify Chromium is available
    console.log('Checking Chromium path:', process.env.PUPPETEER_EXECUTABLE_PATH);
    if (fs.existsSync('/usr/bin/chromium-browser')) {
      console.log('Chromium found at /usr/bin/chromium-browser');
    } else {
      console.error('WARNING: Chromium not found at expected path');
    }

    // Ensure browser is available
    console.log('Ensuring browser is available...');
    try {
      await ensureBrowser(BROWSER_CONFIG);
      console.log('Browser ensured successfully');
    } catch (browserError) {
      console.error('Failed to ensure browser:', browserError);
      throw new Error(`Browser not available: ${browserError.message}`);
    }

    // Get compositions first to verify bundle is accessible
    console.log('Fetching compositions from serveUrl...');
    try {
      const compositions = await getCompositions(serveUrl, BROWSER_CONFIG);
      console.log('Available compositions:', compositions.map(c => c.id));

      const targetComp = compositions.find(c => c.id === composition);
      if (!targetComp) {
        throw new Error(`Composition "${composition}" not found. Available: ${compositions.map(c => c.id).join(', ')}`);
      }
      console.log('Target composition found:', targetComp);
    } catch (compError) {
      console.error('Failed to get compositions:', compError);
      throw new Error(`Cannot access Remotion bundle: ${compError.message}`);
    }

    console.log('Starting video render with @remotion/renderer...');

    // Render the video
    await renderMedia({
      serveUrl,
      composition,
      codec: 'h264',
      inputProps,
      outputLocation: outputPath,
      ...BROWSER_CONFIG,
      onProgress: ({progress}) => {
        const percent = Math.round(progress * 100);
        console.log(`Render progress: ${percent}%`);
      },
      onDownload: (src) => {
        console.log('Downloading asset:', src);
      },
    });

    console.log('Render completed successfully', {outputPath});

    // Verify output file exists and has content
    if (!fs.existsSync(outputPath)) {
      throw new Error('Output file was not created');
    }

    const stats = fs.statSync(outputPath);
    console.log('Output file size:', stats.size, 'bytes');

    if (stats.size === 0) {
      throw new Error('Output file is empty');
    }

    // Read the rendered file
    const videoBuffer = fs.readFileSync(outputPath);

    // Clean up
    fs.unlinkSync(outputPath);
    console.log('Cleaned up temporary file');

    // Return video as base64
    const base64Video = videoBuffer.toString('base64');
    console.log('Sending response with base64 video, size:', videoBuffer.length);

    res.json({
      success: true,
      video: base64Video,
      size: videoBuffer.length,
    });
  } catch (error) {
    console.error('=== RENDER ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Log additional error details if available
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }

    res.status(500).json({
      error: 'Render failed',
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
    });
  }
});

/**
 * Get compositions from a bundle
 * POST /compositions
 * Body: { serveUrl: string }
 */
app.post('/compositions', async (req, res) => {
  const {serveUrl} = req.body;

  if (!serveUrl) {
    return res.status(400).json({error: 'Missing required field: serveUrl'});
  }

  try {
    const compositions = await getCompositions(serveUrl, BROWSER_CONFIG);
    res.json({compositions});
  } catch (error) {
    console.error('Get compositions error:', error);
    res.status(500).json({
      error: 'Failed to get compositions',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Remotion Cloud Run service listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Render endpoint: http://localhost:${PORT}/render`);
});
