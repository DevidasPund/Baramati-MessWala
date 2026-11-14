import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, onSnapshot, doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseClientConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseClientConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('[Firebase Client] Initialized successfully for project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[Firebase Client] Initialization error:', err.message);
  }
} else {
  // Graceful client fallback: app operates in REST/Vite mode
}

export {
  app,
  auth,
  db,
  storage,
  isFirebaseClientConfigured,
  onSnapshot,
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
};
