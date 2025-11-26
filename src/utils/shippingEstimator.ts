/**
 * Shipping Estimator Utility
 * 
 * Main calculation functions for comparing courier vs SpareCarry prices
 * Includes hybrid platform fee baked into prices (invisible to user)
 */

import { calculateCourierPrice } from './courierRates';
import { calculateCustomsCost } from './customsRates';
import { 
  calculatePlatformFee, 
  calculateStripeFee, 
  calculateNetRevenue,
  validatePlatformFeeCoversStripe 
} from '../constants/shippingFees';

export interface ShippingEstimateInput {
  originCountry: string;
  destinationCountry: string;
  length: number; // cm
  width: number; // cm
  height: number; // cm
  weight: number; // kg
  declaredValue: number; // USD
  selectedCourier: string;
  isPremium?: boolean; // Whether user has active premium subscription
}

export interface ShippingEstimateResult {
  courierPrice: number;
  courierTotal: number; // courier + customs
  customsCost: number;
  spareCarryPlanePrice: number;
  spareCarryBoatPrice: number;
  savingsPlane: number;
  savingsBoat: number;
  savingsPercentagePlane: number;
  savingsPercentageBoat: number;
  platformFeePlane: number; // Internal fee (not shown to user)
  platformFeeBoat: number; // Internal fee (not shown to user)
  // Internal Stripe fee accounting (not shown to user)
  stripeFeePlane?: number;
  stripeFeeBoat?: number;
  netRevenuePlane?: number; // Platform fee - Stripe fee
  netRevenueBoat?: number; // Platform fee - Stripe fee
  // Premium prices (for non-premium users to see what they'd pay as premium)
  premiumPlanePrice?: number;
  premiumBoatPrice?: number;
  premiumSavingsPlane?: number;
  premiumSavingsBoat?: number;
  premiumSavingsPercentagePlane?: number;
  premiumSavingsPercentageBoat?: number;
}

/**
 * Calculate SpareCarry plane base price (before platform fee)
 * Formula: 2.0 * weight + 6
 */
export function calculateSpareCarryPlaneBasePrice(weight: number): number {
  const price = 2.0 * weight + 6;
  return Math.round(price * 100) / 100;
}

/**
 * Calculate SpareCarry boat base price (before platform fee)
 * Formula: 0.7 * weight + 4
 */
export function calculateSpareCarryBoatBasePrice(weight: number): number {
  const price = 0.7 * weight + 4;
  return Math.round(price * 100) / 100;
}

/**
 * Calculate SpareCarry plane price with hybrid platform fee baked in
 * Formula: base_price + platform_fee
 * Platform fee: $3 flat + 8% of base price (reduced for premium users)
 */
export function calculateSpareCarryPlanePrice(weight: number, isPremium: boolean = false): number {
  const basePrice = calculateSpareCarryPlaneBasePrice(weight);
  const platformFee = calculatePlatformFee(basePrice, isPremium);
  const totalPrice = basePrice + platformFee;
  return Math.round(totalPrice * 100) / 100;
}

/**
 * Calculate SpareCarry boat price with hybrid platform fee baked in
 * Formula: base_price + platform_fee
 * Platform fee: $3 flat + 8% of base price (reduced for premium users)
 */
export function calculateSpareCarryBoatPrice(weight: number, isPremium: boolean = false): number {
  const basePrice = calculateSpareCarryBoatBasePrice(weight);
  const platformFee = calculatePlatformFee(basePrice, isPremium);
  const totalPrice = basePrice + platformFee;
  return Math.round(totalPrice * 100) / 100;
}

/**
 * Calculate complete shipping estimate
 * Includes hybrid platform fee baked into SpareCarry prices
 */
