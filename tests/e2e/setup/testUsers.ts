/**
 * Test User Data for Multi-User E2E Tests
 * 
 * Defines test users with complete profile data for simulating
 * multiple users interacting in the app.
 */

export interface TestUser {
  id: string;
  email: string;
  phone?: string;
  role: 'requester' | 'traveler' | 'sailor' | 'admin';
  created_at: string;
  profile: {
    user_id: string;
    phone?: string;
    verified_sailor_at?: string;
    stripe_identity_verified_at?: string;
    lifetime_active?: boolean;
    stripe_customer_id?: string;
  };
  userData: {
    id: string;
    email: string;
    role: 'requester' | 'traveler' | 'sailor' | 'admin';
    subscription_status?: string | null;
    supporter_status?: string | null;
    lifetime_pro?: boolean;
    stripe_customer_id?: string;
  };
}

/**
 * User A: Request Creator
 * - Signs up
 * - Creates delivery request
 * - Receives messages from travelers
 */
export const USER_A: TestUser = {
  id: 'test-user-a-id',
  email: 'usera@test.sparecarry.com',
  phone: '+15551234567',
  role: 'requester',
  created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
  profile: {
    user_id: 'test-user-a-id',
    phone: '+15551234567',
    verified_sailor_at: undefined,
    stripe_identity_verified_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lifetime_active: false,
    stripe_customer_id: 'cus_test_user_a',
  },
  userData: {
    id: 'test-user-a-id',
    email: 'usera@test.sparecarry.com',
    role: 'requester',
    subscription_status: null,
    supporter_status: null,
    lifetime_pro: false,
    stripe_customer_id: 'cus_test_user_a',
  },
};

/**
 * User B: Traveler/Claimer
 * - Signs up
 * - Browses feed
 * - Claims User A's request
 * - Messages User A
 */
export const USER_B: TestUser = {
  id: 'test-user-b-id',
  email: 'userb@test.sparecarry.com',
  phone: '+15551234568',
  role: 'traveler',
  created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  profile: {
    user_id: 'test-user-b-id',
    phone: '+15551234568',
    verified_sailor_at: undefined,
    stripe_identity_verified_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    lifetime_active: false,
    stripe_customer_id: 'cus_test_user_b',
  },
  userData: {
    id: 'test-user-b-id',
    email: 'userb@test.sparecarry.com',
    role: 'traveler',
    subscription_status: null,
    supporter_status: null,
    lifetime_pro: false,
    stripe_customer_id: 'cus_test_user_b',
  },
};

/**
 * User C: Late Claimer
 * - Signs up after User B
 * - Attempts to claim already-claimed request
 * - Should see it's already claimed
 */
export const USER_C: TestUser = {
  id: 'test-user-c-id',
  email: 'userc@test.sparecarry.com',
  phone: '+15551234569',
  role: 'traveler',
  created_at: new Date().toISOString(), // Just now
  profile: {
    user_id: 'test-user-c-id',
    phone: '+15551234569',
    verified_sailor_at: undefined,
    stripe_identity_verified_at: new Date().toISOString(),
    lifetime_active: false,
    stripe_customer_id: 'cus_test_user_c',
  },
  userData: {
    id: 'test-user-c-id',
    email: 'userc@test.sparecarry.com',
    role: 'traveler',
    subscription_status: null,
    supporter_status: null,
    lifetime_pro: false,
    stripe_customer_id: 'cus_test_user_c',
  },
};

/**
 * Helper to create a unique test user with timestamp
 */
export function createTestUser(prefix: string, role: 'requester' | 'traveler' | 'sailor' = 'requester'): TestUser {
  const timestamp = Date.now();
  const id = `test-${prefix}-${timestamp}`;
  const email = `${prefix}${timestamp}@test.sparecarry.com`;
  
  return {
    id,
    email,
    phone: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    role,
    created_at: new Date(timestamp - 60 * 1000).toISOString(), // 1 minute ago
    profile: {
      user_id: id,
      phone: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      verified_sailor_at: role === 'sailor' ? new Date().toISOString() : undefined,
      stripe_identity_verified_at: new Date().toISOString(),
      lifetime_active: false,
      stripe_customer_id: `cus_test_${prefix}_${timestamp}`,
    },
    userData: {
      id,
      email,
      role,
      subscription_status: null,
      supporter_status: null,
      lifetime_pro: false,
      stripe_customer_id: `cus_test_${prefix}_${timestamp}`,
    },
  };
}

/**
 * Get user by ID from predefined users
 */
export function getTestUser(id: string): TestUser | null {
  const users = [USER_A, USER_B, USER_C];
  return users.find(u => u.id === id) || null;
}

