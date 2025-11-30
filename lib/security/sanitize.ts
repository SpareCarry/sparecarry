/**
 * Input Sanitization Utilities
 *
 * Functions to sanitize and validate user inputs
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * For HTML content, use DOMPurify instead
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, "");

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize HTML content (basic - use DOMPurify for production)
 * For production, install: npm install dompurify @types/dompurify
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== "string") {
    return "";
  }

  // Basic sanitization - strip script tags and event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");

  return sanitizeString(sanitized);
}

/**
 * Sanitize object recursively (for form data, JSON inputs)
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key
      const cleanKey = sanitizeString(key);
      // Sanitize the value
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  return obj;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  if (typeof text !== "string") {
    return "";
  }

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== "string") {
    return "file";
  }

  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[\/\\]/g, "_") // Replace slashes
    .replace(/\.\./g, "_") // Replace parent directory references
    .replace(/[<>:"|?*]/g, "_") // Replace invalid filename characters
    .trim();

  // Ensure filename is not empty
  if (!sanitized) {
    sanitized = "file";
  }

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  return sanitized;
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSizeBytes: number): boolean {
  return size > 0 && size <= maxSizeBytes;
}

/**
 * Validate file type
 */
export function isValidFileType(
  filename: string,
  allowedExtensions: string[]
): boolean {
  if (!filename || typeof filename !== "string") {
    return false;
  }

  const ext = filename.toLowerCase().split(".").pop();
  if (!ext) {
    return false;
  }

  return allowedExtensions.includes(ext.toLowerCase());
}

/**
 * Common allowed file types
 */
export const ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp"];
export const ALLOWED_DOCUMENT_TYPES = ["pdf", "doc", "docx", "txt"];
export const ALLOWED_VIDEO_TYPES = ["mp4", "webm", "mov"];

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
