/**
 * Call Gemini Agent - Secure server-side API calls
 * Keeps API key private and secure
 */

const functions = require('firebase-functions');

// Get API key from environment (loaded from .env or Firebase config)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || functions.config().gemini?.key;
const GEMINI_MODEL = 'gemini-2.0-flash';

/**
 * Callable Cloud Function to call Gemini API securely
 * This keeps the API key server-side and never exposes it to the client
 */
async function callGeminiAgent(data, context) {
  try {
    // Validate input
    if (!data.systemPrompt || !data.userMessage) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: systemPrompt and userMessage'
      );
    }

    // Check if API key is configured
    if (!GEMINI_API_KEY) {
      console.error('[Gemini] API key not configured');
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Gemini API key not configured on server'
      );
    }

    const { systemPrompt, userMessage } = data;

    // Build Gemini API request
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: userMessage }]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    console.log('[Gemini] Calling API for model:', GEMINI_MODEL);

    // Call Gemini API
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Gemini] API error:', errorData);
      throw new functions.https.HttpsError(
        'internal',
        `Gemini API error: ${response.status}`,
        errorData
      );
    }

    const responseData = await response.json();

    // Extract the generated text
    const generatedText = responseData.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      throw new functions.https.HttpsError(
        'internal',
        'No response from Gemini API'
      );
    }

    console.log('[Gemini] Successfully generated response, length:', generatedText.length);

    // Return the response
    return {
      success: true,
      response: generatedText,
      model: GEMINI_MODEL
    };

  } catch (error) {
    console.error('[Gemini] Error:', error);

    // If it's already an HttpsError, re-throw it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Otherwise wrap it
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Unknown error calling Gemini API'
    );
  }
}

module.exports = { callGeminiAgent };
