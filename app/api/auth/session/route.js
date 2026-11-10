import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import {
  getAdminAuth,
  getAdminDb,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/firebaseAdmin';
import { trialEndDateFromNow } from '@/lib/subscription';

export const runtime = 'nodejs';

const invalidCredentialCodes = new Set([
  'auth/argument-error',
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/invalid-credential',
  'auth/invalid-id-token',
  'auth/session-cookie-expired',
  'auth/session-cookie-revoked',
  'auth/user-disabled',
  'auth/user-not-found',
]);
const unavailableDatabaseCodes = new Set([
  'deadline-exceeded',
  'firestore/unavailable',
  'resource-exhausted',
  'unavailable',
]);

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  company: z.string().trim().max(160).optional(),
  workRole: z.enum(['Farm owner', 'Equipment operator', 'Operations manager', 'Enterprise lead']).optional(),
}).strict();

const sessionSchema = z.object({
  idToken: z.string().min(1).max(8192),
  profile: profileSchema.optional(),
}).strict();

function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

async function ensureUserProfile(adminDb, decoded, profile = {}) {
  const userRef = adminDb.collection('users').doc(decoded.uid);
  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (!snapshot.exists) {
      transaction.create(userRef, {
        name: profile.name || decoded.name || '',
        email: decoded.email || '',
        ...(profile.company ? { company: profile.company } : {}),
        ...(profile.workRole ? { workRole: profile.workRole } : {}),
        role: 'pilot-partner',
        plan: 'trial',
        trialEndsAt: trialEndDateFromNow(),
        createdAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const currentProfile = snapshot.data();
    const missingFields = {};
    if (profile.name && !currentProfile.name) missingFields.name = profile.name;
    if (profile.company && !currentProfile.company) missingFields.company = profile.company;
    if (profile.workRole && !currentProfile.workRole) missingFields.workRole = profile.workRole;
    if (Object.keys(missingFields).length) transaction.update(userRef, missingFields);
  });
}

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Request origin could not be verified.', code: 'INVALID_ORIGIN' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = sessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'A valid sign-in session is required.', code: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        {
          error: 'The secure account service is not configured. The site administrator must check the Firebase Admin credentials and Firestore access in the production environment.',
          code: 'AUTH_NOT_CONFIGURED',
        },
        { status: 503 },
      );
    }

    const decoded = await adminAuth.verifyIdToken(parsed.data.idToken);
    await ensureUserProfile(adminDb, decoded, parsed.data.profile);
    const cookie = await adminAuth.createSessionCookie(parsed.data.idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, cookie, sessionCookieOptions());
    return response;
  } catch (error) {
    if (error?.code === 'FIREBASE_ADMIN_INVALID_CONFIGURATION') {
      return NextResponse.json(
        {
          error: 'Secure sign-in is unavailable because the server Firebase Admin credentials could not be initialized. The site administrator must check the Vercel function logs and Firebase Admin environment variables.',
          code: error.code,
        },
        { status: 503 },
      );
    }
    if (invalidCredentialCodes.has(error?.code)) {
      return NextResponse.json({ error: 'Sign-in could not be verified. Please try again.', code: 'INVALID_CREDENTIAL' }, { status: 401 });
    }
    console.error('[AUTH_SESSION_ERROR]', error?.stack || error);
    if (unavailableDatabaseCodes.has(error?.code)) {
      return NextResponse.json({ error: 'Account services are temporarily unavailable. Please try again shortly.', code: 'AUTH_SERVICE_UNAVAILABLE' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal Server Error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Request origin could not be verified.', code: 'INVALID_ORIGIN' }, { status: 403 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, '', { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    console.error('[AUTH_SESSION_ERROR]', error?.stack || error);
    return NextResponse.json({ error: 'Internal Server Error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
