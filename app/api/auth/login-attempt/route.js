import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientIp, checkRateLimit } from '@/lib/rate-limit';
import { verifyRequestUser } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const attemptSchema = z.object({
  action: z.enum(['check', 'failed', 'succeeded']),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
}).strict();

function rateLimitResponse(result) {
  const resetSeconds = result.resetAt
    ? Math.max(1, Math.ceil((new Date(result.resetAt).getTime() - Date.now()) / 1000))
    : 60;
  return NextResponse.json(
    { error: 'Too many sign-in attempts. Please wait a minute and try again.', code: 'RATE_LIMITED' },
    {
      status: 429,
      headers: {
        'Retry-After': String(resetSeconds),
        'RateLimit-Limit': String(result.limit || 5),
        'RateLimit-Remaining': String(result.remaining || 0),
        'RateLimit-Reset': String(resetSeconds),
      },
    },
  );
}

function serviceUnavailable() {
  return NextResponse.json(
    { error: 'Sign-in protection is temporarily unavailable. Please try again shortly.', code: 'AUTH_PROTECTION_UNAVAILABLE' },
    { status: 503 },
  );
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = attemptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter a valid email address.', code: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    const ip = clientIp(request).slice(0, 128);
    const digestKey = process.env.UPSTASH_REDIS_REST_TOKEN || 'brief-group-local-auth-audit';
    const emailDigest = createHmac('sha256', digestKey).update(parsed.data.email).digest('hex');
    const userAgent = (request.headers.get('user-agent') || 'unknown').slice(0, 512);

    if (parsed.data.action === 'check') {
      let limits;
      try {
        limits = await Promise.all([
          checkRateLimit('auth-login-ip', ip, 5, '1 m'),
          checkRateLimit('auth-login-email', emailDigest, 5, '1 m'),
        ]);
      } catch (error) {
        console.error('[AUTH_RATE_LIMIT_ERROR]', error?.stack || error);
        return serviceUnavailable();
      }
      const [ipLimit, emailLimit] = limits;
      if ((!ipLimit.configured || !emailLimit.configured) && process.env.NODE_ENV === 'production') {
        return serviceUnavailable();
      }
      if (ipLimit.limited) return rateLimitResponse(ipLimit);
      if (emailLimit.limited) return rateLimitResponse(emailLimit);
      return NextResponse.json({ ok: true });
    }

    const eventLimit = await checkRateLimit('auth-login-audit', ip, 120, '1 m');
    if (!eventLimit.configured && process.env.NODE_ENV === 'production') return serviceUnavailable();
    if (eventLimit.limited) return rateLimitResponse(eventLimit);

    if (parsed.data.action === 'succeeded') {
      const auth = await verifyRequestUser(request);
      if (auth.error) return NextResponse.json({ error: auth.error, code: 'UNAUTHENTICATED' }, { status: auth.status });
      if (auth.email?.trim().toLowerCase() !== parsed.data.email) {
        return NextResponse.json({ error: 'The sign-in audit could not be verified.', code: 'AUDIT_IDENTITY_MISMATCH' }, { status: 403 });
      }
    }

    const event = {
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      status: parsed.data.action === 'succeeded' ? 'success' : 'client_reported_failure',
      emailDigest,
    };
    const logMessage = `[AUTH_LOGIN_AUDIT] ${JSON.stringify(event)}`;
    if (parsed.data.action === 'succeeded') console.info(logMessage);
    else console.warn(logMessage);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[AUTH_LOGIN_ERROR]', error?.stack || error);
    return NextResponse.json({ error: 'Internal Server Error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
