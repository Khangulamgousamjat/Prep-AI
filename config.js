// ==========================================
// config.js — Environment Loader & Firebase Init
// ==========================================

// Global references (set synchronously via hardcoded fallbacks immediately,
// then overwritten after async .env load if available)
window.GEMINI_API_KEY = 'GEMINI_API_KEY_HERE';

const FIREBASE_CONFIG = {
  apiKey:            'FIREBASE_API_KEY_HERE',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  projectId:         'your-project-id',
  storageBucket:     'your-project-id.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             '1:YOUR_SENDER_ID:web:5ee8910e878210549184c8',
  measurementId:     'G-XXXXXXXXXX'
};

// Initialize Firebase synchronously so auth/db are ready for DOMContentLoaded
try {
  firebase.initializeApp(FIREBASE_CONFIG);
} catch(e) {
  console.warn('Firebase init skipped (already initialized):', e.message);
}

let auth = null;
let db = null;

try {
  auth = firebase.auth();
  db   = firebase.firestore();
  console.log('Firebase Auth & Firestore initialized successfully.');
} catch(e) {
  console.warn('Firebase services unavailable. Running in offline mode.', e);
}
