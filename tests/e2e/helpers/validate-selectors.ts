/**
 * Validation utilities for ensuring all selectors are valid and stable
 */

import type { Page } from '@playwright/test';

/**
 * List of all critical selectors used in tests
 */
export const CRITICAL_SELECTORS = {
  // Landing page
  landingPagePlaneButton: "button[name*='traveling by Plane'], button:has-text('I\\'m traveling by Plane')",
  landingPageBoatButton: "button[name*='sailing by Boat'], button:has-text('I\\'m sailing by Boat')",
  
  // Login page
  loginPageHeading: "text=/Welcome to CarrySpace/i, h1:has-text('Welcome to CarrySpace')",
  loginPageEmailInput: "input[type='email'], [aria-label*='email' i], [label*='email' i]",
  loginPageSubmitButton: "button[type='submit'], button:has-text('Send Magic Link')",
  loginPageSuccessMessage: "div.bg-teal-50, text=/check your email/i",
  loginPageErrorMessage: "div.bg-red-50, text=/error|failed/i",
  loginPageSignupLink: "a[href*='/auth/signup'], link:has-text('Sign up')",
  
  // Feed page
  feedPageHeading: "h1:has-text('Browse'), heading[name*='Browse' i]",
  feedPageBrowseLink: "a[href='/home'], link:has-text('Browse')",
  
  // Navigation
  navigationBrowseLink: "a[href='/home'], link:has-text('Browse')",
} as const;

/**
 * Validate that critical selectors exist on the page
 */
export async function validateSelectors(
  page: Page,
  selectors: Record<string, string | string[]>
): Promise<{
  valid: boolean;
  missing: string[];
  found: string[];
}> {
  const missing: string[] = [];
  const found: string[] = [];
  
  for (const [name, selector] of Object.entries(selectors)) {
    const selectorsList = Array.isArray(selector) ? selector : [selector];
    let foundAny = false;
    
    for (const sel of selectorsList) {
      try {
        const count = await page.locator(sel).count();
        if (count > 0) {
          foundAny = true;
          found.push(name);
          break;
        }
      } catch (e) {
        // Selector syntax error - log but continue
        console.warn(`Invalid selector "${sel}" for ${name}:`, e);
      }
    }
    
    if (!foundAny) {
      missing.push(name);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    found,
  };
}

/**
 * Get all critical selectors for documentation
 */
export function getCriticalSelectors(): typeof CRITICAL_SELECTORS {
  return CRITICAL_SELECTORS;
}

/**
 * Check if a selector is stable (uses semantic attributes)
 */
export function isStableSelector(selector: string): boolean {
  // Stable patterns: role-based, type-based, data-testid
  const stablePatterns = [
    /\[role=/,
    /\[type=/,
    /\[data-testid=/,
    /getByRole\(/,
    /getByLabel\(/,
    /getByTestId\(/,
  ];
  
  return stablePatterns.some(pattern => pattern.test(selector));
}

/**
 * Check if a selector is fragile (uses text, classes, or nested paths)
 */
export function isFragileSelector(selector: string): boolean {
  // Fragile patterns: text content, CSS classes, complex paths
  const fragilePatterns = [
    /:has-text\(/,
    /text=/,
    /\.[a-z-]+/, // CSS classes
    />>>/, // Complex selectors
  ];
  
  return fragilePatterns.some(pattern => pattern.test(selector));
}

