/**
 * API Error Handler
 * 
 * Standardized error handling for API routes
 */

import { NextResponse } from 'next/server';
import { logger } from '../logger';

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export class ApiErrorResponse extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiErrorResponse';
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): NextResponse {
  let apiError: ApiError;

  if (error instanceof ApiErrorResponse) {
    apiError = {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    };
  } else if (error instanceof Error) {
    // Never expose stack traces in production
    apiError = {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? defaultMessage : error.message,
      statusCode: 500,
    };
  } else {
    apiError = {
      code: 'UNKNOWN_ERROR',
      message: defaultMessage,
      statusCode: 500,
    };
  }

  // Log error
  logger.error('API Error', error instanceof Error ? error : new Error(String(error)), {
    code: apiError.code,
    statusCode: apiError.statusCode,
    details: apiError.details,
  });

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(process.env.NODE_ENV === 'development' && apiError.details && { details: apiError.details }),
      },
    },
    { status: apiError.statusCode }
  );
}

/**
 * Wrap API route handler with error handling
 */
export function withApiErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  defaultMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error, defaultMessage);
    }
  }) as T;
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Not Found
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Business Logic
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_STATE: 'INVALID_STATE',
  CONFLICT: 'CONFLICT',
} as const;

/**
 * Helper to create API errors
 */
export function createApiError(
  code: keyof typeof ErrorCodes,
  message: string,
  statusCode: number = 500,
  details?: unknown
): ApiErrorResponse {
  return new ApiErrorResponse(ErrorCodes[code], message, statusCode, details);
}

