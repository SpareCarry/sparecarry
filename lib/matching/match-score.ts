// Match Score Calculation (0-100)
// Breakdown: Route (40%), Dates (25%), Capacity (20%), Trust (15%)

import { differenceInDays, parseISO, isWithinInterval } from "date-fns";

interface MatchScoreParams {
  // Route matching
  requestFrom: string;
  requestTo: string;
  tripFrom: string;
  tripTo: string;
  
  // Date matching
  requestEarliest: string; // ISO date
  requestLatest: string; // ISO date
  tripStart?: string; // ISO date (for boat trips)
  tripEnd?: string; // ISO date (for boat trips)
  tripDate?: string; // ISO date (for plane trips)
  
  // Capacity matching
  requestWeight: number; // kg
  requestDimensions: { length: number; width: number; height: number }; // cm
  requestValue: number; // USD
  tripSpareKg?: number; // kg
  tripSpareLiters?: number; // liters
  tripMaxTonnage?: number; // kg (for boats)
  tripSpareCubicMeters?: number; // m³ (for boats)
  tripMaxDimensions?: { length: number; width: number; height: number }; // cm
  
  // Trust level
  travelerVerifiedIdentity: boolean;
  travelerVerifiedSailor: boolean;
  travelerRating?: number; // 1-5
  travelerCompletedDeliveries: number;
  travelerSubscribed: boolean;
  
  // Method preference
  requestPreferredMethod?: "plane" | "boat" | "any";
  tripType: "plane" | "boat";
}

export interface MatchScoreBreakdown {
  routeScore: number; // 0-40
  dateScore: number; // 0-25
  capacityScore: number; // 0-20
  trustScore: number; // 0-15
  totalScore: number; // 0-100
  routeMatch: "exact" | "nearby" | "partial" | "none";
  dateMatch: "perfect" | "good" | "tight" | "none";
  capacityMatch: "perfect" | "good" | "tight" | "none";
  trustLevel: "excellent" | "good" | "fair" | "new";
}

export function calculateMatchScore(params: MatchScoreParams): MatchScoreBreakdown {
  // 1. Route Score (0-40 points)
  const routeScore = calculateRouteScore(
    params.requestFrom,
    params.requestTo,
    params.tripFrom,
    params.tripTo
  );

  // 2. Date Score (0-25 points)
  const dateScore = calculateDateScore(
    params.requestEarliest,
    params.requestLatest,
    params.tripStart,
    params.tripEnd,
    params.tripDate
  );

  // 3. Capacity Score (0-20 points)
  const capacityScore = calculateCapacityScore(
    params.requestWeight,
    params.requestDimensions,
    params.requestValue,
    params.tripSpareKg,
    params.tripSpareLiters,
    params.tripMaxTonnage,
    params.tripSpareCubicMeters,
    params.tripMaxDimensions,
    params.tripType
  );

  // 4. Trust Score (0-15 points)
  const trustScore = calculateTrustScore(
    params.travelerVerifiedIdentity,
    params.travelerVerifiedSailor,
    params.travelerRating,
    params.travelerCompletedDeliveries,
    params.travelerSubscribed
  );

  const totalScore = routeScore.score + dateScore.score + capacityScore.score + trustScore.score;

  return {
    routeScore: routeScore.score,
    dateScore: dateScore.score,
    capacityScore: capacityScore.score,
    trustScore: trustScore.score,
    totalScore: Math.round(totalScore),
    routeMatch: routeScore.match,
    dateMatch: dateScore.match,
    capacityMatch: capacityScore.match,
    trustLevel: trustScore.level,
  };
}

function calculateRouteScore(
  requestFrom: string,
  requestTo: string,
  tripFrom: string,
  tripTo: string
): { score: number; match: "exact" | "nearby" | "partial" | "none" } {
  // Normalize locations (lowercase, remove extra spaces)
  const normalize = (loc: string) => loc.toLowerCase().trim().replace(/\s+/g, " ");
  const reqFrom = normalize(requestFrom);
  const reqTo = normalize(requestTo);
  const trFrom = normalize(tripFrom);
  const trTo = normalize(tripTo);

  // Exact match (both from and to match)
  if (reqFrom === trFrom && reqTo === trTo) {
    return { score: 40, match: "exact" };
  }

  // Nearby match (cities match or within 50km - simplified check)
  const fromMatch = reqFrom.includes(trFrom) || trFrom.includes(reqFrom);
  const toMatch = reqTo.includes(trTo) || trTo.includes(reqTo);

  if (fromMatch && toMatch) {
    return { score: 35, match: "nearby" };
  }

  // Partial match (one direction matches)
  if ((fromMatch && reqTo === trTo) || (reqFrom === trFrom && toMatch)) {
    return { score: 25, match: "partial" };
  }

  // No match
  return { score: 0, match: "none" };
}

