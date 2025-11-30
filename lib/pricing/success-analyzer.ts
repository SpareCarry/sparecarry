/**
 * Success Rate Analyzer
 *
 * Analyzes completed requests to determine what reward amounts get accepted
 * and finds optimal price ranges for different routes/categories/sizes
 */

import {
  getSimilarCompletedRequests,
  type HistoricalRequest,
} from "./historical-pricing";
import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PriceRange {
  min: number;
  max: number;
  median: number;
  mean: number;
  acceptanceRate: number; // % of requests in this range that got completed
  dataPoints: number;
}

export interface SuccessAnalysis {
  route: string;
  optimalPriceRange: PriceRange | null;
  priceBuckets: Array<{
    range: string; // e.g., "$40-$50"
    min: number;
    max: number;
    acceptanceRate: number;
    dataPoints: number;
    medianReward: number;
  }>;
  sweetSpot: number | null; // Price with highest acceptance rate
  confidence: "high" | "medium" | "low";
  totalDataPoints: number;
}

/**
 * Analyze success rates by price range for a specific route
 */
export async function analyzeSuccessRates(
  fromLocation: string,
  toLocation: string,
  weightKg: number,
  lengthCm?: number,
  widthCm?: number,
  heightCm?: number,
  category?: string,
  preferredMethod?: string,
  supabase?: SupabaseClient
): Promise<SuccessAnalysis> {
  const client = supabase || createClient();

  try {
    // Get similar completed requests
    const similarRequests = await getSimilarCompletedRequests(
      {
        fromLocation,
        toLocation,
        weightKg,
        lengthCm,
        widthCm,
        heightCm,
        category,
        preferredMethod,
        limit: 100,
      },
      client
    );

    if (similarRequests.length < 3) {
      return {
        route: `${fromLocation} → ${toLocation}`,
        optimalPriceRange: null,
        priceBuckets: [],
        sweetSpot: null,
        confidence: "low",
        totalDataPoints: similarRequests.length,
      };
    }

    // Get all requests (completed + not completed) for this route to calculate acceptance rates
    const { data: allRequests, error } = await client
      .from("requests")
      .select(
        `
        id,
        max_reward,
        matches(status)
      `
      )
      .eq("from_location", fromLocation)
      .eq("to_location", toLocation)
      .limit(500);

    if (error) {
      console.error("[success-analyzer] Error fetching all requests:", error);
    }

    // Group all requests by max_reward buckets
    const allRewards = ((allRequests || []) as any[]).map((r: any) => ({
      maxReward: r.max_reward as number,
      wasCompleted: Array.isArray(r.matches)
        ? r.matches.some((m: any) => m.status === "completed")
        : (r.matches as any)?.status === "completed",
    }));

    // Create price buckets ($10 increments)
    const buckets: Record<
      string,
      { rewards: number[]; completed: number; total: number }
    > = {};

    for (const reward of allRewards) {
      const bucketKey = Math.floor(reward.maxReward / 10) * 10;
      const bucketLabel = `$${bucketKey}-$${bucketKey + 10}`;

      if (!buckets[bucketLabel]) {
        buckets[bucketLabel] = { rewards: [], completed: 0, total: 0 };
      }

      buckets[bucketLabel].rewards.push(reward.maxReward);
      buckets[bucketLabel].total++;
      if (reward.wasCompleted) {
        buckets[bucketLabel].completed++;
      }
    }

    // Convert to price buckets array
    const priceBuckets = Object.entries(buckets)
      .map(([range, data]) => {
        const [minStr] = range.replace("$", "").split("-");
        const min = parseInt(minStr);
        const max = min + 10;
        const acceptanceRate =
          data.total > 0 ? (data.completed / data.total) * 100 : 0;
        const medianReward = calculateMedian(
          data.rewards.sort((a, b) => a - b)
        );

        return {
          range,
          min,
          max,
          acceptanceRate,
          dataPoints: data.total,
          medianReward,
        };
      })
      .filter((b) => b.dataPoints >= 2) // Only include buckets with at least 2 data points
      .sort((a, b) => a.min - b.min);

    // Find sweet spot (price range with highest acceptance rate)
    const bestBucket = priceBuckets.reduce((best, current) => {
      if (current.acceptanceRate > best.acceptanceRate) {
        return current;
      }
      return best;
    }, priceBuckets[0] || null);

    const sweetSpot = bestBucket ? (bestBucket.min + bestBucket.max) / 2 : null;

    // Calculate optimal price range (25th-75th percentile of completed requests)
    const completedRewards = similarRequests
      .map((r) => r.final_reward)
      .sort((a, b) => a - b);
    let optimalPriceRange: PriceRange | null = null;

    if (completedRewards.length >= 3) {
      const percentile25 = calculatePercentile(completedRewards, 25);
      const percentile75 = calculatePercentile(completedRewards, 75);
      const median = calculateMedian(completedRewards);
      const mean =
        completedRewards.reduce((a, b) => a + b, 0) / completedRewards.length;

      // Calculate acceptance rate for this range
      const rangeCompleted = allRewards.filter(
        (r) =>
          r.maxReward >= percentile25 &&
          r.maxReward <= percentile75 &&
          r.wasCompleted
      ).length;
      const rangeTotal = allRewards.filter(
        (r) => r.maxReward >= percentile25 && r.maxReward <= percentile75
      ).length;
      const acceptanceRate =
        rangeTotal > 0 ? (rangeCompleted / rangeTotal) * 100 : 0;

      optimalPriceRange = {
        min: percentile25,
        max: percentile75,
        median,
        mean,
        acceptanceRate,
        dataPoints: rangeTotal,
      };
    }

    // Determine confidence
    let confidence: "high" | "medium" | "low" = "low";
    if (similarRequests.length >= 20 && priceBuckets.length >= 5) {
      confidence = "high";
    } else if (similarRequests.length >= 10 && priceBuckets.length >= 3) {
      confidence = "medium";
    }

    return {
      route: `${fromLocation} → ${toLocation}`,
      optimalPriceRange,
      priceBuckets,
      sweetSpot,
      confidence,
      totalDataPoints: similarRequests.length,
    };
  } catch (error) {
    console.error("[success-analyzer] Error analyzing success rates:", error);
    return {
      route: `${fromLocation} → ${toLocation}`,
      optimalPriceRange: null,
      priceBuckets: [],
      sweetSpot: null,
      confidence: "low",
      totalDataPoints: 0,
    };
  }
}

