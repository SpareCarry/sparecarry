/**
 * Pre-Authenticated Session Helpers
 *
 * Provides utilities for setting up pre-authenticated sessions
 * in fast testing mode
 */

import { Page } from "@playwright/test";
import type { TestUser } from "./testUsers";
import { setupUserMocks } from "./supabaseHelpers";
import { isFastMode } from "../config/test-config";

/**
 * Set up a pre-authenticated session for a user
 * Only works in fast mode - skips auth flows
 */
export async function setupAuthenticatedSession(
  page: Page,
  user: TestUser
): Promise<void> {
  if (!isFastMode()) {
    throw new Error(
      "setupAuthenticatedSession only works in fast mode. " +
        "Set PLAYWRIGHT_TEST_MODE=fast or use real auth flows."
    );
  }

  // Set up all user mocks (auth + data)
  await setupUserMocks(page, user);

  // Navigate to home with authenticated state
  // The mocks will make the app think the user is logged in
}

/**
 * Switch to a different authenticated user mid-test
 * Useful for testing multi-user interactions
 */
export async function switchToUser(page: Page, user: TestUser): Promise<void> {
  if (!isFastMode()) {
    throw new Error(
      "switchToUser only works in fast mode. " +
        "Set PLAYWRIGHT_TEST_MODE=fast or use real auth flows."
    );
  }

  // Set up mocks for the new user
  await setupUserMocks(page, user);

  // Reload page to pick up new user context
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .waitForLoadState("networkidle", { timeout: 10000 })
    .catch(() => {});
}

/**
 * Start test from home screen with authenticated user
 * This is the recommended way to start most tests in fast mode
 */
export async function startFromHome(
  page: Page,
  user: TestUser,
  baseUrl: string = "http://localhost:3000"
): Promise<void> {
  if (!isFastMode()) {
    throw new Error(
      "startFromHome only works in fast mode. " +
        "Set PLAYWRIGHT_TEST_MODE=fast or use real auth flows."
    );
  }

  // Set up authenticated session first (this sets up mocks and injects session)
  await setupAuthenticatedSession(page, user);

  // Navigate directly to home (skipping login)
  await page.goto(`${baseUrl}/home`, {
    waitUntil: "domcontentloaded",
  });

  // Wait for page to be ready
  await page
    .waitForLoadState("networkidle", { timeout: 10000 })
    .catch(() => {});

  // Wait for authentication to be processed
  await page.waitForTimeout(2000); // Allow time for React Query to check auth

  // Verify we're authenticated (not showing login prompt)
  const hasLoginPrompt = await page
    .locator("text=Please log in")
    .isVisible()
    .catch(() => false);
  if (hasLoginPrompt) {
    // Wait a bit more for auth to settle
    await page.waitForTimeout(2000);
  }
}

/**
 * Start test from profile screen
 */
export async function startFromProfile(
  page: Page,
  user: TestUser,
  baseUrl: string = "http://localhost:3000"
): Promise<void> {
  if (!isFastMode()) {
    throw new Error(
      "startFromProfile only works in fast mode. " +
        "Set PLAYWRIGHT_TEST_MODE=fast or use real auth flows."
    );
  }

  await setupAuthenticatedSession(page, user);
  await page.goto(`${baseUrl}/home/profile`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .waitForLoadState("networkidle", { timeout: 10000 })
    .catch(() => {});
  await page.waitForTimeout(1000);
}

/**
 * Check if user is authenticated (in fast mode)
 * Useful for assertions
 */
export async function isUserAuthenticated(page: Page): Promise<boolean> {
  // Check if we can find authenticated user indicators
  const hasAuthIndicators = await page.evaluate(() => {
    // Check for profile menu or authenticated-only elements
    const profileLink = document.querySelector('a[href*="/profile"]');
    const signOutButton = document.querySelector('button:has-text("Sign Out")');
    const loginPrompt = document.querySelector("text=Please log in");

    return !loginPrompt && (!!profileLink || !!signOutButton);
  });

  return hasAuthIndicators;
}
