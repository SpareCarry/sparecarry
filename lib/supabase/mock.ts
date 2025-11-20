/**
 * Mock Supabase Client for Testing
 * 
 * This provides a mock implementation of Supabase client methods
 * for use in CI/CD and local testing without requiring actual Supabase credentials.
 */

export interface MockSupabaseClient {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; email: string } | null }; error: null }>;
    signInWithOtp: (options: { email: string }) => Promise<{ data: {}; error: null }>;
    signInWithOAuth: (options: { provider: string }) => Promise<{ data: {}; error: null }>;
    signOut: () => Promise<{ error: null }>;
  };
  from: (table: string) => MockQueryBuilder;
  storage: {
    from: (bucket: string) => {
      upload: (path: string, file: File) => Promise<{ data: { path: string } | null; error: null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
}

interface MockQueryBuilder {
  select: (columns?: string) => MockQueryBuilder;
  insert: (data: unknown) => MockQueryBuilder;
  update: (data: unknown) => MockQueryBuilder;
  delete: () => MockQueryBuilder;
  eq: (column: string, value: unknown) => MockQueryBuilder;
  neq: (column: string, value: unknown) => MockQueryBuilder;
  gt: (column: string, value: unknown) => MockQueryBuilder;
  gte: (column: string, value: unknown) => MockQueryBuilder;
  lt: (column: string, value: unknown) => MockQueryBuilder;
  lte: (column: string, value: unknown) => MockQueryBuilder;
  or: (filter: string) => MockQueryBuilder;
  order: (column: string, options?: { ascending: boolean }) => MockQueryBuilder;
  limit: (count: number) => MockQueryBuilder;
  single: () => Promise<{ data: unknown | null; error: null }>;
  then: (callback: (result: { data: unknown[]; error: null }) => unknown) => Promise<unknown>;
}

const mockDataStore: Record<string, unknown[]> = {};

export function createMockSupabaseClient(): MockSupabaseClient {
  const createQueryBuilder = (table: string): MockQueryBuilder => {
    let query: {
      type: 'select' | 'insert' | 'update' | 'delete';
      filters: Array<{ type: string; column?: string; value?: unknown; filter?: string }>;
      data?: unknown;
      columns?: string;
      orderBy?: { column: string; ascending: boolean };
      limitCount?: number;
    } = {
      type: 'select',
      filters: [],
    };

    const builder: MockQueryBuilder = {
      select: (columns) => {
        query.type = 'select';
        query.columns = columns;
        return builder;
      },
      insert: (data) => {
        query.type = 'insert';
        query.data = data;
        return builder;
      },
      update: (data) => {
        query.type = 'update';
        query.data = data;
        return builder;
      },
      delete: () => {
        query.type = 'delete';
        return builder;
      },
      eq: (column, value) => {
        query.filters.push({ type: 'eq', column, value });
        return builder;
      },
      neq: (column, value) => {
        query.filters.push({ type: 'neq', column, value });
        return builder;
      },
      gt: (column, value) => {
        query.filters.push({ type: 'gt', column, value });
        return builder;
      },
      gte: (column, value) => {
        query.filters.push({ type: 'gte', column, value });
        return builder;
      },
      lt: (column, value) => {
        query.filters.push({ type: 'lt', column, value });
        return builder;
      },
      lte: (column, value) => {
        query.filters.push({ type: 'lte', column, value });
        return builder;
      },
      or: (filter) => {
        query.filters.push({ type: 'or', filter });
        return builder;
      },
      order: (column, options) => {
        query.orderBy = { column, ascending: options?.ascending ?? true };
        return builder;
      },
      limit: (count) => {
        query.limitCount = count;
        return builder;
      },
      single: async () => {
        const tableData = mockDataStore[table] || [];
        let result = [...tableData];

        // Apply filters
        for (const filter of query.filters) {
          if (filter.type === 'eq' && filter.column) {
            result = result.filter((item: Record<string, unknown>) => item[filter.column!] === filter.value);
          }
        }

        return { data: result[0] || null, error: null };
      },
      then: async (callback) => {
        if (query.type === 'insert' && query.data) {
          const newId = `mock-${Date.now()}`;
          const newRecord = { ...(query.data as Record<string, unknown>), id: newId };
          if (!mockDataStore[table]) {
            mockDataStore[table] = [];
          }
          mockDataStore[table].push(newRecord);
          return callback({ data: [newRecord], error: null });
        }

        if (query.type === 'select') {
          const tableData = mockDataStore[table] || [];
          let result = [...tableData];

          // Apply filters
          for (const filter of query.filters) {
            if (filter.type === 'eq' && filter.column) {
              result = result.filter((item: Record<string, unknown>) => item[filter.column!] === filter.value);
            }
          }

          // Apply ordering
          if (query.orderBy) {
            result.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
              const aVal = a[query.orderBy!.column];
              const bVal = b[query.orderBy!.column];
              if (query.orderBy!.ascending) {
                return aVal > bVal ? 1 : -1;
              }
              return aVal < bVal ? 1 : -1;
            });
          }

          // Apply limit
          if (query.limitCount) {
            result = result.slice(0, query.limitCount);
          }

          return callback({ data: result, error: null });
        }

        return callback({ data: [], error: null });
      },
    };

    return builder;
  };

  return {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      }),
      signInWithOtp: async () => ({ data: {}, error: null }),
      signInWithOAuth: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: (table: string) => createQueryBuilder(table),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://test.url' } }),
      }),
    },
  };
}

/**
 * Reset mock data store
 */
export function resetMockDataStore(): void {
  Object.keys(mockDataStore).forEach((key) => {
    delete mockDataStore[key];
  });
}

/**
 * Seed mock data for testing
 */
export function seedMockData(table: string, data: unknown[]): void {
  mockDataStore[table] = data;
}
