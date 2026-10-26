import { NextRequest, NextResponse } from "next/server";

const inMemoryBuckets = new Map<string, number[]>();

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function jsonRateLimitResponse(message: string, retryAfter: number, limit: number) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}

async function enforceRateLimit(
  request: NextRequest,
  key: string,
  limit: number,
  windowMs: number,
) {
  const clientIp = getClientIp(request);
  const bucketKey = `${key}:${clientIp}`;
  const now = Date.now();

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowMs = tonumber(ARGV[2])
      local limit = tonumber(ARGV[3])
      redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)
      local count = redis.call('ZCARD', key)
      if count >= limit then
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        return {0, math.max(1, math.ceil((tonumber(oldest[2]) + windowMs - now) / 1000))}
      end
      redis.call('ZADD', key, now, ARGV[4])
      redis.call('PEXPIRE', key, windowMs)
      return {1, 0}
    `;

    try {
      const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          "EVAL",
          script,
          "1",
          `rate:${bucketKey}`,
          String(now),
          String(windowMs),
          String(limit),
          crypto.randomUUID(),
        ]),
        cache: "no-store",
      });

      if (!response.ok) {
        return jsonRateLimitResponse("Rate limiting is temporarily unavailable.", 60, limit);
      }

      const payload = (await response.json()) as { result?: number[] };
      const result = payload.result ?? [1, 0];
      if (Number(result[0]) === 0) {
        return jsonRateLimitResponse(
          "Too many requests. Please try again shortly.",
          Math.max(1, Number(result[1]) || 1),
          limit,
        );
      }

      return null;
    } catch {
      return jsonRateLimitResponse("Rate limiting is temporarily unavailable.", 60, limit);
    }
  }

  const timestamps = inMemoryBuckets.get(bucketKey) ?? [];
  const recent = timestamps.filter((value) => now - value < windowMs);
  if (recent.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
    return jsonRateLimitResponse("Too many requests. Please try again shortly.", retryAfter, limit);
  }

  recent.push(now);
  inMemoryBuckets.set(bucketKey, recent);

  if (inMemoryBuckets.size > 10_000) {
    for (const [key, entries] of inMemoryBuckets.entries()) {
      if (entries.every((value) => now - value >= windowMs)) {
        inMemoryBuckets.delete(key);
      }
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const isWriteRequest = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const protectedWildcard = /^\/api\/(?!weather|webhooks\/)/;

  if (pathname.startsWith("/api/")) {
    if (isWriteRequest && protectedWildcard.test(pathname)) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !/^Bearer\s+.+$/i.test(authHeader)) {
        return NextResponse.json(
          { error: "Authentication token required." },
          { status: 401 },
        );
      }
    }

    if (isWriteRequest) {
      const rateLimited = await enforceRateLimit(request, `api:${pathname}`, 60, 60_000);
      if (rateLimited) {
        return rateLimited;
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), geolocation=(), microphone=()" );
  response.headers.set("x-xss-protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