/**
 * Get optimal price range for a request
 * Returns a suggested price range with confidence
 */
export interface OptimalPriceSuggestion {
  suggestedMin: number;
  suggestedMax: number;
  suggestedMedian: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  dataPoints: number;
  acceptanceRate: number;
}

export async function getOptimalPriceSuggestion(
  fromLocation: string,
  toLocation: string,
  weightKg: number,
  lengthCm?: number,
  widthCm?: number,
  heightCm?: number,
  category?: string,
  preferredMethod?: string,
  baseSpareCarryPrice?: number, // Calculated base price
  courierPrice?: number, // For competitiveness check
  supabase?: SupabaseClient
): Promise<OptimalPriceSuggestion | null> {
  const client = supabase || createClient();

  try {
    const analysis = await analyzeSuccessRates(
      fromLocation,
      toLocation,
      weightKg,
      lengthCm,
      widthCm,
      heightCm,
      category,
      preferredMethod,
      client
    );

    if (!analysis.optimalPriceRange || analysis.confidence === "low") {
      // Not enough data, use base price with simple adjustments
      if (baseSpareCarryPrice) {
        // Suggest 90-110% of base price
        return {
          suggestedMin: baseSpareCarryPrice * 0.9,
          suggestedMax: baseSpareCarryPrice * 1.1,
          suggestedMedian: baseSpareCarryPrice,
          confidence: "low",
          reasoning: "Based on calculated price (limited historical data)",
          dataPoints: analysis.totalDataPoints,
          acceptanceRate: 0,
        };
      }
      return null;
    }

    const { optimalPriceRange, sweetSpot, confidence } = analysis;

    // Use optimal range, but ensure it's competitive vs courier
    let suggestedMin = optimalPriceRange.min;
    let suggestedMax = optimalPriceRange.max;
    let suggestedMedian = optimalPriceRange.median;

    // Competitiveness check: ensure price is 40-60% of courier (sweet spot)
    if (courierPrice && courierPrice > 0) {
      const minCompetitive = courierPrice * 0.4;
      const maxCompetitive = courierPrice * 0.6;

      // Adjust if our suggestion is outside competitive range
      if (suggestedMax < minCompetitive) {
        // Too low, adjust upward
        suggestedMin = Math.max(suggestedMin, minCompetitive);
        suggestedMax = Math.max(suggestedMax, minCompetitive * 1.2);
        suggestedMedian = (suggestedMin + suggestedMax) / 2;
      } else if (suggestedMin > maxCompetitive) {
        // Too high, adjust downward
        suggestedMax = Math.min(suggestedMax, maxCompetitive);
        suggestedMin = Math.min(suggestedMin, maxCompetitive * 0.8);
        suggestedMedian = (suggestedMin + suggestedMax) / 2;
      }
    }

    // Use sweet spot if available and within range
    if (sweetSpot && sweetSpot >= suggestedMin && sweetSpot <= suggestedMax) {
      suggestedMedian = sweetSpot;
    }

    // Build reasoning
    let reasoning = `Based on ${analysis.totalDataPoints} similar completed requests`;
    if (analysis.totalDataPoints >= 10) {
      reasoning += `, ${Math.round(optimalPriceRange.acceptanceRate)}% acceptance rate in this range`;
    }
    if (courierPrice) {
      const ratio = (suggestedMedian / courierPrice) * 100;
      reasoning += `, ${Math.round(ratio)}% of courier price (typical: 40-60%)`;
    }

    return {
      suggestedMin: Math.round(suggestedMin * 100) / 100,
      suggestedMax: Math.round(suggestedMax * 100) / 100,
      suggestedMedian: Math.round(suggestedMedian * 100) / 100,
      confidence,
      reasoning,
      dataPoints: analysis.totalDataPoints,
      acceptanceRate: optimalPriceRange.acceptanceRate,
    };
  } catch (error) {
    console.error(
      "[success-analyzer] Error getting optimal price suggestion:",
      error
    );
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
