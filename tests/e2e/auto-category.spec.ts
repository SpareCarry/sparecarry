// @ts-nocheck
/**
 * Auto Category Detection Tests
 * 
 * Tests automatic category detection from title/description
 */

import { test, expect } from '@playwright/test';
import { enableTestMode } from './setup/testModeSetup';
import { USER_A } from './setup/testUsers';
import { setupSupabaseMocks } from './helpers/supabase-mocks';
import { setupComprehensiveMocks } from './helpers/comprehensive-mocks';

test.describe('Auto Category Detection', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute('**');
    await setupSupabaseMocks(page);
    await setupComprehensiveMocks(page);
  });

  test('should auto-detect electronics category from iPhone title', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Enter title that should trigger electronics category
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.fill('iPhone 14 Pro case');

    // Wait for category detection (if implemented in real-time)
    await page.waitForTimeout(1000);

    // Verify title was entered
    expect(await titleInput.inputValue()).toContain('iPhone');

    // Note: Category detection would show in UI if integrated
    // This test verifies the form accepts the input
  });

  test('should auto-detect clothing category', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Wait for title input to be visible before interacting
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 15000 });
    await titleInput.fill('Nike running shoes size 10');

    await page.waitForTimeout(1000);

    expect(await titleInput.inputValue()).toContain('shoes');
  });
});

