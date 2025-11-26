/**
 * Supabase Mock Setup for Tests
 * 
 * Automatically injects mock Supabase clients into all test environments.
 * This ensures tests never make external API calls.
 */

import { vi } from 'vitest';

// Check if we should use mock mode
const USE_MOCK = process.env.SUPABASE_MOCK_MODE === 'true' || 
                 process.env.CI === 'true' ||
                 !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                 process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test');

if (USE_MOCK) {
  // Mock Supabase client module - define inline to avoid hoisting issues
  // Since vi.mock() is hoisted, we must define everything inside the factory
  // Use dynamic import for vitest since globals may not be available in factory context
  vi.mock('@/lib/supabase/client', async () => {
    const { vi } = await import('vitest');
    
    // Try to use real mock client, fallback to inline
    let mockClient: any;
    try {
      const mockClientModule = await import('./mocks/supabase/mockClient');
      if (mockClientModule.createMockSupabaseClient) {
        mockClient = mockClientModule.createMockSupabaseClient();
      }
    } catch {}
    
    if (!mockClient) {
      // Inline mock implementation
      mockClient = {
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
    }
    
    return {
      createClient: vi.fn(() => mockClient),
    };
  });

  // Mock Supabase server module
  vi.mock('@/lib/supabase/server', async () => {
    const { vi } = await import('vitest');
    
    let mockClient: any;
    try {
      const mockClientModule = await import('./mocks/supabase/mockClient');
      if (mockClientModule.createMockSupabaseClient) {
        mockClient = mockClientModule.createMockSupabaseClient();
      }
    } catch {}
    
    if (!mockClient) {
      mockClient = {
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
    }
    
    return {
      createClient: vi.fn(async () => mockClient),
    };
  });

  // Mock Supabase SSR
  vi.mock('@supabase/ssr', async () => {
    const { vi } = await import('vitest');
    
    let mockClient: any;
    try {
      const mockClientModule = await import('./mocks/supabase/mockClient');
      if (mockClientModule.createMockSupabaseClient) {
        mockClient = mockClientModule.createMockSupabaseClient();
      }
    } catch {}
    
    if (!mockClient) {
      mockClient = {
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
    }
    
    return {
      createBrowserClient: vi.fn(() => mockClient),
      createServerClient: vi.fn(async () => mockClient),
    };
  });
}
