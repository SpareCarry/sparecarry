/**
 * Historical Pricing Data
 *
 * Queries completed deliveries to extract pricing patterns and market data
 * Used for improving courier estimates and suggested SpareCarry prices
 */

import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface HistoricalRequest {
  id: string;
  from_location: string;
  to_location: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
  value_usd: number | null;
  max_reward: number;
  final_reward: number; // From matches.reward_amount
  category: string | null;
  preferred_method: string;
  created_at: string;
  completed_at: string; // From matches.updated_at when status = 'completed'
  courier_price?: number; // If available from shipping estimate
  courier_total?: number; // If available
}

export interface SimilarRequestParams {
  fromLocation: string;
  toLocation: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  category?: string;
  preferredMethod?: string;
  limit?: number;
}

/**
 * Get similar completed requests from historical data
 */
export async function getSimilarCompletedRequests(
  params: SimilarRequestParams,
  supabase?: SupabaseClient
): Promise<HistoricalRequest[]> {
  const client = supabase || createClient();
  const {
    fromLocation,
    toLocation,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    category,
    preferredMethod,
    limit = 50,
  } = params;

  try {
    // Query completed requests with their matches
    let query = client
      .from("requests")
      .select(
        `
        id,
        from_location,
        to_location,
        dimensions_cm,
        weight_kg,
        value_usd,
        max_reward,
        category,
        preferred_method,
        created_at,
        matches!inner(
          reward_amount,
          status,
          updated_at
        )
      `
      )
      .eq("matches.status", "completed")
      .eq("from_location", fromLocation)
      .eq("to_location", toLocation)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by preferred method if specified
    if (preferredMethod && preferredMethod !== "any") {
      query = query.eq("preferred_method", preferredMethod);
    }

    // Filter by category if specified
    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "[historical-pricing] Error fetching similar requests:",
        error
      );
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform and filter results
    const results: HistoricalRequest[] = [];

    for (const request of data as any[]) {
      const match = Array.isArray((request as any).matches)
        ? (request as any).matches[0]
        : (request as any).matches;
      if (!match || match.status !== "completed") continue;

      // Parse dimensions
      let length_cm = 0;
      let width_cm = 0;
      let height_cm = 0;

      if ((request as any).dimensions_cm) {
        try {
          const dims =
            typeof (request as any).dimensions_cm === "string"
              ? JSON.parse((request as any).dimensions_cm)
              : (request as any).dimensions_cm;
          length_cm = dims.length_cm || dims.length || 0;
          width_cm = dims.width_cm || dims.width || 0;
          height_cm = dims.height_cm || dims.height || 0;
        } catch (e) {
          // Invalid dimensions, skip
        }
      }

      // Filter by similarity (weight within 5kg, dimensions within 20cm if provided)
      if (lengthCm && widthCm && heightCm) {
        const weightDiff = Math.abs(
          ((request as any).weight_kg as number) - weightKg
        );
        const lengthDiff = Math.abs(length_cm - lengthCm);
        const widthDiff = Math.abs(width_cm - widthCm);
        const heightDiff = Math.abs(height_cm - heightCm);

        if (
          weightDiff > 5 ||
          lengthDiff > 20 ||
          widthDiff > 20 ||
          heightDiff > 20
        ) {
          continue; // Not similar enough
        }
      } else {
        // Only filter by weight if dimensions not provided
        const weightDiff = Math.abs(
          ((request as any).weight_kg as number) - weightKg
        );
        if (weightDiff > 5) {
          continue;
        }
      }

      results.push({
        id: (request as any).id,
        from_location: (request as any).from_location,
        to_location: (request as any).to_location,
        length_cm,
        width_cm,
        height_cm,
        weight_kg: (request as any).weight_kg as number,
        value_usd: (request as any).value_usd as number | null,
        max_reward: (request as any).max_reward as number,
        final_reward: (match as any).reward_amount as number,
        category: (request as any).category as string | null,
        preferred_method: (request as any).preferred_method || "any",
        created_at: (request as any).created_at,
        completed_at: match.updated_at,
      });
    }

    return results;
  } catch (error) {
    console.error(
      "[historical-pricing] Error in getSimilarCompletedRequests:",
      error
    );
    return [];
  }
}

/**
 * Get all completed requests for a specific route
 */
