/**
 * Karma Points System
 * 
 * Awards karma points to users for helping travelers.
 * Points are proportional to weight and platform fee.
 */

export interface KarmaCalculationInput {
  weight: number; // kg
  platformFee: number; // USD
  basePoints?: number; // Optional base points multiplier
}

export const KARMA_BASE_MULTIPLIER = 10; // Base points per kg
export const KARMA_FEE_MULTIPLIER = 2; // Points per dollar of platform fee

/**
 * Calculate karma points for a completed delivery
 * Formula: (weight * KARMA_BASE_MULTIPLIER) + (platformFee * KARMA_FEE_MULTIPLIER)
 * 
 * @param input - Karma calculation parameters
 * @returns Karma points awarded
 */
export function calculateKarma(input: KarmaCalculationInput): number {
  const { weight, platformFee, basePoints = KARMA_BASE_MULTIPLIER } = input;
  
  if (weight <= 0) return 0;
  
  const weightPoints = weight * basePoints;
  const feePoints = platformFee * KARMA_FEE_MULTIPLIER;
  const totalPoints = weightPoints + feePoints;
  
  // Round to nearest integer
  return Math.round(totalPoints);
}

/**
 * Format karma points for display
 */
export function formatKarmaPoints(points: number): string {
  if (points === 0) return '0';
  if (points < 1000) return points.toString();
  return `${(points / 1000).toFixed(1)}k`;
}

