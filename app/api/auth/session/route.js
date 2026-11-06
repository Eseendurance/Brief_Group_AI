import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAdminAuth,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const invalidCredentialCodes = new Set([
  'auth/argument-error',
  'auth/id-token-expired',
  'auth/invalid-credential',
  'auth/invalid-id-token',
  'auth/user-disabled',
  'auth/user-not-found',
]);

const sessionSchema = z.object({
  idToken: z.string().min(1).max(8192),
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
    if (!adminAuth) {
      return NextResponse.json({ error: 'Secure sign-in is temporarily unavailable.', code: 'AUTH_NOT_CONFIGURED' }, { status: 503 });
    }

    await adminAuth.verifyIdToken(parsed.data.idToken);
    const cookie = await adminAuth.createSessionCookie(parsed.data.idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, cookie, sessionCookieOptions());
    return response;
  } catch (error) {
    if (invalidCredentialCodes.has(error?.code)) {
      return NextResponse.json({ error: 'Sign-in could not be verified. Please try again.', code: 'INVALID_CREDENTIAL' }, { status: 401 });
    }
    console.error('[AUTH_SESSION_ERROR]', error?.stack || error);
    return NextResponse.json({ error: 'Internal Server Error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Request origin could not be verified.', code: 'INVALID_ORIGIN' }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
