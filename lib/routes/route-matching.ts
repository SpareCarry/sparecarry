/**
 * Route Matching Service
 *
 * Matches new requests against saved routes and sends notifications
 * when matches are found above the threshold score.
 */

import { createClient } from "@supabase/supabase-js";
import { generateRouteSegments, findMatchingSegments } from "./route-segments";
import { calculateMatchScore } from "../matching/match-score";
import type { RouteDestination, RouteSegment } from "./route-segments";

const MATCH_SCORE_THRESHOLD = 60; // Only notify if match score >= 60

interface RequestData {
  id: string;
  from_location: string;
  to_location: string;
  deadline_earliest: string | null;
  deadline_latest: string;
  max_reward: number;
  weight_kg: number;
  preferred_method?: "plane" | "boat" | "any";
  category?: string;
  value_usd?: number;
}

interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  type: "boat" | "plane";
  destinations: RouteDestination[];
  is_active: boolean;
  notification_preferences: {
    min_reward?: number;
    max_weight?: number;
    categories?: string[];
    enabled?: boolean;
  };
  airport_preferences?: Record<string, string[]>;
  recurrence_pattern?: string;
  next_occurrence_date?: string | null;
  flexibility_days?: number;
}

interface RouteMatch {
  savedRouteId: string;
  requestId: string;
  segmentIndex: number;
  segmentFrom: string;
  segmentTo: string;
  matchScore: number;
}

/**
 * Check if request matches notification preferences
 */
