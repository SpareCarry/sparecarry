/**
 * Market Rate Calculator
 *
 * Analyzes historical delivery data to calculate market adjustments
 * for routes, categories, sizes, and seasonal patterns
 */

import {
  getCompletedRequestsByRoute,
  getRouteStatistics,
  type HistoricalRequest,
} from "./historical-pricing";
import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface MarketRateAdjustments {
  routeMultiplier: number; // Route-specific adjustment (e.g., 1.15 = 15% premium)
  categoryMultiplier: number; // Category-based adjustment
  sizeMultiplier: number; // Size tier adjustment
  seasonalMultiplier: number; // Seasonal/demand adjustment
  confidence: "high" | "medium" | "low"; // Confidence in adjustments
  dataPoints: number; // Number of historical data points used
}

export interface RouteMarketData {
  route: string;
  avgCourierPrice?: number; // Average courier price if available
  avgSpareCarryPrice: number; // Average SpareCarry price
  priceRatio: number; // SpareCarry / Courier ratio
  multiplier: number; // Suggested multiplier adjustment
  dataPoints: number;
}

/**
 * Calculate market rate adjustments based on historical data
 */
export async function calculateMarketRateAdjustments(
  fromLocation: string,
  toLocation: string,
  category?: string,
  weightKg?: number,
  supabase?: SupabaseClient
): Promise<MarketRateAdjustments> {
  const client = supabase || createClient();

  // Default adjustments (no change)
  const defaultAdjustments: MarketRateAdjustments = {
    routeMultiplier: 1.0,
    categoryMultiplier: 1.0,
    sizeMultiplier: 1.0,
    seasonalMultiplier: 1.0,
    confidence: "low",
    dataPoints: 0,
  };

  try {
    // Get route statistics
    const routeStats = await getRouteStatistics(
      fromLocation,
      toLocation,
      client
    );

    if (!routeStats || routeStats.totalCompleted < 3) {
      // Not enough data for this route
      return defaultAdjustments;
    }

    // Get completed requests for this route
    const completedRequests = await getCompletedRequestsByRoute(
      fromLocation,
      toLocation,
      100,
      client
    );

    if (completedRequests.length < 3) {
      return defaultAdjustments;
    }

    // Calculate route multiplier
    // Compare median reward to calculated base price (if we had it)
    // For now, use a simple heuristic: if median is significantly different from mean, adjust
    const routeMultiplier = calculateRouteMultiplier(
      routeStats,
      completedRequests
    );

    // Calculate category multiplier
    const categoryMultiplier = category
      ? calculateCategoryMultiplier(completedRequests, category)
      : 1.0;

    // Calculate size multiplier
    const sizeMultiplier = weightKg
      ? calculateSizeMultiplier(completedRequests, weightKg)
      : 1.0;

    // Calculate seasonal multiplier (based on month patterns)
    const seasonalMultiplier = calculateSeasonalMultiplier(completedRequests);

    // Determine confidence
    let confidence: "high" | "medium" | "low" = "low";
    if (routeStats.totalCompleted >= 20) {
      confidence = "high";
    } else if (routeStats.totalCompleted >= 10) {
      confidence = "medium";
    }

    return {
      routeMultiplier,
      categoryMultiplier,
      sizeMultiplier,
      seasonalMultiplier,
      confidence,
      dataPoints: routeStats.totalCompleted,
    };
  } catch (error) {
    console.error("[market-rates] Error calculating adjustments:", error);
    return defaultAdjustments;
  }
}

/**
 * Calculate route-specific multiplier
 * Compares actual rewards to expected base prices
 */
function calculateRouteMultiplier(
  routeStats: Awaited<ReturnType<typeof getRouteStatistics>>,
  completedRequests: HistoricalRequest[]
): number {
  if (!routeStats) return 1.0;

  // Use median reward as baseline
  // If median is significantly higher than mean, route might be premium
  // If median is lower, route might be competitive

  // Simple heuristic: compare median to 25th/75th percentiles
  const spread = routeStats.percentile75 - routeStats.percentile25;
  const medianRatio = routeStats.medianReward / routeStats.meanReward;

  // If median is close to mean (ratio ~1.0), prices are consistent
  // If median < mean, there are some high outliers (premium route)
  // If median > mean, there are some low outliers (competitive route)

  // For now, use a simple adjustment based on median vs mean
  // If median is 20%+ higher than mean, it's a premium route (1.1x)
  // If median is 20%+ lower than mean, it's a competitive route (0.9x)
  if (medianRatio > 1.2) {
    return 1.1; // Premium route
  } else if (medianRatio < 0.8) {
    return 0.9; // Competitive route
  }

  return 1.0; // Standard route
}

/**
 * Calculate category-based multiplier
 */
