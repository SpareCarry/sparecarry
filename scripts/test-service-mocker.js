/**
 * Test Service Mocker
 *
 * Mocks external services during testing to avoid hitting API limits
 * and service quotas (Supabase free plan, Stripe test mode, etc.)
 */

const fs = require("fs");
const path = require("path");

/**
 * Check if we should use mocks
 *
 * DEFAULT: Always use mocks to avoid hitting service limits
 * Only disable if explicitly set to false
 */
function shouldUseMocks() {
  // Default to true - always use mocks unless explicitly disabled
  if (process.env.USE_TEST_MOCKS === "false") {
    return false;
  }

  // Always use mocks by default
  return true;

  // Old logic (kept for reference, but we always use mocks now):
  // return process.env.USE_TEST_MOCKS === 'true' ||
  //        process.env.NODE_ENV === 'test' ||
  //        process.env.AVOID_EXTERNAL_CALLS === 'true' ||
  //        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  //        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test');
}

/**
 * Mock Supabase connectivity check
 */
function mockSupabaseCheck() {
  if (shouldUseMocks()) {
    return {
      connected: true,
      mocked: true,
      message: "Using mock Supabase client (no API calls made)",
      errors: [],
    };
  }
  return null; // Will use real check
}

/**
 * Mock Stripe connectivity check
 */
function mockStripeCheck() {
  if (shouldUseMocks()) {
    return {
      connected: true,
      mocked: true,
      message: "Using mock Stripe (test mode)",
      errors: [],
    };
  }
  return null; // Will use real check
}

/**
 * Mock Resend email check
 */
function mockResendCheck() {
  if (shouldUseMocks()) {
    return {
      connected: true,
      mocked: true,
      message: "Using mock Resend (no emails sent)",
      errors: [],
    };
  }
  return null; // Will use real check
}

/**
 * Create mock environment for testing
 */
function createMockEnvironment() {
  if (!shouldUseMocks()) return {};

  return {
    NEXT_PUBLIC_SUPABASE_URL: "https://mock-project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key",
    STRIPE_SECRET_KEY: "sk_test_mock",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_mock",
    RESEND_API_KEY: "re_mock",
    USE_TEST_MOCKS: "true",
    AVOID_EXTERNAL_CALLS: "true",
  };
}

/**
 * Setup test environment variables
 */
function setupTestEnvironment() {
  if (!shouldUseMocks()) return;

  const mockEnv = createMockEnvironment();
  Object.keys(mockEnv).forEach((key) => {
    if (!process.env[key]) {
      process.env[key] = mockEnv[key];
    }
  });
}

/**
 * Throttle function to add delay between API calls
 */
function throttle(delay = 200) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Batch operations to reduce API calls
 */
async function batchOperations(operations, batchSize = 5, delay = 200) {
  const results = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((op) => op()));
    results.push(...batchResults);

    if (i + batchSize < operations.length) {
      await throttle(delay);
    }
  }

  return results;
}

/**
 * Check if service should be mocked
 */
function isServiceMocked(serviceName) {
  if (!shouldUseMocks()) return false;

  const mockMap = {
    supabase: true,
    stripe: true,
    resend: true,
    analytics: true,
    pixel: true,
  };

  return mockMap[serviceName.toLowerCase()] || false;
}

module.exports = {
  shouldUseMocks,
  mockSupabaseCheck,
  mockStripeCheck,
  mockResendCheck,
  createMockEnvironment,
  setupTestEnvironment,
  throttle,
  batchOperations,
  isServiceMocked,
};
