/**
 * Supabase Mock Setup for Tests
 * 
 * Automatically injects mock Supabase clients into all test environments.
 * This ensures tests never make external API calls.
 */

// Check if we should use mock mode
const USE_MOCK = process.env.SUPABASE_MOCK_MODE === 'true' || 
                 process.env.CI === 'true' ||
                 !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                 process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test');

if (USE_MOCK) {
  (function setupSupabaseMock() {
  // Conditional import for vitest
  let vi: typeof import('vitest').vi | null = null;
  try {
    const vitest = require('vitest');
    vi = vitest.vi;
  } catch {
    // Not running inside Vitest; skip setting up mocks.
  }

  if (!vi) {
    return;
  }

  // Create a simple mock client if the real one doesn't exist
  const createMockSupabaseClient = () => {
    return {
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        signInWithOtp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        signInWithOAuth: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
        exchangeCodeForSession: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    };
  };

  // Mock Supabase client module
  vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => createMockSupabaseClient()),
  }));

  // Mock Supabase server module
  vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => createMockSupabaseClient()),
  }));

  // Mock Supabase SSR
  vi.mock('@supabase/ssr', () => ({
    createBrowserClient: vi.fn(() => createMockSupabaseClient()),
    createServerClient: vi.fn(async () => createMockSupabaseClient()),
  }));

  // Mock legacy supabase module if it exists
  try {
    vi.mock('@/lib/supabase', () => ({
      supabase: createMockSupabaseClient(),
    }));
  } catch {
    // Module doesn't exist, skip
  }
  })();
}
