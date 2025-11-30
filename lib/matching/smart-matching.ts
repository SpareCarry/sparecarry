/**
 * Smart Matching Service
 *
 * Extends existing match-score.ts with automatic matching suggestions
 * and confidence scoring for trip-request pairs
 */

import { calculateMatchScore, MatchScoreBreakdown } from "./match-score";
import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface MatchCandidate {
  tripId: string;
  requestId: string;
  travelerId: string;
  requesterId: string;
  score: number;
  confidence: "high" | "medium" | "low";
  breakdown: MatchScoreBreakdown;
  routeMatch: "exact" | "nearby" | "partial" | "none";
  dateOverlap: boolean;
  capacityMatch: "fits" | "no_capacity";
  travelerReliability: number;
  travelerRating?: number;
}

export interface MatchSuggestion {
  candidate: MatchCandidate;
  trip: {
    id: string;
    type: "plane" | "boat";
    from_location: string;
    to_location: string;
    departure_date: string;
    spare_kg: number;
    user_id: string;
  };
  request: {
    id: string;
    title: string;
    from_location: string;
    to_location: string;
    deadline_latest: string;
    weight_kg: number;
    user_id: string;
  };
  traveler: {
    id: string;
    reliability_score: number;
    average_rating?: number;
    completed_deliveries_count: number;
    subscription_status?: string;
  };
}

type MatchedCandidateRow = {
  request_id: string;
  trip_id: string;
  date_overlap: boolean;
  capacity_match: string;
  reliability_score?: number | null;
  average_rating?: number | null;
  route_match: string;
  completed_deliveries_count?: number | null;
  traveler_premium?: boolean | null;
};

/**
 * Find matches for a trip or request
 */
export async function findMatches(postOrTrip: {
  type: "trip" | "request";
  id: string;
}): Promise<MatchSuggestion[]> {
  const supabase = createClient() as SupabaseClient;

  if (postOrTrip.type === "trip") {
    return findMatchesForTrip(postOrTrip.id, supabase);
  } else {
    return findMatchesForRequest(postOrTrip.id, supabase);
  }
}

/**
 * Find matching requests for a trip
 */
async function findMatchesForTrip(
  tripId: string,
  supabase: SupabaseClient
): Promise<MatchSuggestion[]> {
  // Get trip details
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*, users(*)")
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    return [];
  }

  const traveler = trip.users as any;

  // Get matching requests from materialized view or direct query
  const { data: candidates, error: candidatesError } = await supabase
    .from("matched_candidates")
    .select("*")
    .eq("trip_id", tripId)
    .eq("route_match", "exact")
    .eq("date_overlap", true)
    .eq("capacity_match", "fits")
    .order("reliability_score", { ascending: false })
    .limit(20);

  if (candidatesError || !candidates) {
    return [];
  }

  const candidateRows = candidates as MatchedCandidateRow[];

  // Get request details for candidates
  const requestIds = candidateRows.map((c) => c.request_id);
  const { data: requests, error: requestsError } = await supabase
    .from("requests")
    .select("*, users(*)")
    .in("id", requestIds)
    .eq("status", "open");

  if (requestsError || !requests) {
    return [];
  }

  // Calculate match scores and build suggestions
  const suggestions: MatchSuggestion[] = [];

  for (const candidate of candidates) {
    const request = requests.find((r) => r.id === candidate.request_id);
    if (!request) continue;

    const requester = request.users as any;

    // Parse dimensions
    const requestDimensions = request.dimensions_cm
      ? JSON.parse(request.dimensions_cm)
      : { length: 0, width: 0, height: 0 };

    const tripDimensions = trip.max_dimensions
      ? JSON.parse(trip.max_dimensions)
      : { length: 0, width: 0, height: 0 };

    // Calculate match score
    const breakdown = calculateMatchScore({
      requestFrom: request.from_location,
      requestTo: request.to_location,
      tripFrom: trip.from_location,
      tripTo: trip.to_location,
      requestEarliest: request.deadline_earliest || request.deadline_latest,
      requestLatest: request.deadline_latest,
      tripStart: trip.eta_window_start,
      tripEnd: trip.eta_window_end,
      tripDate: trip.departure_date,
      requestWeight: request.weight_kg,
      requestDimensions,
      requestValue: request.value_usd || 0,
      tripSpareKg: trip.spare_kg,
      tripSpareLiters: trip.spare_volume_liters,
      tripMaxDimensions: tripDimensions,
      tripType: trip.type,
      travelerVerifiedIdentity: traveler.id_verified || false,
      travelerVerifiedSailor: traveler.verified_sailor_at ? true : false,
      travelerRating: traveler.average_rating,
      travelerCompletedDeliveries: traveler.completed_deliveries_count || 0,
      travelerSubscribed: traveler.subscription_status === "active",
      requestPreferredMethod: request.preferred_method || "any",
    });

    // Determine confidence level
    let confidence: "high" | "medium" | "low" = "low";
    if (
      breakdown.totalScore >= 70 &&
      breakdown.routeMatch === "exact" &&
      candidate.date_overlap
    ) {
      confidence = "high";
    } else if (
      breakdown.totalScore >= 50 &&
      (breakdown.routeMatch === "exact" || breakdown.routeMatch === "nearby")
    ) {
      confidence = "medium";
    }

    suggestions.push({
      candidate: {
        tripId: trip.id,
        requestId: request.id,
        travelerId: trip.user_id,
        requesterId: request.user_id,
        score: breakdown.totalScore,
        confidence,
        breakdown,
        routeMatch: breakdown.routeMatch,
        dateOverlap: candidate.date_overlap,
        capacityMatch: candidate.capacity_match as "fits" | "no_capacity",
        travelerReliability: candidate.reliability_score || 0,
        travelerRating: candidate.average_rating ?? undefined,
      },
      trip: {
        id: trip.id,
        type: trip.type,
        from_location: trip.from_location,
        to_location: trip.to_location,
        departure_date: trip.departure_date,
        spare_kg: trip.spare_kg,
        user_id: trip.user_id,
      },
      request: {
        id: request.id,
        title: request.title,
        from_location: request.from_location,
        to_location: request.to_location,
        deadline_latest: request.deadline_latest,
        weight_kg: request.weight_kg,
        user_id: request.user_id,
      },
      traveler: {
        id: traveler.id,
        reliability_score: candidate.reliability_score || 0,
        average_rating: candidate.average_rating ?? undefined,
        completed_deliveries_count: candidate.completed_deliveries_count || 0,
        subscription_status: candidate.traveler_premium ? "active" : undefined,
      },
    });
  }

  // Sort by score descending
  return suggestions.sort((a, b) => b.candidate.score - a.candidate.score);
}

