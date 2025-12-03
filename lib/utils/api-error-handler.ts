/**
 * API Error Handler Utility
 * 
 * Provides standardized error handling for API routes with consistent response format
 */

import { NextResponse } from "next/server";
import { getUserFriendlyErrorMessage, isNetworkError, isAuthError, isValidationError } from "./error-messages";

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

/**
 * Standardized error response format
 */
export function createErrorResponse(
  error: unknown,
  status: number = 500,
  context?: {
    operation?: string;
    field?: string;
    code?: string;
  }
): NextResponse<ApiErrorResponse> {
  const userMessage = getUserFriendlyErrorMessage(error, {
    operation: context?.operation,
    field: context?.field,
  });

  const response: ApiErrorResponse = {
    error: userMessage,
  };

  // Add error code if provided
  if (context?.code) {
    response.code = context.code;
  }

  // Add details in development mode
  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    response.details = {
      message: error.message,
      stack: error.stack,
    };
  }

  return NextResponse.json(response, { status });
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: unknown): NextResponse<ApiErrorResponse> {
  if (isAuthError(error)) {
    return createErrorResponse(error, 401, { code: "UNAUTHORIZED" });
  }
  return createErrorResponse(error, 401, { code: "AUTH_REQUIRED" });
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  error: unknown,
  field?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(error, 400, {
    code: "VALIDATION_ERROR",
    field,
  });
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(
  resource: string = "Resource"
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    new Error(`${resource} not found`),
    404,
    { code: "NOT_FOUND" }
  );
}

/**
 * Handle network errors
 */
export function handleNetworkError(
  error: unknown
): NextResponse<ApiErrorResponse> {
  if (isNetworkError(error)) {
    return createErrorResponse(error, 503, { code: "NETWORK_ERROR" });
  }
  return createErrorResponse(error, 500, { code: "SERVER_ERROR" });
}

/**
 * Handle rate limit errors
 */
export function handleRateLimitError(
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const response = createErrorResponse(
    new Error("Too many requests. Please try again later."),
    429,
    { code: "RATE_LIMIT_EXCEEDED" }
  );

  if (retryAfter) {
    response.headers.set("Retry-After", retryAfter.toString());
  }

  return response;
}

/**
 * Wrapper for API route handlers with standardized error handling
 */
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  context?: {
    operation?: string;
    onError?: (error: unknown) => NextResponse<ApiErrorResponse> | null;
  }
): Promise<NextResponse<T> | NextResponse<ApiErrorResponse>> {
  try {
    const result = await handler();
    return NextResponse.json(result);
  } catch (error: unknown) {
    // Log error for debugging
    console.error(`[API Error] ${context?.operation || "Operation"} failed:`, error);

    // Allow custom error handling
    if (context?.onError) {
      const customResponse = context.onError(error);
      if (customResponse) {
        return customResponse;
      }
    }

    // Default error handling based on error type
    if (isAuthError(error)) {
      return handleAuthError(error);
    }

    if (isValidationError(error)) {
      return handleValidationError(error);
    }

    if (isNetworkError(error)) {
      return handleNetworkError(error);
    }

    // Generic error response
    return createErrorResponse(error, 500, {
      operation: context?.operation,
    });
  }
}

/**
 * Validate request body against a schema (for use with Zod)
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: { parse: (data: unknown) => T }
): { success: true; data: T } | { success: false; error: NextResponse<ApiErrorResponse> } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: handleValidationError(error, error.path?.[0]),
    };
  }
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

