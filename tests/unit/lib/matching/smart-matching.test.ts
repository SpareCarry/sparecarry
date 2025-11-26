/**
 * Unit tests for smart matching service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findMatches, getConfidenceLabel } from '../../../../lib/matching/smart-matching';

// Mock Supabase client
vi.mock('../../../../lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        in: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}));

describe('Smart Matching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfidenceLabel', () => {
    it('should return correct label for high confidence', () => {
      expect(getConfidenceLabel('high')).toBe('High Match');
    });

    it('should return correct label for medium confidence', () => {
      expect(getConfidenceLabel('medium')).toBe('Good Match');
    });

    it('should return correct label for low confidence', () => {
      expect(getConfidenceLabel('low')).toBe('Possible Match');
    });
  });

  // Note: Full integration tests would require mocking Supabase responses
  // These are basic unit tests for utility functions
});