/**
 * Find matching trips for a request
 */
async function findMatchesForRequest(
  requestId: string,
  supabase: SupabaseClient
): Promise<MatchSuggestion[]> {
  // Get request details
  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    return [];
  }

  // Get matching trips from materialized view
  const { data: candidates, error: candidatesError } = await supabase
    .from("matched_candidates")
    .select("*")
    .eq("request_id", requestId)
    .in("route_match", ["exact", "nearby"])
    .eq("date_overlap", true)
    .eq("capacity_match", "fits")
    .order("reliability_score", { ascending: false })
    .limit(20);

  if (candidatesError || !candidates) {
    return [];
  }

  const candidateRows = candidates as MatchedCandidateRow[];

  // Get trip details for candidates
  const tripIds = candidateRows.map((c) => c.trip_id);
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("*, users(*)")
    .in("id", tripIds)
    .eq("status", "active");

  if (tripsError || !trips) {
    return [];
  }

  // Calculate match scores and build suggestions
  const suggestions: MatchSuggestion[] = [];

  for (const candidate of candidateRows) {
    const trip = trips.find((t) => t.id === candidate.trip_id);
    if (!trip) continue;

    const traveler = trip.users as any;

    // Parse dimensions
    const requestDimensions = request.dimensions_cm
      ? JSON.parse(request.dimensions_cm)
      : { length: 0, width: 0, height: 0 };

    const tripDimensions = trip.max_dimensions
      ? JSON.parse(trip.max_dimensions)
      : { length: 0, width: 0, height: 0 };

    // Calculate match score
    const breakdown = calculateMatchScore({
      requestFrom: request.from_location,
      requestTo: request.to_location,
      tripFrom: trip.from_location,
      tripTo: trip.to_location,
      requestEarliest: request.deadline_earliest || request.deadline_latest,
      requestLatest: request.deadline_latest,
      tripStart: trip.eta_window_start,
      tripEnd: trip.eta_window_end,
      tripDate: trip.departure_date,
      requestWeight: request.weight_kg,
      requestDimensions,
      requestValue: request.value_usd || 0,
      tripSpareKg: trip.spare_kg,
      tripSpareLiters: trip.spare_volume_liters,
      tripMaxDimensions: tripDimensions,
      tripType: trip.type,
      travelerVerifiedIdentity: traveler.id_verified || false,
      travelerVerifiedSailor: traveler.verified_sailor_at ? true : false,
      travelerRating: traveler.average_rating,
      travelerCompletedDeliveries: traveler.completed_deliveries_count || 0,
      travelerSubscribed: traveler.subscription_status === "active",
      requestPreferredMethod: request.preferred_method || "any",
    });

    // Determine confidence level
    let confidence: "high" | "medium" | "low" = "low";
    if (
      breakdown.totalScore >= 70 &&
      breakdown.routeMatch === "exact" &&
      candidate.date_overlap
    ) {
      confidence = "high";
    } else if (
      breakdown.totalScore >= 50 &&
      (breakdown.routeMatch === "exact" || breakdown.routeMatch === "nearby")
    ) {
      confidence = "medium";
    }

    suggestions.push({
      candidate: {
        tripId: trip.id,
        requestId: request.id,
        travelerId: trip.user_id,
        requesterId: request.user_id,
        score: breakdown.totalScore,
        confidence,
        breakdown,
        routeMatch: breakdown.routeMatch,
        dateOverlap: candidate.date_overlap,
        capacityMatch: candidate.capacity_match as "fits" | "no_capacity",
        travelerReliability: candidate.reliability_score || 0,
        travelerRating: candidate.average_rating ?? undefined,
      },
      trip: {
        id: trip.id,
        type: trip.type,
        from_location: trip.from_location,
        to_location: trip.to_location,
        departure_date: trip.departure_date,
        spare_kg: trip.spare_kg,
        user_id: trip.user_id,
      },
      request: {
        id: request.id,
        title: request.title,
        from_location: request.from_location,
        to_location: request.to_location,
        deadline_latest: request.deadline_latest,
        weight_kg: request.weight_kg,
        user_id: request.user_id,
      },
      traveler: {
        id: traveler.id,
        reliability_score: candidate.reliability_score || 0,
        average_rating: candidate.average_rating ?? undefined,
        completed_deliveries_count: candidate.completed_deliveries_count || 0,
        subscription_status: candidate.traveler_premium ? "active" : undefined,
      },
    });
  }

  // Sort by score descending
  return suggestions.sort((a, b) => b.candidate.score - a.candidate.score);
}

/**
 * Get match confidence label
 */
export function getConfidenceLabel(
  confidence: "high" | "medium" | "low"
): string {
  switch (confidence) {
    case "high":
      return "High Match";
    case "medium":
      return "Good Match";
    case "low":
      return "Possible Match";
  }
}
