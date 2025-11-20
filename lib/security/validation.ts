/**
 * Security Validation Utilities
 * 
 * Provides Zod schemas and validation helpers for secure API operations
 */

import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email address');
export const nonEmptyStringSchema = z.string().min(1, 'String cannot be empty');

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string(),
  size: z.number().int().positive(),
});

// MIME type whitelist
export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
} as const;

export const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  default: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: { filename: string; mimetype: string; size: number },
  options?: {
    allowedMimeTypes?: string[];
    maxSize?: number;
    allowedExtensions?: string[];
  }
): { valid: boolean; error?: string } {
  const { allowedMimeTypes, maxSize = MAX_FILE_SIZE.default, allowedExtensions } = options || {};

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
    };
  }

  // Check file extension
  if (allowedExtensions) {
    const extension = file.filename.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension .${extension || 'unknown'} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeError(error: unknown): { message: string; code?: string } {
  // Never expose internal errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Database errors - sanitize
    if (message.includes('database') || message.includes('sql') || message.includes('postgres')) {
      return {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
      };
    }

    // Network errors
    if (message.includes('network') || message.includes('timeout') || message.includes('econnrefused')) {
      return {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
      };
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('jwt')) {
      return {
        message: 'Authentication failed',
        code: 'AUTH_ERROR',
      };
    }

    // Validation errors - these are safe to expose
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return {
        message: error.message,
        code: 'VALIDATION_ERROR',
      };
    }

    // Generic error - sanitized
    return {
      message: 'An error occurred',
      code: 'INTERNAL_ERROR',
    };
  }

  // Unknown error type
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Validate and parse request body with Zod schema
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Validation failed: ${messages}` };
    }
    return { success: false, error: 'Invalid request body' };
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, unknown>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Invalid query parameters: ${messages}` };
    }
    return { success: false, error: 'Invalid query parameters' };
  }
}

/**
 * Extract and validate UUID from path or params
 */
export function validateUuid(value: unknown): { success: true; uuid: string } | { success: false; error: string } {
  try {
    const uuid = uuidSchema.parse(value);
    return { success: true, uuid };
  } catch {
    return { success: false, error: 'Invalid UUID format' };
  }
}

