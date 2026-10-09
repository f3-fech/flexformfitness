import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import '../lib/env'; // Ensure env vars are loaded into process.env

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured = !!(redisUrl && redisToken);

let checkoutLimiter: any = null;
let authLimiter: any = null;
let emailLimiter: any = null;
let notificationsLimiter: any = null;
let imageProxyLimiter: any = null;

if (isConfigured) {
  try {
    const redis = new Redis({
      url: redisUrl!,
      token: redisToken!,
    });

    checkoutLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '5 m'), // 5 requests per 5 minutes
      prefix: '@upstash/ratelimit/checkout',
    });

    authLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '5 m'), // 5 requests per 5 minutes
      prefix: '@upstash/ratelimit/auth',
    });

    emailLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '10 m'), // 3 requests per 10 minutes
      prefix: '@upstash/ratelimit/email',
    });

    notificationsLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(4, '1 m'), // 4 requests per 1 minute
      prefix: '@upstash/ratelimit/notifications',
    });

    imageProxyLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per 1 minute
      prefix: '@upstash/ratelimit/image-proxy',
    });
  } catch (err) {
    console.error('[Rate Limiting] Error initializing Upstash Redis clients:', err);
  }
} else {
  // Only log warning once in development/SSR initialization
  if (import.meta.env.DEV) {
    console.warn('[Rate Limiting] Upstash Redis credentials not found. Rate limits are disabled in development.');
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory sliding window fallback when Upstash Redis is unconfigured or unavailable
interface MemoryBucket {
  count: number;
  resetAt: number;
}
const memoryBuckets = new Map<string, MemoryBucket>();

const MEMORY_LIMITS: Record<string, { max: number; windowMs: number }> = {
  checkout: { max: 8, windowMs: 5 * 60 * 1000 },
  auth: { max: 8, windowMs: 5 * 60 * 1000 },
  email: { max: 4, windowMs: 10 * 60 * 1000 },
  notifications: { max: 10, windowMs: 60 * 1000 },
  imageProxy: { max: 35, windowMs: 60 * 1000 },
};

function checkMemoryRateLimit(limiterName: string, identifier: string): RateLimitResult {
  const config = MEMORY_LIMITS[limiterName] || { max: 10, windowMs: 60 * 1000 };
  const key = `${limiterName}:${identifier}`;
  const now = Date.now();

  // Periodic pruning if cache exceeds 1000 items
  if (memoryBuckets.size > 1000) {
    for (const [k, v] of memoryBuckets.entries()) {
      if (now > v.resetAt) memoryBuckets.delete(k);
    }
  }

  const bucket = memoryBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true, limit: config.max, remaining: config.max - 1, reset: now + config.windowMs };
  }

  bucket.count += 1;
  if (bucket.count > config.max) {
    return { success: false, limit: config.max, remaining: 0, reset: bucket.resetAt };
  }

  return { success: true, limit: config.max, remaining: config.max - bucket.count, reset: bucket.resetAt };
}

/**
 * Checks if a given identifier exceeds the specified rate limit.
 * Uses Upstash Redis when configured, with an in-memory fallback to avoid total exposure.
 */
export async function checkRateLimit(
  limiterName: 'checkout' | 'auth' | 'email' | 'notifications' | 'imageProxy',
  identifier: string
): Promise<RateLimitResult> {
  if (!isConfigured) {
    return checkMemoryRateLimit(limiterName, identifier);
  }

  let limiter;
  switch (limiterName) {
    case 'checkout':
      limiter = checkoutLimiter;
      break;
    case 'auth':
      limiter = authLimiter;
      break;
    case 'email':
      limiter = emailLimiter;
      break;
    case 'notifications':
      limiter = notificationsLimiter;
      break;
    case 'imageProxy':
      limiter = imageProxyLimiter;
      break;
  }

  if (!limiter) {
    return checkMemoryRateLimit(limiterName, identifier);
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error(`[Rate Limiting] Error querying Upstash Redis for limiter "${limiterName}":`, error);
    // Fallback to in-memory rate limiting during Redis outage
    return checkMemoryRateLimit(limiterName, identifier);
  }
}

