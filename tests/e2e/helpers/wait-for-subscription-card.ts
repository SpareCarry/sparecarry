/**
 * Helper function to wait for subscription card to appear
 * Uses multiple selectors and longer timeout for reliability
 */
import { Page, Locator } from '@playwright/test';

export async function waitForSubscriptionCard(page: Page, timeout = 25000): Promise<Locator> {
  // Try multiple selectors in order of preference
  const selectors = [
    page.locator('[data-testid="sparecarry-pro-title"]'),
    page.locator('[data-testid="subscription-card"]'),
    page.getByText('SpareCarry Pro').first(),
    page.locator('text=SpareCarry Pro').first(),
    page.locator('h1:has-text("SpareCarry Pro")').first(),
    page.locator('h2:has-text("SpareCarry Pro")').first(),
    page.locator('[class*="CardTitle"]:has-text("SpareCarry Pro")').first(),
  ];

  // Wait for any of the selectors to be visible
  for (const selector of selectors) {
    try {
      await selector.waitFor({ state: 'visible', timeout });
      return selector;
    } catch (e) {
      // Try next selector
      continue;
    }
  }

  // If none found, throw with helpful error
  throw new Error(
    `Subscription card ("SpareCarry Pro") not found after ${timeout}ms. ` +
    `Page URL: ${page.url()}. ` +
    `Check screenshot for details.`
  );
}

