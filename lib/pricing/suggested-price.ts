/**
 * Smart Suggested Price Algorithm
 *
 * Combines base SpareCarry price, market data, and success rate analysis
 * to suggest optimal asking prices for requests
 */

import {
  getOptimalPriceSuggestion,
  type OptimalPriceSuggestion,
} from "./success-analyzer";
import {
  calculateMarketRateAdjustments,
  type MarketRateAdjustments,
} from "./market-rates";
import {
  calculateSpareCarryPlaneBasePrice,
  calculateSpareCarryBoatBasePrice,
} from "../services/shipping";
import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SuggestedPriceResult {
  suggestedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: "high" | "medium" | "low";
  reasoning: string;
  breakdown: {
    basePrice: number;
    marketAdjustment?: number;
    successRateAdjustment?: number;
    competitivenessAdjustment?: number;
    finalPrice: number;
  };
  dataPoints: number;
  acceptanceRate?: number;
  comparisonToCourier?: {
    ratio: number; // SpareCarry / Courier percentage
    savings: number;
    isCompetitive: boolean; // 40-60% of courier is competitive
  };
}

export interface SuggestedPriceInput {
  fromLocation: string;
  toLocation: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  category?: string;
  preferredMethod?: "plane" | "boat" | "any";
  restrictedItems?: boolean;
  fragile?: boolean;
  declaredValue?: number;
  distanceKm?: number;
  routeComplexity?: number;
  urgencyMultiplier?: number;
  courierPrice?: number; // For competitiveness check
  courierTotal?: number; // Including customs
  useMarketData?: boolean; // Whether to use historical data
  supabase?: SupabaseClient;
}

/**
 * Calculate suggested asking price using smart algorithm
 */
