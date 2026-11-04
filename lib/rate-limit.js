import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const limiters = new Map();
let redisClient = null;

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

export async function checkRateLimit(name, identifier, requests, window) {
  const limiter = getLimiter(name, requests, window);
  if (!limiter) return { limited: false, configured: false };

  const result = await limiter.limit(String(identifier));
  return {
    limited: !result.success,
    configured: true,
    limit: result.limit,
    remaining: result.remaining,
    resetAt: new Date(result.reset).toISOString(),
  };
}

export function rateLimitFailure(result, limitedMessage) {
  if (!result.configured && process.env.NODE_ENV === 'production') {
    return {
      status: 503,
      error: 'This service is temporarily unavailable while its rate limit is configured.',
    };
  }
  if (result.limited) return { status: 429, error: limitedMessage };
  return null;
}

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}
