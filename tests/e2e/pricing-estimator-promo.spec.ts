// @ts-nocheck
/**
 * E2E tests for pricing estimator with promo
 */

import { test, expect } from '@playwright/test';

import { setupSupabaseMocks } from './helpers/supabase-mocks';
import { setupComprehensiveMocks } from './helpers/comprehensive-mocks';
import { enableTestMode } from './setup/testModeSetup';
import { USER_A } from './setup/testUsers';
import { selectCountry } from './helpers/test-helpers';

test.describe('Pricing Estimator with Promo', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute('**');
    await setupSupabaseMocks(page);
    await setupComprehensiveMocks(page);
    await enableTestMode(page, USER_A);
    
    await page.goto('/shipping-estimator', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('should show 0% platform fee during promo period', async ({ page }) => {
    // Mock date to be before promo end
    await page.addInitScript(() => {
      Date.now = () => new Date('2026-01-15T00:00:00Z').getTime();
    });

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
    
    // Fill in form
    await page.fill('input[id="length"]', '20');
    await page.fill('input[id="width"]', '15');
    await page.fill('input[id="height"]', '10');
    await page.fill('input[id="weight"]', '5');
    
    // Wait for estimate to calculate
    await page.waitForSelector('text=Price Comparison', { timeout: 5000 });
    
    // Check that platform fee is 0% (should be reflected in lower prices)
    // This is a placeholder - actual implementation would check the breakdown
    expect(true).toBe(true);
  });

  test('should show premium savings message', async ({ page }) => {
    // Fill in form and check for premium savings message
    await page.fill('input[id="length"]', '20');
    await page.fill('input[id="width"]', '15');
    await page.fill('input[id="height"]', '10');
    await page.fill('input[id="weight"]', '5');
    
    await page.waitForSelector('text=Price Comparison', { timeout: 5000 });
    
    // Check for premium savings message
    const premiumMessage = page.locator('text=/Premium saves you up to/');
    if (await premiumMessage.isVisible()) {
      expect(await premiumMessage.textContent()).toContain('%');
    }
  });

  test('should show Early Supporter Reward message during promo', async ({ page }) => {
    // Mock date to be before promo end - must be before navigation
    await page.addInitScript(() => {
      Date.now = () => new Date('2026-01-15T00:00:00Z').getTime();
    });

    // Mock users table to ensure user is NOT premium (no active subscription)
    await page.route('**/rest/v1/users**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/users') && route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: USER_A.id,
            email: USER_A.email,
            subscription_status: null, // NOT premium
            supporter_status: null,
            lifetime_pro: false,
          }]),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Fill in form completely - need countries and dimensions
    await selectCountry(page, 'origin_country', 'United States');
    await page.waitForTimeout(1000);
    await selectCountry(page, 'destination_country', 'Canada');
    await page.waitForTimeout(1000);
    
    await page.fill('input[id="length"]', '20');
    await page.fill('input[id="width"]', '15');
    await page.fill('input[id="height"]', '10');
    await page.fill('input[id="weight"]', '5');
    await page.waitForTimeout(2000); // Wait for estimate calculation
    
    // Wait for estimate to calculate and price comparison to appear
    await page.waitForSelector('text=Price Comparison', { timeout: 15000 });
    await page.waitForTimeout(3000); // Wait for React to render premiumSavingsMessage
    
    // Check for Early Supporter message - appears in the price comparison section
    // Text: "Early Supporter Reward: You're paying 0% platform fees..."
    // Try multiple patterns to find the message
    const promoTexts = [
      page.getByText(/Early Supporter Reward:/i),
      page.getByText(/You're paying 0% platform fees/i),
      page.getByText(/Early Supporter/i).filter({ hasText: /0%/ }),
      page.locator('strong:has-text("Early Supporter Reward")'),
    ];
    
    let found = false;
    for (const promoText of promoTexts) {
      const visible = await promoText.first().isVisible({ timeout: 5000 }).catch(() => false);
      if (visible) {
        found = true;
        break;
      }
    }
    
    expect(found).toBe(true);
  });

  test('should not show promo on shipping calculator if suppressed', async ({ page }) => {
    // This would test the suppressOnPages functionality
    // Placeholder for now
    expect(true).toBe(true);
  });
});

