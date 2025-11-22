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

  // Mock Supabase client module
  vi.mock('@/lib/supabase/client', () => {
    const { createMockSupabaseClient } = require('../../tests/mocks/supabase/mockClient');
    return {
      createClient: vi.fn(() => createMockSupabaseClient()),
    };
  });

  // Mock Supabase server module
  vi.mock('@/lib/supabase/server', () => {
    const { createMockSupabaseClient } = require('../../tests/mocks/supabase/mockClient');
    return {
      createClient: vi.fn(async () => createMockSupabaseClient()),
    };
  });

  // Mock Supabase SSR
  vi.mock('@supabase/ssr', () => {
    const { createMockSupabaseClient } = require('../../tests/mocks/supabase/mockClient');
    return {
      createBrowserClient: vi.fn(() => createMockSupabaseClient()),
      createServerClient: vi.fn(async () => createMockSupabaseClient()),
    };
  });

  // Mock legacy supabase module if it exists
  try {
    vi.mock('@/lib/supabase', () => {
      const { createMockSupabaseClient } = require('../../tests/mocks/supabase/mockClient');
      return {
        supabase: createMockSupabaseClient(),
      };
    });
  } catch {
    // Module doesn't exist, skip
  }
  })();
}
