/**
 * Safety Scoring Rules
 *
 * Computes a safety score (0-100) based on listing details and photos.
 * Higher scores indicate safer items to transport.
 */

import { ListingDetails, SafetyScoreResult } from "./types";

/**
 * Compute safety score based on listing details
 */
export function computeSafetyScore(details: ListingDetails): SafetyScoreResult {
  let score = 100; // Start with perfect score
  const reasons: string[] = [];

  // Rule 1: Category-based risk
  const categoryRisk = getCategoryRisk(details.category);
  if (categoryRisk < 0) {
    score += categoryRisk;
    reasons.push(`Category "${details.category}" has known risks`);
  }

  // Rule 2: Batteries (lithium batteries reduce score)
  if (details.hasBatteries) {
    score -= 20;
    reasons.push("Contains batteries - requires special handling");
  }

  // Rule 3: Liquids
  if (details.hasLiquids) {
    score -= 15;
    reasons.push("Contains liquids - check volume limits");
  }

  // Rule 3.5: Restricted items (lithium batteries, flammable items, etc.)
  if (details.restrictedItems) {
    score -= 25;
    reasons.push(
      "Contains restricted items - requires boat transport only and special handling"
    );
  }

  // Rule 4: High declared value (insurance risk)
  if (details.declaredValue && details.declaredValue > 1000) {
    score -= 10;
    reasons.push("High declared value - increased insurance risk");
  }
  if (details.declaredValue && details.declaredValue > 5000) {
    score -= 10; // Additional penalty for very high value
    reasons.push("Very high declared value - consider special insurance");
  }

  // Rule 5: Weight/size thresholds
  if (details.weight && details.weight > 20) {
    score -= 5;
    reasons.push("Heavy item - verify traveler capacity");
  }
  if (details.dimensions) {
    const volume =
      (details.dimensions.length || 0) *
      (details.dimensions.width || 0) *
      (details.dimensions.height || 0);
    if (volume > 50000) {
      // ~50L
      score -= 5;
      reasons.push("Large item - check space availability");
    }
  }

  // Rule 6: Photo count (more photos = better verification = higher score)
  const photoCount = details.photoCount || 0;
  if (photoCount === 0) {
    score -= 30;
    reasons.push("No photos provided - verification impossible");
  } else if (photoCount < 3) {
    score -= 15;
    reasons.push("Insufficient photos - minimum 3 recommended");
  } else if (photoCount >= 3) {
    score += 5; // Bonus for meeting minimum
    if (photoCount >= 5) {
      score += 5; // Additional bonus for comprehensive photos
      reasons.push("Comprehensive photo documentation");
    }
  }

  // Rule 7: Description quality
  if (!details.description || details.description.length < 20) {
    score -= 10;
    reasons.push("Description too brief - more detail needed");
  }

  // Ensure score stays within 0-100 range
  score = Math.max(0, Math.min(100, score));

  // Add positive reasons for good scores
  if (score >= 80) {
    reasons.push("Item appears safe for transport");
  } else if (score >= 60) {
    reasons.push("Item acceptable with precautions");
  } else if (score < 30) {
    reasons.push("⚠️ Low safety score - review carefully before accepting");
  }

  return { score, reasons };
}

/**
 * Get risk score adjustment based on category
 * Returns negative number for risky categories
 */
function getCategoryRisk(category?: string): number {
  if (!category) return 0;

  const categoryLower = category.toLowerCase();

  // High risk categories
  if (
    categoryLower.includes("battery") ||
    categoryLower.includes("electronics")
  ) {
    return -5;
  }
  if (categoryLower.includes("cosmetic") || categoryLower.includes("liquid")) {
    return -5;
  }
  if (categoryLower.includes("food")) {
    return -10; // Food has customs/expiry risks
  }
  if (
    categoryLower.includes("medicine") ||
    categoryLower.includes("pharmaceutical")
  ) {
    return -15; // Medicines require special handling
  }

  // Low risk categories
  if (categoryLower.includes("book") || categoryLower.includes("clothing")) {
    return 5; // Books and clothing are generally safe
  }

  return 0; // Neutral
}
