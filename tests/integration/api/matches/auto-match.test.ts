import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/matches/auto-match/route';
import { supabase, seedMockData, resetMockDataStore } from '@/tests/mocks/supabase/mockClient';
import type { Trip, Request as RequestType } from '@/types/supabase';

describe('POST /api/matches/auto-match', () => {
  beforeEach(() => {
    resetMockDataStore();
    
    // Seed test data
    seedMockData<Trip>('trips', [
      {
        id: 'trip-123',
        user_id: 'user-1',
        type: 'plane',
        from_location: 'Miami',
        to_location: 'St. Martin',
        eta_window_start: '2024-01-01',
        eta_window_end: '2024-01-15',
        spare_kg: 20,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    seedMockData<RequestType>('requests', [
      {
        id: 'request-123',
        user_id: 'user-2',
        title: 'Test Request',
        from_location: 'Miami',
        to_location: 'St. Martin',
        deadline_earliest: '2024-01-01',
        deadline_latest: '2024-01-15',
        preferred_method: 'plane',
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
    ]);
  });

  it('should create matches for a new trip', async () => {
    const request = new NextRequest('http://localhost:3000/api/matches/auto-match', {
      method: 'POST',
      body: JSON.stringify({ type: 'trip', id: 'trip-123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify match was created
    const matches = await supabase.from('matches').select('*').then((r) => r.data || []);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]).toMatchObject({
      trip_id: 'trip-123',
      request_id: 'request-123',
      status: 'pending',
    });
  });

  it('should create matches for a new request', async () => {
    const request = new NextRequest('http://localhost:3000/api/matches/auto-match', {
      method: 'POST',
      body: JSON.stringify({ type: 'request', id: 'request-123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify match was created
    const matches = await supabase.from('matches').select('*').then((r) => r.data || []);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should return 404 if trip not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/matches/auto-match', {
      method: 'POST',
      body: JSON.stringify({ type: 'trip', id: 'non-existent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Trip not found');
  });
});

