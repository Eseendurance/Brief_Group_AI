import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Vercel env vars store newlines as literal \n — convert them back.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null; // Not configured yet — callers must handle this.
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminDb() {
  const app = getAdminApp();
  if (!app) return null;
  return getFirestore(app);
}

export function getAdminAuth() {
  const app = getAdminApp();
  if (!app) return null;
  return getAuth(app);
}

// Verifies the Firebase ID token sent from the client in the Authorization header.
// Every protected API route should call this — this is the real auth check,
// not a decorative one.
export async function verifyRequestUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || token.length > 8192) return { error: 'Missing or invalid Authorization bearer token', status: 401 };

  let adminAuth;
  try {
    adminAuth = getAdminAuth();
  } catch (err) {
    console.error('Firebase Admin auth initialization failed', err);
    return { error: 'Server authentication is temporarily unavailable.', status: 503 };
  }
  if (!adminAuth) return { error: 'Server auth is not configured (missing Firebase Admin env vars)', status: 503 };

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}
