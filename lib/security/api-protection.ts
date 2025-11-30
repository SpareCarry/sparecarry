/**
 * API Protection Utilities
 *
 * Rate limiting, request size limits, and timeout protection for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import {
  rateLimit,
  authRateLimiter,
  uploadRateLimiter,
  apiRateLimiter,
} from "./rate-limit";

const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Check request size
 */
function checkRequestSize(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_REQUEST_SIZE) {
      return {
        valid: false,
        error: `Request body too large. Maximum size is ${MAX_REQUEST_SIZE / 1024 / 1024}MB`,
      };
    }
  }

  return { valid: true };
}

/**
 * Create timeout wrapper for async operations
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * API route protection wrapper
 */
export async function withApiProtection(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    rateLimiter?: typeof apiRateLimiter;
    requireAuth?: boolean;
    maxSize?: number;
    timeout?: number;
  } = {}
): Promise<NextResponse> {
  const {
    rateLimiter = apiRateLimiter,
    requireAuth = false,
    maxSize = MAX_REQUEST_SIZE,
    timeout = REQUEST_TIMEOUT_MS,
  } = options;

  try {
    // 1. Check request size
    const sizeCheck = checkRequestSize(request);
    if (!sizeCheck.valid) {
      return NextResponse.json(
        { error: sizeCheck.error },
        { status: 413 } // Payload Too Large
      );
    }

    // 2. Apply rate limiting
    const rateLimitResult = await rateLimit(request, rateLimiter);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Rate limit exceeded" },
        {
          status: 429, // Too Many Requests
          headers: {
            ...Object.fromEntries(rateLimitResult.headers?.entries() || []),
          },
        }
      );
    }

    // 3. Execute handler with timeout
    const response = await withTimeout(handler(request), timeout);

    // 4. Add rate limit headers to response
    if (rateLimitResult.headers) {
      rateLimitResult.headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error: any) {
    // Handle timeout errors
    if (error?.message?.includes("timeout")) {
      return NextResponse.json(
        { error: "Request timeout. Please try again." },
        { status: 504 } // Gateway Timeout
      );
    }

    // Handle other errors
    console.error("[API Protection Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Helper for auth-required routes
 */
export async function withAuthProtection(
  request: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  // Import here to avoid circular dependencies
  const { createClient } = await import("@/lib/supabase/server");

  return withApiProtection(
    request,
    async (req) => {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return handler(req, user.id);
    },
    {
      rateLimiter: authRateLimiter,
      requireAuth: true,
    }
  );
}

/**
 * Helper for upload routes
 */
export async function withUploadProtection(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return withApiProtection(request, handler, {
    rateLimiter: uploadRateLimiter,
    maxSize: 50 * 1024 * 1024, // 50MB for uploads
    timeout: 60000, // 60 seconds for uploads
  });
}