export async function getCompletedRequestsByRoute(
  fromLocation: string,
  toLocation: string,
  limit: number = 100,
  supabase?: SupabaseClient
): Promise<HistoricalRequest[]> {
  const client = supabase || createClient();

  try {
    const { data, error } = await client
      .from("requests")
      .select(
        `
        id,
        from_location,
        to_location,
        dimensions_cm,
        weight_kg,
        value_usd,
        max_reward,
        category,
        preferred_method,
        created_at,
        matches!inner(
          reward_amount,
          status,
          updated_at
        )
      `
      )
      .eq("from_location", fromLocation)
      .eq("to_location", toLocation)
      .eq("matches.status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(
        "[historical-pricing] Error fetching route requests:",
        error
      );
      return [];
    }

    if (!data) return [];

    const results: HistoricalRequest[] = [];

    for (const request of data as any[]) {
      const match = Array.isArray((request as any).matches)
        ? (request as any).matches[0]
        : (request as any).matches;
      if (!match || (match as any).status !== "completed") continue;

      let length_cm = 0;
      let width_cm = 0;
      let height_cm = 0;

      if ((request as any).dimensions_cm) {
        try {
          const dims =
            typeof (request as any).dimensions_cm === "string"
              ? JSON.parse((request as any).dimensions_cm)
              : (request as any).dimensions_cm;
          length_cm = dims.length_cm || dims.length || 0;
          width_cm = dims.width_cm || dims.width || 0;
          height_cm = dims.height_cm || dims.height || 0;
        } catch (e) {
          // Invalid dimensions
        }
      }

      results.push({
        id: (request as any).id,
        from_location: (request as any).from_location,
        to_location: (request as any).to_location,
        length_cm,
        width_cm,
        height_cm,
        weight_kg: (request as any).weight_kg as number,
        value_usd: (request as any).value_usd as number | null,
        max_reward: (request as any).max_reward as number,
        final_reward: (match as any).reward_amount as number,
        category: (request as any).category as string | null,
        preferred_method: (request as any).preferred_method || "any",
        created_at: (request as any).created_at,
        completed_at: (match as any).updated_at,
      });
    }

    return results;
  } catch (error) {
    console.error(
      "[historical-pricing] Error in getCompletedRequestsByRoute:",
      error
    );
    return [];
  }
}

/**
 * Get aggregated statistics for a route
 */
export interface RouteStatistics {
  route: string;
  totalCompleted: number;
  medianReward: number;
  meanReward: number;
  minReward: number;
  maxReward: number;
  percentile25: number;
  percentile75: number;
  acceptanceRate: number; // % of requests that got completed
  avgWeight: number;
  avgValue: number;
}

export async function getRouteStatistics(
  fromLocation: string,
  toLocation: string,
  supabase?: SupabaseClient
): Promise<RouteStatistics | null> {
  const client = supabase || createClient();

  try {
    // Get all completed requests for this route
    const completed = await getCompletedRequestsByRoute(
      fromLocation,
      toLocation,
      1000,
      client
    );

    if (completed.length === 0) {
      return null;
    }

    // Get all requests (completed + not completed) for acceptance rate
    const { data: allRequests, error } = await client
      .from("requests")
      .select("id, max_reward, matches(status)")
      .eq("from_location", fromLocation)
      .eq("to_location", toLocation)
      .limit(1000);

    if (error) {
      console.error("[historical-pricing] Error fetching all requests:", error);
    }

    const totalRequests = allRequests?.length || completed.length;
    const acceptanceRate =
      totalRequests > 0 ? (completed.length / totalRequests) * 100 : 0;

    // Calculate statistics
    const rewards = completed.map((r) => r.final_reward).sort((a, b) => a - b);
    const weights = completed.map((r) => r.weight_kg);
    const values = completed
      .filter((r) => r.value_usd !== null)
      .map((r) => r.value_usd!);

    const medianReward = calculateMedian(rewards);
    const meanReward = rewards.reduce((a, b) => a + b, 0) / rewards.length;
    const minReward = rewards[0] || 0;
    const maxReward = rewards[rewards.length - 1] || 0;
    const percentile25 = calculatePercentile(rewards, 25);
    const percentile75 = calculatePercentile(rewards, 75);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const avgValue =
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    return {
      route: `${fromLocation} → ${toLocation}`,
      totalCompleted: completed.length,
      medianReward,
      meanReward,
      minReward,
      maxReward,
      percentile25,
      percentile75,
      acceptanceRate,
      avgWeight,
      avgValue,
    };
  } catch (error) {
    console.error("[historical-pricing] Error in getRouteStatistics:", error);
    return null;
  }
}

/**
 * Calculate median of sorted array
 */
function calculateMedian(sortedArray: number[]): number {
  if (sortedArray.length === 0) return 0;
  const mid = Math.floor(sortedArray.length / 2);
  return sortedArray.length % 2 === 0
    ? (sortedArray[mid - 1] + sortedArray[mid]) / 2
    : sortedArray[mid];
}

/**
 * Calculate percentile of sorted array
 */
function calculatePercentile(
  sortedArray: number[],
  percentile: number
): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}
