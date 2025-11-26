/**
 * Photo Verification Types
 */

export interface PhotoUploadResult {
  url: string;
  sortOrder: number;
  verified: boolean;
}

export interface PhotoVerificationResult {
  verified: boolean;
  message?: string;
  errors?: string[];
}

