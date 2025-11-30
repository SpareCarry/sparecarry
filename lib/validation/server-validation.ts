/**
 * Server-Side Validation Utilities
 *
 * Validates and sanitizes user inputs on the server side
 * Should be used in all API routes that accept user input
 */

import {
  sanitizeString,
  sanitizeObject,
  isValidEmail,
  isValidUrl,
  escapeHtml,
} from "@/lib/security/sanitize";
import { z } from "zod";

/**
 * Validate and sanitize request body
 */
export async function validateRequestBody<T>(
  request: Request,
  schema?: z.ZodSchema<T>
): Promise<{ data: T; error?: string }> {
  try {
    // Parse JSON body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return {
        data: {} as T,
        error: "Invalid JSON in request body",
      };
    }

    // Sanitize object recursively
    const sanitized = sanitizeObject(body);

    // If schema provided, validate against it
    if (schema) {
      const result = schema.safeParse(sanitized);
      if (!result.success) {
        return {
          data: {} as T,
          error: result.error.errors.map((e) => e.message).join(", "),
        };
      }
      return { data: result.data };
    }

    return { data: sanitized as T };
  } catch (error: any) {
    return {
      data: {} as T,
      error: error.message || "Validation failed",
    };
  }
}

/**
 * Escape HTML in user-generated content before storing/displaying
 */
export function escapeUserContent(content: string | null | undefined): string {
  if (!content || typeof content !== "string") {
    return "";
  }
  return escapeHtml(content);
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  email: z
    .string()
    .email("Invalid email format")
    .transform((val) => sanitizeString(val).toLowerCase()),
  url: z
    .string()
    .url("Invalid URL format")
    .transform((val) => sanitizeString(val)),
  nonEmptyString: z
    .string()
    .min(1, "Cannot be empty")
    .transform((val) => sanitizeString(val)),
  positiveNumber: z.number().positive("Must be positive"),
  uuid: z.string().uuid("Invalid UUID format"),
};

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validate and sanitize string input
 */
export function validateString(
  input: unknown,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}
): { valid: boolean; value?: string; error?: string } {
  const { required = true, minLength, maxLength, pattern } = options;

  // Check if input is a string
  if (typeof input !== "string") {
    return {
      valid: false,
      error: required ? "Required field must be a string" : undefined,
    };
  }

  // Sanitize
  let sanitized = sanitizeString(input);

  // Check if empty and required
  if (required && sanitized.length === 0) {
    return {
      valid: false,
      error: "This field is required",
    };
  }

  // Check min length
  if (minLength && sanitized.length < minLength) {
    return {
      valid: false,
      error: `Must be at least ${minLength} characters`,
    };
  }

  // Check max length
  if (maxLength && sanitized.length > maxLength) {
    return {
      valid: false,
      error: `Must be no more than ${maxLength} characters`,
    };
  }

  // Check pattern
  if (pattern && !pattern.test(sanitized)) {
    return {
      valid: false,
      error: "Invalid format",
    };
  }

  return { valid: true, value: sanitized };
}

/**
 * Validate and sanitize number input
 */
export function validateNumber(
  input: unknown,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): { valid: boolean; value?: number; error?: string } {
  const { required = true, min, max, integer = false } = options;

  // Handle empty string as undefined
  if (input === "" || input === null || input === undefined) {
    if (required) {
      return {
        valid: false,
        error: "This field is required",
      };
    }
    return { valid: true, value: undefined };
  }

  // Convert to number
  const num = typeof input === "string" ? parseFloat(input) : Number(input);

  // Check if valid number
  if (isNaN(num)) {
    return {
      valid: false,
      error: "Must be a valid number",
    };
  }

  // Check integer
  if (integer && !Number.isInteger(num)) {
    return {
      valid: false,
      error: "Must be an integer",
    };
  }

  // Check min
  if (min !== undefined && num < min) {
    return {
      valid: false,
      error: `Must be at least ${min}`,
    };
  }

  // Check max
  if (max !== undefined && num > max) {
    return {
      valid: false,
      error: `Must be no more than ${max}`,
    };
  }

  return { valid: true, value: num };
}

/**
 * Validate array input
 */
export function validateArray<T>(
  input: unknown,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: unknown) => {
      valid: boolean;
      value?: T;
      error?: string;
    };
  } = {}
): { valid: boolean; value?: T[]; error?: string } {
  const { required = true, minLength, maxLength, itemValidator } = options;

  // Check if input is an array
  if (!Array.isArray(input)) {
    return {
      valid: false,
      error: required ? "Must be an array" : undefined,
    };
  }

  // Check min length
  if (minLength && input.length < minLength) {
    return {
      valid: false,
      error: `Must have at least ${minLength} items`,
    };
  }

  // Check max length
  if (maxLength && input.length > maxLength) {
    return {
      valid: false,
      error: `Must have no more than ${maxLength} items`,
    };
  }

  // Validate items if validator provided
  if (itemValidator) {
    const validatedItems: T[] = [];
    for (let i = 0; i < input.length; i++) {
      const result = itemValidator(input[i]);
      if (!result.valid) {
        return {
          valid: false,
          error: `Item ${i + 1}: ${result.error || "Invalid"}`,
        };
      }
      if (result.value !== undefined) {
        validatedItems.push(result.value);
      }
    }
    return { valid: true, value: validatedItems };
  }

  return { valid: true, value: input as T[] };
}
