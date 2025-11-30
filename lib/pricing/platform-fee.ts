/**
 * Dynamic platform fee calculation
 *
 * Uses centralized config from config/platformFees.ts
 * First delivery = $0 platform fee (attractive new-user offer, sustainable for one-time users)
 */

import {
  PLANE_PLATFORM_FEE_PERCENT,
  BOAT_PLATFORM_FEE_PERCENT,
  MIN_PLATFORM_FEE_PERCENT,
} from "../../config/platformFees";

interface PlatformFeeParams {
  method: "plane" | "boat";
  userId: string;
  userCompletedDeliveries: number;
  userRating?: number;
  isSubscriber: boolean;
  isSupporter?: boolean; // Check if user is a Supporter
}

export function calculatePlatformFee({
  method,
  userId,
  userCompletedDeliveries,
  userRating = 5.0,
  isSubscriber,
  isSupporter = false,
}: PlatformFeeParams): number {
  // First delivery = $0 platform fee (attractive new-user offer, sustainable for one-time users)
  const isFreeDelivery = userCompletedDeliveries < 1;
  if (isFreeDelivery) {
    return 0;
  }

  // Supporters get 0% fee forever
  if (isSupporter) {
    return 0;
  }

  // Subscribers get 0% fee
  if (isSubscriber) {
    return 0;
  }

  // Base fee by method (from config)
  const baseFee =
    method === "plane" ? PLANE_PLATFORM_FEE_PERCENT : BOAT_PLATFORM_FEE_PERCENT;

  // Volume discount: reduce fee based on completed deliveries
  let volumeDiscount = 0;
  if (userCompletedDeliveries >= 50) {
    volumeDiscount = 0.03; // 3% discount for 50+ deliveries
  } else if (userCompletedDeliveries >= 20) {
    volumeDiscount = 0.02; // 2% discount for 20+ deliveries
  } else if (userCompletedDeliveries >= 10) {
    volumeDiscount = 0.01; // 1% discount for 10+ deliveries
  }

  // Rating bonus: reduce fee for high ratings
  let ratingDiscount = 0;
  if (userRating >= 4.8) {
    ratingDiscount = 0.01; // 1% discount for 4.8+ rating
  } else if (userRating >= 4.5) {
    ratingDiscount = 0.005; // 0.5% discount for 4.5+ rating
  }

  // Calculate final fee (minimum from config)
  const finalFee = Math.max(
    MIN_PLATFORM_FEE_PERCENT,
    baseFee - volumeDiscount - ratingDiscount
  );

  return finalFee;
}

export function formatPlatformFee(fee: number): string {
  return `${(fee * 100).toFixed(1)}%`;
}