export async function calculateSuggestedPrice(
  input: SuggestedPriceInput
): Promise<SuggestedPriceResult | null> {
  const {
    fromLocation,
    toLocation,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    category,
    preferredMethod = "any",
    restrictedItems = false,
    fragile = false,
    declaredValue,
    distanceKm,
    routeComplexity,
    urgencyMultiplier,
    courierPrice,
    courierTotal,
    useMarketData = true,
    supabase,
  } = input;

  const client = supabase || createClient();

  try {
    // Step 1: Calculate base SpareCarry price
    let basePrice: number;
    let canUsePlane = true;

    // Check if plane is available
    if (restrictedItems) {
      canUsePlane = false;
    }

    if (preferredMethod === "plane" && canUsePlane) {
      basePrice = calculateSpareCarryPlaneBasePrice(
        weightKg,
        distanceKm,
        lengthCm,
        widthCm,
        heightCm,
        declaredValue,
        fragile,
        urgencyMultiplier
      );
    } else if (preferredMethod === "boat") {
      basePrice = calculateSpareCarryBoatBasePrice(
        weightKg,
        distanceKm,
        lengthCm,
        widthCm,
        heightCm,
        restrictedItems,
        category,
        declaredValue,
        fragile,
        routeComplexity,
        urgencyMultiplier
      );
    } else {
      // Auto: use cheaper option (usually boat)
      const planePrice = canUsePlane
        ? calculateSpareCarryPlaneBasePrice(
            weightKg,
            distanceKm,
            lengthCm,
            widthCm,
            heightCm,
            declaredValue,
            fragile,
            urgencyMultiplier
          )
        : Infinity;
      const boatPrice = calculateSpareCarryBoatBasePrice(
        weightKg,
        distanceKm,
        lengthCm,
        widthCm,
        heightCm,
        restrictedItems,
        category,
        declaredValue,
        fragile,
        routeComplexity,
        urgencyMultiplier
      );
      basePrice = Math.min(planePrice, boatPrice);
    }

    // Step 2: Get market adjustments (if enabled)
    let marketAdjustments: MarketRateAdjustments | null = null;
    if (useMarketData) {
      try {
        marketAdjustments = await calculateMarketRateAdjustments(
          fromLocation,
          toLocation,
          category,
          weightKg,
          client
        );
      } catch (error) {
        console.warn(
          "[suggested-price] Market adjustments unavailable:",
          error
        );
      }
    }

    // Step 3: Get optimal price suggestion from success rate analysis
    let optimalSuggestion: OptimalPriceSuggestion | null = null;
    if (useMarketData) {
      try {
        optimalSuggestion = await getOptimalPriceSuggestion(
          fromLocation,
          toLocation,
          weightKg,
          lengthCm,
          widthCm,
          heightCm,
          category,
          preferredMethod,
          basePrice,
          courierTotal || courierPrice,
          client
        );
      } catch (error) {
        console.warn(
          "[suggested-price] Success rate analysis unavailable:",
          error
        );
      }
    }

    // Step 4: Combine all factors
    let suggestedPrice = basePrice;
    let marketAdjustment = 0;
    let successRateAdjustment = 0;
    let competitivenessAdjustment = 0;

    // Apply market adjustments
    if (marketAdjustments && marketAdjustments.confidence !== "low") {
      // Apply route multiplier
      const routeAdjustment =
        (marketAdjustments.routeMultiplier - 1) * basePrice;
      marketAdjustment += routeAdjustment;

      // Apply category multiplier
      const categoryAdjustment =
        (marketAdjustments.categoryMultiplier - 1) * basePrice;
      marketAdjustment += categoryAdjustment;

      // Apply size multiplier
      const sizeAdjustment = (marketAdjustments.sizeMultiplier - 1) * basePrice;
      marketAdjustment += sizeAdjustment;

      // Apply seasonal multiplier
      const seasonalAdjustment =
        (marketAdjustments.seasonalMultiplier - 1) * basePrice;
      marketAdjustment += seasonalAdjustment;
    }

    // Apply success rate adjustment (use optimal suggestion if available)
    if (optimalSuggestion && optimalSuggestion.confidence !== "low") {
      // Adjust towards optimal median
      const optimalMedian = optimalSuggestion.suggestedMedian;
      const currentPrice = basePrice + marketAdjustment;
      const adjustment = (optimalMedian - currentPrice) * 0.5; // 50% weight towards optimal
      successRateAdjustment = adjustment;
    }

    // Apply competitiveness adjustment (ensure 40-60% of courier)
    const courierPriceToUse = courierTotal || courierPrice;
    if (courierPriceToUse && courierPriceToUse > 0) {
      const currentPrice = basePrice + marketAdjustment + successRateAdjustment;
      const ratio = (currentPrice / courierPriceToUse) * 100;

      if (ratio < 40) {
        // Too low, adjust upward to 45% (sweet spot)
        const targetPrice = courierPriceToUse * 0.45;
        competitivenessAdjustment = targetPrice - currentPrice;
      } else if (ratio > 60) {
        // Too high, adjust downward to 55% (still competitive)
        const targetPrice = courierPriceToUse * 0.55;
        competitivenessAdjustment = targetPrice - currentPrice;
      }
    }

    // Calculate final price
    const finalPrice =
      basePrice +
      marketAdjustment +
      successRateAdjustment +
      competitivenessAdjustment;

    // Ensure minimum price
    const minPrice = Math.max(10, basePrice * 0.8); // At least 80% of base or $10
    const suggestedPriceFinal = Math.max(minPrice, finalPrice);

    // Calculate price range
    let priceRange = {
      min: suggestedPriceFinal * 0.9,
      max: suggestedPriceFinal * 1.1,
    };

    // Use optimal suggestion range if available
    if (optimalSuggestion && optimalSuggestion.confidence !== "low") {
      priceRange = {
        min: optimalSuggestion.suggestedMin,
        max: optimalSuggestion.suggestedMax,
      };
    }

    // Determine confidence
    let confidence: "high" | "medium" | "low" = "low";
    if (optimalSuggestion && optimalSuggestion.confidence === "high") {
      confidence = "high";
    } else if (optimalSuggestion && optimalSuggestion.confidence === "medium") {
      confidence = "medium";
    } else if (marketAdjustments && marketAdjustments.confidence === "high") {
      confidence = "medium";
    }

    // Build reasoning
    let reasoning = "";
    if (optimalSuggestion && optimalSuggestion.dataPoints > 0) {
      reasoning = optimalSuggestion.reasoning;
    } else if (marketAdjustments && marketAdjustments.dataPoints > 0) {
      reasoning = `Based on ${marketAdjustments.dataPoints} similar completed requests`;
    } else {
      reasoning = "Based on calculated price (limited historical data)";
    }

    // Comparison to courier
    let comparisonToCourier:
      | SuggestedPriceResult["comparisonToCourier"]
      | undefined;
    if (courierPriceToUse && courierPriceToUse > 0) {
      const ratio = (suggestedPriceFinal / courierPriceToUse) * 100;
      const savings = courierPriceToUse - suggestedPriceFinal;
      comparisonToCourier = {
        ratio: Math.round(ratio * 10) / 10,
        savings: Math.round(savings * 100) / 100,
        isCompetitive: ratio >= 40 && ratio <= 60,
      };
    }

    return {
      suggestedPrice: Math.round(suggestedPriceFinal * 100) / 100,
      priceRange: {
        min: Math.round(priceRange.min * 100) / 100,
        max: Math.round(priceRange.max * 100) / 100,
      },
      confidence,
      reasoning,
      breakdown: {
        basePrice: Math.round(basePrice * 100) / 100,
        marketAdjustment:
          marketAdjustment !== 0
            ? Math.round(marketAdjustment * 100) / 100
            : undefined,
        successRateAdjustment:
          successRateAdjustment !== 0
            ? Math.round(successRateAdjustment * 100) / 100
            : undefined,
        competitivenessAdjustment:
          competitivenessAdjustment !== 0
            ? Math.round(competitivenessAdjustment * 100) / 100
            : undefined,
        finalPrice: Math.round(suggestedPriceFinal * 100) / 100,
      },
      dataPoints:
        optimalSuggestion?.dataPoints || marketAdjustments?.dataPoints || 0,
      acceptanceRate: optimalSuggestion?.acceptanceRate,
      comparisonToCourier,
    };
  } catch (error) {
    console.error(
      "[suggested-price] Error calculating suggested price:",
      error
    );
    return null;
  }
}

/**
 * Quick suggested price (synchronous, uses base price only)
 * For use in UI where async operations are not convenient
 */
export function calculateSuggestedPriceQuick(
  weightKg: number,
  distanceKm?: number,
  lengthCm?: number,
  widthCm?: number,
  heightCm?: number,
  preferredMethod: "plane" | "boat" | "any" = "any",
  restrictedItems: boolean = false,
  category?: string,
  declaredValue?: number,
  fragile: boolean = false,
  routeComplexity?: number,
  urgencyMultiplier?: number
): number {
  let basePrice: number;

  if (preferredMethod === "plane" && !restrictedItems) {
    basePrice = calculateSpareCarryPlaneBasePrice(
      weightKg,
      distanceKm,
      lengthCm,
      widthCm,
      heightCm,
      declaredValue,
      fragile,
      urgencyMultiplier
    );
  } else {
    basePrice = calculateSpareCarryBoatBasePrice(
      weightKg,
      distanceKm,
      lengthCm,
      widthCm,
      heightCm,
      restrictedItems,
      category,
      declaredValue,
      fragile,
      routeComplexity,
      urgencyMultiplier
    );
  }

  return Math.round(basePrice * 100) / 100;
}
