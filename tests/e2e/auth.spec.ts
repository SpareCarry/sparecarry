// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setupSupabaseMocks } from './helpers/supabase-mocks';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // CRITICAL: Set up Supabase mocks BEFORE any navigation or interactions
    await setupSupabaseMocks(page);

    // Clear cookies before navigation
    try {
      await context.clearCookies();
    } catch (e) {
      // Context might be closed - ignore
    }
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait for page to fully load and React to render
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Wait for the heading to appear
    await expect(page.getByText('Welcome to CarrySpace')).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500).catch(() => {}); // Give React time to render
    
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('invalid-email');
    
    const submitButton = page.getByRole('button', { name: /send magic link/i });
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();
    
    // Should show HTML5 validation or error message
    // Wait a bit for validation to trigger
    await page.waitForTimeout(500);
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.getByText('Welcome to CarrySpace')).toBeVisible({ timeout: 10000 });
    
    // Find and click the signup link
    const signupLink = page.getByRole('link', { name: /sign up/i });
    await expect(signupLink).toBeVisible({ timeout: 10000 });
    
    // Click and wait for navigation - use waitForFunction for client-side routing
    await signupLink.click();
    
    // Wait for URL to change to signup page - Next.js client-side routing
    try {
      await page.waitForFunction(
        () => {
          return /\/auth\/signup/.test(window.location.href);
        },
        { timeout: 10000, polling: 100 }
      );
    } catch (e) {
      // Fallback: wait for navigation event if available
      await page.waitForURL(/.*\/auth\/signup/, { timeout: 5000 }).catch(() => {});
    }
    
    await expect(page).toHaveURL(/.*\/auth\/signup/, { timeout: 5000 });
  });
});

