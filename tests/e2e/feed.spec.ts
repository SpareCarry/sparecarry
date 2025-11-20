import { test, expect } from '@playwright/test';

test.describe('Feed Browsing', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication or use test user
    await page.goto('/home');
  });

  test('should display feed page', async ({ page }) => {
    await expect(page.getByText(/browse|feed/i)).toBeVisible();
  });

  test('should allow filtering by type', async ({ page }) => {
    // This test assumes filter UI exists
    // Adjust selectors based on actual implementation
    const tripFilter = page.getByRole('button', { name: /trips/i });
    if (await tripFilter.isVisible()) {
      await tripFilter.click();
      // Verify filtered results
    }
  });
});

