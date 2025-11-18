// Dynamic platform fee calculation
// Base: 12-18% based on method + user history
// Promotions:
// - First delivery: 0% (both sides)
// - Promo period (until Feb 18, 2026): 0% for everyone

interface PlatformFeeParams {
  method: "plane" | "boat";
  userId: string;
  userCompletedDeliveries: number;
  userRating?: number;
  isSubscriber: boolean;
  isFirstDelivery?: boolean; // Check if this is user's first completed delivery
  isSupporter?: boolean; // Check if user is a Supporter
}

const PROMO_END_DATE = new Date("2026-02-18T23:59:59Z");

export function calculatePlatformFee({
  method,
  userId,
  userCompletedDeliveries,
  userRating = 5.0,
  isSubscriber,
  isFirstDelivery = false,
  isSupporter = false,
}: PlatformFeeParams): number {
  // First delivery is always free (both sides)
  if (isFirstDelivery) {
    return 0;
  }

  // Promo period: zero fees until Feb 18, 2026
  const now = new Date();
  if (now < PROMO_END_DATE) {
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

  // Base fee by method
  const baseFee = method === "plane" ? 0.18 : 0.15; // 18% plane, 15% boat

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

  // Calculate final fee (minimum 12%)
  const finalFee = Math.max(
    0.12, // Minimum 12%
    baseFee - volumeDiscount - ratingDiscount
  );

  return finalFee;
}

export function formatPlatformFee(fee: number): string {
  return `${(fee * 100).toFixed(1)}%`;
}

export function isPromoPeriodActive(): boolean {
  return new Date() < PROMO_END_DATE;
}

export function getPromoEndDate(): Date {
  return PROMO_END_DATE;
}
