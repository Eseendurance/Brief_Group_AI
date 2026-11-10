import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;
export const SESSION_COOKIE_NAME = process.env.NODE_ENV === 'production'
  ? '__Host-briefgroup_session'
  : 'briefgroup_session';

let missingConfigLogged = false;

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Vercel env vars store newlines as literal \n — convert them back.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && 'FIREBASE_ADMIN_PROJECT_ID',
      !clientEmail && 'FIREBASE_ADMIN_CLIENT_EMAIL',
      !privateKey && 'FIREBASE_ADMIN_PRIVATE_KEY',
    ].filter(Boolean);
    if (!missingConfigLogged) {
      console.error('[FIREBASE_ADMIN_CONFIG_ERROR]', `Missing required environment variables: ${missing.join(', ')}`);
      missingConfigLogged = true;
    }
    return null;
  }

  try {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } catch (error) {
    console.error('[FIREBASE_ADMIN_INIT_ERROR]', error?.code || error?.name || 'unknown');
    const configurationError = new Error(
      'Firebase Admin could not initialize. Verify the project ID, service-account email, and private key in the deployment environment.',
    );
    configurationError.code = 'FIREBASE_ADMIN_INVALID_CONFIGURATION';
    throw configurationError;
  }
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

// Verifies the Firebase session cookie used by the app, while accepting bearer
// ID tokens for backward compatibility with existing API clients.
export async function verifyRequestUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const sessionCookie = request.cookies?.get(SESSION_COOKIE_NAME)?.value || null;
  if ((!token || token.length > 8192) && !sessionCookie) {
    return { error: 'Sign in to continue.', status: 401 };
  }

  let adminAuth;
  try {
    adminAuth = getAdminAuth();
  } catch (err) {
    if (err?.code !== 'FIREBASE_ADMIN_INVALID_CONFIGURATION') {
      console.error('[FIREBASE_ADMIN_AUTH_ERROR]', err?.code || err?.name || 'unknown');
    }
    if (err?.code === 'FIREBASE_ADMIN_INVALID_CONFIGURATION') {
      return {
        error: 'Secure sign-in is unavailable because the server Firebase Admin credentials could not be initialized. The site administrator must check the Vercel function logs and Firebase Admin environment variables.',
        status: 503,
      };
    }
    return { error: 'Server authentication is temporarily unavailable.', status: 503 };
  }
  if (!adminAuth) return { error: 'Server auth is not configured (missing Firebase Admin env vars)', status: 503 };

  try {
    const decoded = token && token.length <= 8192
      ? await adminAuth.verifyIdToken(token)
      : await adminAuth.verifySessionCookie(sessionCookie);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    console.warn('[AUTH_TOKEN_REJECTED]', err?.code || err?.message || 'invalid credential');
    return { error: 'Your sign-in has expired. Please sign in again.', status: 401 };
  }
}
