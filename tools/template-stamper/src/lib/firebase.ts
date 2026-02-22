import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration for v3-creative-engine
// NOTE: Firebase web API keys are safe to commit — they identify the project
// but are not secret credentials. Access is controlled by Firestore/Storage
// Security Rules and Firebase Authentication settings.
// See: https://firebase.google.com/docs/projects/api-keys
const firebaseConfig = {
  apiKey: "AIzaSyBwtQBAZ_IewB2TYCkew3ctzB4HMs9Gyn0",
  authDomain: "v3-creative-engine.firebaseapp.com",
  projectId: "v3-creative-engine",
  storageBucket: "v3-creative-engine.firebasestorage.app",
  messagingSenderId: "964100659393",
  appId: "1:964100659393:web:bc6aa41fce9a8770d55c40"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
