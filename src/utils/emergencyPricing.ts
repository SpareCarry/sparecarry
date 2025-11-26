/**
 * Emergency Add-On Pricing Utility
 * 
 * Calculates tiered percentage bonus for emergency requests:
 * - Base reward ≤ $20 → +25%
 * - Base reward $20–$50 → +15%
 * - Base reward > $50 → +10%
 * - Cap: Maximum $15 extra
 */

export interface EmergencyPricingResult {
  baseReward: number;
  bonusPercentage: number;
  extraAmount: number;
  finalReward: number;
}

export function calculateEmergencyPricing(baseReward: number): EmergencyPricingResult {
  let bonusPercentage: number;
  
  if (baseReward <= 20) {
    bonusPercentage = 25;
  } else if (baseReward <= 50) {
    bonusPercentage = 15;
  } else {
    bonusPercentage = 10;
  }
  
  // Calculate extra amount
  const extraAmount = Math.min((baseReward * bonusPercentage) / 100, 15);
  
  // Calculate final reward
  const finalReward = baseReward + extraAmount;
  
  return {
    baseReward,
    bonusPercentage,
    extraAmount: Math.round(extraAmount * 100) / 100, // Round to 2 decimals
    finalReward: Math.round(finalReward * 100) / 100,
  };
}

