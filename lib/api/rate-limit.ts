/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiting for API routes
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory store (clears on server restart)
// In production, use Redis or similar
const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetAt < now) {
        delete store[key];
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  identifier?: string; // Custom identifier (defaults to IP)
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}:${options.windowMs}`;
  const entry = store[key];

  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetAt: now + options.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= options.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  // Increment count
  entry.count += 1;
  return {
    success: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return ip;
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function withRateLimit(
  options: RateLimitOptions,
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const identifier = getClientIdentifier(request);
    const result = checkRateLimit(identifier, options);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": result.retryAfter?.toString() || "60",
            "X-RateLimit-Limit": options.maxRequests.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(request);
    response.headers.set("X-RateLimit-Limit", options.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", new Date(result.resetAt).toISOString());

    return response;
  };
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Strict limits for auth endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // Moderate limits for write operations
  WRITE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  // Lenient limits for read operations
  READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // Very strict for payment operations
  PAYMENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,
  },
} as const;

