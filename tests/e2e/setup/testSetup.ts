/**
 * Shared Test Setup
 * 
 * Provides standardized beforeEach hooks and setup utilities
 * for all E2E tests with fast/full auth mode support
 */

import { Page, BrowserContext } from '@playwright/test';
import { setupSupabaseMocks } from '../helpers/supabase-mocks';
import { setupComprehensiveMocks } from '../helpers/comprehensive-mocks';
import { isFastMode, testConfig, logTestMode } from '../config/test-config';

/**
 * Standard beforeEach hook for all tests
 * Sets up mocks based on test mode
 */
export async function setupTestEnvironment(
  page: Page,
  context: BrowserContext
) {
  // Log test mode for debugging
  if (process.env.DEBUG) {
    logTestMode();
  }

  // Clear cookies
  await context.clearCookies();
  
  // Note: Don't clear localStorage here - it will interfere with auth mocks
  // localStorage will be set by setupUserMocks when authentication is set up
  // For full auth mode, localStorage clearing is handled in setupFullAuthMode

  // Always set up base Supabase mocks
  await setupSupabaseMocks(page);

  // Set up comprehensive mocks (Stripe, jobs, messages, etc.)
  await setupComprehensiveMocks(page);

  // In fast mode, we're done - individual tests will set up authenticated users
  // In full auth mode, tests will handle real auth flows
}

/**
 * Fast mode: Set up pre-authenticated session
 * Use this in beforeEach or at the start of tests in fast mode
 */
export async function setupFastMode(
  page: Page,
  user?: any // TestUser type, avoiding circular import
) {
  if (!isFastMode()) {
    return; // Not in fast mode, skip
  }

  if (user) {
    // Set up specific user if provided
    const { setupUserMocks } = await import('./supabaseHelpers');
    await setupUserMocks(page, user);
  }
  // If no user provided, tests will set up their own users
}

/**
 * Full auth mode: Prepare for real auth flows
 * Use this in beforeEach for full auth tests
 */
export async function setupFullAuthMode(page: Page) {
  if (isFastMode()) {
    // In fast mode, don't set up full auth
    return;
  }

  // Clear all auth state using addInitScript (runs before page loads)
  await page.addInitScript(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
    }
  });
}

/**
 * Complete test setup hook
 * Use this in beforeEach for all tests
 */
export async function beforeEachSetup(
  page: Page,
  context: BrowserContext,
  options: {
    user?: any; // TestUser type
    mode?: 'fast' | 'full' | 'auto';
  } = {}
): Promise<void> {
  const { user, mode = 'auto' } = options;

  // Set up base environment
  await setupTestEnvironment(page, context);

  // Set up mode-specific configuration
  if (mode === 'fast' || (mode === 'auto' && isFastMode())) {
    await setupFastMode(page, user);
  } else if (mode === 'full' || (mode === 'auto' && !isFastMode())) {
    await setupFullAuthMode(page);
  }
}

/**
 * Helper to wait for authenticated state
 */
export async function waitForAuthenticated(page: Page, timeout = 5000): Promise<boolean> {
  try {
    // Wait for authentication indicators
    await page.waitForSelector('a[href*="/profile"], button:has-text("Sign Out")', {
      timeout,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to wait for page to be ready
 */
export async function waitForPageReady(page: Page, timeout = 10000): Promise<void> {
  await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await page.waitForTimeout(1000); // Allow React Query to hydrate
}

