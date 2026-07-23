import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Real cost protection: without this, a single user (or a bot) hitting
// /api/chat, /api/reports/generate, or /api/vision/analyze in a loop would
// rack up real Anthropic API charges with no ceiling. This is optional to
// configure — if UPSTASH_REDIS_REST_URL/TOKEN aren't set, requests are
// allowed through uncapped (same "works now, upgrade later" pattern as
// every other integration in this app), but you should add it before
// sharing the pilot link publicly.

let redis = null;
const limiters = {};

function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(name, requests, window) {
  if (limiters[name]) return limiters[name];
  const client = getRedis();
  if (!client) return null;
  limiters[name] = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `briefgroup:ratelimit:${name}`,
  });
  return limiters[name];
}

/**
 * @param {string} name - a label for this limiter, e.g. 'chat'
 * @param {string} identifier - who to limit by (uid or IP)
 * @param {number} requests - how many requests allowed
 * @param {string} window - Upstash duration string, e.g. '1 h', '1 d'
 */
export async function checkRateLimit(name, identifier, requests, window) {
  const limiter = getLimiter(name, requests, window);
  if (!limiter) return { limited: false, configured: false };
  const result = await limiter.limit(identifier);
  return {
    limited: !result.success,
    configured: true,
    limit: result.limit,
    remaining: result.remaining,
    resetAt: new Date(result.reset).toISOString(),
  };
}

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}
