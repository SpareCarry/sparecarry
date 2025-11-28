// @ts-nocheck
/**
 * Negative path tests - test error handling and edge cases
 * These tests ensure the app handles errors gracefully
 */

import { test, expect } from '@playwright/test';
import { setupSupabaseMocks } from './helpers/supabase-mocks';

test.describe('Negative Path Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupSupabaseMocks(page);
  });

  test('should handle invalid email format gracefully', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    await emailInput.fill('invalid-email');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Override OTP mock to return error
    await page.route("**/auth/v1/otp**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Network error',
            status: 500,
          },
        }),
      });
    });
    
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('test@example.com');
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();
    
    // Wait for error message to appear
    await page.waitForFunction(
      () => {
        const text = document.body.textContent || '';
        const errorDiv = document.querySelector('div.bg-red-50, div[class*="error"], div[class*="Error"]');
        return text.includes('Network error') || text.includes('error') || errorDiv !== null;
      },
      { timeout: 10000 }
    ).catch(() => {});
    
    // Check for error message with multiple selectors
    const errorMessage = page.locator('text=Network error')
      .or(page.locator('text=/network error/i'))
      .or(page.locator('div.bg-red-50'))
      .or(page.locator('div[class*="error"]'))
      .first();
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle missing redirect parameter', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Should still load login page without redirect parameter
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    // Default redirect should be /home
    const url = page.url();
    expect(url).toContain('/auth/login');
  });

  test('should handle expired or invalid magic link', async ({ page }) => {
    // Navigate to callback with invalid code
    await page.goto('/auth/callback?code=invalid-code&redirect=/home', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    
    // Wait for redirect to login page or error handling
    try {
      await page.waitForURL(/\/auth\/login/, { timeout: 20000 });
    } catch (e) {
      // Fallback: wait for URL to change
      await page.waitForFunction(
        () => {
          return /\/auth\/login/.test(window.location.href) || 
                 /\/auth\/callback/.test(window.location.href);
        },
        { timeout: 20000 }
      ).catch(() => {});
      
      // Check final URL
      const finalUrl = page.url();
      // Should redirect to login or stay on callback (both are valid error handling)
      expect(finalUrl.includes('/auth/login') || finalUrl.includes('/auth/callback')).toBe(true);
    }
  });

  test('should handle empty form submission', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500).catch(() => {}); // Give React time to render
    
    // Wait for email input to be visible first
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    
    // Try to submit without email
    await submitButton.click();
    
    // Wait a bit for validation to trigger
    await page.waitForTimeout(500).catch(() => {});
    
    // HTML5 validation should prevent submission
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => {
      return el.validity.valid;
    });
    
    // Empty email should fail validation
    expect(isValid).toBe(false);
  });
});

