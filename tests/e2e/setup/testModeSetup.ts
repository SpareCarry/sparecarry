/**
 * Test Mode Setup for Playwright
 * 
 * This enables test mode in the application, which bypasses authentication.
 * Much more reliable than trying to mock Supabase at the network/module level.
 */

import { Page } from '@playwright/test';
import { TestUser } from './testUserFactory';
import { setupUserMocks } from './supabaseHelpers';

export async function enableTestMode(page: Page, user: TestUser) {
  console.log(`[TEST_MODE] Enabling test mode for user: ${user.email}`);

  // Set test mode flag and user BEFORE page loads
  await page.addInitScript((userData) => {
    // Enable test mode
    (window as any).__PLAYWRIGHT_TEST_MODE__ = true;
    
    // Store test user
    (window as any).__TEST_USER__ = {
      id: userData.id,
      email: userData.email,
      phone: userData.phone || '',
      aud: 'authenticated',
      role: 'authenticated',
      email_confirmed_at: new Date().toISOString(),
      confirmed_at: userData.created_at || new Date().toISOString(),
      created_at: userData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {
        email: userData.email,
        email_verified: true,
        phone_verified: false,
        sub: userData.id,
      },
    };
    
    console.log('[TEST_MODE] ✓ Test mode enabled for:', userData.email);
    console.log('[TEST_MODE] ✓ Test user stored');
  }, user);

  // Ensure Supabase REST endpoints return this user's data
  await setupUserMocks(page, user);

  console.log(`[TEST_MODE] Test mode setup complete for: ${user.email}`);
}