function calculateDateScore(
  requestEarliest: string,
  requestLatest: string,
  tripStart?: string,
  tripEnd?: string,
  tripDate?: string
): { score: number; match: "perfect" | "good" | "tight" | "none" } {
  const reqEarliest = parseISO(requestEarliest);
  const reqLatest = parseISO(requestLatest);

  // For plane trips (single date)
  if (tripDate) {
    const trip = parseISO(tripDate);
    if (isWithinInterval(trip, { start: reqEarliest, end: reqLatest })) {
      const daysUntilEarliest = differenceInDays(trip, reqEarliest);
      const daysUntilLatest = differenceInDays(reqLatest, trip);
      const totalWindow = differenceInDays(reqLatest, reqEarliest);

      // Perfect: within first 30% of window
      if (daysUntilEarliest <= totalWindow * 0.3) {
        return { score: 25, match: "perfect" };
      }
      // Good: within window
      return { score: 20, match: "good" };
    }
    return { score: 0, match: "none" };
  }

  // For boat trips (date range)
  if (tripStart && tripEnd) {
    const tripStartDate = parseISO(tripStart);
    const tripEndDate = parseISO(tripEnd);

    // Check if there's any overlap
    const overlapStart = tripStartDate > reqEarliest ? tripStartDate : reqEarliest;
    const overlapEnd = tripEndDate < reqLatest ? tripEndDate : reqLatest;

    if (overlapStart <= overlapEnd) {
      const overlapDays = differenceInDays(overlapEnd, overlapStart);
      const requestWindow = differenceInDays(reqLatest, reqEarliest);
      const overlapPercent = overlapDays / requestWindow;

      // Perfect: >70% overlap
      if (overlapPercent > 0.7) {
        return { score: 25, match: "perfect" };
      }
      // Good: >40% overlap
      if (overlapPercent > 0.4) {
        return { score: 20, match: "good" };
      }
      // Tight: any overlap
      return { score: 15, match: "tight" };
    }
  }

  return { score: 0, match: "none" };
}

function calculateCapacityScore(
  requestWeight: number,
  requestDimensions: { length: number; width: number; height: number },
  requestValue: number,
  tripSpareKg?: number,
  tripSpareLiters?: number,
  tripMaxTonnage?: number,
  tripSpareCubicMeters?: number,
  tripMaxDimensions?: { length: number; width: number; height: number },
  tripType?: "plane" | "boat"
): { score: number; match: "perfect" | "good" | "tight" | "none" } {
  if (tripType === "plane") {
    // Plane capacity check
    if (!tripSpareKg) return { score: 0, match: "none" };

    const weightFit = requestWeight <= tripSpareKg;
    const volumeFit = tripMaxDimensions
      ? requestDimensions.length <= tripMaxDimensions.length &&
        requestDimensions.width <= tripMaxDimensions.width &&
        requestDimensions.height <= tripMaxDimensions.height
      : true; // Assume fits if no max dimensions specified

    if (!weightFit || !volumeFit) {
      return { score: 0, match: "none" };
    }

    // Perfect: <70% of capacity
    if (requestWeight <= tripSpareKg * 0.7) {
      return { score: 20, match: "perfect" };
    }
    // Good: <90% of capacity
    if (requestWeight <= tripSpareKg * 0.9) {
      return { score: 18, match: "good" };
    }
    // Tight: fits but >90%
    return { score: 15, match: "tight" };
  } else {
    // Boat capacity check
    if (!tripMaxTonnage) return { score: 0, match: "none" };

    const weightFit = requestWeight <= tripMaxTonnage;
    const volumeFit = tripSpareCubicMeters
      ? (requestDimensions.length * requestDimensions.width * requestDimensions.height) / 1000000 <= tripSpareCubicMeters
      : true;

    if (!weightFit || !volumeFit) {
      return { score: 0, match: "none" };
    }

    // Perfect: <60% of capacity
    if (requestWeight <= tripMaxTonnage * 0.6) {
      return { score: 20, match: "perfect" };
    }
    // Good: <85% of capacity
    if (requestWeight <= tripMaxTonnage * 0.85) {
      return { score: 18, match: "good" };
    }
    // Tight: fits but >85%
    return { score: 15, match: "tight" };
  }
}

function calculateTrustScore(
  verifiedIdentity: boolean,
  verifiedSailor: boolean,
  rating?: number,
  completedDeliveries: number = 0,
  subscribed: boolean = false
): { score: number; level: "excellent" | "good" | "fair" | "new" } {
  let score = 0;

  // Identity verification: +5 points
  if (verifiedIdentity) score += 5;

  // Sailor verification (if relevant): +3 points
  if (verifiedSailor) score += 3;

  // Rating: up to +4 points (4.5+ = 4, 4.0+ = 3, 3.5+ = 2, 3.0+ = 1)
  if (rating) {
    if (rating >= 4.5) score += 4;
    else if (rating >= 4.0) score += 3;
    else if (rating >= 3.5) score += 2;
    else if (rating >= 3.0) score += 1;
  }

  // Completed deliveries: up to +2 points (10+ = 2, 5+ = 1)
  if (completedDeliveries >= 10) score += 2;
  else if (completedDeliveries >= 5) score += 1;

  // Subscription: +1 point
  if (subscribed) score += 1;

  // Cap at 15
  score = Math.min(score, 15);

  // Determine level
  let level: "excellent" | "good" | "fair" | "new";
  if (score >= 12) level = "excellent";
  else if (score >= 8) level = "good";
  else if (score >= 4) level = "fair";
  else level = "new";

  return { score, level };
}

