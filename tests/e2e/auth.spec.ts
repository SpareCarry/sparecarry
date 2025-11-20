import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByText('Welcome to CarrySpace')).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByRole('button', { name: /send magic link/i }).click();
    
    // Should show HTML5 validation or error message
    const emailInput = page.getByLabel(/email/i);
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/.*\/auth\/signup/);
  });
});

