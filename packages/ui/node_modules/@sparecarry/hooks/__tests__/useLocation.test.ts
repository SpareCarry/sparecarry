/**
 * Tests for useLocation hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLocation, getCurrentLocation } from '../useLocation';

// Mock navigator.geolocation for web
const mockGeolocation = {
  getCurrentPosition: vi.fn((success) => {
    success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
  }),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

describe('useLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof navigator !== 'undefined') {
      (navigator as any).geolocation = mockGeolocation;
    }
  });

  it('should get current location on web', async () => {
    const location = await getCurrentLocation();
    expect(location).toBeDefined();
    expect(location.latitude).toBe(37.7749);
    expect(location.longitude).toBe(-122.4194);
  });

  it('should handle geolocation errors', async () => {
    mockGeolocation.getCurrentPosition = vi.fn((_success, error) => {
      error({
        code: 1,
        message: 'Permission denied',
      });
    });

    await expect(getCurrentLocation()).rejects.toMatchObject({
      code: 1,
      message: 'Permission denied',
    });
  });
});

