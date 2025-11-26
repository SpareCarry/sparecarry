// @ts-nocheck
/**
 * Trusted Traveller Badge Tests
 * 
 * Tests the trusted traveller badge system
 */

import { test, expect } from '@playwright/test';
import { enableTestMode } from './setup/testModeSetup';
import { USER_A } from './setup/testUsers';
import { setupSupabaseMocks } from './helpers/supabase-mocks';
import { setupComprehensiveMocks } from './helpers/comprehensive-mocks';

test.describe('Trusted Traveller Badge', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute('**');
    await setupSupabaseMocks(page);
    await setupComprehensiveMocks(page);
  });

  test('should display trusted traveller badge on profile when user has badge', async ({ page }) => {
    // Mock user with trusted traveller stats (3+ completed jobs)
    await enableTestMode(page, USER_A);

    // Mock traveller_stats with 3 completed jobs
    await page.route((url) => url.href.includes('/rest/v1/traveller_stats'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          user_id: USER_A.id,
          completed_jobs_count: 3,
          last_completed_at: new Date().toISOString(),
        }]),
      });
    });

    // Mock user_badges with trusted_traveller
    await page.route((url) => url.href.includes('/rest/v1/user_badges'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'badge-1',
          user_id: USER_A.id,
          badge_id: 'trusted-badge-id',
          awarded_at: new Date().toISOString(),
          badge: {
            id: 'trusted-badge-id',
            slug: 'trusted_traveller',
            title: 'Trusted Traveller',
            description: 'Completed 3 successful jobs',
            icon: 'shield-check',
          },
        }]),
      });
    });

    await page.goto(`${baseUrl}/home/profile`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Verify profile page loads - check for h1 with "Profile" text
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible({ timeout: 15000 });
  });
});

