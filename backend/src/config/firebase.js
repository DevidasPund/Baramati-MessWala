import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isFirebaseInitialized = false;
let firestoreDb = null;
let firebaseStorage = null;

try {
  let credential = null;
  const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('[Firebase Admin] Initializing via FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    if (rawKey.startsWith('{')) {
      credential = admin.credential.cert(JSON.parse(rawKey));
    } else {
      const decoded = Buffer.from(rawKey, 'base64').toString('utf8');
      credential = admin.credential.cert(JSON.parse(decoded));
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    console.log('[Firebase Admin] Found local firebase-service-account.json file.');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.log('[Firebase Admin] Using environment variables for Firebase Admin credentials.');
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }

  if (credential) {
    const appConfig = { credential };
    if (process.env.FIREBASE_STORAGE_BUCKET) {
      appConfig.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    }
    if (process.env.FIREBASE_DATABASE_URL) {
      appConfig.databaseURL = process.env.FIREBASE_DATABASE_URL;
    }

    if (!admin.apps.length) {
      admin.initializeApp(appConfig);
    }

    firestoreDb = admin.firestore();
    firebaseStorage = admin.storage();
    isFirebaseInitialized = true;
    console.log('âœ” [Firebase Admin] Firebase Admin SDK successfully connected & initialized!');
  } else {
    console.log('â„¹ [Firebase Admin] Firebase credentials not provided yet in environment or serviceAccount file.');
  }
} catch (error) {
  console.warn('âš  [Firebase Admin] Initialization warning:', error.message);
}

export { admin, firestoreDb, firebaseStorage, isFirebaseInitialized };
export default admin;
