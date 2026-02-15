// Script to add a sample Veo template to Firestore
// Run with: node scripts/add-sample-template.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration (from .env or hardcoded for script)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDPCR5YogTe0vq3hJDQO0YSZJ9uAg1Nn3c",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "template-stamper-d7045.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "template-stamper-d7045",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "template-stamper-d7045.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "467854516798",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:467854516798:web:ffb4af2cbb0f8fce698f1c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample template data
const sampleTemplate = {
  name: "Veo on Shorts - 4 Grid Images",
  version: "1.0.0",
  duration: 17,
  status: "active",
  slots: [
    {
      slotId: "gridImage1",
      label: "Grid Image 1 (Top-Left)",
      type: "image",
      description: "First image in the 2x2 grid shown at video start",
      required: true
    },
    {
      slotId: "gridImage2",
      label: "Grid Image 2 (Top-Right)",
      type: "image",
      description: "Second image in the 2x2 grid",
      required: true
    },
    {
      slotId: "gridImage3",
      label: "Grid Image 3 (Bottom-Left)",
      type: "image",
      description: "Third image in the 2x2 grid",
      required: true
    },
    {
      slotId: "gridImage4",
      label: "Grid Image 4 (Bottom-Right)",
      type: "image",
      description: "Fourth image in the 2x2 grid",
      required: true
    },
    {
      slotId: "promptText",
      label: "Prompt Text",
      type: "text",
      description: "The AI prompt shown in the middle section (e.g., 'A drone shot of a beach')",
      required: true
    },
    {
      slotId: "generatedVideo",
      label: "AI Generated Video Result",
      type: "video",
      description: "The final AI-generated video to showcase",
      required: true
    }
  ],
  remotionServeUrl: "https://remotionlambda-useast1-xxxxxx.s3.amazonaws.com/sites/veo-shorts-template",
  remotionCompositionId: "VeoShortsTemplate",
  previewImageUrl: null,
  createdAt: serverTimestamp()
};

async function addTemplate() {
  try {
    console.log('Adding sample template to Firestore...');
    const docRef = await addDoc(collection(db, 'templates'), sampleTemplate);
    console.log('✅ Template added successfully with ID:', docRef.id);
    console.log('\nTemplate details:');
    console.log('- Name:', sampleTemplate.name);
    console.log('- Version:', sampleTemplate.version);
    console.log('- Duration:', sampleTemplate.duration, 'seconds');
    console.log('- Slots:', sampleTemplate.slots.length);
    console.log('  - Images:', sampleTemplate.slots.filter(s => s.type === 'image').length);
    console.log('  - Videos:', sampleTemplate.slots.filter(s => s.type === 'video').length);
    console.log('  - Text:', sampleTemplate.slots.filter(s => s.type === 'text').length);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding template:', error);
    process.exit(1);
  }
}

addTemplate();
