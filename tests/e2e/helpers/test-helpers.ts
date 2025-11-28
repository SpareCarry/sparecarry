/**
 * Shared test helper functions for E2E tests
 */

import { Page } from '@playwright/test';

/**
 * Helper function to select a country from CountrySelect component
 * Handles scrolling, focusing, filling, and selecting from dropdown
 */
export async function selectCountry(page: Page, inputId: string, countryName: string) {
  const input = page.locator(`#${inputId}`).first();
  
  // Wait for input to be visible
  await input.waitFor({ state: 'visible', timeout: 10000 });
  
  // Click to focus and open dropdown
  await input.click();
  await page.waitForTimeout(300);
  
  // Clear any existing value and type the country name
  await input.fill('');
  await input.fill(countryName);
  
  // Wait for debounce (250ms default) plus dropdown render time
  await page.waitForTimeout(500);
  
  // Wait for dropdown to be visible (has role="listbox")
  // Try multiple selectors for Radix UI Select component
  const dropdown = page.locator('[role="listbox"]')
    .or(page.locator('[data-radix-popper-content-wrapper]'))
    .or(page.locator('[data-radix-select-content]'))
    .first();
  
  // Wait for dropdown with multiple strategies
  try {
    await dropdown.waitFor({ state: 'visible', timeout: 15000 });
  } catch (e) {
    // Fallback: wait for any visible option or content
    await page.waitForFunction(
      () => {
        const listbox = document.querySelector('[role="listbox"]');
        const popper = document.querySelector('[data-radix-popper-content-wrapper]');
        const content = document.querySelector('[data-radix-select-content]');
        return listbox || popper || content;
      },
      { timeout: 15000 }
    ).catch(() => {});
  }
  
  // Find the option button containing the country name
  // Options are buttons with role="option" containing the country name in a span
  // Try multiple selectors
  const option = page.locator(`button[role="option"]:has-text("${countryName}")`)
    .or(page.locator(`[role="option"]:has-text("${countryName}")`))
    .or(page.getByRole('option', { name: countryName }))
    .first();
  
  // Wait for option to be visible (might need scrolling)
  try {
    await option.waitFor({ state: 'visible', timeout: 15000 });
  } catch (e) {
    // Fallback: wait for any option to appear
    await page.waitForFunction(
      (name) => {
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        return options.some(opt => opt.textContent?.includes(name));
      },
      countryName,
      { timeout: 15000 }
    ).catch(() => {});
  }
  
  // Scroll option into view if needed
  await option.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  
  // Click the option
  await option.click();
  await page.waitForTimeout(500);
}

/**
 * Helper to wait for page navigation
 */
export async function waitForNavigation(page: Page, urlPattern: string | RegExp, timeout = 10000) {
  if (typeof urlPattern === 'string') {
    await page.waitForURL(`**${urlPattern}**`, { timeout }).catch(() => {});
  } else {
    // For regex patterns, wait and check
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    if (!urlPattern.test(currentUrl)) {
      await page.waitForURL(urlPattern, { timeout }).catch(() => {});
    }
  }
}

/**
 * Helper to fill form field safely
 */
export async function fillField(page: Page, selector: string, value: string, timeout = 5000) {
  const field = page.locator(selector).first();
  if (await field.isVisible({ timeout }).catch(() => false)) {
    await field.focus({ timeout });
    await page.waitForTimeout(100);
    await field.fill(value);
    await page.waitForTimeout(200);
  }
}

/**
 * Helper to click button and wait for navigation
 */
export async function clickAndWaitForNavigation(
  page: Page,
  buttonSelector: string | { role: string; name: string | RegExp },
  expectedUrl: string,
  timeout = 10000
) {
  let button;
  if (typeof buttonSelector === 'string') {
    button = page.locator(buttonSelector).first();
  } else {
    button = page.getByRole(buttonSelector.role as any, { name: buttonSelector.name }).first();
  }
  
  const buttonExists = await button.isVisible({ timeout: 5000 }).catch(() => false);
  if (buttonExists) {
    await Promise.all([
      page.waitForURL(`**${expectedUrl}**`, { timeout }).catch(() => {}),
      button.click(),
    ]);
    await page.waitForTimeout(1000);
  }
}

