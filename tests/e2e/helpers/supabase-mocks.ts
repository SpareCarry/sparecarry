/**
 * Helper functions for mocking Supabase endpoints in Playwright tests
 * 
 * Call setupSupabaseMocks() BEFORE any page.goto() or form interactions
 * 
 * This mock helper provides type-safe responses matching Supabase's actual API structure
 */

import { Page } from '@playwright/test';
import type {
  OTPResponse,
  UserResponse,
  TokenResponse,
  SupabaseUser,
} from './types';
import {
  createMockOTPResponse,
  createMockUserResponse,
  createMockTokenResponse,
} from './types';

// Shared state to track mocked users - allows setupSupabaseMocks to return user if set
const mockedUsers = new WeakMap<Page, SupabaseUser>();

export function getMockedUser(page: Page): SupabaseUser | null {
  return mockedUsers.get(page) || null;
}

export function setMockedUser(page: Page, user: SupabaseUser | null): void {
  if (user) {
    mockedUsers.set(page, user);
  } else {
    mockedUsers.delete(page);
  }
}

/**
 * Mock all Supabase auth and API endpoints
 * Call this BEFORE any page.goto() or form interactions
 */
export async function setupSupabaseMocks(page: Page) {
  // Mock OTP endpoint (magic link sign-in)
  // IMPORTANT: Match all possible URL patterns, including query parameters
  // Pattern must match: **/auth/v1/otp* (with or without query params)
  
  // Route pattern that matches OTP endpoint with or without query parameters
  await page.route("**/auth/v1/otp**", async (route) => {
    const request = route.request();
    // Only mock POST requests (OTP requests)
    if (request.method() === "POST") {
      console.log('[MOCK] Intercepting OTP request:', request.url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        // Supabase OTP success response is just an empty object
        body: JSON.stringify({}),
      });
    } else {
      await route.continue();
    }
  });

  // Also catch any Supabase domain patterns
  await page.route("**/*supabase*/auth/v1/otp**", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      console.log('[MOCK] Intercepting OTP request (supabase domain):', request.url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({}),
      });
    } else {
      await route.continue();
    }
  });

  // Mock token endpoint (session refresh, code exchange, set session)
  // Keep simple - just return empty object for most cases
  await page.route("**/auth/v1/token**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({}),
    });
  });

  // Mock token endpoint with Supabase domain
  await page.route("**/*supabase*/auth/v1/token**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({}),
    });
  });

  // Mock user endpoint (get user info) - only for GET requests
  // Check if a user has been mocked via setupUserMocks - if so, return that user
  // IMPORTANT: Check shared state dynamically when the route handler runs
  // CRITICAL: Routes from mockUserAuth will be registered AFTER this and take precedence
  // So this handler should only be used if mockUserAuth routes haven't been registered yet
  const userRouteHandler = async (route: any) => {
    const request = route.request();
    const url = request.url();
    
    // Only handle GET requests to /auth/v1/user endpoints (but not with code param)
    if (request.method() === "GET" && url.includes('/auth/v1/user') && !url.includes('/auth/v1/user?code=')) {
      // Check shared state FIRST - this is checked dynamically on every request
      // This allows setupUserMocks to set a user that will be returned here
      const mockedUser = getMockedUser(page);
      
      // Log for debugging
      console.log(`[SETUP_SUPABASE_MOCKS] Intercepted GET ${url}`);
      if (mockedUser) {
        console.log(`[SETUP_SUPABASE_MOCKS] Returning mocked user from shared state: ${mockedUser.email}`);
        // If a user is mocked, return it
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ 
            user: mockedUser,
            error: null 
          }),
        });
        return; // Stop here
      } else {
        console.log(`[SETUP_SUPABASE_MOCKS] No mocked user in shared state, returning null (unauthenticated)`);
        // If no user is mocked, return null (unauthenticated)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ 
            user: null,
            error: null 
          }),
        });
        return; // Stop here - don't continue to other routes
      }
    } else {
      await route.continue();
    }
  };

  // Register routes - these will be checked in reverse order (last registered = first checked)
  // Routes registered later by mockUserAuth will be checked first
  // CRITICAL: Use function matchers - they work better than string patterns for Supabase URLs
  // Function matchers are checked before string patterns in Playwright
  await page.route((url) => {
    const href = typeof url === 'string' ? url : (url.href || (url as any).url || '');
    return href.includes('/auth/v1/user') && !href.includes('/auth/v1/user?code=');
  }, userRouteHandler);
  
  // Also register string patterns as fallback (function matcher takes precedence)
  await page.route("**/auth/v1/user**", userRouteHandler);
  await page.route("**/*supabase*/auth/v1/user**", userRouteHandler);

  // Storage APIs remain mocked to avoid network calls
  await page.route("**/storage/v1/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.route("**/*supabase*/storage/v1/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

