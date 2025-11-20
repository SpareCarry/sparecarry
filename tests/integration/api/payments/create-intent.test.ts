import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/create-intent/route';
import { supabase, seedMockData, resetMockDataStore, mockUserLogin } from '@/tests/mocks/supabase/mockClient';
import type { MatchWithRelations, User } from '@/types/supabase';
import Stripe from 'stripe';

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: vi.fn(),
      },
    })),
  };
});

describe('POST /api/payments/create-intent', () => {
  const mockStripe = {
    paymentIntents: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockDataStore();
    mockUserLogin({ id: 'user-2', email: 'requester@example.com' });
    
    (Stripe as any).mockImplementation(() => mockStripe);
    
    // Seed match data
    seedMockData<MatchWithRelations>('matches', [
      {
        id: 'match-123',
        trip_id: 'trip-123',
        request_id: 'request-123',
        status: 'pending',
        reward_amount: 500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        trips: {
          id: 'trip-123',
          user_id: 'user-1',
          type: 'plane',
          from_location: 'Miami',
          to_location: 'St. Martin',
          spare_kg: 20,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profiles: {
            stripe_account_id: 'acct_test_123',
          },
        },
        requests: {
          id: 'request-123',
          user_id: 'user-2',
          title: 'Test Request',
          from_location: 'Miami',
          to_location: 'St. Martin',
          deadline_latest: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          preferred_method: 'any',
          max_reward: 500,
          weight_kg: 10,
          length_cm: 50,
          width_cm: 40,
          height_cm: 30,
          emergency: false,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ]);

    seedMockData<User>('users', [
      {
        id: 'user-2',
        email: 'requester@example.com',
        created_at: new Date().toISOString(),
        subscription_status: null,
        supporter_status: null,
        completed_deliveries_count: 0,
        average_rating: 5.0,
        referral_credits: 0,
      },
    ]);
  });

  it('should create payment intent for a match', async () => {
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      status: 'requires_payment_method',
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        matchId: 'match-123',
        amount: 50000, // in cents
        insurance: null,
        useCredits: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clientSecret).toBe('pi_test_123_secret');
    expect(data.paymentIntentId).toBe('pi_test_123');
    expect(mockStripe.paymentIntents.create).toHaveBeenCalled();
  });

  it('should return error if match not found', async () => {
    resetMockDataStore(); // Clear all data

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        matchId: 'non-existent',
        amount: 50000,
        insurance: null,
        useCredits: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Match not found');
  });
});

