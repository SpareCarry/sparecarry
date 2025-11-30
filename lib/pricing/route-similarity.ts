/**
 * Route Similarity Matching
 *
 * Finds similar routes from historical data and uses actual courier prices
 * when available, with fallback to calculated estimates
 */

import {
  getCompletedRequestsByRoute,
  type HistoricalRequest,
} from "./historical-pricing";
import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SimilarRoute {
  fromLocation: string;
  toLocation: string;
  similarityScore: number; // 0-1, higher = more similar
  dataPoints: number;
  avgCourierPrice?: number;
  avgSpareCarryPrice: number;
  priceRatio?: number; // SpareCarry / Courier
}

export interface RouteSimilarityResult {
  similarRoutes: SimilarRoute[];
  bestMatch: SimilarRoute | null;
  confidence: "high" | "medium" | "low";
  suggestedCourierPrice?: number; // If we have enough similar route data
}

/**
 * Find similar routes based on location proximity and characteristics
 */
export async function findSimilarRoutes(
  fromLocation: string,
  toLocation: string,
  limit: number = 10,
  supabase?: SupabaseClient
): Promise<RouteSimilarityResult> {
  const client = supabase || createClient();

  try {
    // Get all completed requests to find similar routes
    const { data: allRequests, error } = await client
      .from("requests")
      .select(
        `
        id,
        from_location,
        to_location,
        matches!inner(
          reward_amount,
          status,
          updated_at
        )
      `
      )
      .eq("matches.status", "completed")
      .limit(1000);

    if (error) {
      console.error("[route-similarity] Error fetching requests:", error);
      return {
        similarRoutes: [],
        bestMatch: null,
        confidence: "low",
      };
    }

    if (!allRequests || allRequests.length === 0) {
      return {
        similarRoutes: [],
        bestMatch: null,
        confidence: "low",
      };
    }

    // Group by route and calculate similarity
    const routeMap = new Map<
      string,
      {
        fromLocation: string;
        toLocation: string;
        requests: HistoricalRequest[];
        courierPrices: number[];
        spareCarryPrices: number[];
      }
    >();

    for (const request of allRequests as any[]) {
      const match = Array.isArray((request as any).matches)
        ? (request as any).matches[0]
        : (request as any).matches;
      if (!match || (match as any).status !== "completed") continue;

      const routeKey = `${(request as any).from_location}|||${(request as any).to_location}`;

      if (!routeMap.has(routeKey)) {
        routeMap.set(routeKey, {
          fromLocation: (request as any).from_location,
          toLocation: (request as any).to_location,
          requests: [],
          courierPrices: [],
          spareCarryPrices: [],
        });
      }

      const routeData = routeMap.get(routeKey)!;
      routeData.spareCarryPrices.push(match.reward_amount as number);

      // Note: courier prices would need to be stored separately if available
      // For now, we'll calculate similarity without courier prices
    }

    // Calculate similarity scores
    const similarRoutes: SimilarRoute[] = [];

    for (const [routeKey, routeData] of routeMap.entries()) {
      // Skip exact match (we want similar, not identical)
      if (
        routeData.fromLocation === fromLocation &&
        routeData.toLocation === toLocation
      ) {
        continue;
      }

      const similarityScore = calculateRouteSimilarity(
        fromLocation,
        toLocation,
        routeData.fromLocation,
        routeData.toLocation
      );

      if (similarityScore > 0.3) {
        // Only include routes with >30% similarity
        const avgSpareCarryPrice = calculateMedian(
          routeData.spareCarryPrices.sort((a, b) => a - b)
        );

        similarRoutes.push({
          fromLocation: routeData.fromLocation,
          toLocation: routeData.toLocation,
          similarityScore,
          dataPoints: routeData.requests.length,
          avgSpareCarryPrice,
          avgCourierPrice:
            routeData.courierPrices.length > 0
              ? calculateMedian(routeData.courierPrices.sort((a, b) => a - b))
              : undefined,
          priceRatio:
            routeData.courierPrices.length > 0 && routeData.courierPrices[0] > 0
              ? avgSpareCarryPrice / routeData.courierPrices[0]
              : undefined,
        });
      }
    }

    // Sort by similarity score (highest first)
    similarRoutes.sort((a, b) => b.similarityScore - a.similarityScore);

    // Take top N
    const topSimilar = similarRoutes.slice(0, limit);

    // Find best match
    const bestMatch =
      topSimilar.length > 0 && topSimilar[0].similarityScore > 0.5
        ? topSimilar[0]
        : null;

    // Determine confidence
    let confidence: "high" | "medium" | "low" = "low";
    if (
      bestMatch &&
      bestMatch.similarityScore > 0.7 &&
      bestMatch.dataPoints >= 5
    ) {
      confidence = "high";
    } else if (
      bestMatch &&
      bestMatch.similarityScore > 0.5 &&
      bestMatch.dataPoints >= 3
    ) {
      confidence = "medium";
    }

    // Calculate suggested courier price if we have enough similar routes with courier data
    const routesWithCourierData = topSimilar.filter(
      (r) => r.avgCourierPrice !== undefined
    );
    let suggestedCourierPrice: number | undefined;

    if (routesWithCourierData.length >= 3) {
      const courierPrices = routesWithCourierData.map(
        (r) => r.avgCourierPrice!
      );
      suggestedCourierPrice = calculateMedian(
        courierPrices.sort((a, b) => a - b)
      );
    }

    return {
      similarRoutes: topSimilar,
      bestMatch,
      confidence,
      suggestedCourierPrice,
    };
  } catch (error) {
    console.error("[route-similarity] Error finding similar routes:", error);
    return {
      similarRoutes: [],
      bestMatch: null,
      confidence: "low",
    };
  }
}

