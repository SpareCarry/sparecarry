/**
 * Next.js Middleware
 *
 * This runs on the Edge Runtime and handles:
 * - Session management via Supabase
 * - Security headers
 * - Request routing
 */

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/api/rate-limit";

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const identifier = getClientIdentifier(request);
    
    // Determine rate limit based on endpoint
    let rateLimitConfig: { windowMs: number; maxRequests: number } = RATE_LIMITS.READ;
    const path = request.nextUrl.pathname;
    
    if (path.includes("/auth/") || path.includes("/login") || path.includes("/signup")) {
      rateLimitConfig = RATE_LIMITS.AUTH;
    } else if (path.includes("/payments/") || path.includes("/subscriptions/")) {
      rateLimitConfig = RATE_LIMITS.PAYMENT;
    } else if (request.method !== "GET") {
      rateLimitConfig = RATE_LIMITS.WRITE;
    }
    
    const result = checkRateLimit(identifier, {
      windowMs: rateLimitConfig.windowMs,
      maxRequests: rateLimitConfig.maxRequests,
    });
    
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": result.retryAfter?.toString() || "60",
            "X-RateLimit-Limit": rateLimitConfig.maxRequests.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
          },
        }
      );
    }
  }
  
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
