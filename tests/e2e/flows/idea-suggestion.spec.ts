// @ts-nocheck
import { test, expect } from "@playwright/test";
import { enableTestMode } from '../setup/testModeSetup';
import { USER_A } from '../setup/testUsers';
import { setupSupabaseMocks } from '../helpers/supabase-mocks';
import { setupComprehensiveMocks } from '../helpers/comprehensive-mocks';

test.describe("Idea Suggestion Flow", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute('**');
    await setupSupabaseMocks(page);
    await setupComprehensiveMocks(page);
    await enableTestMode(page, USER_A);
  });

  test("user can navigate to suggest idea from profile", async ({ page }) => {
    // Navigate to profile
    await page.goto("/home/profile");
    
    // Wait for profile page to load
    await page.waitForSelector('text=Profile', { timeout: 10000 });
    
    // Find and click "Suggest an Idea" button
    const suggestIdeaButton = page.locator('button:has-text("Submit Idea")');
    await expect(suggestIdeaButton).toBeVisible();
    await suggestIdeaButton.click();
    
    // Should navigate to suggest idea page
    await page.waitForURL("**/home/suggest-idea", { timeout: 10000 });
    await expect(page.locator('text=Suggest an Idea')).toBeVisible();
  });

  test("user can submit an idea suggestion", async ({ page }) => {
    // Navigate directly to suggest idea page
    await page.goto("/home/suggest-idea");
    
    // Wait for form to load
    await page.waitForSelector('input[id="title"]', { timeout: 10000 });
    
    // Fill in the form
    await page.fill('input[id="title"]', "Add dark mode support");
    await page.fill('textarea[id="description"]', "I would love to have a dark mode option for better visibility at night. This would improve the user experience significantly.");
    
    // Submit the form
    const submitButton = page.locator('button:has-text("Submit Idea")');
    await submitButton.click();
    
    // Should show success message
    await expect(page.locator('text=Idea Submitted!')).toBeVisible({ timeout: 15000 });
    
    // Should navigate back to profile after 2 seconds
    await page.waitForURL("**/home/profile", { timeout: 5000 });
  });

  test("form validation works correctly", async ({ page }) => {
    await page.goto("/home/suggest-idea");
    
    await page.waitForSelector('input[id="title"]', { timeout: 10000 });
    
    // Try to submit with short title
    await page.fill('input[id="title"]', "Test");
    await page.fill('textarea[id="description"]', "Short description");
    
    await page.locator('button:has-text("Submit Idea")').click();
    
    // Should show validation errors
    await expect(page.locator('text=Title must be at least 5 characters')).toBeVisible();
    await expect(page.locator('text=Description must be at least 20 characters')).toBeVisible();
  });
});

