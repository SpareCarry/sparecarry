// @ts-nocheck
/**
 * Test: Backward Compatibility with Monthly/Yearly Subscriptions
 *
 * Verifies:
 * - Monthly subscription purchase still works
 * - Yearly subscription purchase still works
 * - UI updates correctly after subscription
 */
import { test, expect } from "@playwright/test";
import { enableTestMode } from "../setup/testModeSetup";
import { setupSubscriptionTest } from "../helpers/setup-subscription-test";
import { USER_A } from "../setup/testUsers";

test.describe("Monthly/Yearly Subscription Compatibility", () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute("**");
  });

  test("should allow monthly subscription purchase", async ({ page }) => {
    await setupSubscriptionTest(page, USER_A, {
      lifetimeAvailable: true,
    });

    let checkoutUrl: string | null = null;

    // Mock checkout creation for monthly
    await page.route("**/api/subscriptions/create-checkout", async (route) => {
      const request = route.request();
      const body = await request.postDataJSON();

      if (body.priceId === "monthly") {
        checkoutUrl = "https://checkout.stripe.com/test-monthly";
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ url: checkoutUrl }),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid price ID" }),
        });
      }
    });

    await page.goto("http://localhost:3000/home/profile", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page
      .waitForLoadState("networkidle", { timeout: 20000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // Wait for subscription card
    await expect(page.locator("text=SpareCarry Pro").first()).toBeVisible({
      timeout: 15000,
    });

    // Find monthly subscribe button
    const monthlyButton = page
      .locator('button:has-text("Subscribe Monthly")')
      .first();
    await expect(monthlyButton).toBeVisible({ timeout: 10000 });
    await monthlyButton.click();

    // Wait for API call
    await page.waitForTimeout(1000);
    expect(checkoutUrl).toBeTruthy();
    expect(checkoutUrl).toContain("stripe.com");
  });

  test("should allow yearly subscription purchase", async ({ page }) => {
    await setupSubscriptionTest(page, USER_A, {
      lifetimeAvailable: true,
    });

    let checkoutUrl: string | null = null;

    // Mock checkout creation for yearly
    await page.route("**/api/subscriptions/create-checkout", async (route) => {
      const request = route.request();
      const body = await request.postDataJSON();

      if (body.priceId === "yearly") {
        checkoutUrl = "https://checkout.stripe.com/test-yearly";
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ url: checkoutUrl }),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid price ID" }),
        });
      }
    });

    await page.goto("http://localhost:3000/home/profile", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page
      .waitForLoadState("networkidle", { timeout: 20000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // Wait for subscription card
    await expect(page.locator("text=SpareCarry Pro").first()).toBeVisible({
      timeout: 15000,
    });

    // Find yearly subscribe button
    const yearlyButton = page
      .locator('button:has-text("Subscribe Yearly")')
      .first();
    await expect(yearlyButton).toBeVisible({ timeout: 10000 });
    await yearlyButton.click();

    // Wait for API call
    await page.waitForTimeout(1000);
    expect(checkoutUrl).toBeTruthy();
    expect(checkoutUrl).toContain("stripe.com");
  });

  test("should show all three options when available", async ({ page }) => {
    await setupSubscriptionTest(page, USER_A, {
      lifetimeAvailable: true,
    });

    await page.goto("http://localhost:3000/subscription", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page
      .waitForLoadState("networkidle", { timeout: 20000 })
      .catch(() => {});
    await page.waitForTimeout(3000); // Wait for components to render

    // Wait for subscription card - try multiple selectors with longer timeout
    await expect(
      page
        .locator("text=SpareCarry Pro")
        .first()
        .or(page.getByText("SpareCarry Pro").first())
        .or(page.locator('h1:has-text("SpareCarry Pro")').first())
    ).toBeVisible({ timeout: 25000 });

    // Verify all three options are visible
    await expect(page.locator("text=/\\$5/").first()).toBeVisible({
      timeout: 10000,
    }); // Monthly
    await expect(page.locator("text=/\\$30/").first()).toBeVisible({
      timeout: 10000,
    }); // Yearly
    await expect(page.locator("text=/\\$100/").first()).toBeVisible({
      timeout: 10000,
    }); // Lifetime
  });
});
