'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function configured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

// IMPORTANT: guard initialization behind a configured() check.
// Next.js prerenders client components on the server at build time too — if
// getAuth()/initializeApp() run with an empty/invalid API key (e.g. env vars
// not set yet in Vercel), the build throws `auth/invalid-api-key` and the
// entire deploy fails, even though every page is meant to run client-side.
// This is a common cause of "works locally, fails on Vercel" for Firebase apps.
let app = null;
let auth = null;
let db = null;
let storage = null;

if (configured()) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { auth, db, storage };
export default app;

// The UI checks this to show "Firebase isn't configured yet" instead of
// crashing, since keys are added after this build per your workflow.
export function isFirebaseConfigured() {
  return configured();
}
