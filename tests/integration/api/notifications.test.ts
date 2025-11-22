/**
 * Integration Test: Notification Endpoints
 * 
 * Tests notification endpoints:
 * - Register token endpoint
 * - Send message endpoint
 * - Send match endpoint
 */

import { describe, it, expect } from 'vitest';

describe('Notification Endpoints', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  it('should have register-token endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/notifications/register-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'test-token' }),
    });

    // Should return 401 (unauthorized) or 400 (invalid), not 404
    expect(response.status).not.toBe(404);
  });

  it('should have send-message endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/notifications/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: 'test', recipientId: 'test' }),
    });

    // Should return 401 (unauthorized) or 400 (invalid), not 404
    expect(response.status).not.toBe(404);
  });

  it('should have send-match endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/notifications/send-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: 'test', userId: 'test' }),
    });

    // Should return 401 (unauthorized) or 400 (invalid), not 404
    expect(response.status).not.toBe(404);
  });
});

