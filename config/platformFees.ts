/**
 * Platform Fee Configuration
 * 
 * Centralized platform fee configuration with environment variable overrides
 */

// Base platform fee percentage (can be overridden via env)
export const PLATFORM_FEE_PERCENT = 
  process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT 
    ? parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT) / 100
    : 0.08; // Default 8%

// Method-specific fees (if needed)
export const PLANE_PLATFORM_FEE_PERCENT = 
  process.env.NEXT_PUBLIC_PLANE_FEE_PERCENT
    ? parseFloat(process.env.NEXT_PUBLIC_PLANE_FEE_PERCENT) / 100
    : 0.18; // Default 18% for plane

export const BOAT_PLATFORM_FEE_PERCENT = 
  process.env.NEXT_PUBLIC_BOAT_FEE_PERCENT
    ? parseFloat(process.env.NEXT_PUBLIC_BOAT_FEE_PERCENT) / 100
    : 0.15; // Default 15% for boat

// Minimum platform fee
export const MIN_PLATFORM_FEE_PERCENT = 0.12; // 12%

// Promo end date
export const PROMO_END_DATE = new Date("2026-02-18T00:00:00Z");

