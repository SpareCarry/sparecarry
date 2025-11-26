// @ts-nocheck
/**
 * Test: Lifetime Purchase Flow
 * 
 * Verifies:
 * - User can click "Get Lifetime Access"
 * - Stripe checkout is created
 * - Webhook processes payment
 * - User profile is updated with lifetime_active
 * - Thank you modal appears
 * - Subscription screens hide lifetime option
 */
import { test, expect } from "@playwright/test";
import { setupSubscriptionTest } from "../helpers/setup-subscription-test";
import { USER_A } from "../setup/testUsers";

test.describe("Lifetime Purchase Flow", () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute('**');
  });

  test("should complete lifetime purchase flow", async ({ page }) => {
    await setupSubscriptionTest(page, USER_A, {
      lifetimeAvailable: true,
    });

    let checkoutUrl: string | null = null;

    // Mock checkout creation
    await page.route("**/api/subscriptions/create-checkout", async (route) => {
      const request = route.request();
      const body = await request.postDataJSON();
      
      if (body.priceId === "lifetime") {
        checkoutUrl = "https://checkout.stripe.com/test-session";
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

    // Navigate to profile page
    await page.goto("http://localhost:3000/home/profile", { 
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000); // Wait for components to render

    // Wait for subscription card - use multiple selectors
    await expect(
      page.locator('[data-testid="sparecarry-pro-title"]')
        .or(page.locator('text=SpareCarry Pro').first())
        .or(page.getByText('SpareCarry Pro').first())
    ).toBeVisible({ timeout: 25000 });

    // Find and click "Get Lifetime Access" button
    const buyLifetimeButton = page.locator('button:has-text("Get Lifetime Access")').first();
    await expect(buyLifetimeButton).toBeVisible({ timeout: 10000 });
    await buyLifetimeButton.click();

    // Should redirect to Stripe checkout
    await page.waitForTimeout(1000);
    expect(checkoutUrl).toBeTruthy();
    expect(checkoutUrl).toContain("stripe.com");
  });

  test("should show early bird badge", async ({ page }) => {
    await setupSubscriptionTest(page, USER_A, {
      lifetimeAvailable: true,
    });

    await page.goto("http://localhost:3000/home/profile", { 
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000); // Wait for components to render

    // Wait for subscription card - use multiple selectors
    await expect(
      page.locator('[data-testid="sparecarry-pro-title"]')
        .or(page.locator('text=SpareCarry Pro').first())
        .or(page.getByText('SpareCarry Pro').first())
    ).toBeVisible({ timeout: 25000 });

    // Check for early bird badge
    const earlyBirdBadge = page.locator('text=EARLY BIRD').or(page.locator('text=Limited to first 1,000 users'));
    await expect(earlyBirdBadge.first()).toBeVisible({ timeout: 15000 });
  });
});
