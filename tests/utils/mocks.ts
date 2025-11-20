/**
 * Legacy mock utilities - now use tests/mocks/supabase/mockClient instead
 * @deprecated Use supabase from '@/tests/mocks/supabase/mockClient' instead
 */

// Re-export from new mock system for backward compatibility
export {
  createMockSupabaseClient,
  supabase,
  resetMockDataStore,
  seedMockData,
} from '@/tests/mocks/supabase/mockClient';

// Mock Stripe
export const createMockStripe = () => ({
  paymentIntents: {
    create: vi.fn().mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      status: 'requires_payment_method',
    }),
    retrieve: vi.fn().mockResolvedValue({
      id: 'pi_test_123',
      status: 'succeeded',
    }),
  },
  customers: {
    create: vi.fn().mockResolvedValue({
      id: 'cus_test_123',
      email: 'test@example.com',
    }),
  },
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      }),
    },
  },
});

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockProfile = (overrides = {}) => ({
  user_id: 'test-user-id',
  full_name: 'Test User',
  verified_identity: false,
  verified_sailor: false,
  subscription_status: null,
  supporter_status: null,
  ...overrides,
});

export const createMockTrip = (overrides = {}) => ({
  id: 'trip-123',
  user_id: 'test-user-id',
  type: 'plane' as const,
  from_location: 'Miami',
  to_location: 'St. Martin',
  departure_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  spare_kg: 20,
  status: 'active',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockRequest = (overrides = {}) => ({
  id: 'request-123',
  user_id: 'test-user-id',
  title: 'Test Request',
  from_location: 'Miami',
  to_location: 'St. Martin',
  deadline_latest: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  max_reward: 500,
  weight_kg: 10,
  status: 'open',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockMatch = (overrides = {}) => ({
  id: 'match-123',
  trip_id: 'trip-123',
  request_id: 'request-123',
  status: 'pending',
  reward_amount: 500,
  created_at: new Date().toISOString(),
  ...overrides,
});

