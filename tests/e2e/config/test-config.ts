/**
 * E2E Test Configuration
 * 
 * Controls test execution mode and behavior
 * 
 * Usage:
 * - Fast Mode (default): Pre-authenticated sessions, skip auth flows
 * - Full Auth Mode: Real authentication flows for testing auth functionality
 * 
 * Switch modes via environment variable:
 *   PLAYWRIGHT_TEST_MODE=full npm run test:e2e
 *   PLAYWRIGHT_TEST_MODE=fast npm run test:e2e (default)
 */

export type TestMode = 'fast' | 'full';

/**
 * Get current test mode from environment variable
 * Defaults to 'fast' for speed
 */
export function getTestMode(): TestMode {
  const mode = process.env.PLAYWRIGHT_TEST_MODE || 'fast';
  return (mode === 'full' ? 'full' : 'fast') as TestMode;
}

/**
 * Check if we're in fast mode (pre-authenticated)
 */
export function isFastMode(): boolean {
  return getTestMode() === 'fast';
}

/**
 * Check if we're in full auth mode (real auth flows)
 */
export function isFullAuthMode(): boolean {
  return getTestMode() === 'full';
}

/**
 * Test configuration object
 */
export const testConfig = {
  mode: getTestMode(),
  isFastMode: isFastMode(),
  isFullAuthMode: isFullAuthMode(),
  
  // Base URL for tests
  baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
  
  // Timeouts
  defaultTimeout: 60000, // 60 seconds
  actionTimeout: 10000, // 10 seconds
  navigationTimeout: 30000, // 30 seconds
  
  // Fast mode settings
  fastMode: {
    // Pre-authenticate users
    preAuthenticate: true,
    // Skip login/signup flows
    skipAuthFlows: true,
    // Use mocked sessions
    useMockedAuth: true,
  },
  
  // Full auth mode settings
  fullAuthMode: {
    // Use real auth flows
    useRealAuth: true,
    // Allow login/signup flows
    allowAuthFlows: true,
    // Don't pre-authenticate
    preAuthenticate: false,
  },
} as const;

/**
 * Log current test mode (useful for debugging)
 */
export function logTestMode(): void {
  console.log(`[TEST CONFIG] Mode: ${testConfig.mode}`);
  console.log(`[TEST CONFIG] Fast Mode: ${testConfig.isFastMode}`);
  console.log(`[TEST CONFIG] Full Auth Mode: ${testConfig.isFullAuthMode}`);
}

