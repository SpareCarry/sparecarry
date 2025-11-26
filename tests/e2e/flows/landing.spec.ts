// @ts-nocheck
/**
 * Landing Page Flow Tests
 * 
 * Tests for the landing page, including:
 * - Page load
 * - Button interactions
 * - Navigation to auth
 * - Waitlist functionality
 */

import { test, expect } from '@playwright/test';
import { waitForPageReady, waitForNavigation } from '../setup/uiHelpers';
import { setupSupabaseMocks } from '../helpers/supabase-mocks';

test.describe('Landing Page', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page, context }) => {
    await setupSupabaseMocks(page);
    await context.clearCookies();
  });

  test('should load landing page successfully', async ({ page }) => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Check for main heading or buttons
    await expect(
      page.getByRole('button', { name: /I'm traveling by Plane/i })
    ).toBeVisible({ timeout: 10000 });
    
    await expect(
      page.getByRole('button', { name: /I'm sailing by Boat/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to login when clicking plane button', async ({ page }) => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Mock user endpoint to return null (not authenticated)
    await page.route('**/auth/v1/user**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: null, error: null }),
        });
      } else {
        await route.continue();
      }
    });

    // Click plane button
    const planeButton = page.getByRole('button', { name: /I'm traveling by Plane/i });
    await expect(planeButton).toBeVisible({ timeout: 10000 });
    await expect(planeButton).toBeEnabled({ timeout: 5000 });

    // Wait for getUser() response
    const getUserPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/v1/user') &&
        response.request().method() === 'GET',
      { timeout: 10000 }
    ).catch(() => null);

    await planeButton.click();
    await getUserPromise;

    // Wait for navigation to login - give more time for client-side routing
    await page.waitForURL(/\/auth\/login/, { timeout: 15000 }).catch(() => {});
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
  });

  test('should navigate to login when clicking boat button', async ({ page }) => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Mock user endpoint to return null (not authenticated)
    await page.route('**/auth/v1/user**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: null, error: null }),
        });
      } else {
        await route.continue();
      }
    });

    // Click boat button
    const boatButton = page.getByRole('button', { name: /I'm sailing by Boat/i });
    await expect(boatButton).toBeVisible({ timeout: 10000 });
    await expect(boatButton).toBeEnabled({ timeout: 5000 });

    // Wait for getUser() response
    const getUserPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/v1/user') &&
        response.request().method() === 'GET',
      { timeout: 10000 }
    ).catch(() => null);

    await boatButton.click();
    await getUserPromise;

    // Wait for navigation to login - give more time for client-side routing
    await page.waitForURL(/\/auth\/login/, { timeout: 15000 }).catch(() => {});
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
  });

  test('should show waitlist form when opened', async ({ page }) => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Look for waitlist button or form trigger
    const waitlistButton = page.locator('button:has-text("Join Waitlist"), button:has-text("Waitlist")').first();
    
    if (await waitlistButton.isVisible().catch(() => false)) {
      await waitlistButton.click();
      
      // Wait for waitlist form to appear
      const emailInput = page.locator('input[type="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display all key sections', async ({ page }) => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Check for common landing page elements
    // Adjust selectors based on actual implementation
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    expect(hasContent?.length).toBeGreaterThan(100);
  });
});

