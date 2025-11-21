/**
 * Mock Supabase Client
 * 
 * Complete mock implementation of Supabase client for testing.
 * Provides in-memory database, auth, storage, and realtime functionality.
 */

import type { MockSupabaseClient as MockClient } from './types';
import { createMockAuth } from './mockAuth';
import { createMockQueryBuilder } from './mockQueryBuilder';
import { createMockStorage } from './mockStorage';
import { createMockRealtime } from './mockRealtime';
import { mockDataStore, resetMockDataStore, seedMockData, addMockData } from './mockDataStore';

/**
 * Create a mock Supabase client instance
 */
export function createMockSupabaseClient(): MockClient {
  return {
    auth: createMockAuth(),
    from: (table: string) => createMockQueryBuilder(table),
    storage: createMockStorage(),
    rpc: (fnName: string, params?: Record<string, unknown>) => {
      // Mock RPC calls
      return Promise.resolve({ data: null, error: null });
    },
    realtime: createMockRealtime(),
  };
}

/**
 * Default exported mock client instance
 */
export const supabase = createMockSupabaseClient();

/**
 * Re-export helper functions
 */
export { resetMockDataStore, seedMockData, mockDataStore, addMockData };

/**
 * Type export for use in tests
 */
export type { MockSupabaseClient } from './types';