function matchesNotificationPreferences(
  request: RequestData,
  preferences: SavedRoute["notification_preferences"]
): boolean {
  if (!preferences.enabled && preferences.enabled !== undefined) {
    return false;
  }

  // Check minimum reward
  if (preferences.min_reward && request.max_reward < preferences.min_reward) {
    return false;
  }

  // Check maximum weight
  if (preferences.max_weight && request.weight_kg > preferences.max_weight) {
    return false;
  }

  // Check categories
  if (preferences.categories && preferences.categories.length > 0) {
    if (
      !request.category ||
      !preferences.categories.includes(request.category)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Check if request matches route type
 */
function matchesRouteType(
  request: RequestData,
  routeType: "boat" | "plane"
): boolean {
  if (!request.preferred_method || request.preferred_method === "any") {
    return true;
  }

  if (request.preferred_method === routeType) {
    return true;
  }

  // Boat routes can handle restricted items (only boats can)
  // Plane routes cannot handle restricted items
  // This logic would need to check request.restricted_items if available
  return false;
}

/**
 * Find all saved routes that match a request
 * @param request - Request data to match
 * @param supabase - Supabase client (admin/service role for accessing all routes)
 * @returns Array of route matches
 */
export async function findRouteMatches(
  request: RequestData,
  supabase: ReturnType<typeof createClient>
): Promise<RouteMatch[]> {
  const matches: RouteMatch[] = [];

  try {
    // Get all active saved routes
    const { data: savedRoutes, error } = await supabase
      .from("saved_routes")
      .select("*")
      .eq("is_active", true)
      .eq("notification_preferences->enabled", true);

    if (error) {
      console.error("Error fetching saved routes:", error);
      return matches;
    }

    if (!savedRoutes || savedRoutes.length === 0) {
      return matches;
    }

    // Check each saved route
    for (const route of savedRoutes as SavedRoute[]) {
      // Check notification preferences
      if (
        !matchesNotificationPreferences(
          request,
          route.notification_preferences || {}
        )
      ) {
        continue;
      }

      // Check route type compatibility
      if (!matchesRouteType(request, route.type)) {
        continue;
      }

      // Generate route segments
      const segments = generateRouteSegments(route.destinations, true);

      // Find matching segments
      const matchingSegments = findMatchingSegments(
        segments,
        request.from_location,
        request.to_location,
        true // fuzzy matching
      );

      if (matchingSegments.length === 0) {
        continue;
      }

      // For each matching segment, calculate comprehensive match score
      for (const segmentMatch of matchingSegments) {
        // Calculate date compatibility (simplified - would need trip dates from route)
        // For now, we'll use a basic date check
        let dateScore = 25; // Default score if no specific dates

        // If route has next_occurrence_date, check if it's within request deadline
        if (route.next_occurrence_date) {
          const routeDate = new Date(route.next_occurrence_date);
          const requestLatest = new Date(request.deadline_latest);
          const flexibilityDays = route.flexibility_days || 3;

          const daysDifference = Math.abs(
            (routeDate.getTime() - requestLatest.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (daysDifference > flexibilityDays) {
            dateScore = 0; // Date doesn't match
          } else if (daysDifference <= 1) {
            dateScore = 25; // Perfect match
          } else {
            dateScore = 20; // Good match
          }
        }

        // Combine segment match score with date score
        // Route match: 40 points (from segmentMatch.matchScore)
        // Date match: 25 points (calculated above)
        // Capacity: Assume 20 points (would need trip capacity from route)
        // Trust: Assume 15 points (would need user rating)
        const totalScore = Math.min(
          segmentMatch.matchScore * 0.4 + // Route component (max 40)
            dateScore + // Date component (max 25)
            20 + // Capacity component (placeholder)
            15, // Trust component (placeholder)
          100
        );

        if (totalScore >= MATCH_SCORE_THRESHOLD) {
          matches.push({
            savedRouteId: route.id,
            requestId: request.id,
            segmentIndex: segmentMatch.segmentIndex,
            segmentFrom: segmentMatch.from.location,
            segmentTo: segmentMatch.to.location,
            matchScore: Math.round(totalScore),
          });
        }
      }
    }

    return matches;
  } catch (error) {
    console.error("Exception finding route matches:", error);
    return matches;
  }
}

/**
 * Create route notifications for matched routes
 * @param matches - Array of route matches
 * @param supabase - Supabase client
 */
export async function createRouteNotifications(
  matches: RouteMatch[],
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  if (matches.length === 0) {
    return;
  }

  try {
    // Check if notifications already exist (prevent duplicates)
    const existingNotifications = await supabase
      .from("route_notifications")
      .select("saved_route_id, request_id")
      .in(
        "saved_route_id",
        matches.map((m) => m.savedRouteId)
      )
      .in(
        "request_id",
        matches.map((m) => m.requestId)
      );

    const existingSet = new Set(
      ((existingNotifications.data || []) as any[]).map(
        (n: any) => `${n.saved_route_id}:${n.request_id}`
      )
    );

    // Filter out duplicates
    const newMatches = matches.filter(
      (m) => !existingSet.has(`${m.savedRouteId}:${m.requestId}`)
    );

    if (newMatches.length === 0) {
      return;
    }

    // Insert notifications
    const notificationsToInsert = newMatches.map((match) => ({
      saved_route_id: match.savedRouteId,
      request_id: match.requestId,
      segment_index: match.segmentIndex,
      segment_from: match.segmentFrom,
      segment_to: match.segmentTo,
      match_score: match.matchScore,
    }));

    const { error } = await supabase
      .from("route_notifications")
      .insert(notificationsToInsert as any);

    if (error) {
      console.error("Error creating route notifications:", error);
      return;
    }

    // TODO: Trigger push notifications to users
    // This would integrate with the existing notification system
    console.log(`Created ${newMatches.length} route notifications`);
  } catch (error) {
    console.error("Exception creating route notifications:", error);
  }
}

/**
 * Process a new request and match against saved routes
 * Main entry point for route matching when a request is created
 * @param requestId - ID of the newly created request
 * @param supabaseAdmin - Supabase admin client (with service role)
 */
export async function processRequestForRouteMatching(
  requestId: string,
  supabaseAdmin: ReturnType<typeof createClient>
): Promise<void> {
  try {
    // Fetch request details
    const { data: request, error: requestError } = await supabaseAdmin
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      console.error("Error fetching request for route matching:", requestError);
      return;
    }

    const requestData: RequestData = {
      id: (request as any).id,
      from_location: (request as any).from_location,
      to_location: (request as any).to_location,
      deadline_earliest: (request as any).deadline_earliest,
      deadline_latest: (request as any).deadline_latest,
      max_reward: parseFloat((request as any).max_reward?.toString() || "0"),
      weight_kg: parseFloat((request as any).weight_kg?.toString() || "0"),
      preferred_method: (request as any).preferred_method,
      category: (request as any).category,
      value_usd: (request as any).value_usd
        ? parseFloat((request as any).value_usd.toString())
        : undefined,
    };

    // Find matches
    const matches = await findRouteMatches(requestData, supabaseAdmin);

    if (matches.length > 0) {
      // Create notifications
      await createRouteNotifications(matches, supabaseAdmin);

      // TODO: Send push notifications to users
      // This should integrate with existing notification infrastructure
    }
  } catch (error) {
    console.error("Exception processing request for route matching:", error);
  }
}
