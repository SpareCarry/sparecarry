/**
 * Rate Limiting
 * 
 * Lightweight in-memory rate limiter for API routes
 * Uses per-IP tracking with sliding window
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private windowMs: number = 60 * 1000, private maxRequests: number = 100) {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.store.set(identifier, newEntry);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Destroy limiter (cleanup interval)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Create rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter(60 * 1000, 100); // 100 requests per minute
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes
export const uploadRateLimiter = new RateLimiter(60 * 1000, 10); // 10 uploads per minute

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (behind proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown';

  // In production, you might want to hash the IP for privacy
  return ip;
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimit(
  request: Request,
  limiter: RateLimiter = apiRateLimiter
): Promise<{ allowed: boolean; headers?: Headers; error?: string }> {
  const identifier = getClientIdentifier(request);
  const result = limiter.check(identifier);

  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limiter['maxRequests'].toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

  if (!result.allowed) {
    return {
      allowed: false,
      headers,
      error: 'Rate limit exceeded. Please try again later.',
    };
  }

  return {
    allowed: true,
    headers,
  };
}

