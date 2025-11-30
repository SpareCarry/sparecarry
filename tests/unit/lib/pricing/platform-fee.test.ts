/**
 * Unit Test: Platform Fee Calculation
 *
 * Tests the dynamic platform fee calculation logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculatePlatformFee } from "@/lib/pricing/platform-fee";
import { getDaysLeft } from "@/utils/getDaysLeft";

describe("Platform Fee Calculation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 0% for first 3 deliveries", () => {
    // First 3 deliveries should be free
    const result = calculatePlatformFee({
      method: "plane",
      userId: "test",
      userCompletedDeliveries: 0,
      userRating: 5.0,
      isSubscriber: false,
      isSupporter: false,
    });

    expect(result).toBe(0);
  });

  it("should return 0% for first 3 deliveries", () => {
    const result = calculatePlatformFee({
      method: "plane",
      userId: "test",
      userCompletedDeliveries: 2, // Still within first 3
      userRating: 5.0,
      isSubscriber: false,
      isSupporter: false,
    });

    expect(result).toBe(0);
  });

  it("should return 0% for subscribers", () => {
    const result = calculatePlatformFee({
      method: "plane",
      userId: "test",
      userCompletedDeliveries: 10,
      userRating: 4.0,
      isSubscriber: true, // Subscriber
      isSupporter: false,
    });

    expect(result).toBe(0);
  });

  it("should return 0% for supporters", () => {
    const result = calculatePlatformFee({
      method: "plane",
      userId: "test",
      userCompletedDeliveries: 10,
      userRating: 4.0,
      isSubscriber: false,
      isSupporter: true, // Supporter
    });

    expect(result).toBe(0);
  });

  it("should handle different methods", () => {
    // Test normal fee calculation after first 3 deliveries
    const planeResult = calculatePlatformFee({
      method: "plane",
      userId: "test",
      userCompletedDeliveries: 5,
      userRating: 4.0,
      isSubscriber: false,
      isSupporter: false,
    });

    const boatResult = calculatePlatformFee({
      method: "boat",
      userId: "test",
      userCompletedDeliveries: 5,
      userRating: 4.0,
      isSubscriber: false,
      isSupporter: false,
    });

    expect(planeResult).toBeGreaterThanOrEqual(0);
    expect(boatResult).toBeGreaterThanOrEqual(0);
    expect(planeResult).toBeLessThanOrEqual(0.18); // Max 18%
    expect(boatResult).toBeLessThanOrEqual(0.15); // Max 15%
  });
});
