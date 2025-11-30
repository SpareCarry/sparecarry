/**
 * Helper Functions for Mock Supabase
 *
 * Convenience functions for common testing operations
 */

import {
  supabase,
  seedMockData,
  resetMockDataStore,
  addMockData,
} from "./mockClient";
import { mockAuthState } from "./mockAuthState";
import type { MockUser, MockSession } from "./types";
import type {
  Trip,
  Request,
  Match,
  Profile,
  User,
} from "../../../types/supabase";

/**
 * Mock user login - sets up authenticated user
 */
export function mockUserLogin(user?: Partial<MockUser>): MockSession {
  const mockUser: MockUser = {
    id: user?.id || "test-user-id",
    email: user?.email || "test@example.com",
    created_at: user?.created_at || new Date().toISOString(),
    app_metadata: user?.app_metadata || {},
    user_metadata: user?.user_metadata || {},
  };

  const mockSession: MockSession = {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: mockUser,
  };

  mockAuthState.setUser(mockUser, mockSession);
  return mockSession;
}

/**
 * Mock user logout
 */
export function mockUserLogout(): void {
  mockAuthState.clearUser();
}

/**
 * Mock insert - adds data to a table
 */
export function mockInsert<T = unknown>(table: string, data: T | T[]): T[] {
  const dataArray = Array.isArray(data) ? data : [data];
  const inserted = dataArray.map((item) => {
    const record = { ...(item as Record<string, unknown>) };

    if (!record.id) {
      record.id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    if (!record.created_at) {
      record.created_at = new Date().toISOString();
    }
    if (!record.updated_at) {
      record.updated_at = new Date().toISOString();
    }

    return addMockData(table, record) as T;
  });
  return inserted as T[];
}

/**
 * Mock select - queries data from a table
 */
export async function mockSelect<T = unknown>(
  table: string,
  options?: {
    filters?: Array<{ column: string; operator: string; value: unknown }>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<T[]> {
  let query = supabase.from(table).select("*");

  if (options?.filters) {
    options.filters.forEach((filter) => {
      switch (filter.operator) {
        case "eq":
          query = query.eq(filter.column, filter.value);
          break;
        case "neq":
          query = query.neq(filter.column, filter.value);
          break;
        case "gt":
          query = query.gt(filter.column, filter.value);
          break;
        case "gte":
          query = query.gte(filter.column, filter.value);
          break;
        case "lt":
          query = query.lt(filter.column, filter.value);
          break;
        case "lte":
          query = query.lte(filter.column, filter.value);
          break;
      }
    });
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const result = await query.then((r) => r.data || []);
  return result as T[];
}

/**
 * Mock update - updates records in a table
 */
export async function mockUpdate<T = unknown>(
  table: string,
  updates: Partial<T>,
  filter?: { column: string; value: unknown }
): Promise<T[]> {
  let query = supabase.from(table).update(updates);

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const result = await query.then((r) => r.data || []);
  return result as T[];
}

/**
 * Mock delete - deletes records from a table
 */
export async function mockDelete(
  table: string,
  filter: { column: string; value: unknown }
): Promise<number> {
  const query = supabase.from(table).delete().eq(filter.column, filter.value);
  const result = (await query.then((r) => r.data || [])) as unknown[];
  return result.length;
}

/**
 * Mock auth events - simulates auth state changes
 */
export function mockAuthEvents(
  event: "SIGNED_IN" | "SIGNED_OUT",
  session?: MockSession | null
): void {
  mockAuthState.notifyListeners(event, session || null);
}

/**
 * Mock storage upload - simulates file upload
 */
export async function mockStorageUpload(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<{ path: string }> {
  const result = await supabase.storage.from(bucket).upload(path, file);
  if (!result.data) {
    throw new Error("Upload failed");
  }
  return result.data;
}

/**
 * Mock storage get public URL
 */
export function mockStorageGetPublicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Seed common test data
 */
export function seedTestData(): void {
  resetMockDataStore();

  // Seed users
  seedMockData<User>("users", [
    {
      id: "user-1",
      email: "traveler@example.com",
      created_at: new Date().toISOString(),
      subscription_status: null,
      supporter_status: null,
      completed_deliveries_count: 5,
      average_rating: 4.5,
      referral_credits: 0,
      karma_points: 0,
    },
    {
      id: "user-2",
      email: "requester@example.com",
      created_at: new Date().toISOString(),
      subscription_status: "active",
      supporter_status: null,
      completed_deliveries_count: 2,
      average_rating: 4.8,
      referral_credits: 50,
      karma_points: 0,
    },
  ]);

  // Seed profiles
  seedMockData<Profile>("profiles", [
    {
      user_id: "user-1",
      full_name: "Test Traveler",
      verified_identity: true,
      verified_sailor: false,
      stripe_account_id: "acct_test_123",
      expo_push_token: "ExponentPushToken[test-token-1]",
      push_notifications_enabled: true,
      boat_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      user_id: "user-2",
      full_name: "Test Requester",
      verified_identity: true,
      verified_sailor: false,
      stripe_account_id: null,
      expo_push_token: "ExponentPushToken[test-token-2]",
      push_notifications_enabled: true,
      boat_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  // Seed trips
  seedMockData<Trip>("trips", [
    {
      id: "trip-1",
      user_id: "user-1",
      type: "plane",
      from_location: "Miami",
      to_location: "St. Martin",
      departure_date: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      spare_kg: 20,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  // Seed requests
  seedMockData<Request>("requests", [
    {
      id: "request-1",
      user_id: "user-2",
      title: "Test Request",
      from_location: "Miami",
      to_location: "St. Martin",
      deadline_latest: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
      preferred_method: "any",
      max_reward: 500,
      weight_kg: 10,
      length_cm: 50,
      width_cm: 40,
      height_cm: 30,
      emergency: false,
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  // Seed matches
  seedMockData<Match>("matches", [
    {
      id: "match-1",
      trip_id: "trip-1",
      request_id: "request-1",
      status: "pending",
      reward_amount: 500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
}

/**
 * Reset all mocks
 */
export function resetAllMocks(): void {
  resetMockDataStore();
  mockAuthState.reset();
}
