/**
 * Revenue Tracking Utility
 *
 * Internal utility for tracking net revenue after Stripe fees.
 * Can be used to log or store revenue data for analytics.
 */

import {
  calculateNetRevenue,
  calculateStripeFee,
} from "../constants/shippingFees";

export interface RevenueData {
  transactionAmount: number;
  platformFee: number;
  stripeFee: number;
  netRevenue: number;
  method: "plane" | "boat";
  isPremium: boolean;
  timestamp?: Date;
}

/**
 * Calculate and prepare revenue data for tracking
 * @param transactionAmount - Total transaction amount (base + platform fee)
 * @param platformFee - Platform fee collected
 * @param method - Shipping method (plane or boat)
 * @param isPremium - Whether user is premium
 * @returns Revenue data object
 */
export function prepareRevenueData(
  transactionAmount: number,
  platformFee: number,
  method: "plane" | "boat",
  isPremium: boolean
): RevenueData {
  const stripeFee = calculateStripeFee(transactionAmount);
  const netRevenue = calculateNetRevenue(platformFee, transactionAmount);

  return {
    transactionAmount,
    platformFee,
    stripeFee,
    netRevenue,
    method,
    isPremium,
    timestamp: new Date(),
  };
}

/**
 * Log revenue data (for analytics/debugging)
 * In production, this could send to analytics service or store in database
 */
export function logRevenueData(data: RevenueData): void {
  // For now, just log to console
  // In production, this could:
  // - Send to analytics service (e.g., PostHog, Mixpanel)
  // - Store in Supabase transactions table
  // - Send to revenue tracking API
  console.log("[Revenue Tracking]", {
    method: data.method,
    transactionAmount: data.transactionAmount,
    platformFee: data.platformFee,
    stripeFee: data.stripeFee,
    netRevenue: data.netRevenue,
    isPremium: data.isPremium,
    margin: data.netRevenue > 0 ? "positive" : "negative",
  });
}
