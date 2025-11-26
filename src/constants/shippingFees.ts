/**
 * Shipping Platform Fee Constants
 * 
 * Hybrid platform fee: FLAT_FEE + (PERCENT_FEE * base_price)
 * Baked into SpareCarry plane/boat prices (invisible to user)
 * 
 * Platform fee must cover Stripe payment processing fees internally
 * 
 * Uses centralized config from config/platformFees.ts
 * Respects Early Supporter promo (0% until Feb 18, 2026)
 */

import { PLATFORM_FEE_PERCENT as CONFIG_PLATFORM_FEE } from '../../config/platformFees';
import { getDaysLeft } from '@/utils/getDaysLeft';

export const PLATFORM_FEE_FLAT = 3.0; // $3 flat fee
export const PLATFORM_FEE_PERCENT = CONFIG_PLATFORM_FEE; // From config (default 8%)

/**
 * Stripe Payment Processing Fees
 * Typical card transaction: 2.9% + $0.30
 * These are deducted from platform fee to calculate net revenue
 */
export const STRIPE_FEE_PERCENT = 0.029; // 2.9%
export const STRIPE_FEE_FLAT = 0.30; // $0.30

/**
 * Round price to nearest $0.50 increment
 */
export function roundToHalfDollar(price: number): number {
  return Math.round(price * 2) / 2;
}

/**
 * Calculate hybrid platform fee
 * @param basePrice - Base price before platform fee
 * @param isPremium - Whether user has active premium subscription
 * @returns Platform fee amount
 * 
 * Premium discount: Flat fee waived ($0) + Percentage fee halved (4% instead of 8%)
 * Early Supporter promo: 0% until Feb 18, 2026 (overrides all other logic)
 */
export function calculatePlatformFee(basePrice: number, isPremium: boolean = false): number {
  // Early Supporter promo: 0% until Feb 18, 2026
  const daysLeft = getDaysLeft();
  if (daysLeft > 0) {
    return 0; // Force 0% during promo period
  }

  let fee: number;
  
  if (isPremium) {
    // Premium: flat fee waived ($0) + percentage fee halved (4% instead of 8%)
    fee = (PLATFORM_FEE_PERCENT / 2) * basePrice; // 4% instead of 8%
  } else {
    // Free users: $3 flat + 8% of base price
    fee = PLATFORM_FEE_FLAT + (PLATFORM_FEE_PERCENT * basePrice);
  }
  
  return roundToHalfDollar(fee);
}

/**
 * Calculate Stripe payment processing fee
 * Formula: (transaction_amount * 2.9%) + $0.30
 * @param transactionAmount - Total transaction amount (base price + platform fee)
 * @returns Stripe fee amount
 */
export function calculateStripeFee(transactionAmount: number): number {
  const fee = (transactionAmount * STRIPE_FEE_PERCENT) + STRIPE_FEE_FLAT;
  return Math.round(fee * 100) / 100;
}

/**
 * Calculate net platform revenue after Stripe fees
 * @param platformFee - Platform fee collected
 * @param transactionAmount - Total transaction amount (base price + platform fee)
 * @returns Net revenue after Stripe fees
 */
export function calculateNetRevenue(platformFee: number, transactionAmount: number): number {
  const stripeFee = calculateStripeFee(transactionAmount);
  const netRevenue = platformFee - stripeFee;
  return Math.round(netRevenue * 100) / 100;
}

/**
 * Validate that platform fee covers Stripe fee
 * @param platformFee - Platform fee collected
 * @param transactionAmount - Total transaction amount
 * @returns true if platform fee covers Stripe fee, false otherwise
 */
export function validatePlatformFeeCoversStripe(platformFee: number, transactionAmount: number): boolean {
  const stripeFee = calculateStripeFee(transactionAmount);
  return platformFee >= stripeFee;
}

