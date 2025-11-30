/**
 * Unit Test: Karma Points System
 *
 * Tests karma point calculation logic.
 */

import { describe, it, expect } from "vitest";
import {
  calculateKarma,
  formatKarmaPoints,
  KARMA_BASE_MULTIPLIER,
  KARMA_FEE_MULTIPLIER,
} from "../src/utils/karma";

describe("Karma Points System", () => {
  describe("Constants", () => {
    it("should have correct base multiplier", () => {
      expect(KARMA_BASE_MULTIPLIER).toBe(10);
    });

    it("should have correct fee multiplier", () => {
      expect(KARMA_FEE_MULTIPLIER).toBe(2);
    });
  });

  describe("calculateKarma", () => {
    it("should calculate karma points correctly", () => {
      const result = calculateKarma({
        weight: 5, // 5 kg
        platformFee: 10, // $10 (includes Stripe fee impact via net revenue)
      });
      // (5 * 10) + (10 * 2) = 50 + 20 = 70
      expect(result).toBe(70);
    });

    it("should calculate karma with platform fee that accounts for Stripe", () => {
      // Example: Platform fee $11, after Stripe fee of $3.52, net revenue is $7.48
      // Karma uses platform fee (before Stripe), so it reflects full contribution
      const result = calculateKarma({
        weight: 5,
        platformFee: 11, // Full platform fee (before Stripe deduction)
      });
      // (5 * 10) + (11 * 2) = 50 + 22 = 72
      expect(result).toBe(72);
    });

    it("should handle zero weight", () => {
      const result = calculateKarma({
        weight: 0,
        platformFee: 10,
      });
      expect(result).toBe(0);
    });

    it("should handle zero platform fee", () => {
      const result = calculateKarma({
        weight: 5,
        platformFee: 0,
      });
      // (5 * 10) + (0 * 2) = 50
      expect(result).toBe(50);
    });

    it("should use custom base points multiplier", () => {
      const result = calculateKarma({
        weight: 5,
        platformFee: 10,
        basePoints: 20,
      });
      // (5 * 20) + (10 * 2) = 100 + 20 = 120
      expect(result).toBe(120);
    });

    it("should round to nearest integer", () => {
      const result = calculateKarma({
        weight: 1.5,
        platformFee: 3.5,
      });
      // (1.5 * 10) + (3.5 * 2) = 15 + 7 = 22
      expect(result).toBe(22);
    });
  });

  describe("formatKarmaPoints", () => {
    it("should format small numbers", () => {
      expect(formatKarmaPoints(0)).toBe("0");
      expect(formatKarmaPoints(50)).toBe("50");
      expect(formatKarmaPoints(999)).toBe("999");
    });

    it("should format large numbers with k suffix", () => {
      expect(formatKarmaPoints(1000)).toBe("1.0k");
      expect(formatKarmaPoints(1500)).toBe("1.5k");
      expect(formatKarmaPoints(2500)).toBe("2.5k");
    });
  });
});
