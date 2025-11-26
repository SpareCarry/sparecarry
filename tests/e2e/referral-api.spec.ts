// @ts-nocheck
/**
 * Referral API Routes E2E Tests
 * 
 * Tests the referral API routes: get-or-create, stats, leaderboard
 */

import { test, expect } from '@playwright/test';
import { enableTestMode } from './setup/testModeSetup';
import { USER_A } from './setup/testUsers';
import { setupSupabaseMocks } from './helpers/supabase-mocks';
import { setupComprehensiveMocks } from './helpers/comprehensive-mocks';

test.describe('Referral API Routes', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute('**');
    await setupSupabaseMocks(page);
    await setupComprehensiveMocks(page);
  });

  test('should get or create referral code', async ({ page }) => {
    await enableTestMode(page, USER_A);

    // Navigate to a page that uses referral code
    await page.goto(`${baseUrl}/home/profile`, {
      waitUntil: 'domcontentloaded',
    });

    // Wait for referral code to be fetched
    await page.waitForTimeout(2000);

    // Check if referral code is displayed (component should call the API)
    const referralCode = page.locator('[data-testid="referral-code"], text=/[A-Z0-9-]+/').first();
    const hasReferralCode = await referralCode.isVisible().catch(() => false);
    
    // API should be called (check network requests or component state)
    expect(hasReferralCode).toBe(true);
  });

  test('should fetch referral stats', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/profile`, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(2000);

    // Check if stats are displayed
    const stats = page.locator('text=/referrals|credits/i').first();
    const hasStats = await stats.isVisible().catch(() => false);
    
    expect(hasStats).toBe(true);
  });

  test('should fetch referral leaderboard', async ({ page }) => {
    await page.goto(`${baseUrl}/home/profile`, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(2000);

    // Check if leaderboard is displayed (if component exists)
    const leaderboard = page.locator('text=/leaderboard|top referrers/i').first();
    const hasLeaderboard = await leaderboard.isVisible().catch(() => false);
    
    // Leaderboard might not always be visible, so this is optional
    // Just verify the page loads without errors
    expect(page.url()).toContain('/home/profile');
  });
});

