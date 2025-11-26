/**
 * Enhanced Supabase Helper Functions for E2E Tests
 * 
 * Provides utilities for mocking Supabase endpoints with full
 * user context, database tables, and RPC functions.
 */

import { Page } from '@playwright/test';
import type { TestUser } from './testUsers';
import type {
  SupabaseUser,
  Trip,
  Request,
  Match,
  Conversation,
  Message,
  Profile,
  User,
} from '../helpers/types';

import { setMockedUser } from '../helpers/supabase-mocks';

/**
 * Mock Supabase authentication endpoints for a specific user
 */
// Global map to store route handlers per page for proper cleanup
const routeHandlers = new WeakMap<Page, Map<string, Function>>();

export async function mockUserAuth(page: Page, user: TestUser) {
  const supabaseUser: SupabaseUser = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    created_at: user.created_at,
    updated_at: new Date().toISOString(),
  };

  // CRITICAL: Store the user in shared state FIRST
  // The routes from setupSupabaseMocks check this shared state dynamically
  setMockedUser(page, supabaseUser);

  // CRITICAL: Unroute ALL existing routes to ensure our routes take precedence
  // Playwright unroute() works with string patterns but not function matchers
  // We'll unroute string patterns and register our routes AFTER, which will make them check first
  const patternsToUnroute = [
    '**/auth/v1/user**',
    '**/*supabase*/auth/v1/user**',
  ];
  
  for (const pattern of patternsToUnroute) {
    try {
      page.unroute(pattern);
    } catch (e) {
      // Route might not exist, that's OK - continue
    }
  }

  // Define handler that ALWAYS returns the mocked user (never null)
  // This handler will take precedence over routes from setupSupabaseMocks
  // because it's registered AFTER them (Playwright checks routes in reverse order)
  const userRouteHandler = async (route: any) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    
    // Log all requests that reach this handler (for debugging)
    console.log(`[MOCK_USER_AUTH] Route handler called: ${method} ${url}`);
    
    // Only handle GET requests to /auth/v1/user endpoints (exclude code param for callback)
    if (method === 'GET' && url.includes('/auth/v1/user') && !url.includes('/auth/v1/user?code=')) {
      // CRITICAL: Always return the mocked user - never null
      // Check shared state for consistency, but fall back to the user passed in
      const { getMockedUser } = await import('../helpers/supabase-mocks');
      const sharedStateUser = getMockedUser(page);
      const userToReturn = sharedStateUser || supabaseUser;
      
      console.log(`[MOCK_USER_AUTH] ✓ Intercepted GET ${url}`);
      console.log(`[MOCK_USER_AUTH] Shared state user: ${sharedStateUser?.email || 'null'}`);
      console.log(`[MOCK_USER_AUTH] Returning user: ${userToReturn?.email || 'null'}`);
      
      if (!userToReturn) {
        console.error('[MOCK_USER_AUTH] ERROR: userToReturn is null, this should never happen!');
      }
      
      // Always fulfill with the user - match Supabase's response format from HAR file
      // Based on HAR analysis: requests need apikey header, response is JSON with user object
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers()['origin'] || '*',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Expose-Headers': 'X-Total-Count, Link, X-Supabase-Api-Version',
        },
        body: JSON.stringify({
          user: userToReturn, // Always return the mocked user
          error: null,
        }),
      });
      return; // Stop here - don't continue to other routes
    }
    // For non-GET or non-matching requests, continue to next route
    await route.continue();
  };
  
  // CRITICAL: Use function matchers instead of string patterns!
  // String patterns like '**/auth/v1/user**' don't match Supabase URLs correctly
  // Function matchers work reliably and are checked in reverse order (last registered = first checked)
  // Since this is registered AFTER setupSupabaseMocks (in beforeEach), it will be checked FIRST
  
  // Unroute any existing routes (best effort)
  try {
    page.unroute('**/auth/v1/user**');
    page.unroute('**/*supabase*/auth/v1/user**');
  } catch (e) {
    // Routes might not exist, that's OK
  }
  
  // Register function matcher route - this will be checked FIRST due to reverse order
  // This must be registered AFTER any catch-all routes or routes that continue
  await page.route((url) => {
    const href = typeof url === 'string' ? url : (url.href || (url as any).url || '');
    // Match /auth/v1/user but exclude callback URLs with code param
    const matches = href.includes('/auth/v1/user') && !href.includes('/auth/v1/user?code=');
    if (matches) {
      console.log(`[MOCK_USER_AUTH] Function matcher matched: ${href}`);
    }
    return matches;
  }, userRouteHandler);
  
  // Also register string patterns as fallback (though function matcher should handle it)
  await page.route('**/auth/v1/user**', userRouteHandler);
  await page.route('**/*supabase*/auth/v1/user**', userRouteHandler);
  
  console.log(`[MOCK_USER_AUTH] All routes registered for user: ${supabaseUser.email}`);

  // Mock token endpoint
  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: supabaseUser,
      }),
    });
  });

  // CRITICAL: Wait a moment to ensure routes are fully registered
  // Playwright routes are checked in reverse order (last registered = first checked)
  // Since mockUserAuth is called AFTER setupSupabaseMocks (in beforeEach),
  // these routes will be checked FIRST and take precedence
  await page.waitForTimeout(100);
  
  console.log(`[MOCK_USER_AUTH] User authentication routes registered for: ${supabaseUser.email}`);

  // CRITICAL: Inject session into localStorage BEFORE page loads
  // Supabase SSR client reads from localStorage and uses it to determine auth state
  // Based on HAR file analysis, Supabase makes network requests to validate sessions
  // Our routes will intercept those network requests
  await page.addInitScript((userData) => {
    // Clear any existing session data first
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.startsWith('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    
    // Create a valid session object that Supabase SSR will recognize
    // Format based on Supabase SSR session structure
    const session = {
      access_token: 'mock-access-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
      token_type: 'bearer',
      user: userData,
    };
    
    // Get Supabase URL to determine correct localStorage key
    let projectId = 'gujyzwqcwecbeznlablx'; // Default from env
    try {
      // Try to get from __NEXT_DATA__ if available
      const nextData = (window as any).__NEXT_DATA__;
      if (nextData?.env?.NEXT_PUBLIC_SUPABASE_URL) {
        const supabaseUrl = nextData.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl.includes('supabase.co')) {
          const extractedId = supabaseUrl.split('//')[1]?.split('.')[0];
          if (extractedId) {
            projectId = extractedId;
          }
        }
      }
    } catch (e) {
      // Use default project ID
    }
    
    // Set session in the correct localStorage key format used by Supabase SSR
    // Format: sb-{project-ref}-auth-token
    const sessionKey = `sb-${projectId}-auth-token`;
    try {
      localStorage.setItem(sessionKey, JSON.stringify(session));
      console.log('[MOCK_USER_AUTH] Session injected into localStorage:', sessionKey, 'for user:', userData?.email);
    } catch (e) {
      console.error('[MOCK_USER_AUTH] Failed to set localStorage:', e);
    }
    
    // Also try alternative key formats (Supabase SSR might use different formats)
    ['sb-auth-token', 'sb-localhost-auth-token'].forEach(key => {
      try {
        if (key !== sessionKey) {
          localStorage.setItem(key, JSON.stringify(session));
        }
      } catch (e) {
        // Ignore errors
      }
    });
    
    // CRITICAL: Override window.fetch to intercept ALL Supabase requests
    // This is more reliable than Playwright routes because it intercepts at the JavaScript level
    // Store mocked user globally for fetch override
    (window as any).__PLAYWRIGHT_MOCKED_USER__ = userData;
    
    console.log('[MOCK_USER_AUTH_INIT] Installing fetch override for user:', userData?.email);
    
    // Override fetch BEFORE Supabase client is created
    // This ensures all fetch requests are intercepted
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as globalThis.Request).url;
      
      // Log ALL fetch requests for debugging
      if (url.includes('supabase') || url.includes('/auth/')) {
        console.log('[FETCH_OVERRIDE] Fetch called:', url);
      }
      
      // Intercept Supabase auth/v1/user requests
      if (url.includes('/auth/v1/user') && !url.includes('/auth/v1/user?code=')) {
        const mockedUser = (window as any).__PLAYWRIGHT_MOCKED_USER__;
        if (mockedUser) {
          console.log('[FETCH_OVERRIDE] ✓ Intercepting /auth/v1/user, returning mocked user:', mockedUser.email);
          // Return mock Response matching Supabase format
          // HAR file shows response format: {user: {...}, error: null}
          return Promise.resolve(new Response(JSON.stringify({
            user: mockedUser,
            error: null,
          }), {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': window.location.origin || '*',
              'Access-Control-Allow-Credentials': 'true',
            },
          }));
        } else {
          console.error('[FETCH_OVERRIDE] ERROR: No mocked user found!');
        }
      }
      
      // For all other requests, use original fetch (will be intercepted by Playwright routes)
      return originalFetch.call(this, input, init);
    };
    
    console.log('[MOCK_USER_AUTH_INIT] ✓ window.fetch override installed successfully');
  }, supabaseUser);
}

