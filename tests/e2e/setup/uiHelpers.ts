/**
 * UI Helper Functions for E2E Tests
 *
 * Provides utilities for interacting with UI elements,
 * waiting for states, and common user actions.
 */

import { Page, expect } from "@playwright/test";

/**
 * Wait for page to be fully loaded and ready for interaction
 */
export async function waitForPageReady(page: Page, timeout = 15000) {
  await page.waitForLoadState("domcontentloaded", { timeout });
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
    // Network idle is optional - continue if it times out
  });
}

/**
 * Wait for element to be visible with retry logic
 */
export async function waitForVisible(
  page: Page,
  selector: string,
  timeout = 10000,
  retries = 3
) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { state: "visible", timeout });
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Wait for text to be visible
 */
export async function waitForText(
  page: Page,
  text: string | RegExp,
  timeout = 10000
) {
  await expect(page.getByText(text)).toBeVisible({ timeout });
}

/**
 * Fill form field with retry logic
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string,
  retries = 3
) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.fill(selector, value, { timeout: 5000 });
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Click button with retry logic
 */
export async function clickButton(
  page: Page,
  selector: string | { role: "button"; name: string | RegExp },
  retries = 3
) {
  for (let i = 0; i < retries; i++) {
    try {
      if (typeof selector === "string") {
        await page.click(selector, { timeout: 5000 });
      } else {
        await page.getByRole("button", selector).click({ timeout: 5000 });
      }
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 20000 // Increased default timeout
) {
  try {
    await page.waitForURL(urlPattern, { timeout });
  } catch (e) {
    // Fallback: poll for URL change
    await page.waitForFunction(
      (pattern) => {
        const currentUrl = window.location.href;
        if (typeof pattern === "string") {
          return currentUrl.includes(pattern);
        } else {
          return pattern.test(currentUrl);
        }
      },
      urlPattern,
      { timeout, polling: 100 }
    );
  }
}

/**
 * Wait for response from specific endpoint
 */
export async function waitForResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
) {
  return await page
    .waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === "string") {
          return url.includes(urlPattern);
        } else {
          return urlPattern.test(url);
        }
      },
      { timeout }
    )
    .catch(() => null);
}

/**
 * Wait for API call to complete
 */
export async function waitForAPICall(
  page: Page,
  endpoint: string,
  method: string = "GET",
  timeout = 10000
) {
  return await page
    .waitForResponse(
      (response) => {
        const url = response.url();
        return (
          url.includes(endpoint) &&
          response.request().method() === method &&
          response.status() === 200
        );
      },
      { timeout }
    )
    .catch(() => null);
}

/**
 * Sign in with email (magic link)
 */
export async function signInWithEmail(page: Page, email: string) {
  // Wait for email input
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });

  // Fill email
  await emailInput.fill(email);

  // Click submit button
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeVisible();

  // Wait for OTP response
  await waitForResponse(page, "/auth/v1/otp", 15000);

  // Wait for success message
  try {
    await waitForText(page, /check your email|magic link/i, 10000);
  } catch (e) {
    // Success message may not appear immediately - continue
  }
}

/**
 * Navigate to a route and wait for it to load
 */
export async function navigateTo(page: Page, path: string, timeout = 10000) {
  const baseUrl =
    process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";
  const fullUrl = `${baseUrl}${path}`;

  await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout });
  await waitForPageReady(page, 5000);
}

/**
 * Wait for feed to load (home page)
 */
export async function waitForFeed(page: Page, timeout = 15000) {
  // Wait for either feed items or "no items" message
  try {
    await Promise.race([
      page.waitForSelector('[data-testid="feed-card"]', { timeout }),
      page.waitForSelector("text=/no (trips|requests)/i", { timeout }),
      page.waitForSelector("text=/feed/i", { timeout }),
    ]);
  } catch (e) {
    // Feed may take time to load - continue
  }
}

/**
 * Wait for modal/dialog to open
 */
export async function waitForModal(page: Page, timeout = 5000) {
  await page.waitForSelector('[role="dialog"], .modal, [data-testid="modal"]', {
    state: "visible",
    timeout,
  });
}

/**
 * Close modal/dialog
 */
export async function closeModal(page: Page) {
  const closeButton = page
    .locator(
      'button[aria-label="Close"], button:has-text("Close"), [data-testid="close-modal"]'
    )
    .first();

  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  } else {
    // Try ESC key
    await page.keyboard.press("Escape");
  }
}

/**
 * Scroll to element
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, selector);

  // Wait for scroll to complete
  await page.waitForTimeout(300);
}

/**
 * Take screenshot for debugging
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `tests/e2e/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Wait for loading spinner to disappear
 */
export async function waitForLoadingToFinish(page: Page, timeout = 10000) {
  try {
    // Wait for loader to disappear
    await page
      .waitForSelector('[data-testid="loader"], .animate-spin, Loader2', {
        state: "hidden",
        timeout,
      })
      .catch(() => {
        // Loader may not exist or already hidden
      });
  } catch (e) {
    // Continue if loader check fails
  }

  // Additional wait for React to finish rendering
  await page.waitForTimeout(500);
}

/**
 * Check if user is authenticated (on protected route)
 */
export async function checkAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url();

  // If we're on login page, we're not authenticated
  if (currentUrl.includes("/auth/login")) {
    return false;
  }

  // Check for login prompts
  const loginPrompt = page.locator("text=/please log in|sign in/i");
  const isLoginPromptVisible = await loginPrompt.isVisible().catch(() => false);

  return !isLoginPromptVisible;
}

/**
 * Wait for element to be enabled
 */
export async function waitForEnabled(
  page: Page,
  selector: string,
  timeout = 10000
) {
  await page.waitForSelector(selector, { state: "visible", timeout });
  await expect(page.locator(selector)).toBeEnabled({ timeout });
}

/**
 * Select option from dropdown
 */
export async function selectOption(
  page: Page,
  selector: string,
  value: string
) {
  await page.selectOption(selector, value, { timeout: 5000 });
}

/**
 * Check checkbox
 */
export async function checkCheckbox(page: Page, selector: string) {
  await page.check(selector, { timeout: 5000 });
}

/**
 * Uncheck checkbox
 */
export async function uncheckCheckbox(page: Page, selector: string) {
  await page.uncheck(selector, { timeout: 5000 });
}
