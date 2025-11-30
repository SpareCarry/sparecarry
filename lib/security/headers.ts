/**
 * Security Headers Configuration
 *
 * Centralized security headers for all responses
 */

import { NextResponse, type NextRequest } from "next/server";

/**
 * Get security headers for a response
 */
export function getSecurityHeaders(
  isHttps: boolean = true
): Record<string, string> {
  const headers: Record<string, string> = {
    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // XSS protection (legacy, but still useful for older browsers)
    "X-XSS-Protection": "1; mode=block",

    // Referrer policy - only send origin in referrer
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions policy - restrict access to browser features
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=(self)",
      "interest-cohort=()",
    ].join(", "),

    // Content Security Policy
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://browser.sentry-cdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://*.stripe.com https://www.google-analytics.com https://sentry.io wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  };

  // HSTS - only for HTTPS
  if (isHttps) {
    headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains; preload";
  }

  return headers;
}

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  request?: NextRequest
): NextResponse {
  const isHttps =
    request?.url.startsWith("https://") ||
    request?.headers.get("x-forwarded-proto") === "https" ||
    process.env.NODE_ENV === "production";

  const securityHeaders = getSecurityHeaders(isHttps);

  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Remove X-Powered-By header (Next.js adds this by default)
  response.headers.delete("X-Powered-By");

  return response;
}