/**
 * Mock Supabase REST API endpoints for user profile and data
 */
export async function mockUserData(page: Page, user: TestUser) {
  // IMPORTANT: Unroute existing routes from setupSupabaseMocks first
  // Playwright uses the FIRST matching route, so we need to remove the old ones
  // Unroute by pattern to remove all routes matching that pattern
  try {
    // Unroute with exact patterns that setupSupabaseMocks uses
    page.unroute('**/rest/v1/profiles**');
    page.unroute('**/*supabase*/rest/v1/profiles**');
    page.unroute('**/rest/v1/users**');
    page.unroute('**/*supabase*/rest/v1/users**');
    // Also unroute the generic **/rest/v1/** pattern if it exists
    page.unroute('**/rest/v1/**');
    page.unroute('**/*supabase*/rest/v1/**');
  } catch (e) {
    // Routes might not exist - that's OK, we'll just register our routes
  }

  // Mock profiles table - override routes from setupSupabaseMocks
  const mockProfilesRoute = async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === 'GET') {
      // Check if querying by user_id (with .single() it might have limit=1)
      const userIdParam = url.searchParams.get('user_id');
      if (userIdParam === `eq.${user.id}` || userIdParam?.includes(user.id)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Content-Type': 'application/json',
            'Content-Range': '0-0/1',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify([user.profile]),
        });
        return;
      } else {
        // Return empty array for other queries
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Content-Type': 'application/json',
            'Content-Range': '0--1/0',
          },
          body: JSON.stringify([]),
        });
        return;
      }
    } else if (method === 'PATCH') {
      // Allow updates
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ ...user.profile, ...JSON.parse(request.postData() || '{}') }]),
      });
      return;
    } else if (method === 'POST') {
      // Allow inserts
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([user.profile]),
      });
      return;
    }
    await route.continue();
  };

  // Register for both patterns to override setupSupabaseMocks
  await page.route('**/rest/v1/profiles**', mockProfilesRoute);
  await page.route('**/*supabase*/rest/v1/profiles**', mockProfilesRoute);

  // Mock users table - override routes from setupSupabaseMocks
  const mockUsersRoute = async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === 'GET') {
      // Check if querying by id (with .single() it might have limit=1)
      const idParam = url.searchParams.get('id');
      if (idParam === `eq.${user.id}` || idParam?.includes(user.id)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Content-Type': 'application/json',
            'Content-Range': '0-0/1',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify([user.userData]),
        });
        return;
      } else {
        // Return empty array for other queries
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Content-Type': 'application/json',
            'Content-Range': '0--1/0',
          },
          body: JSON.stringify([]),
        });
        return;
      }
    } else if (method === 'PATCH') {
      // Allow updates
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ ...user.userData, ...JSON.parse(request.postData() || '{}') }]),
      });
      return;
    } else if (method === 'POST') {
      // Allow inserts
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([user.userData]),
      });
      return;
    }
    await route.continue();
  };

  // Register for both patterns to override setupSupabaseMocks
  await page.route('**/rest/v1/users**', mockUsersRoute);
  await page.route('**/*supabase*/rest/v1/users**', mockUsersRoute);
}

