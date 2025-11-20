/**
 * Secure API Response Helpers
 * 
 * Provides safe response formatting that never leaks sensitive data
 */

import { NextResponse } from 'next/server';
import { sanitizeError } from './validation';

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create an error response with sanitized error message
 */
export function errorResponse(
  error: unknown,
  status: number = 500,
  additionalHeaders?: HeadersInit
): NextResponse {
  const sanitized = sanitizeError(error);

  const response = NextResponse.json(
    {
      success: false,
      error: sanitized.message,
      code: sanitized.code,
    },
    {
      status,
      headers: additionalHeaders,
    }
  );

  // Never include error details in response headers
  return response;
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'VALIDATION_ERROR',
    },
    { status }
  );
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(headers?: Headers): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    {
      status: 429,
      headers,
    }
  );

  return response;
}

/**
 * Create an authentication error response
 */
export function authErrorResponse(message: string = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'AUTH_ERROR',
    },
    { status: 401 }
  );
}

/**
 * Create a forbidden error response
 */
export function forbiddenResponse(message: string = 'Access denied'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

/**
 * Wrap API route handler with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  }) as T;
}

