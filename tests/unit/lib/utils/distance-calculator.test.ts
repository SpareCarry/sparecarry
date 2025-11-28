/**
 * Unit tests for distance calculation
 */

import { describe, it, expect } from 'vitest';
import { calculateDistance } from '../../../../lib/utils/distance-calculator';

describe('Distance Calculator', () => {
  it('should calculate distance between two points', () => {
    // New York to Los Angeles (approximately 3,944 km)
    const nyc = { lat: 40.7128, lon: -74.0060 };
    const la = { lat: 34.0522, lon: -118.2437 };
    
    const distance = calculateDistance(nyc, la);
    
    // Allow 5% margin for calculation differences
    expect(distance).toBeGreaterThan(3700);
    expect(distance).toBeLessThan(4200);
  });

  it('should calculate short distance accurately', () => {
    // San Francisco to Oakland (approximately 13-14 km)
    const sf = { lat: 37.7749, lon: -122.4194 };
    const oakland = { lat: 37.8044, lon: -122.2711 };
    
    const distance = calculateDistance(sf, oakland);
    
    expect(distance).toBeGreaterThan(10);
    expect(distance).toBeLessThan(20);
  });

  it('should return 0 for same coordinates', () => {
    const point = { lat: 40.7128, lon: -74.0060 };
    
    const distance = calculateDistance(point, point);
    
    expect(distance).toBe(0);
  });

  it('should handle international distances', () => {
    // London to New York (approximately 5,585 km)
    const london = { lat: 51.5074, lon: -0.1278 };
    const nyc = { lat: 40.7128, lon: -74.0060 };
    
    const distance = calculateDistance(london, nyc);
    
    expect(distance).toBeGreaterThan(5300);
    expect(distance).toBeLessThan(5900);
  });

  it('should handle cross-equator distances', () => {
    // Northern hemisphere to southern hemisphere
    const north = { lat: 40.7128, lon: -74.0060 }; // NYC
    const south = { lat: -33.8688, lon: 151.2093 }; // Sydney
    
    const distance = calculateDistance(north, south);
    
    // Should be a very long distance
    expect(distance).toBeGreaterThan(15000);
    expect(distance).toBeLessThan(17000);
  });
});