export function calculateShippingEstimate(input: ShippingEstimateInput): ShippingEstimateResult | null {
  const isInternational = input.originCountry !== input.destinationCountry;
  const isPremium = input.isPremium ?? false;

  // Calculate courier price
  const courierPrice = calculateCourierPrice(
    input.selectedCourier,
    isInternational,
    input.length,
    input.width,
    input.height,
    input.weight
  );

  if (courierPrice === null) {
    return null;
  }

  // Calculate customs cost (only for international)
  let customsCost = 0;
  if (isInternational && input.declaredValue > 0) {
    const customs = calculateCustomsCost(input.destinationCountry, input.declaredValue);
    customsCost = customs ? customs.total : 0;
  }

  const courierTotal = courierPrice + customsCost;

  // Calculate SpareCarry base prices
  const planeBasePrice = calculateSpareCarryPlaneBasePrice(input.weight);
  const boatBasePrice = calculateSpareCarryBoatBasePrice(input.weight);

  // Calculate platform fees (baked into final prices)
  const platformFeePlane = calculatePlatformFee(planeBasePrice, isPremium);
  const platformFeeBoat = calculatePlatformFee(boatBasePrice, isPremium);

  // Calculate final SpareCarry prices (base + platform fee)
  const spareCarryPlanePrice = planeBasePrice + platformFeePlane;
  const spareCarryBoatPrice = boatBasePrice + platformFeeBoat;

  // Calculate Stripe fees internally (for net revenue tracking)
  const stripeFeePlane = calculateStripeFee(spareCarryPlanePrice);
  const stripeFeeBoat = calculateStripeFee(spareCarryBoatPrice);

  // Calculate net revenue (platform fee - Stripe fee)
  const netRevenuePlane = calculateNetRevenue(platformFeePlane, spareCarryPlanePrice);
  const netRevenueBoat = calculateNetRevenue(platformFeeBoat, spareCarryBoatPrice);

  // Validate that platform fee covers Stripe fee (warn if not, but don't block)
  const planeFeeValid = validatePlatformFeeCoversStripe(platformFeePlane, spareCarryPlanePrice);
  const boatFeeValid = validatePlatformFeeCoversStripe(platformFeeBoat, spareCarryBoatPrice);
  
  if (!planeFeeValid || !boatFeeValid) {
    console.warn('Platform fee may not fully cover Stripe fees:', {
      plane: { 
        platformFee: platformFeePlane, 
        stripeFee: stripeFeePlane, 
        netRevenue: netRevenuePlane,
        valid: planeFeeValid 
      },
      boat: { 
        platformFee: platformFeeBoat, 
        stripeFee: stripeFeeBoat, 
        netRevenue: netRevenueBoat,
        valid: boatFeeValid 
      },
    });
  }

  // Calculate savings
  const savingsPlane = courierTotal - spareCarryPlanePrice;
  const savingsBoat = courierTotal - spareCarryBoatPrice;
  const savingsPercentagePlane = courierTotal > 0 
    ? Math.round((savingsPlane / courierTotal) * 100) 
    : 0;
  const savingsPercentageBoat = courierTotal > 0 
    ? Math.round((savingsBoat / courierTotal) * 100) 
    : 0;

  // Calculate premium prices (for non-premium users to see what they'd pay as premium)
  let premiumPlanePrice: number | undefined;
  let premiumBoatPrice: number | undefined;
  let premiumSavingsPlane: number | undefined;
  let premiumSavingsBoat: number | undefined;
  let premiumSavingsPercentagePlane: number | undefined;
  let premiumSavingsPercentageBoat: number | undefined;

  if (!isPremium) {
    // Calculate what prices would be if user were premium
    const premiumFeePlane = calculatePlatformFee(planeBasePrice, true);
    const premiumFeeBoat = calculatePlatformFee(boatBasePrice, true);
    premiumPlanePrice = planeBasePrice + premiumFeePlane;
    premiumBoatPrice = boatBasePrice + premiumFeeBoat;
    premiumSavingsPlane = courierTotal - premiumPlanePrice;
    premiumSavingsBoat = courierTotal - premiumBoatPrice;
    premiumSavingsPercentagePlane = courierTotal > 0 
      ? Math.round((premiumSavingsPlane / courierTotal) * 100) 
      : 0;
    premiumSavingsPercentageBoat = courierTotal > 0 
      ? Math.round((premiumSavingsBoat / courierTotal) * 100) 
      : 0;
  }

  return {
    courierPrice,
    courierTotal,
    customsCost,
    spareCarryPlanePrice: Math.round(spareCarryPlanePrice * 100) / 100,
    spareCarryBoatPrice: Math.round(spareCarryBoatPrice * 100) / 100,
    savingsPlane: Math.round(savingsPlane * 100) / 100,
    savingsBoat: Math.round(savingsBoat * 100) / 100,
    savingsPercentagePlane,
    savingsPercentageBoat,
    platformFeePlane, // Internal tracking (not shown to user)
    platformFeeBoat, // Internal tracking (not shown to user)
    stripeFeePlane, // Internal Stripe fee (not shown to user)
    stripeFeeBoat, // Internal Stripe fee (not shown to user)
    netRevenuePlane, // Internal net revenue (not shown to user)
    netRevenueBoat, // Internal net revenue (not shown to user)
    premiumPlanePrice: premiumPlanePrice ? Math.round(premiumPlanePrice * 100) / 100 : undefined,
    premiumBoatPrice: premiumBoatPrice ? Math.round(premiumBoatPrice * 100) / 100 : undefined,
    premiumSavingsPlane: premiumSavingsPlane ? Math.round(premiumSavingsPlane * 100) / 100 : undefined,
    premiumSavingsBoat: premiumSavingsBoat ? Math.round(premiumSavingsBoat * 100) / 100 : undefined,
    premiumSavingsPercentagePlane,
    premiumSavingsPercentageBoat,
  };
}

