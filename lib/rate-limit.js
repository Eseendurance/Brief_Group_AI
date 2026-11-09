import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getAdminDb } from '@/lib/firebaseAdmin';

const limiters = new Map();
let redisClient = null;
const RATE_LIMIT_COLLECTION = 'security_rate_limits';
const MAX_EVENTS_PER_WINDOW = 250;

function getRedis() {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

function getLimiter(name, requests, window) {
  const key = `${name}:${requests}:${window}`;
  if (limiters.has(key)) return limiters.get(key);

  const client = getRedis();
  if (!client) return null;

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `briefgroup:ratelimit:${name}`,
  });

  limiters.set(key, limiter);
  return limiter;
}

function parseWindow(window) {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(window);
  if (!match) throw new TypeError(`Unsupported rate-limit window: ${window}`);

  const multipliers = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const duration = Number(match[1]) * multipliers[match[2]];
  if (!Number.isSafeInteger(duration) || duration <= 0) {
    throw new TypeError(`Invalid rate-limit window: ${window}`);
  }
  return duration;
}

async function checkFirestoreRateLimit(name, identifier, requests, window) {
  const adminDb = getAdminDb();
  if (!adminDb) return { limited: false, configured: false };

  const windowMs = parseWindow(window);
  const digest = createHash('sha256').update(`${name}:${identifier}`).digest('hex');
  const ref = adminDb.collection(RATE_LIMIT_COLLECTION).doc(digest);
  const now = Date.now();
  let result;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const events = (snapshot.data()?.events || [])
      .filter((timestamp) => Number.isSafeInteger(timestamp) && timestamp > now - windowMs && timestamp <= now)
      .sort((left, right) => left - right);

    if (events.length >= requests) {
      result = {
        limited: true,
        configured: true,
        limit: requests,
        remaining: 0,
        resetAt: new Date(events[0] + windowMs).toISOString(),
      };
      return;
    }

    if (events.length >= MAX_EVENTS_PER_WINDOW) {
      throw new Error('Configured rate limit exceeds the supported event window.');
    }

    const updatedEvents = [...events, now];
    transaction.set(ref, {
      events: updatedEvents,
      expiresAt: Timestamp.fromMillis(now + windowMs * 2),
      updatedAt: Timestamp.fromMillis(now),
    });
    result = {
      limited: false,
      configured: true,
      limit: requests,
      remaining: Math.max(0, requests - updatedEvents.length),
      resetAt: new Date(updatedEvents[0] + windowMs).toISOString(),
    };
  });

  return result;
}

export async function checkRateLimit(name, identifier, requests, window) {
  if (!name || name.length > 80 || !Number.isSafeInteger(requests) || requests < 1 || requests > MAX_EVENTS_PER_WINDOW) {
    throw new TypeError('Invalid rate-limit configuration.');
  }

  const limiter = getLimiter(name, requests, window);
  if (limiter) {
    try {
      const result = await limiter.limit(String(identifier));
      return {
        limited: !result.success,
        configured: true,
        limit: result.limit,
        remaining: result.remaining,
        resetAt: new Date(result.reset).toISOString(),
      };
    } catch (error) {
      console.error('[RATE_LIMIT_REDIS_ERROR]', error?.stack || error);
    }
  }

  try {
    return await checkFirestoreRateLimit(name, String(identifier), requests, window);
  } catch (error) {
    console.error('[RATE_LIMIT_FIRESTORE_ERROR]', error?.stack || error);
    return { limited: false, configured: false };
  }
}

export function rateLimitFailure(result, limitedMessage) {
  if (!result.configured && process.env.NODE_ENV === 'production') {
    return {
      status: 503,
      error: 'This service is temporarily unavailable because its security controls are not ready.',
    };
  }
  if (result.limited) return { status: 429, error: limitedMessage };
  return null;
}

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}
