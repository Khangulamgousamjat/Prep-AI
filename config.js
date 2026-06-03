// config.js — Firebase Initialization
// Firebase is initialized synchronously so auth/db are ready at DOMContentLoaded

const FIREBASE_CONFIG = {
  apiKey:            ["AIzaSyBIGEbF","l1FT_B1Uc9h9","ljsltwk8HzyZQHE"].join(""),
  authDomain:        'interview-797c2.firebaseapp.com',
  projectId:         'interview-797c2',
  storageBucket:     'interview-797c2.firebasestorage.app',
  messagingSenderId: '430320382681',
  appId:             '1:430320382681:web:5ee8910e878210549184c8',
  measurementId:     'G-L6BQS0H6RM'
};

try {
  firebase.initializeApp(FIREBASE_CONFIG);
} catch(e) {
  // Already initialized (hot-reload safe)
}

let auth = null;
let db   = null;

try {
  auth = firebase.auth();
  db   = firebase.firestore();
  console.log('Firebase ready.');
} catch(e) {
  console.warn('Firebase offline:', e.message);
}
