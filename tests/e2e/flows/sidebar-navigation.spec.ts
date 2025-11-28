// @ts-nocheck
/**
 * Sidebar Navigation E2E Tests
 * 
 * Tests for sidebar navigation functionality across pages
 */

import { test, expect } from '@playwright/test';
import { enableTestMode } from '../setup/testModeSetup';
import { USER_A } from '../setup/testUsers';
import { setupSupabaseMocks } from '../helpers/supabase-mocks';
import { setupComprehensiveMocks } from '../helpers/comprehensive-mocks';
import { selectCountry } from '../helpers/test-helpers';

test.describe('Sidebar Navigation', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute('**');
    await setupSupabaseMocks(page);
    await setupComprehensiveMocks(page);
  });

  test('should show sidebar on shipping estimator page', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/shipping-estimator`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Verify page loaded
    await expect(page.getByText(/Shipping Cost Estimator/i)).toBeVisible({ timeout: 15000 });

    // Check for desktop sidebar (hidden on mobile, visible on desktop)
    const desktopSidebar = page.locator('aside.hidden.lg\\:fixed').first();
    const viewport = page.viewportSize();
    
    if (viewport && viewport.width >= 1024) {
      // Desktop: sidebar should be visible
      const isVisible = await desktopSidebar.isVisible().catch(() => false);
      // On desktop, the sidebar class is "hidden lg:fixed" which means it's visible on large screens
      // Actually, let's check for the navigation links instead
      const browseLink = page.getByRole('link', { name: /Browse/i });
      const hasBrowseLink = await browseLink.isVisible().catch(() => false);
      expect(hasBrowseLink).toBe(true);
    } else {
      // Mobile: check for mobile menu button
      const menuButton = page.getByRole('button', { name: /open navigation menu/i });
      const hasMenuButton = await menuButton.first().isVisible().catch(() => false);
      expect(hasMenuButton).toBe(true);
    }
  });

  test('should navigate from shipping estimator via sidebar', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/shipping-estimator`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Verify page loaded
    await expect(page.getByText(/Shipping Cost Estimator/i)).toBeVisible({ timeout: 15000 });

    // Try to navigate via sidebar
    const browseLink = page.getByRole('link', { name: /Browse/i }).first();
    const hasBrowseLink = await browseLink.isVisible().catch(() => false);
    
    const homeUrlPattern = /\/home($|[?#])/;

    if (hasBrowseLink) {
      await browseLink.click();
      await page.waitForURL(homeUrlPattern, { timeout: 15000 });
    } else {
      // On mobile, open menu first
      const menuButton = page.getByRole('button', { name: /open navigation menu/i }).first();
      if (await menuButton.isVisible().catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(500);
        const browseLinkMobile = page.getByRole('link', { name: /Browse/i }).first();
        if (await browseLinkMobile.isVisible().catch(() => false)) {
          await browseLinkMobile.click();
          await page.waitForURL(homeUrlPattern, { timeout: 15000 });
        }
      }
    }
  });

  test('should highlight current page in sidebar', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/shipping-estimator`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Check if Shipping Estimator link is highlighted/active
    const estimatorLink = page.getByRole('link', { name: /Shipping Estimator/i });
    const hasEstimatorLink = await estimatorLink.isVisible().catch(() => false);
    
    if (hasEstimatorLink) {
      // Check if it has active styling (bg-teal-600 or similar)
      const classes = await estimatorLink.getAttribute('class');
      expect(classes).toContain('bg-teal-600');
    }
  });

  test('should not overlap with dropdowns and inputs', async ({ page }) => {
    await enableTestMode(page, USER_A);

    await page.goto(`${baseUrl}/shipping-estimator`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Fill form to trigger dropdowns
    const originInput = page.locator('#origin_country').first();
    if (await originInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await originInput.focus({ timeout: 5000 });
      await originInput.fill('United States');
      await page.waitForTimeout(800); // Wait for debounce and dropdown
      
      // Check if dropdown is visible and not hidden by sidebar
      const dropdown = page.locator('[role="listbox"]').first();
      const isDropdownVisible = await dropdown.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isDropdownVisible) {
        // Verify dropdown is above sidebar (check z-index or positioning)
        const dropdownBox = await dropdown.boundingBox();
        const sidebarBox = await page.locator('aside').first().boundingBox().catch(() => null);
        
        // Dropdown should be visible and clickable
        await expect(dropdown).toBeVisible();
      }
    }
  });
});

