/**
 * Country Validation Utility
 * 
 * Provides validation functions for country ISO codes.
 * Used both client-side and server-side.
 */

import { COUNTRIES, Country, getCountryByIso2 } from '../constants/countries';

/**
 * Validate ISO2 country code
 * @param code - Two-letter ISO country code
 * @returns true if valid, false otherwise
 */
export function isValidIso2(code: string): boolean {
  if (!code || typeof code !== 'string' || code.length !== 2) {
    return false;
  }
  return getCountryByIso2(code) !== undefined;
}

/**
 * Validate ISO3 country code
 * @param code - Three-letter ISO country code
 * @returns true if valid, false otherwise
 */
export function isValidIso3(code: string): boolean {
  if (!code || typeof code !== 'string' || code.length !== 3) {
    return false;
  }
  const country = COUNTRIES.find(
    (c) => c.iso3.toLowerCase() === code.toLowerCase()
  );
  return country !== undefined;
}

/**
 * Get country by ISO2 code (re-exported for convenience)
 * @param code - Two-letter ISO country code
 * @returns Country object or undefined if not found
 */
export { getCountryByIso2 };

/**
 * Normalize ISO2 code to uppercase
 * @param code - ISO2 code (case-insensitive)
 * @returns Uppercase ISO2 code or null if invalid
 */
export function normalizeIso2(code: string): string | null {
  if (!isValidIso2(code)) {
    return null;
  }
  return code.toUpperCase();
}

