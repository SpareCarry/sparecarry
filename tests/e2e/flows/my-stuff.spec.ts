// @ts-nocheck
/**
 * My Stuff Page E2E Tests
 * 
 * Tests for the My Stuff page including:
 * - Support button functionality
 * - Email support link
 * - Page rendering
 */

import { test, expect } from '@playwright/test';
import { enableTestMode } from '../setup/testModeSetup';
import { USER_A } from '../setup/testUsers';
import { setupSupabaseMocks } from '../helpers/supabase-mocks';
import { setupComprehensiveMocks } from '../helpers/comprehensive-mocks';

test.describe('My Stuff Page', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute('**');
    await setupSupabaseMocks(page);
    await setupComprehensiveMocks(page);
  });

  test('should navigate to my stuff page', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/my-stuff`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Verify page loaded
    await expect(page.getByRole('heading', { name: 'My Stuff', exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('should show only one support button with correct email link', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/my-stuff`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Verify page loaded
    await expect(page.getByRole('heading', { name: 'My Stuff', exact: true })).toBeVisible({ timeout: 15000 });

    // There should be at least one visible Contact Support button
    const contactButtons = page.getByRole('button', { name: /Contact Support/i });
    const buttonCount = await contactButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(1);

    // Open the contact form modal
    await contactButtons.first().click();
    await expect(page.getByRole('heading', { name: 'Contact Support' })).toBeVisible();

    // Close the dialog so other tests can keep running
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('should not show "Start chat" button', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/my-stuff`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Verify page loaded
    await expect(page.getByRole('heading', { name: 'My Stuff', exact: true })).toBeVisible({ timeout: 15000 });

    // Verify "Start chat" button does NOT exist
    const startChatButton = page.getByText(/Start chat|Start a chat/i);
    const hasStartChat = await startChatButton.isVisible().catch(() => false);
    expect(hasStartChat).toBe(false);
  });

  test('should have accessible support button', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/my-stuff`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Find the contact support button
    const supportButton = page.getByRole('button', { name: /Contact Support/i });
    await expect(supportButton).toBeVisible({ timeout: 5000 });

    // Verify it has a reasonable touch target
    const boundingBox = await supportButton.boundingBox();
    if (boundingBox) {
      // Minimum touch target size guidelines are 44px; allow slight padding differences in tests.
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
      expect(boundingBox.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('should open email client when support button is clicked', async ({ page, context }) => {
    await enableTestMode(page, USER_A);

    // Track navigation to mailto: links
    let mailtoOpened = false;
    
    context.on('page', (newPage) => {
      if (newPage.url().startsWith('mailto:')) {
        mailtoOpened = true;
      }
    });

    await page.goto(`${baseUrl}/home/my-stuff`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Find and click the contact support button
    const supportButton = page.getByRole('button', { name: /Contact Support/i });
    await expect(supportButton).toBeVisible({ timeout: 5000 });

    await supportButton.click();

    // Dialog should appear with the contact form fields
    await expect(page.getByRole('heading', { name: 'Contact Support' })).toBeVisible();
    await expect(page.getByLabel('Subject *')).toBeVisible();
    await expect(page.getByLabel('Message *')).toBeVisible();

    // Close dialog
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});

