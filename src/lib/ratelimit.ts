import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import '../lib/env'; // Ensure env vars are loaded into process.env

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured = !!(redisUrl && redisToken);

let checkoutLimiter: any = null;
let authLimiter: any = null;
let emailLimiter: any = null;

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

/**
 * Checks if a given identifier exceeds the specified rate limit.
 * Fail-open design: if Upstash Redis fails or is unconfigured, it returns success=true.
 */
export async function checkRateLimit(
  limiterName: 'checkout' | 'auth' | 'email',
  identifier: string
): Promise<RateLimitResult> {
  if (!isConfigured) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
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
  }

  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
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
    // Fail-open to not block real users if Upstash has an outage
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}
