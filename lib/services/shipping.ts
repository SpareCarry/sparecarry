/**
 * Unified Shipping Service
 * 
 * Consolidated shipping calculations including courier rates, customs, and SpareCarry pricing.
 * Replaces: src/utils/shippingEstimator.ts + src/utils/courierRates.ts + src/utils/customsRates.ts
 * 
 * Features:
 * - Caching for repeated calculations
 * - Optimized price calculations
 * - Premium user discounts
 * - Platform fee tracking
 */

import { 
  calculatePlatformFee, 
  calculateStripeFee, 
  calculateNetRevenue,
  validatePlatformFeeCoversStripe 
} from '../../src/constants/shippingFees';

// ============================================================================
// Types
// ============================================================================

export interface ShippingEstimateInput {
  originCountry: string;
  destinationCountry: string;
  length: number; // cm
  width: number; // cm
  height: number; // cm
  weight: number; // kg
  declaredValue: number; // USD
  selectedCourier: string;
  isPremium?: boolean;
}

export interface ShippingEstimateResult {
  courierPrice: number;
  courierTotal: number;
  customsCost: number;
  spareCarryPlanePrice: number;
  spareCarryBoatPrice: number;
  savingsPlane: number;
  savingsBoat: number;
  savingsPercentagePlane: number;
  savingsPercentageBoat: number;
  platformFeePlane: number;
  platformFeeBoat: number;
  stripeFeePlane?: number;
  stripeFeeBoat?: number;
  netRevenuePlane?: number;
  netRevenueBoat?: number;
  premiumPlanePrice?: number;
  premiumBoatPrice?: number;
  premiumSavingsPlane?: number;
  premiumSavingsBoat?: number;
  premiumSavingsPercentagePlane?: number;
  premiumSavingsPercentageBoat?: number;
}

export interface CourierRates {
  [courier: string]: {
    base_rate: {
      domestic: number;
      international: number;
    };
    per_kg_rate: {
      domestic: number;
      international: number;
    };
  };
}

export interface CourierRateConfig {
  base_rate: number;
  per_kg_rate: number;
}

export interface CustomsRates {
  [countryCode: string]: {
    duty_rate: number;
    processing_fee: number;
  };
}

export interface CustomsCost {
  duty: number;
  processingFee: number;
  total: number;
}

// ============================================================================
// Data Loading (Lazy)
// ============================================================================

let courierRatesData: CourierRates | null = null;
let customsRatesData: CustomsRates | null = null;

function loadCourierRates(): CourierRates {
  if (!courierRatesData) {
    try {
      courierRatesData = require('../../assets/data/courierRates.json');
    } catch (error) {
      console.error('Failed to load courier rates:', error);
      courierRatesData = {};
    }
  }
  return courierRatesData || {};
}

function loadCustomsRates(): CustomsRates {
  if (!customsRatesData) {
    try {
      customsRatesData = require('../../assets/data/countryCustoms.json');
    } catch (error) {
      console.error('Failed to load customs rates:', error);
      customsRatesData = {};
    }
  }
  return customsRatesData || {};
}

// ============================================================================
// Courier Rate Functions
// ============================================================================

export function getCourierRates(courier: string, isInternational: boolean): CourierRateConfig | null {
  const rates = loadCourierRates()[courier];
  if (!rates) return null;

  return {
    base_rate: isInternational ? rates.base_rate.international : rates.base_rate.domestic,
    per_kg_rate: isInternational ? rates.per_kg_rate.international : rates.per_kg_rate.domestic,
  };
}

export function getAvailableCouriers(): string[] {
  return Object.keys(loadCourierRates());
}

export function calculateDimensionalWeight(
  length: number,
  width: number,
  height: number
): number {
  return (length * width * height) / 5000;
}

export function calculateChargeableWeight(
  actualWeight: number,
  dimensionalWeight: number
): number {
  return Math.max(actualWeight, dimensionalWeight);
}

export function calculateCourierPrice(
  courier: string,
  isInternational: boolean,
  length: number,
  width: number,
  height: number,
  actualWeight: number
): number | null {
  const rates = getCourierRates(courier, isInternational);
  if (!rates) return null;

  const dimensionalWeight = calculateDimensionalWeight(length, width, height);
  const chargeableWeight = calculateChargeableWeight(actualWeight, dimensionalWeight);

  const price = rates.base_rate + (rates.per_kg_rate * chargeableWeight);
  
  return Math.round(price * 100) / 100;
}

// ============================================================================
// Customs Functions
// ============================================================================

export function getCustomsRates(countryCode: string): { duty_rate: number; processing_fee: number } | null {
  const rates = loadCustomsRates()[countryCode.toUpperCase()];
  if (!rates) return null;
  return rates;
}

export function calculateCustomsCost(
  countryCode: string,
  declaredValue: number
): CustomsCost | null {
  const rates = getCustomsRates(countryCode);
  if (!rates) return null;

  const duty = declaredValue * rates.duty_rate;
  const processingFee = rates.processing_fee;
  const total = duty + processingFee;

  return {
    duty: Math.round(duty * 100) / 100,
    processingFee,
    total: Math.round(total * 100) / 100,
  };
}

export function getAvailableCountries(): string[] {
  return Object.keys(loadCustomsRates());
}

// ============================================================================
// SpareCarry Pricing Functions
// ============================================================================

export function calculateSpareCarryPlaneBasePrice(weight: number): number {
  const price = 2.0 * weight + 6;
  return Math.round(price * 100) / 100;
}

export function calculateSpareCarryBoatBasePrice(weight: number): number {
  const price = 0.7 * weight + 4;
  return Math.round(price * 100) / 100;
}

export function calculateSpareCarryPlanePrice(weight: number, isPremium: boolean = false): number {
  const basePrice = calculateSpareCarryPlaneBasePrice(weight);
  const platformFee = calculatePlatformFee(basePrice, isPremium);
  const totalPrice = basePrice + platformFee;
  return Math.round(totalPrice * 100) / 100;
}

export function calculateSpareCarryBoatPrice(weight: number, isPremium: boolean = false): number {
  const basePrice = calculateSpareCarryBoatBasePrice(weight);
  const platformFee = calculatePlatformFee(basePrice, isPremium);
  const totalPrice = basePrice + platformFee;
  return Math.round(totalPrice * 100) / 100;
}

// ============================================================================
// Main Estimate Function
// ============================================================================

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

  // Validate that platform fee covers Stripe fee
  const planeFeeValid = validatePlatformFeeCoversStripe(platformFeePlane, spareCarryPlanePrice);
  const boatFeeValid = validatePlatformFeeCoversStripe(platformFeeBoat, spareCarryBoatPrice);
  
  if (!planeFeeValid || !boatFeeValid) {
    // Log warning in development only
    if (process.env.NODE_ENV === 'development') {
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
    platformFeePlane,
    platformFeeBoat,
    stripeFeePlane,
    stripeFeeBoat,
    netRevenuePlane,
    netRevenueBoat,
    premiumPlanePrice: premiumPlanePrice ? Math.round(premiumPlanePrice * 100) / 100 : undefined,
    premiumBoatPrice: premiumBoatPrice ? Math.round(premiumBoatPrice * 100) / 100 : undefined,
    premiumSavingsPlane: premiumSavingsPlane ? Math.round(premiumSavingsPlane * 100) / 100 : undefined,
    premiumSavingsBoat: premiumSavingsBoat ? Math.round(premiumSavingsBoat * 100) / 100 : undefined,
    premiumSavingsPercentagePlane,
    premiumSavingsPercentageBoat,
  };
}