/**
 * Mock trips table with custom data
 */
export async function mockTrips(page: Page, trips: Trip[] = []) {
  await page.route('**/rest/v1/trips**', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': `0-${trips.length - 1}/${trips.length}`,
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(trips),
      });
    } else if (method === 'POST') {
      const newTrip = JSON.parse(request.postData() || '{}');
      const createdTrip: Trip = {
        id: `trip-${Date.now()}`,
        ...newTrip,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([createdTrip]),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock requests table with custom data
 */
export async function mockRequests(page: Page, requests: Request[] = []) {
  await page.route('**/rest/v1/requests**', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': `0-${requests.length - 1}/${requests.length}`,
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(requests),
      });
    } else if (method === 'POST') {
      const newRequest = JSON.parse(request.postData() || '{}');
      const createdRequest: Request = {
        id: `req-${Date.now()}`,
        ...newRequest,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([createdRequest]),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock matches table
 */
export async function mockMatches(page: Page, matches: Match[] = []) {
  await page.route('**/rest/v1/matches**', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': `0-${matches.length - 1}/${matches.length}`,
        },
        body: JSON.stringify(matches),
      });
    } else if (method === 'POST') {
      const newMatch = JSON.parse(request.postData() || '{}');
      const createdMatch: Match = {
        id: `match-${Date.now()}`,
        ...newMatch,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([createdMatch]),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock conversations table
 */
export async function mockConversations(page: Page, conversations: Conversation[] = []) {
  await page.route('**/rest/v1/conversations**', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': `0-${conversations.length - 1}/${conversations.length}`,
        },
        body: JSON.stringify(conversations),
      });
    } else if (method === 'POST') {
      const newConversation = JSON.parse(request.postData() || '{}');
      const createdConversation: Conversation = {
        id: `conv-${Date.now()}`,
        ...newConversation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([createdConversation]),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock messages table
 */
export async function mockMessages(page: Page, messages: Message[] = []) {
  await page.route('**/rest/v1/messages**', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': `0-${messages.length - 1}/${messages.length}`,
        },
        body: JSON.stringify(messages),
      });
    } else if (method === 'POST') {
      const newMessage = JSON.parse(request.postData() || '{}');
      const createdMessage: Message = {
        id: `msg-${Date.now()}`,
        ...newMessage,
        created_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([createdMessage]),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock OTP endpoint (magic link sign-in)
 */
export async function mockOTP(page: Page) {
  await page.route('**/auth/v1/otp**', async (route) => {
    if (route.request().method() === 'POST') {
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
}

/**
 * Mock RPC functions
 */
export async function mockRPC(page: Page, functionName: string, response: any) {
  await page.route(`**/rpc/${functionName}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    });
  });
}

/**
 * Setup complete Supabase mocks for a user
 */
export async function setupUserMocks(page: Page, user: TestUser) {
  await mockUserAuth(page, user);
  await mockUserData(page, user);
  await mockOTP(page);
}

/**
 * Clear all mocks (useful for cleanup)
 */
export async function clearMocks(page: Page) {
  // Routes are automatically cleared when context closes
  // This is just for documentation
}



