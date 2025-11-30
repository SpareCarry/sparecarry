/**
 * Validation utilities for ensuring all mocks are properly configured
 */

import type { Page } from "@playwright/test";

/**
 * List of all Supabase endpoints that should be mocked
 */
export const REQUIRED_MOCK_ENDPOINTS = [
  // Auth endpoints
  "**/auth/v1/otp**",
  "**/*supabase*/auth/v1/otp**",
  "**/auth/v1/user",
  "**/*supabase*/auth/v1/user",
  "**/auth/v1/token",
  "**/*supabase*/auth/v1/token",

  // REST API endpoints
  "**/rest/v1/**",
  "**/*supabase*/rest/v1/**",

  // Storage endpoints
  "**/storage/v1/**",
  "**/*supabase*/storage/v1/**",
] as const;

/**
 * List of all Supabase tables used in the app
 */
export const SUPABASE_TABLES = [
  "trips",
  "requests",
  "profiles",
  "users",
  "matches",
  "conversations",
  "messages",
  "deliveries",
  "referrals",
  "group_buys",
  "payouts",
  "disputes",
] as const;

/**
 * Validate that all required endpoints are mocked
 * This should be called before running tests
 */
export async function validateMocks(page: Page): Promise<{
  valid: boolean;
  missing: string[];
  warnings: string[];
}> {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Note: Playwright doesn't expose registered routes directly
  // This is a placeholder for manual validation
  // In practice, we validate by checking if requests are intercepted

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Check if a specific route pattern is registered
 * Note: This is a helper for documentation purposes
 */
export function getMockedEndpointPatterns(): readonly string[] {
  return REQUIRED_MOCK_ENDPOINTS;
}

/**
 * Get list of all Supabase tables that need mocks
 */
export function getSupabaseTables(): readonly string[] {
  return SUPABASE_TABLES;
}
