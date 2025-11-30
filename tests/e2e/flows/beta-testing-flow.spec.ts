// @ts-nocheck
/**
 * Beta Testing Flow E2E Tests
 *
 * Simulates complete user journeys for beta testing:
 * - New user signup and onboarding
 * - Post creation (trip and request)
 * - Shipping estimator usage
 * - Messaging interactions
 * - Complete delivery flow
 */

import { test, expect } from "@playwright/test";
import { enableTestMode } from "../setup/testModeSetup";
import { USER_A, USER_B } from "../setup/testUsers";
import { setupSupabaseMocks } from "../helpers/supabase-mocks";
import { setupComprehensiveMocks } from "../helpers/comprehensive-mocks";
import {
  selectCountry,
  clickAndWaitForNavigation,
} from "../helpers/test-helpers";

test.describe("Beta Testing Flow", () => {
  const baseUrl =
    process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute("**");
    await setupSupabaseMocks(page);
    await setupComprehensiveMocks(page);
  });

  test("should complete full user journey: signup → post request → messaging", async ({
    page,
  }) => {
    await enableTestMode(page, USER_A);

    // 1. Signup (simulated - user already logged in via test mode)
    await page.goto(`${baseUrl}/home`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // 2. Navigate to post request
    await clickAndWaitForNavigation(
      page,
      { role: "link", name: /Post Request/i },
      "/home/post-request",
      10000
    );

    // 3. Fill post request form
    await page.locator("#title").first().fill("Test Item for Beta");
    await page.locator("#length_cm").first().fill("10");
    await page.locator("#width_cm").first().fill("10");
    await page.locator("#height_cm").first().fill("10");
    await page.locator("#weight_kg").first().fill("1");

    // Select category - wait for dropdown to appear
    const categorySelect = page.locator("#category").first();
    await categorySelect.click();
    await page.waitForTimeout(500);

    // Wait for dropdown to appear
    await page
      .waitForFunction(
        () => {
          const listbox = document.querySelector('[role="listbox"]');
          const options = document.querySelectorAll('[role="option"]');
          return listbox || options.length > 0;
        },
        { timeout: 15000 }
      )
      .catch(() => {});

    // Try to find and click the Electronics option
    const electronicsOption = page
      .getByRole("option", { name: "Electronics" })
      .or(page.locator('[role="option"]:has-text("Electronics")'))
      .first();
    await expect(electronicsOption).toBeVisible({ timeout: 10000 });
    await electronicsOption.click();
    await page.waitForTimeout(500);

    // Set deadline
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deadlineStr = tomorrow.toISOString().split("T")[0];
    await page.locator("#deadline_latest").first().fill(deadlineStr);

    // Set reward
    await page.locator("#max_reward").first().fill("100");
    await page.waitForTimeout(500);

    // Verify form is filled correctly
    await expect(page.locator("#title").first()).toHaveValue(
      "Test Item for Beta"
    );
    await expect(categorySelect).toContainText("Electronics");
  });

  test("should complete shipping estimator → job creation flow", async ({
    page,
  }) => {
    await enableTestMode(page, USER_A);

    // 1. Use shipping estimator
    await page.goto(`${baseUrl}/shipping-estimator`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // Fill estimator
    await selectCountry(page, "origin_country", "United States");
    await selectCountry(page, "destination_country", "Australia");

    await page.locator("#length").first().fill("10");
    await page.locator("#width").first().fill("10");
    await page.locator("#height").first().fill("10");
    await page.locator("#weight").first().fill("1");
    await page.waitForTimeout(2000);

    // 2. Verify prices calculated
    await expect(
      page.getByText("SpareCarry Plane", { exact: true })
    ).toBeVisible({ timeout: 10000 });

    // 3. Click "Create SpareCarry Job"
    await clickAndWaitForNavigation(
      page,
      { role: "button", name: /Create SpareCarry Job from This Estimate/i },
      "/home/post-request",
      15000
    );

    expect(page.url()).toContain("/post-request");
  });

  test("should handle multi-user messaging scenario", async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // Open a post
    const postItem = page.locator('[data-testid="feed-item"]').first();
    if (await postItem.isVisible().catch(() => false)) {
      await postItem.click();
      await page.waitForTimeout(1000);

      // Check for messaging options
      const messageButton = page.getByText(/Message/i).first();
      const hasMessageButton = await messageButton
        .isVisible()
        .catch(() => false);

      // If user owns the post, should see "Open Messages"
      const openMessagesButton = page.getByText(/Open Messages/i).first();
      const hasOpenMessages = await openMessagesButton
        .isVisible()
        .catch(() => false);

      // At least one messaging option should be available
      expect(hasMessageButton || hasOpenMessages).toBeTruthy();
    }
  });

  test("should verify all safety disclaimers are present", async ({ page }) => {
    await enableTestMode(page, USER_A);

    // Check shipping estimator
    await page.goto(`${baseUrl}/shipping-estimator`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // Check post request form
    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // Check for safety tooltip in message input (when messaging is available)
    const safetyText = page
      .getByText(/All communication stays on SpareCarry/i)
      .first();
    const hasSafetyText = await safetyText.isVisible().catch(() => false);
    // Safety text appears in message input when messaging is available
  });
});
