export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBwtQBAZ_IewB2TYCkew3ctzB4HMs9Gyn0',
  authDomain: 'v3-creative-engine.firebaseapp.com',
  projectId: 'v3-creative-engine',
  storageBucket: 'v3-creative-engine.firebasestorage.app',
  messagingSenderId: '964100659393',
  appId: '1:964100659393:web:v3creativeengine',
};

export const MARKETS = [
  { id: 'korea', name: 'Korea', flag: '\u{1F1F0}\u{1F1F7}' },
  { id: 'japan', name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
  { id: 'indonesia', name: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}' },
  { id: 'india', name: 'India', flag: '\u{1F1EE}\u{1F1F3}' },
];