function calculateCategoryMultiplier(
  completedRequests: HistoricalRequest[],
  category: string
): number {
  const categoryRequests = completedRequests.filter(
    (r) => r.category === category
  );

  if (categoryRequests.length < 3) {
    return 1.0; // Not enough data
  }

  const allRewards = completedRequests.map((r) => r.final_reward);
  const categoryRewards = categoryRequests.map((r) => r.final_reward);

  const allMedian = calculateMedian(allRewards.sort((a, b) => a - b));
  const categoryMedian = calculateMedian(categoryRewards.sort((a, b) => a - b));

  if (allMedian === 0) return 1.0;

  // Calculate ratio: if category median is 15% higher, multiplier is 1.15
  const ratio = categoryMedian / allMedian;

  // Cap adjustments between 0.8x and 1.2x to avoid extreme values
  return Math.max(0.8, Math.min(1.2, ratio));
}

/**
 * Calculate size-based multiplier
 */
function calculateSizeMultiplier(
  completedRequests: HistoricalRequest[],
  weightKg: number
): number {
  // Group by size tiers
  const small = completedRequests.filter((r) => r.weight_kg < 5);
  const medium = completedRequests.filter(
    (r) => r.weight_kg >= 5 && r.weight_kg < 20
  );
  const large = completedRequests.filter(
    (r) => r.weight_kg >= 20 && r.weight_kg < 50
  );
  const extraLarge = completedRequests.filter((r) => r.weight_kg >= 50);

  // Determine which tier the current weight falls into
  let relevantRequests: HistoricalRequest[];
  if (weightKg < 5) {
    relevantRequests = small;
  } else if (weightKg < 20) {
    relevantRequests = medium;
  } else if (weightKg < 50) {
    relevantRequests = large;
  } else {
    relevantRequests = extraLarge;
  }

  if (relevantRequests.length < 3) {
    return 1.0; // Not enough data
  }

  const allRewards = completedRequests.map((r) => r.final_reward);
  const tierRewards = relevantRequests.map((r) => r.final_reward);

  const allMedian = calculateMedian(allRewards.sort((a, b) => a - b));
  const tierMedian = calculateMedian(tierRewards.sort((a, b) => a - b));

  if (allMedian === 0) return 1.0;

  const ratio = tierMedian / allMedian;
  return Math.max(0.8, Math.min(1.2, ratio));
}

/**
 * Calculate seasonal multiplier based on month patterns
 */
function calculateSeasonalMultiplier(
  completedRequests: HistoricalRequest[]
): number {
  if (completedRequests.length < 12) {
    return 1.0; // Need at least 12 data points for seasonal analysis
  }

  // Group by month
  const monthlyRewards: Record<number, number[]> = {};

  for (const request of completedRequests) {
    const month = new Date(
      request.completed_at || request.created_at
    ).getMonth();
    if (!monthlyRewards[month]) {
      monthlyRewards[month] = [];
    }
    monthlyRewards[month].push(request.final_reward);
  }

  // Calculate median for each month
  const monthlyMedians: Record<number, number> = {};
  for (const [month, rewards] of Object.entries(monthlyRewards)) {
    if (rewards.length >= 2) {
      monthlyMedians[parseInt(month)] = calculateMedian(
        rewards.sort((a, b) => a - b)
      );
    }
  }

  if (Object.keys(monthlyMedians).length < 3) {
    return 1.0; // Not enough monthly data
  }

  // Get current month
  const currentMonth = new Date().getMonth();
  const currentMonthMedian = monthlyMedians[currentMonth];

  if (!currentMonthMedian) {
    return 1.0; // No data for current month
  }

  // Calculate overall median
  const allMedians = Object.values(monthlyMedians);
  const overallMedian = calculateMedian(allMedians.sort((a, b) => a - b));

  if (overallMedian === 0) return 1.0;

  // If current month is 20%+ higher, apply premium
  const ratio = currentMonthMedian / overallMedian;
  return Math.max(0.9, Math.min(1.1, ratio)); // Cap between 0.9x and 1.1x
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
 * Get market data for a specific route
 */
export async function getRouteMarketData(
  fromLocation: string,
  toLocation: string,
  supabase?: SupabaseClient
): Promise<RouteMarketData | null> {
  const client = supabase || createClient();

  try {
    const routeStats = await getRouteStatistics(
      fromLocation,
      toLocation,
      client
    );

    if (!routeStats || routeStats.totalCompleted < 3) {
      return null;
    }

    // Calculate average SpareCarry price (use median for robustness)
    const avgSpareCarryPrice = routeStats.medianReward;

    // For now, we don't have courier prices in historical data
    // This would need to be added if users provide feedback
    const avgCourierPrice = undefined;
    const priceRatio = undefined;

    // Calculate multiplier based on how prices compare to expected base
    // This is a placeholder - in reality, we'd compare to calculated base prices
    const multiplier = 1.0;

    return {
      route: `${fromLocation} → ${toLocation}`,
      avgCourierPrice,
      avgSpareCarryPrice,
      priceRatio: priceRatio || 0,
      multiplier,
      dataPoints: routeStats.totalCompleted,
    };
  } catch (error) {
    console.error("[market-rates] Error getting route market data:", error);
    return null;
  }
}
