/**
 * Error Message Utility
 * 
 * Provides user-friendly error messages mapped from error codes and types.
 * This helps users understand what went wrong and how to fix it.
 */

export interface ErrorContext {
  field?: string;
  operation?: string;
  details?: any;
}

/**
 * Error code to user-friendly message mapping
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-not-found": "No account found with this email. Please sign up first.",
  "auth/wrong-password": "Incorrect password. Please try again or reset your password.",
  "auth/email-already-in-use": "This email is already registered. Please sign in instead.",
  "auth/weak-password": "Password is too weak. Please use at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Please check your connection and try again.",
  "auth/invalid-credential": "Invalid email or password. Please check and try again.",
  
  // Supabase errors
  "PGRST116": "The requested item was not found.",
  "PGRST301": "Duplicate entry. This item already exists.",
  "23505": "This record already exists. Please check and try again.",
  "23503": "Invalid reference. Please check your input.",
  "42501": "You don't have permission to perform this action.",
  
  // Network errors
  "network-error": "Unable to connect to the server. Please check your internet connection.",
  "timeout": "Request timed out. Please try again.",
  "fetch-error": "Failed to fetch data. Please check your connection.",
  
  // Validation errors
  "validation-error": "Please check your input and try again.",
  "required-field": "This field is required.",
  "invalid-format": "Invalid format. Please check and try again.",
  
  // File upload errors
  "file-too-large": "File is too large. Please choose a smaller file.",
  "invalid-file-type": "Invalid file type. Please choose a supported format.",
  "upload-failed": "File upload failed. Please try again.",
  
  // Payment errors
  "payment-failed": "Payment failed. Please check your payment method and try again.",
  "insufficient-funds": "Insufficient funds. Please use a different payment method.",
  "card-declined": "Card was declined. Please use a different payment method.",
  
  // General errors
  "unknown-error": "Something went wrong. Please try again.",
  "server-error": "Server error. Please try again in a moment.",
};

/**
 * Get user-friendly error message from error object
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  context?: ErrorContext
): string {
  // Handle Error objects
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    const errorCode = extractErrorCode(error);

    // Check for specific error codes first
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode];
    }

    // Check for error patterns in message
    for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
      if (errorMessage.includes(code.toLowerCase()) || errorMessage.includes(code)) {
        return message;
      }
    }

    // Network errors
    if (
      errorMessage.includes("network") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("connection")
    ) {
      return ERROR_MESSAGES["network-error"];
    }

    // Timeout errors
    if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
      return ERROR_MESSAGES["timeout"];
    }

    // Validation errors
    if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
      if (context?.field) {
        return `Invalid ${context.field}. Please check and try again.`;
      }
      return ERROR_MESSAGES["validation-error"];
    }

    // Return original message if it's user-friendly, otherwise return generic
    if (error.message.length < 100 && !error.message.includes("Error:")) {
      return error.message;
    }
  }

  // Handle string errors
  if (typeof error === "string") {
    const lowerError = error.toLowerCase();
    for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
      if (lowerError.includes(code.toLowerCase())) {
        return message;
      }
    }
    return error;
  }

  // Handle objects with error property
  if (error && typeof error === "object" && "error" in error) {
    return getUserFriendlyErrorMessage((error as { error: unknown }).error, context);
  }

  // Handle objects with message property
  if (error && typeof error === "object" && "message" in error) {
    return getUserFriendlyErrorMessage((error as { message: unknown }).message, context);
  }

  // Default fallback
  if (context?.operation) {
    return `Failed to ${context.operation.toLowerCase()}. Please try again.`;
  }

  return ERROR_MESSAGES["unknown-error"];
}

/**
 * Extract error code from error object
 */
function extractErrorCode(error: unknown): string | null {
  if (error instanceof Error) {
    // Check for Supabase error codes
    if ("code" in error) {
      return String((error as any).code);
    }

    // Check for error code in message (e.g., "auth/invalid-email")
    const codeMatch = error.message.match(/([a-z]+\/[a-z-]+|\d{5})/i);
    if (codeMatch) {
      return codeMatch[1];
    }
  }

  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code);
  }

  return null;
}

/**
 * Get field-specific error message
 */
export function getFieldErrorMessage(
  field: string,
  error: unknown
): string {
  const context: ErrorContext = { field };
  const message = getUserFriendlyErrorMessage(error, context);

  // Customize message for specific fields
  if (field.toLowerCase().includes("email")) {
    if (message.includes("email")) return message;
    return "Please enter a valid email address.";
  }

  if (field.toLowerCase().includes("password")) {
    if (message.includes("password")) return message;
    return "Password must be at least 6 characters.";
  }

  if (field.toLowerCase().includes("phone")) {
    return "Please enter a valid phone number.";
  }

  return message;
}

/**
 * Get operation-specific error message
 */
export function getOperationErrorMessage(
  operation: string,
  error: unknown
): string {
  const context: ErrorContext = { operation };
  return getUserFriendlyErrorMessage(error, context);
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection") ||
      message.includes("timeout")
    );
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("auth/") || message.includes("unauthorized");
  }
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("validation") ||
      message.includes("invalid") ||
      message.includes("required")
    );
  }
  return false;
}

