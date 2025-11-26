/**
 * Test User Factory
 * 
 * Creates test users with various subscription types and roles
 * for comprehensive E2E testing
 */

import type { TestUser } from './testUsers';
import { USER_A, USER_B, USER_C } from './testUsers';

export type { TestUser };

export type SubscriptionType = 'none' | 'monthly' | 'yearly' | 'lifetime';
export type UserRole = 'requester' | 'traveler' | 'sailor' | 'admin';

interface CreateUserOptions {
  prefix?: string;
  role?: UserRole;
  subscription?: SubscriptionType;
  lifetimePro?: boolean;
  verifiedSailor?: boolean;
  completedDeliveries?: number;
  averageRating?: number;
  referralCredits?: number;
  stripeCustomerId?: string;
}

/**
 * Create a test user with specified attributes
 */
export function createTestUser(options: CreateUserOptions = {}): TestUser {
  const {
    prefix = 'user',
    role = 'requester',
    subscription = 'none',
    lifetimePro = false,
    verifiedSailor = false,
    completedDeliveries = 0,
    averageRating = undefined,
    referralCredits = 0,
    stripeCustomerId,
  } = options;

  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  const id = `test-${prefix}-${timestamp}-${randomSuffix}`;
  const email = `${prefix}${timestamp}${randomSuffix}@test.sparecarry.com`;
  const phone = `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
  const customerId = stripeCustomerId || `cus_test_${prefix}_${timestamp}_${randomSuffix}`;

  // Determine subscription status based on subscription type
  let subscription_status: string | null = null;
  let subscription_current_period_end: string | undefined = undefined;

  if (subscription === 'monthly') {
    subscription_status = 'active';
    subscription_current_period_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (subscription === 'yearly') {
    subscription_status = 'active';
    subscription_current_period_end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Generate referral code
  const referral_code = `REF${timestamp}${randomSuffix}`;

  return {
    id,
    email,
    phone,
    role,
    created_at: new Date(timestamp - 60 * 1000).toISOString(), // 1 minute ago
    profile: {
      user_id: id,
      phone,
      verified_sailor_at: verifiedSailor ? new Date().toISOString() : undefined,
      stripe_identity_verified_at: new Date().toISOString(),
      lifetime_active: lifetimePro || subscription === 'lifetime',
      stripe_customer_id: customerId,
    },
    userData: {
      id,
      email,
      role,
      subscription_status,
      supporter_status: null, // Can be added if needed
      lifetime_pro: lifetimePro || subscription === 'lifetime',
      stripe_customer_id: customerId,
    },
  };
}

/**
 * Predefined test users for common scenarios
 */

// User with no subscription
export const USER_NO_SUB = createTestUser({
  prefix: 'no-sub',
  role: 'requester',
  subscription: 'none',
});

// User with monthly subscription
export const USER_MONTHLY = createTestUser({
  prefix: 'monthly',
  role: 'requester',
  subscription: 'monthly',
});

// User with yearly subscription
export const USER_YEARLY = createTestUser({
  prefix: 'yearly',
  role: 'requester',
  subscription: 'yearly',
});

// User with lifetime Pro
export const USER_LIFETIME = createTestUser({
  prefix: 'lifetime',
  role: 'traveler',
  subscription: 'lifetime',
  lifetimePro: true,
});

// Sailor (verified traveler)
export const USER_SAILOR = createTestUser({
  prefix: 'sailor',
  role: 'sailor',
  subscription: 'monthly',
  verifiedSailor: true,
  completedDeliveries: 5,
  averageRating: 4.8,
});

// High-rating user with referrals
export const USER_VETERAN = createTestUser({
  prefix: 'veteran',
  role: 'traveler',
  subscription: 'yearly',
  completedDeliveries: 20,
  averageRating: 4.9,
  referralCredits: 150,
});

// New user (for testing onboarding)
export const USER_NEW = createTestUser({
  prefix: 'new',
  role: 'requester',
  subscription: 'none',
  completedDeliveries: 0,
});

/**
 * Create multiple test users for interaction testing
 */
export function createTestUserGroup(
  count: number,
  options: CreateUserOptions = {}
): TestUser[] {
  const users: TestUser[] = [];
  for (let i = 0; i < count; i++) {
    users.push(createTestUser({
      ...options,
      prefix: `${options.prefix || 'user'}-${i}`,
    }));
  }
  return users;
}

/**
 * Get all predefined test users
 */
export function getAllPredefinedUsers(): TestUser[] {
  return [
    USER_NO_SUB,
    USER_MONTHLY,
    USER_YEARLY,
    USER_LIFETIME,
    USER_SAILOR,
    USER_VETERAN,
    USER_NEW,
  ];
}

