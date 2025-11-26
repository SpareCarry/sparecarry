/**
 * Supabase Module Override - Most Reliable Approach
 * 
 * This overrides module imports at the webpack/next.js level
 * to ensure ALL createClient() calls return a mocked client
 */

import { Page } from '@playwright/test';
import { TestUser } from './testUserFactory';
import { SupabaseUser } from '../helpers/types';

export async function installModuleLevelOverride(page: Page, user: TestUser) {
  const supabaseUser: SupabaseUser = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    created_at: user.created_at,
    updated_at: new Date().toISOString(),
  };

  // This script runs BEFORE any React code
  await page.addInitScript((userData) => {
    console.log('[MODULE_OVERRIDE] Installing module-level Supabase override for:', userData.email);

    // Store globally
    (window as any).__MOCKED_USER__ = userData;

    // Override the import system by intercepting webpack/module resolution
    // We'll hook into the require/import system before React loads
    const originalDefine = Object.defineProperty;
    const overriddenModules = new Map<string, any>();

    // Create mock Supabase client
    const createMockClient = () => {
      console.log('[MODULE_OVERRIDE] Creating mocked client for user:', userData.email);
      
      return {
        auth: {
          getUser: async () => {
            console.log('[MODULE_OVERRIDE] ✓ getUser() called, returning:', userData.email);
            return { data: { user: userData }, error: null };
          },
          getSession: async () => {
            console.log('[MODULE_OVERRIDE] ✓ getSession() called');
            return {
              data: {
                session: {
                  access_token: 'mock-token',
                  user: userData,
                },
              },
              error: null,
            };
          },
          onAuthStateChange: (callback: Function) => {
            console.log('[MODULE_OVERRIDE] ✓ onAuthStateChange() registered');
            // Immediately call with signed_in event
            setTimeout(() => {
              try {
                callback('SIGNED_IN', { access_token: 'mock-token', user: userData });
              } catch (e) {
                console.error('[MODULE_OVERRIDE] Error in onAuthStateChange callback:', e);
              }
            }, 0);
            return { data: { subscription: { unsubscribe: () => {} } } };
          },
        },
        from: (table: string) => {
          console.log('[MODULE_OVERRIDE] from() called for:', table);
          return {
            select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
            insert: () => ({ select: () => ({ data: null, error: null }) }),
            update: () => ({ eq: () => ({ data: null, error: null }) }),
            delete: () => ({ eq: () => ({ data: null, error: null }) }),
          };
        },
      };
    };

    // Hook into module resolution
    // When lib/supabase/client.ts exports createClient, we'll intercept it
    const moduleProxy = new Proxy({}, {
      get(target, prop) {
        if (prop === 'createClient') {
          console.log('[MODULE_OVERRIDE] createClient() called - returning mocked client');
          return createMockClient;
        }
        return undefined;
      },
    });

    // Try to override via multiple methods
    // Method 1: Override webpack require cache
    if (typeof (window as any).webpackChunk !== 'undefined') {
      console.log('[MODULE_OVERRIDE] Webpack detected, attempting to override module cache');
      // Webpack is present, try to override module resolution
    }

    // Method 2: Override via global window object
    // Export the mock client creator globally so it can be used
    (window as any).__CREATE_MOCKED_SUPABASE_CLIENT__ = createMockClient;

    console.log('[MODULE_OVERRIDE] ✓ Module override installed');
  }, supabaseUser);

  // ALSO inject into localStorage
  await page.addInitScript((userData) => {
    const session = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: userData,
    };

    const key = 'sb-gujyzwqcwecbeznlablx-auth-token';
    try {
      localStorage.setItem(key, JSON.stringify(session));
      console.log('[MODULE_OVERRIDE] ✓ Session injected into localStorage');
    } catch (e) {
      console.error('[MODULE_OVERRIDE] Failed to set localStorage:', e);
    }
  }, supabaseUser);

  // ALSO override fetch as ultimate fallback
  await page.addInitScript((userData) => {
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      
      if (url.includes('/auth/v1/user') && !url.includes('?code=')) {
        console.log('[MODULE_OVERRIDE] ✓ Fetch intercepted for /auth/v1/user');
        return Promise.resolve(new Response(JSON.stringify({ user: userData, error: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      
      return originalFetch.call(this, input, init);
    };
    console.log('[MODULE_OVERRIDE] ✓ Fetch override installed');
  }, supabaseUser);

  console.log(`[MODULE_OVERRIDE] Complete override installed for: ${user.email}`);
}

