/**
 * Unit tests for getDaysLeft utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDaysLeft } from "@/utils/getDaysLeft";

describe("getDaysLeft", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return correct days left before promo end", () => {
    // Set date to Jan 1, 2026 (48 days before Feb 18, 2026)
    const testDate = new Date("2026-01-01T00:00:00Z");
    vi.setSystemTime(testDate);

    const daysLeft = getDaysLeft();
    expect(daysLeft).toBe(48);
  });

  it("should return 0 after promo end date", () => {
    // Set date to Feb 19, 2026 (after promo end)
    const testDate = new Date("2026-02-19T00:00:00Z");
    vi.setSystemTime(testDate);

    const daysLeft = getDaysLeft();
    expect(daysLeft).toBe(0);
  });

  it("should return 0 on promo end date", () => {
    // Set date to Feb 18, 2026 (promo end date)
    const testDate = new Date("2026-02-18T00:00:00Z");
    vi.setSystemTime(testDate);

    const daysLeft = getDaysLeft();
    expect(daysLeft).toBe(0);
  });

  it("should never return negative values", () => {
    // Set date far in the future
    const testDate = new Date("2030-01-01T00:00:00Z");
    vi.setSystemTime(testDate);

    const daysLeft = getDaysLeft();
    expect(daysLeft).toBe(0);
    expect(daysLeft).toBeGreaterThanOrEqual(0);
  });
});
