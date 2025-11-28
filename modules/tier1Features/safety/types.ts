/**
 * Safety Scoring Types
 */

export interface SafetyScoreResult {
  score: number; // 0-100
  reasons: string[];
}

export interface ListingDetails {
  title?: string;
  description?: string;
  category?: string;
  declaredValue?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  hasBatteries?: boolean;
  hasLiquids?: boolean;
  restrictedItems?: boolean; // Restricted goods (lithium batteries, flammable items, etc.) - boat only
  photoCount?: number;
}

