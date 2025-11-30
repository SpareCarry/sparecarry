// @ts-nocheck
/**
 * Test: Lifetime Limit Reached
 *
 * Verifies:
 * - When RPC returns false (limit reached), lifetime option is hidden
 * - No lifetime cards appear on pricing page
 * - No lifetime offer screen appears
 */
import { test, expect } from "@playwright/test";
import { setupSupabaseMocks } from "../helpers/supabase-mocks";

test.describe("Lifetime Limit Reached", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page, context }) => {
    await setupSupabaseMocks(page);

    // Mock RPC: available = false (limit reached)
    await page.route(
      "**/rest/v1/rpc/get_lifetime_availability",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(false),
        });
      }
    );

    // Mock lifetime count at limit
    await page.route(
      "**/rest/v1/rpc/get_lifetime_purchase_count*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([{ total: 1000 }]), // Limit reached
        });
      }
    );

    // Mock profile without lifetime
    await page.route("**/rest/v1/profiles*", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("user_id") === "eq.test-user-id") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "profile-id",
              user_id: "test-user-id",
              lifetime_active: false,
            },
          ]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }
    });
  });

  test("should hide lifetime option on pricing page when limit reached", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/subscription", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page
      .waitForLoadState("networkidle", { timeout: 20000 })
      .catch(() => {});

    // Wait for page to be ready - check for heading or subscription card
    await page
      .waitForSelector(
        'h1:has-text("SpareCarry Pro"), [data-testid="subscription-card"]',
        {
          timeout: 20000,
        }
      )
      .catch(() => {});

    await page.waitForTimeout(3000); // Wait for components to render

    // Wait for subscription card - try multiple selectors
    await expect(
      page
        .locator("text=SpareCarry Pro")
        .first()
        .or(page.getByText("SpareCarry Pro").first())
        .or(page.locator('h1:has-text("SpareCarry Pro")').first())
    ).toBeVisible({ timeout: 20000 });

    // Verify lifetime option is NOT visible
    const lifetimeCard = page
      .locator("text=Buy Lifetime")
      .or(page.locator("text=Limited"));
    await expect(lifetimeCard).not.toBeVisible({ timeout: 5000 });

    // Verify monthly and yearly options are still visible
    await expect(
      page.locator('button:has-text("Subscribe")').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("should skip lifetime offer screen when limit reached", async ({
    page,
  }) => {
    // Navigate to onboarding (where lifetime offer would appear)
    await page.goto("http://localhost:3000/onboarding", {
      waitUntil: "domcontentloaded",
    });
    await page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});

    // Wait for onboarding page to load - check for heading or step indicator
    await page
      .waitForSelector(
        'h1, [data-testid="onboarding"], text=/Phone Verification|Identity Verification/i',
        {
          timeout: 20000,
        }
      )
      .catch(() => {});

    // Wait a bit for any lifetime offer screen to potentially appear
    await page.waitForTimeout(3000);

    // Verify lifetime offer screen is NOT visible
    const lifetimeOffer = page
      .locator("text=Support SpareCarry")
      .or(page.locator("text=Get Lifetime Access"));
    await expect(lifetimeOffer).not.toBeVisible({ timeout: 5000 });
  });
});
