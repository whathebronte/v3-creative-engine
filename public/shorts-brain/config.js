// Firebase Configuration - Updated for v3-creative-engine consolidation
export const firebaseConfig = {
    apiKey: "AIzaSyBwtQBAZ_IewB2TYCkew3ctzB4HMs9Gyn0",
    authDomain: "v3-creative-engine.firebaseapp.com",
    projectId: "v3-creative-engine",
    storageBucket: "v3-creative-engine.firebasestorage.app",
    messagingSenderId: "964100659393",
    appId: "1:964100659393:web:bc6aa41fce9a8770d55c40"
};

// Gemini API calls are proxied through the callGeminiAgent Cloud Function.
// DO NOT add a client-side Gemini API key here — it would be publicly visible
// in the browser and could be misused. Use the Cloud Function instead:
//   firebase.functions().httpsCallable('callGeminiAgent')({ prompt, context })
export const GEMINI_API_KEY = null; // Intentionally null - use Cloud Function

// App Configuration
export const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'animac-app';