/**
 * Calculate similarity between two routes
 * Uses location name matching and geographic proximity heuristics
 */
function calculateRouteSimilarity(
  from1: string,
  to1: string,
  from2: string,
  to2: string
): number {
  let score = 0;

  // Exact match on one endpoint
  if (from1 === from2 || to1 === to2) {
    score += 0.3;
  }

  // Both endpoints match (but different order - reverse route)
  if ((from1 === to2 && to1 === from2) || (from1 === from2 && to1 === to2)) {
    return 0.9; // Very similar (reverse route or exact match)
  }

  // Country-level matching
  const from1Country = extractCountry(from1);
  const to1Country = extractCountry(to1);
  const from2Country = extractCountry(from2);
  const to2Country = extractCountry(to2);

  if (from1Country && from2Country && from1Country === from2Country) {
    score += 0.2;
  }
  if (to1Country && to2Country && to1Country === to2Country) {
    score += 0.2;
  }

  // City-level matching (fuzzy)
  const from1City = extractCity(from1);
  const to1City = extractCity(to1);
  const from2City = extractCity(from2);
  const to2City = extractCity(to2);

  if (from1City && from2City && areSimilarCities(from1City, from2City)) {
    score += 0.15;
  }
  if (to1City && to2City && areSimilarCities(to1City, to2City)) {
    score += 0.15;
  }

  return Math.min(1.0, score);
}

/**
 * Extract country code or country name from location string
 */
function extractCountry(location: string): string | null {
  // Try to extract ISO2 country code (2 uppercase letters)
  const iso2Match = location.match(/\b([A-Z]{2})\b/);
  if (iso2Match) {
    return iso2Match[1];
  }

  // Try common country names
  const countryNames = [
    "United States",
    "USA",
    "US",
    "Australia",
    "AU",
    "United Kingdom",
    "UK",
    "GB",
    "Canada",
    "CA",
    "New Zealand",
    "NZ",
    "Indonesia",
    "ID",
    "Singapore",
    "SG",
    "Malaysia",
    "MY",
    "Thailand",
    "TH",
    "Philippines",
    "PH",
    "Fiji",
    "FJ",
    "French Polynesia",
    "PF",
  ];

  const upperLocation = location.toUpperCase();
  for (const country of countryNames) {
    if (upperLocation.includes(country.toUpperCase())) {
      return country.length <= 3 ? country : country.split(" ")[0];
    }
  }

  return null;
}

/**
 * Extract city name from location string
 */
function extractCity(location: string): string | null {
  // Remove country codes and common suffixes
  let city = location
    .replace(/\b([A-Z]{2})\b/g, "") // Remove ISO2 codes
    .replace(/,.*$/, "") // Remove everything after comma
    .trim();

  if (city.length < 2) return null;
  return city;
}

/**
 * Check if two city names are similar
 */
function areSimilarCities(city1: string, city2: string): boolean {
  const c1 = city1.toLowerCase().trim();
  const c2 = city2.toLowerCase().trim();

  // Exact match
  if (c1 === c2) return true;

  // One contains the other
  if (c1.includes(c2) || c2.includes(c1)) return true;

  // Levenshtein distance (simple version)
  const distance = levenshteinDistance(c1, c2);
  const maxLen = Math.max(c1.length, c2.length);
  const similarity = 1 - distance / maxLen;

  return similarity > 0.7; // 70% similar
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
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
 * Get suggested courier price from similar routes
 */
export async function getSuggestedCourierPriceFromSimilarRoutes(
  fromLocation: string,
  toLocation: string,
  supabase?: SupabaseClient
): Promise<number | null> {
  const similarityResult = await findSimilarRoutes(
    fromLocation,
    toLocation,
    10,
    supabase
  );

  if (
    similarityResult.suggestedCourierPrice &&
    similarityResult.confidence !== "low"
  ) {
    return similarityResult.suggestedCourierPrice;
  }

  return null;
}
