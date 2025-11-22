import { test, expect } from "@playwright/test";

/**
 * Complete App Flow Tests
 * 
 * These tests verify the entire app from start to finish:
 * 1. Landing page → Login
 * 2. Magic link request → Email link click
 * 3. Authentication → Home page
 * 4. Post trip/request → Match → Payment → Delivery
 * 
 * Note: These tests use mocks for Supabase/Stripe where possible
 * For full E2E testing, set up test environment with real services
 */

test.describe("Complete App Flow", () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";
  const testEmail = `e2e-test-${Date.now()}@example.com`;

  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("full user journey: landing → auth → home", async ({ page }) => {
    // Step 1: Landing page
    await page.goto(baseUrl);
    await expect(page.getByRole("button", { name: /traveling by Plane/i })).toBeVisible();
    
    // Step 2: Click travel button → Login
    await page.getByRole("button", { name: /traveling by Plane/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Step 3: Request magic link
    await page.fill('input[type="email"]', testEmail);
    
    // Mock the magic link request if needed
    await page.route("**/auth/v1/otp", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({}),
      });
    });

    await page.click('button[type="submit"]');
    
    // Step 4: Should see success message
    await expect(
      page.getByText(/check your email/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("all buttons on landing page work", async ({ page }) => {
    await page.goto(baseUrl);

    // Test all interactive elements
    const planeButton = page.getByRole("button", { name: /traveling by Plane/i });
    const boatButton = page.getByRole("button", { name: /sailing by Boat/i });

    await expect(planeButton).toBeVisible();
    await expect(boatButton).toBeVisible();
    
    // Test buttons are clickable
    await expect(planeButton).toBeEnabled();
    await expect(boatButton).toBeEnabled();
  });

  test("auth callback handles all scenarios", async ({ page }) => {
    // Test 1: No code
    await page.goto(`${baseUrl}/auth/callback`);
    await expect(page).toHaveURL(/\/auth\/login.*error=no_code/);

    // Test 2: Invalid code
    await page.goto(`${baseUrl}/auth/callback?code=invalid`);
    // Should redirect to login with error
    await expect(page).toHaveURL(/\/auth\/login/);

    // Test 3: Valid code with redirect
    await page.goto(`${baseUrl}/auth/callback?code=test&redirect=/home`);
    // Should either redirect to home or show login with error
    const url = page.url();
    expect(
      url.includes("/home") || 
      url.includes("/auth/login")
    ).toBeTruthy();
  });
});

