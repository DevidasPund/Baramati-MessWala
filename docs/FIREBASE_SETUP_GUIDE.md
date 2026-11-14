# MESSMATE – FIREBASE PRODUCTION SETUP & CONNECTION GUIDE

**Application Name:** MessMate – Smart Mess & Tiffin Management System  
**Business Name:** Baramati Messwala  
**Developer:** Devidas Pund  

This guide provides instructions for connecting the production Firebase project to MessMate for Cloud Firestore, Firebase Authentication, and Firebase Storage.

---

## 1. Firebase Project Initialization in Google Cloud / Firebase Console
1. Visit the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select your existing project: `messmate-baramati`).
3. Set your project location/region (recommended: `asia-south1` Mumbai for fastest latency in Maharashtra, India).
4. Disable Google Analytics or enable if desired, and finish creation.

---

## 2. Enable Authentication Providers
1. In the Firebase Console left sidebar, click **Build > Authentication**.
2. Click **Get Started**.
3. Under **Sign-in method**, enable **Email/Password**.
4. In **Authorized domains**, add:
   - `localhost`
   - `baramatimesswala.com`
   - Your Vercel domain: `<your-messmate-app>.vercel.app`

---

## 3. Enable Cloud Firestore Database
1. In the left sidebar, navigate to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose **Native mode**.
4. Select location `asia-south1` (Mumbai).
5. Deploy the provided production security rules located in your workspace root:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   *(Or copy the contents of `firestore.rules` directly into the Firestore Rules tab in the console)*.

---

## 4. Enable Firebase Storage
1. Navigate to **Build > Storage**.
2. Click **Get Started** and select default location.
3. Deploy the provided rules:
   ```bash
   firebase deploy --only storage
   ```
   *(Or copy the contents of `storage.rules` directly into the Storage Rules tab in the console)*.

---

## 5. Obtain Firebase Admin SDK Credentials (Backend & Serverless)
1. Go to **Project Settings** (gear icon) > **Service accounts**.
2. Under **Firebase Admin SDK**, select **Node.js** and click **Generate new private key**.
3. Save the downloaded JSON file as `firebase-service-account.json` in the `backend/` directory:
   ```
   backend/firebase-service-account.json
   ```
   *(Note: This file is already ignored by `.gitignore` and must never be committed to public GitHub)*.
4. Alternatively, on cloud hosts like Vercel or Render, set these environment variables:
   - `FIREBASE_PROJECT_ID`: Your project ID (e.g. `messmate-baramati`)
   - `FIREBASE_CLIENT_EMAIL`: Your service account email
   - `FIREBASE_PRIVATE_KEY`: Your service account private key (with escaped `\n`)
   - `FIREBASE_STORAGE_BUCKET`: `<your-project-id>.appspot.com`

---

## 6. Obtain Firebase Web Client Configuration (Frontend)
1. In **Project Settings** > **General**, scroll to **Your apps** and click the **Web (</>)** icon.
2. Register app name: `MessMate Web`.
3. Copy the config keys into `frontend/.env` (or Vercel Environment Variables):
   ```env
   VITE_FIREBASE_API_KEY="AIzaSy..."
   VITE_FIREBASE_AUTH_DOMAIN="<project-id>.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="<project-id>"
   VITE_FIREBASE_STORAGE_BUCKET="<project-id>.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
   VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef..."
   ```

---

## 7. Run One-Click Data Sync Pipeline
Once the credentials are configured, execute the migration script to populate Cloud Firestore with all 19 entities and customer accounts:
```bash
node backend/migrate-supabase-to-firebase.js
```
The script will write all documents into Firestore with exact UUID IDs and generate a verified synchronization audit report in `docs/FIREBASE_MIGRATION_REPORT.md`.
