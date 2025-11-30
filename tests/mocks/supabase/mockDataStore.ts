/**
 * In-Memory Data Store for Mock Supabase
 *
 * Provides a simple in-memory database for testing.
 */

export const mockDataStore: Record<string, unknown[]> = {};

/**
 * Reset all data in the mock store
 */
export function resetMockDataStore(): void {
  Object.keys(mockDataStore).forEach((key) => {
    delete mockDataStore[key];
  });
}

/**
 * Seed data into a specific table
 */
export function seedMockData<T = unknown>(table: string, data: T[]): void {
  mockDataStore[table] = data;
}

/**
 * Get all data from a table
 */
export function getMockData<T = unknown>(table: string): T[] {
  return (mockDataStore[table] || []) as T[];
}

/**
 * Add a single record to a table
 */
export function addMockData<T = unknown>(table: string, record: T): T {
  if (!mockDataStore[table]) {
    mockDataStore[table] = [];
  }
  const records = mockDataStore[table] as T[];
  records.push(record);
  return record;
}

/**
 * Update a record in a table
 */
export function updateMockData<T = unknown>(
  table: string,
  id: string,
  updates: Partial<T>
): T | null {
  const records = getMockData<T>(table);
  const index = records.findIndex((record: unknown) => {
    const r = record as Record<string, unknown>;
    return r.id === id;
  });

  if (index === -1) {
    return null;
  }

  const updated = { ...records[index], ...updates } as T;
  records[index] = updated;
  return updated;
}

/**
 * Delete a record from a table
 */
export function deleteMockData<T = unknown>(
  table: string,
  id: string
): boolean {
  const records = getMockData<T>(table);
  const index = records.findIndex((record: unknown) => {
    const r = record as Record<string, unknown>;
    return r.id === id;
  });

  if (index === -1) {
    return false;
  }

  records.splice(index, 1);
  return true;
}

/**
 * Clear a specific table
 */
export function clearMockTable(table: string): void {
  delete mockDataStore[table];
}
