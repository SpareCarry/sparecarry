/**
 * Secure File Upload Validation
 *
 * Provides comprehensive file upload security checks
 */

import {
  validateFileUpload,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "./validation";

export interface FileUploadOptions {
  allowedMimeTypes?: string[];
  maxSize?: number;
  allowedExtensions?: string[];
  requireAntivirusScan?: boolean; // Placeholder for future implementation
}

/**
 * Validate file upload with security checks
 */
export function validateSecureFileUpload(
  file: {
    filename: string;
    mimetype: string;
    size: number;
    buffer?: Buffer;
  },
  options: FileUploadOptions = {}
): { valid: boolean; error?: string; sanitizedFilename?: string } {
  // Basic validation
  const basicValidation = validateFileUpload(file, {
    allowedMimeTypes: options.allowedMimeTypes,
    maxSize: options.maxSize,
    allowedExtensions: options.allowedExtensions,
  });

  if (!basicValidation.valid) {
    return basicValidation;
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.filename);

  // Check for path traversal attempts
  if (
    file.filename.includes("..") ||
    file.filename.includes("/") ||
    file.filename.includes("\\")
  ) {
    return {
      valid: false,
      error: "Invalid filename: path traversal detected",
    };
  }

  // Check for null bytes
  if (file.filename.includes("\0")) {
    return {
      valid: false,
      error: "Invalid filename: null byte detected",
    };
  }

  // Antivirus scanning (stub - document but leave disabled)
  if (options.requireAntivirusScan) {
    // TODO: Integrate with antivirus scanning service
    // Example: ClamAV, VirusTotal API, etc.
    // For now, this is a placeholder
    console.warn(
      "[SECURITY] Antivirus scanning is enabled but not implemented"
    );
  }

  return {
    valid: true,
    sanitizedFilename,
  };
}

/**
 * Sanitize filename to prevent security issues
 */
function sanitizeFilename(filename: string): string {
  // Remove path components
  let sanitized = filename.split("/").pop() || filename;
  sanitized = sanitized.split("\\").pop() || sanitized;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop();
    const name = sanitized.substring(0, 255 - (ext ? ext.length + 1 : 0));
    sanitized = ext ? `${name}.${ext}` : name;
  }

  return sanitized;
}

/**
 * Get MIME type from file buffer (basic detection)
 */
export function detectMimeType(buffer: Buffer, filename: string): string {
  // Check magic bytes for common file types
  const header = buffer.slice(0, 12);

  // JPEG
  if (header[0] === 0xff && header[1] === 0xd8) {
    return "image/jpeg";
  }

  // PNG
  if (
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  ) {
    return "image/png";
  }

  // PDF
  if (
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46
  ) {
    return "application/pdf";
  }

  // Fallback to filename extension
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  return mimeMap[ext || ""] || "application/octet-stream";
}

/**
 * Default file upload options for different file types
 */
export const FILE_UPLOAD_PRESETS = {
  image: {
    allowedMimeTypes: ALLOWED_MIME_TYPES.images,
    maxSize: MAX_FILE_SIZE.image,
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "gif"],
  },
  document: {
    allowedMimeTypes: [
      ...ALLOWED_MIME_TYPES.documents,
      ...ALLOWED_MIME_TYPES.spreadsheets,
    ],
    maxSize: MAX_FILE_SIZE.document,
    allowedExtensions: ["pdf", "doc", "docx", "xls", "xlsx"],
  },
  profile: {
    allowedMimeTypes: ALLOWED_MIME_TYPES.images,
    maxSize: MAX_FILE_SIZE.image,
    allowedExtensions: ["jpg", "jpeg", "png"],
  },
} as const;
