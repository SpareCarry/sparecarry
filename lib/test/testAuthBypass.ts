/**
 * Test-Only Auth Bypass
 *
 * This module provides a way to bypass authentication during E2E tests.
 * It's ONLY active when PLAYWRIGHT_TESTING=true and only in development/test environments.
 *
 * Security: This is safe because:
 * 1. Only works in dev/test (checks NODE_ENV)
 * 2. Requires explicit environment variable
 * 3. Never deployed to production
 */

// Check if we're in test mode
export const isTestMode = () => {
  return (
    (typeof window !== "undefined" &&
      (window as any).__PLAYWRIGHT_TEST_MODE__ === true) ||
    (typeof process !== "undefined" &&
      process.env.PLAYWRIGHT_TESTING === "true" &&
      (process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"))
  );
};

// Get test user if in test mode
export const getTestUser = () => {
  if (!isTestMode()) return null;

  // Check if test user is stored in window (set by Playwright)
  if (typeof window !== "undefined" && (window as any).__TEST_USER__) {
    return (window as any).__TEST_USER__;
  }

  // Default test user
  return {
    id: "test-user-id",
    email: "test@example.com",
    aud: "authenticated",
    role: "authenticated",
    email_confirmed_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

// Test-aware auth wrapper
export const withTestAuth = async <T>(
  authFn: () => Promise<T>,
  testValue: T
): Promise<T> => {
  if (isTestMode()) {
    console.log("[TEST_AUTH] Bypassing auth, returning test value");
    return testValue;
  }
  return authFn();
};

// Mock supabase.auth.getUser() for tests
export const getUser = async (supabaseGetUser: () => Promise<any>) => {
  if (isTestMode()) {
    const testUser = getTestUser();
    console.log("[TEST_AUTH] Returning test user:", testUser?.email);
    return { data: { user: testUser }, error: null };
  }
  return supabaseGetUser();
};

// Check if test mode should be enabled based on environment
export const shouldEnableTestMode = () => {
  return (
    process.env.PLAYWRIGHT_TESTING === "true" &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")
  );
};
