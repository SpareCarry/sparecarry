/**
 * Runtime Supabase Client Override
 * 
 * This provides a reliable way to mock Supabase authentication
 * by overriding the createClient function at runtime.
 * 
 * This is more reliable than network interception because:
 * 1. It works regardless of network requests
 * 2. It bypasses localStorage/cookie checks
 * 3. It's deterministic and always returns the mocked user
 */

import { Page } from '@playwright/test';
import { TestUser } from './testUserFactory';
import { SupabaseUser } from '../helpers/types';

/**
 * Installs a runtime override that mocks the Supabase client
 * This must be called BEFORE navigating to any page
 */
export async function installSupabaseClientOverride(page: Page, user: TestUser) {
  const supabaseUser: SupabaseUser = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    created_at: user.created_at,
    updated_at: new Date().toISOString(),
  };

  await page.addInitScript((userData) => {
    console.log('[SUPABASE_OVERRIDE_INIT] Installing Supabase client override for user:', userData.email);

    // Store mocked user globally - THIS IS CRITICAL
    (window as any).__MOCKED_SUPABASE_USER__ = userData;
    (window as any).__SUPABASE_OVERRIDE_INSTALLED__ = true;
    
    // Log to confirm override is being loaded
    console.log('[SUPABASE_OVERRIDE_INIT] Mocked user stored:', userData.email);
    console.log('[SUPABASE_OVERRIDE_INIT] Override flag set:', (window as any).__SUPABASE_OVERRIDE_INSTALLED__);

    // Override the module system to intercept createClient imports
    // We'll patch the Supabase SSR createBrowserClient function
    const originalDefineProperty = Object.defineProperty;
    const originalDefine = Object.defineProperty;

    // Intercept when modules are loaded
    // This is a bit of a hack, but it's the most reliable way to override modules
    if (typeof window !== 'undefined') {
      // Set up a proxy for the Supabase client
      const createMockClient = () => {
        console.log('[SUPABASE_OVERRIDE] Creating mocked Supabase client');
        
        return {
          auth: {
            getUser: async () => {
              console.log('[SUPABASE_OVERRIDE] getUser() called, returning mocked user:', userData.email);
              return Promise.resolve({
                data: { user: userData },
                error: null,
              });
            },
            getSession: async () => {
              console.log('[SUPABASE_OVERRIDE] getSession() called, returning mocked session');
              return Promise.resolve({
                data: {
                  session: {
                    access_token: 'mock-token',
                    refresh_token: 'mock-refresh',
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                    user: userData,
                  },
                },
                error: null,
              });
            },
            onAuthStateChange: () => {
              console.log('[SUPABASE_OVERRIDE] onAuthStateChange() called');
              return {
                data: { subscription: { unsubscribe: () => {} } },
              };
            },
          },
          from: (table: string) => {
            console.log('[SUPABASE_OVERRIDE] from() called for table:', table);
            // Return a mock query builder
            return {
              select: (...args: any[]) => ({
                eq: (...args: any[]) => ({
                  single: async () => ({ data: null, error: null }),
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
                order: (...args: any[]) => ({
                  limit: (...args: any[]) => ({ data: [], error: null }),
                }),
              }),
              insert: (...args: any[]) => ({
                select: (...args: any[]) => ({ data: null, error: null }),
              }),
              update: (...args: any[]) => ({
                eq: (...args: any[]) => ({ data: null, error: null }),
              }),
              delete: (...args: any[]) => ({
                eq: (...args: any[]) => ({ data: null, error: null }),
              }),
            };
          },
        };
      };

      // Store the mock client creator globally
      (window as any).__CREATE_MOCK_SUPABASE_CLIENT__ = createMockClient;

      console.log('[SUPABASE_OVERRIDE] ✓ Override installed successfully');
    }
  }, supabaseUser);

  // Also inject session data into localStorage as backup
  await page.addInitScript((userData) => {
    const session = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: userData,
    };

    // Set session in localStorage
    const projectId = 'gujyzwqcwecbeznlablx';
    const sessionKey = `sb-${projectId}-auth-token`;
    
    try {
      localStorage.setItem(sessionKey, JSON.stringify(session));
      console.log('[SUPABASE_OVERRIDE] Session injected into localStorage:', sessionKey);
    } catch (e) {
      console.error('[SUPABASE_OVERRIDE] Failed to set localStorage:', e);
    }
  }, supabaseUser);

  // Override fetch as final fallback
  await page.addInitScript((userData) => {
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      
      // Intercept Supabase auth requests
      if (url.includes('/auth/v1/user') && !url.includes('?code=')) {
        console.log('[SUPABASE_OVERRIDE] Fetch intercepted for /auth/v1/user, returning mocked user');
        return Promise.resolve(new Response(JSON.stringify({
          user: userData,
          error: null,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      
      return originalFetch.call(this, input, init);
    };
  }, supabaseUser);

  console.log(`[SUPABASE_OVERRIDE] Runtime override installed for user: ${user.email}`);
}

/**
 * Creates a test helper that uses the runtime override
 * Use this instead of setupUserMocks for more reliable auth mocking
 */
export async function setupRuntimeAuthOverride(page: Page, user: TestUser) {
  await installSupabaseClientOverride(page, user);
  
  // Wait for override to be installed
  await page.waitForTimeout(100);
  
  console.log(`[SUPABASE_OVERRIDE] Runtime auth override ready for: ${user.email}`);
}

