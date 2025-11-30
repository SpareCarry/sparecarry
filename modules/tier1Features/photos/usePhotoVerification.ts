/**
 * Photo Verification Hook
 *
 * Validates uploaded photos meet requirements
 */

import { PhotoVerificationResult } from "./types";

/**
 * Verify photo meets basic requirements
 * Note: In a real implementation, this would analyze image data
 * For now, we check file properties passed in
 */
export function usePhotoVerification(
  file?: File | null
): PhotoVerificationResult {
  if (!file) {
    return {
      verified: false,
      message: "No file provided",
      errors: ["File is required"],
    };
  }

  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Check file size
  if (file.size > maxSize) {
    errors.push("File size exceeds 5MB limit");
  }

  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} not allowed. Use JPEG or PNG`);
  }

  // Note: Dimension and brightness checks would require image loading
  // These can be added when images are processed on the client

  if (errors.length > 0) {
    return {
      verified: false,
      errors,
    };
  }

  return {
    verified: true,
    message: "Photo verified successfully",
  };
}

/**
 * Verify multiple photos meet requirements
 */
export function verifyPhotoSet(
  photos: (File | null)[]
): PhotoVerificationResult {
  const validPhotos = photos.filter((p): p is File => p !== null);

  if (validPhotos.length < 3) {
    return {
      verified: false,
      message: "Minimum 3 photos required",
      errors: [
        `Only ${validPhotos.length} photos provided. Need at least 3 (front, side, size-for-scale)`,
      ],
    };
  }

  if (validPhotos.length > 6) {
    return {
      verified: false,
      message: "Maximum 6 photos allowed",
      errors: [`Too many photos (${validPhotos.length}). Maximum is 6.`],
    };
  }

  // Check each photo
  const errors: string[] = [];
  for (let i = 0; i < validPhotos.length; i++) {
    const result = usePhotoVerification(validPhotos[i]);
    if (!result.verified && result.errors) {
      errors.push(`Photo ${i + 1}: ${result.errors.join(", ")}`);
    }
  }

  if (errors.length > 0) {
    return {
      verified: false,
      errors,
    };
  }

  return {
    verified: true,
    message: `All ${validPhotos.length} photos verified`,
  };
}
