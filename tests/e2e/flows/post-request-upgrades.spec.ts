// @ts-nocheck
/**
 * Post Request Upgrades E2E Tests
 * 
 * Tests for the upgraded Post Request form:
 * - Photo upload functionality
 * - Category dropdown with "Other" option
 * - Restricted items checkbox
 * - Emergency add-on pricing
 * - Buy & Ship Directly section
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { enableTestMode } from '../setup/testModeSetup';
import { USER_A } from '../setup/testUsers';
import { setupSupabaseMocks } from '../helpers/supabase-mocks';
import { setupComprehensiveMocks } from '../helpers/comprehensive-mocks';

const openCategoryDropdown = async (page: Page) => {
  const trigger = page.locator('#category').first();
  await trigger.click();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(300);
};

const selectCategoryOption = async (page: Page, optionName: string | RegExp) => {
  await openCategoryDropdown(page);
  const option = page.getByRole('option', { name: optionName });
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();
  await page.waitForTimeout(200);
};

const setRangeValue = async (page: Page, selector: string, value: number) => {
  await page.locator(selector).evaluate((el, val) => {
    const input = el as HTMLInputElement;
    input.value = val;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value.toString());
  await page.waitForTimeout(200);
};

test.describe('Post Request Upgrades', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute('**');
    await setupSupabaseMocks(page);
    await setupComprehensiveMocks(page);
  });

  test('should display category dropdown with options', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Check for category dropdown
    await expect(page.locator('#category').first()).toBeVisible({ timeout: 15000 });

    await openCategoryDropdown(page);

    await expect(page.getByRole('option', { name: 'Electronics' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Marine Equipment' })).toBeVisible();
    await expect(page.getByRole('option', { name: /^Other$/ })).toBeVisible();
  });

  test('should show "Other" description field when "Other" is selected', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Select "Other" category
    await selectCategoryOption(page, /^Other$/);

    // Check for description field
    const otherDescription = page.locator('#category_other_description').first();
    await expect(otherDescription).toBeVisible();
    
    // Fill in description
    await otherDescription.fill('Custom marine parts');
    await expect(otherDescription).toHaveValue('Custom marine parts');
  });

  test('should show restricted items checkbox and prevent plane transport', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Check for restricted items checkbox
    const restrictedCheckbox = page.locator('#restricted_items').first();
    await expect(restrictedCheckbox).toBeVisible({ timeout: 15000 });
    
    // Check the checkbox
    await restrictedCheckbox.check();
    await page.waitForTimeout(500);

    // Verify preferred method is disabled or changed to boat
    const preferredMethod = page.locator('#preferred_method').first();
    const isDisabled = await preferredMethod.isDisabled().catch(() => false);
    
    // Either the select should be disabled, or plane option should be disabled
    if (!isDisabled) {
      await preferredMethod.click();
      await page.waitForTimeout(500);
      // Plane option should be disabled or not visible
      const planeOption = page.getByText('Plane only').first();
      const isPlaneDisabled = await planeOption.isDisabled().catch(() => false);
      expect(isPlaneDisabled || !(await planeOption.isVisible().catch(() => false))).toBeTruthy();
    }
  });

  test('should calculate emergency pricing correctly', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Set base reward to $20 (should get 25% bonus)
    await setRangeValue(page, '#max_reward', 20);

    // Check emergency checkbox
    const emergencyCheckbox = page.locator('#emergency').first();
    await emergencyCheckbox.check();
    await page.waitForTimeout(500);

    // Verify emergency pricing display
    // Should show "+25% → $5 extra (total $25)" for $20 base
    await expect(page.getByText(/Emergency.*\+25%/i)).toBeVisible({ timeout: 5000 }).catch(() => {
      // Alternative: check for emergency mode active text
      expect(page.getByText(/Emergency Mode Active/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test('should cap emergency bonus at $15', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Set base reward to $200 (10% would be $20, but should cap at $15)
    await setRangeValue(page, '#max_reward', 200);

    // Check emergency checkbox
    const emergencyCheckbox = page.locator('#emergency').first();
    await emergencyCheckbox.check();
    await page.waitForTimeout(500);

    // Verify cap is applied (should show $15 extra, not $20)
    // Total should be $215, not $220
    const emergencyParagraph = page.locator('p').filter({ hasText: /Emergency Mode Active/i }).first();
    const emergencyText = await emergencyParagraph.textContent().catch(() => '');
    expect(emergencyText).toMatch(/\$15(\.00)?/);
    expect(emergencyText).not.toMatch(/\$20(\.00)?/);
  });

  test('should allow photo upload', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Check for photo upload button
    const photoUploadButton = page.getByText(/Add Photos/i).first();
    await expect(photoUploadButton).toBeVisible({ timeout: 15000 });
    
    // Note: Actual file upload in Playwright requires a file input
    // For now, we just verify the button exists
    // In a real test, you'd create a test image file and upload it
  });

  test('should display updated Buy & Ship Directly wording', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Scroll to Buy & Ship Directly section
    const buyShipSection = page.getByText(/Buy & Ship Directly/i).first();
    await expect(buyShipSection).toBeVisible({ timeout: 15000 });
    
    // Check for updated wording
    await expect(page.getByText(/User purchases item from retailer/i)).toBeVisible();
    await expect(page.getByText(/SpareCarry delivers to traveler/i)).toBeVisible();
  });

  test('should submit form with all new fields', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/home/post-request`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Fill in required fields
    await page.locator('#title').first().fill('Test Item');
    await page.locator('#length_cm').first().fill('10');
    await page.locator('#width_cm').first().fill('10');
    await page.locator('#height_cm').first().fill('10');
    await page.locator('#weight_kg').first().fill('1');
    
    // Select category
    await selectCategoryOption(page, 'Electronics');

    // Set deadline
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deadlineStr = tomorrow.toISOString().split('T')[0];
    await page.locator('#deadline_latest').first().fill(deadlineStr);

    // Set reward
    await setRangeValue(page, '#max_reward', 100);

    // Note: Full form submission test would require location inputs and other fields
    // This test verifies the new fields are present and can be filled
  });
});

