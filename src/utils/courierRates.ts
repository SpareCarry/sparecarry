/**
 * Courier Rates Utility
 *
 * Loads and provides courier pricing data from JSON file
 */

// Import JSON data - Next.js handles JSON imports automatically
// For runtime, we'll use require or dynamic import
const courierRatesData = require("../../assets/data/courierRates.json");

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

/**
 * Get courier rates for a specific courier
 */
export function getCourierRates(
  courier: string,
  isInternational: boolean
): CourierRateConfig | null {
  const rates = (courierRatesData as CourierRates)[courier];
  if (!rates) return null;

  return {
    base_rate: isInternational
      ? rates.base_rate.international
      : rates.base_rate.domestic,
    per_kg_rate: isInternational
      ? rates.per_kg_rate.international
      : rates.per_kg_rate.domestic,
  };
}

/**
 * Get all available couriers
 */
export function getAvailableCouriers(): string[] {
  return Object.keys(courierRatesData);
}

/**
 * Calculate dimensional weight
 * Formula: (length * width * height) / 5000 (cm)
 */
export function calculateDimensionalWeight(
  length: number,
  width: number,
  height: number
): number {
  return (length * width * height) / 5000;
}

/**
 * Calculate chargeable weight (max of actual and dimensional)
 */
export function calculateChargeableWeight(
  actualWeight: number,
  dimensionalWeight: number
): number {
  return Math.max(actualWeight, dimensionalWeight);
}

/**
 * Calculate courier price
 * Formula: base_rate + (per_kg_rate * chargeable_weight)
 */
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
  const chargeableWeight = calculateChargeableWeight(
    actualWeight,
    dimensionalWeight
  );

  const price = rates.base_rate + rates.per_kg_rate * chargeableWeight;

  return Math.round(price * 100) / 100; // Round to 2 decimal places
}
