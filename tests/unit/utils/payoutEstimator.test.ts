/**
 * Unit tests for payout estimator
 */

import { describe, it, expect } from 'vitest';
import {
  estimatePayoutETA,
  formatPayoutETA,
  getPayoutStatusColor,
} from '../../../utils/payoutEstimator';

describe('Payout Estimator', () => {
  describe('estimatePayoutETA', () => {
    it('should estimate payout for Stripe Connect', () => {
      const confirmedAt = new Date('2025-01-01T10:00:00Z');
      const estimate = estimatePayoutETA(confirmedAt, 'stripe_connect');

      expect(estimate.estimatedHours).toBeGreaterThan(0);
      expect(estimate.method).toBe('standard');
      expect(estimate.message).toContain('Stripe Connect');
    });

    it('should estimate payout for bank transfer', () => {
      const confirmedAt = new Date('2025-01-01T10:00:00Z');
      const estimate = estimatePayoutETA(confirmedAt, 'bank_transfer');

      expect(estimate.estimatedHours).toBeGreaterThan(48);
      expect(estimate.method).toBe('standard');
    });

    it('should handle weekend dates correctly', () => {
      // Saturday
      const saturday = new Date('2025-01-04T10:00:00Z'); // Assuming this is a Saturday
      const estimate = estimatePayoutETA(saturday, 'stripe_connect');

      expect(estimate.estimatedDate.getDay()).not.toBe(0); // Not Sunday
      expect(estimate.estimatedDate.getDay()).not.toBe(6); // Not Saturday
    });
  });

  describe('formatPayoutETA', () => {
    it('should format hours correctly', () => {
      const estimate = {
        estimatedHours: 12,
        estimatedDays: 1,
        estimatedDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
        method: 'standard' as const,
        message: 'Test',
      };

      const formatted = formatPayoutETA(estimate);
      expect(formatted).toContain('hours');
    });

    it('should format days correctly', () => {
      const estimate = {
        estimatedHours: 48,
        estimatedDays: 2,
        estimatedDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        method: 'standard' as const,
        message: 'Test',
      };

      const formatted = formatPayoutETA(estimate);
      expect(formatted).toContain('days');
    });
  });

  describe('getPayoutStatusColor', () => {
    it('should return green for arrived payouts', () => {
      const estimate = {
        estimatedHours: -1,
        estimatedDays: 0,
        estimatedDate: new Date(Date.now() - 1000),
        method: 'standard' as const,
        message: 'Test',
      };

      expect(getPayoutStatusColor(estimate)).toBe('text-green-600');
    });

    it('should return blue for soon payouts', () => {
      const estimate = {
        estimatedHours: 12,
        estimatedDays: 1,
        estimatedDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
        method: 'standard' as const,
        message: 'Test',
      };

      expect(getPayoutStatusColor(estimate)).toBe('text-blue-600');
    });
  });
});

