/**
 * Unit Test: Shipping Platform Fees
 *
 * Tests the hybrid platform fee calculation logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PLATFORM_FEE_FLAT,
  PLATFORM_FEE_PERCENT,
  calculatePlatformFee,
  roundToHalfDollar,
  calculateStripeFee,
  calculateNetRevenue,
  validatePlatformFeeCoversStripe,
} from "../src/constants/shippingFees";

// Mock getDaysLeft to return 0 (promo period ended) so we can test actual fee calculations
vi.mock("@/utils/getDaysLeft", () => ({
  getDaysLeft: vi.fn(() => 0), // Promo period ended
}));

describe("Shipping Platform Fees", () => {
  describe("Constants", () => {
    it("should have correct flat fee", () => {
      expect(PLATFORM_FEE_FLAT).toBe(3.0);
    });

    it("should have correct percentage fee", () => {
      expect(PLATFORM_FEE_PERCENT).toBe(0.08);
    });
  });

  describe("roundToHalfDollar", () => {
    it("should round to nearest $0.50", () => {
      expect(roundToHalfDollar(10.24)).toBe(10.0);
      expect(roundToHalfDollar(10.25)).toBe(10.5);
      expect(roundToHalfDollar(10.74)).toBe(10.5);
      expect(roundToHalfDollar(10.75)).toBe(11.0);
      expect(roundToHalfDollar(10.0)).toBe(10.0);
      expect(roundToHalfDollar(10.5)).toBe(10.5);
    });
  });

  describe("calculatePlatformFee", () => {
    it("should calculate fee for non-premium user", () => {
      const basePrice = 100;
      const fee = calculatePlatformFee(basePrice, false);
      // $3 + (8% * $100) = $3 + $8 = $11
      expect(fee).toBe(11.0);
    });

    it("should apply premium discount: flat fee waived + % fee halved", () => {
      const basePrice = 100;
      const fee = calculatePlatformFee(basePrice, true);
      // Premium: $0 flat + (4% * $100) = $4
      expect(fee).toBe(4.0);
    });

    it("should waive flat fee for premium users", () => {
      const basePrice = 10;
      const freeFee = calculatePlatformFee(basePrice, false);
      const premiumFee = calculatePlatformFee(basePrice, true);
      // Free: $3 + (8% * $10) = $3 + $0.8 = $3.8, rounded to $4
      // Premium: $0 + (4% * $10) = $0.4, rounded to $0.5
      expect(freeFee).toBe(4.0);
      expect(premiumFee).toBe(0.5);
      // Premium fee should be less than free fee
      expect(premiumFee).toBeLessThan(freeFee);
    });

    it("should round to half dollar increments", () => {
      const basePrice = 50;
      const fee = calculatePlatformFee(basePrice, false);
      // $3 + (8% * $50) = $3 + $4 = $7
      expect(fee).toBe(7.0);
    });

    it("should handle zero base price", () => {
      const fee = calculatePlatformFee(0, false);
      // $3 + (8% * $0) = $3
      expect(fee).toBe(3.0);
    });

    it("should handle small base prices", () => {
      const basePrice = 10;
      const fee = calculatePlatformFee(basePrice, false);
      // $3 + (8% * $10) = $3 + $0.8 = $3.8, rounded to $4.0
      expect(fee).toBe(4.0);
    });

    it("should ensure platform fee covers Stripe fee for typical transactions", () => {
      const basePrice = 50;
      const platformFee = calculatePlatformFee(basePrice, false);
      const transactionAmount = basePrice + platformFee;
      const isValid = validatePlatformFeeCoversStripe(
        platformFee,
        transactionAmount
      );

      // Platform fee: $3 + (8% * $50) = $3 + $4 = $7
      // Transaction: $50 + $7 = $57
      // Stripe fee: (57 * 2.9%) + $0.30 = $1.65 + $0.30 = $1.95
      // $7 > $1.95, so should be valid
      expect(isValid).toBe(true);
    });
  });

  describe("Stripe Fee Integration", () => {
    it("should calculate net revenue after Stripe fees", () => {
      const basePrice = 100;
      const platformFee = calculatePlatformFee(basePrice, false); // $3 + 8% = $11
      const transactionAmount = basePrice + platformFee; // $111
      const netRevenue = calculateNetRevenue(platformFee, transactionAmount);

      // Stripe fee: (111 * 2.9%) + $0.30 = $3.22 + $0.30 = $3.52
      // Net revenue: $11.00 - $3.52 = $7.48
      expect(netRevenue).toBeGreaterThan(0);
      expect(netRevenue).toBeLessThan(platformFee);
    });

    it("should validate platform fee covers Stripe fee for free users", () => {
      const basePrice = 20;
      const platformFee = calculatePlatformFee(basePrice, false);
      const transactionAmount = basePrice + platformFee;
      const isValid = validatePlatformFeeCoversStripe(
        platformFee,
        transactionAmount
      );
      expect(isValid).toBe(true);
    });
  });
});
