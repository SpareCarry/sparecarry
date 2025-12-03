/**
 * Input Sanitization Utilities
 * 
 * Provides utilities for sanitizing user input to prevent XSS and other security issues
 */

/**
 * Sanitize HTML content (basic implementation)
 * For production, consider using DOMPurify or similar library
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML tag removal - in production, use DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "") // Remove event handlers
    .replace(/on\w+='[^']*'/gi, "") // Remove event handlers (single quotes)
    .replace(/javascript:/gi, ""); // Remove javascript: protocol
}

/**
 * Sanitize plain text (remove control characters and normalize)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .trim()
    .normalize("NFKC"); // Normalize unicode
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  // Basic email validation and sanitization
  const sanitized = sanitizeText(email).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(sanitized)) {
    return sanitized;
  }
  return "";
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters except +
  const sanitized = phone.replace(/[^\d+]/g, "");
  // Basic validation (should start with + and have 10-15 digits)
  if (sanitized.startsWith("+") && sanitized.length >= 11 && sanitized.length <= 16) {
    return sanitized;
  }
  return "";
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts and dangerous characters
  return fileName
    .replace(/\.\./g, "") // Remove ..
    .replace(/[\/\\]/g, "_") // Replace slashes
    .replace(/[<>:"|?*]/g, "_") // Replace dangerous characters
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeText(sanitized[key]) as T[Extract<keyof T, string>];
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]) as T[Extract<keyof T, string>];
    }
  }
  
  return sanitized;
}

