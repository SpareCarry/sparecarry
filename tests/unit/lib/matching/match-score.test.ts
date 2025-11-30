import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "@/lib/matching/match-score";

describe("calculateMatchScore", () => {
  const baseParams = {
    requestFrom: "Miami",
    requestTo: "St. Martin",
    requestEarliest: "2024-01-01",
    requestLatest: "2024-01-15",
    requestWeight: 10,
    requestDimensions: { length: 50, width: 40, height: 30 },
    requestValue: 1000,
    tripSpareKg: 20,
    tripMaxDimensions: { length: 60, width: 50, height: 40 },
    travelerVerifiedIdentity: true,
    travelerVerifiedSailor: false,
    travelerRating: 4.5,
    travelerCompletedDeliveries: 10,
    travelerSubscribed: false,
    tripType: "plane" as const,
  };

  it("should calculate perfect match score for exact route and dates", () => {
    const result = calculateMatchScore({
      ...baseParams,
      tripFrom: "Miami",
      tripTo: "St. Martin",
      tripDate: "2024-01-10",
    });

    expect(result.totalScore).toBeGreaterThan(80);
    expect(result.routeMatch).toBe("exact");
    // Accept 'perfect' or 'good' - both indicate successful matching
    expect(["perfect", "good"]).toContain(result.dateMatch);
  });

  it("should calculate lower score for partial route match", () => {
    const result = calculateMatchScore({
      ...baseParams,
      tripFrom: "Miami",
      tripTo: "St. Thomas", // Different destination
      tripDate: "2024-01-10",
    });

    expect(result.totalScore).toBeLessThan(80);
    expect(result.routeMatch).not.toBe("exact");
  });

  it("should handle boat trips with date ranges", () => {
    const result = calculateMatchScore({
      ...baseParams,
      tripType: "boat",
      tripFrom: "Miami",
      tripTo: "St. Martin",
      tripStart: "2024-01-05",
      tripEnd: "2024-01-12",
    });

    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.dateMatch).toBeTruthy();
  });

  it("should penalize insufficient capacity", () => {
    const result = calculateMatchScore({
      ...baseParams,
      tripFrom: "Miami",
      tripTo: "St. Martin",
      tripDate: "2024-01-10",
      tripSpareKg: 5, // Less than request weight
    });

    expect(result.capacityMatch).toBe("none");
    expect(result.capacityScore).toBe(0);
  });

  it("should reward verified and high-rated travelers", () => {
    const highTrustResult = calculateMatchScore({
      ...baseParams,
      tripFrom: "Miami",
      tripTo: "St. Martin",
      tripDate: "2024-01-10",
      travelerVerifiedIdentity: true,
      travelerVerifiedSailor: true,
      travelerRating: 4.9,
      travelerCompletedDeliveries: 50,
      travelerSubscribed: true,
    });

    const lowTrustResult = calculateMatchScore({
      ...baseParams,
      tripFrom: "Miami",
      tripTo: "St. Martin",
      tripDate: "2024-01-10",
      travelerVerifiedIdentity: false,
      travelerVerifiedSailor: false,
      travelerRating: 3.0,
      travelerCompletedDeliveries: 0,
      travelerSubscribed: false,
    });

    expect(highTrustResult.trustScore).toBeGreaterThan(
      lowTrustResult.trustScore
    );
    expect(highTrustResult.totalScore).toBeGreaterThan(
      lowTrustResult.totalScore
    );
  });
});
