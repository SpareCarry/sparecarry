/**
 * Customs Rates Utility
 *
 * Loads and provides customs duty data from JSON file
 */

const customsRatesData = require("../../assets/data/countryCustoms.json");

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

/**
 * Get customs rates for a country
 */
export function getCustomsRates(
  countryCode: string
): { duty_rate: number; processing_fee: number } | null {
  const rates = (customsRatesData as CustomsRates)[countryCode.toUpperCase()];
  if (!rates) return null;

  return rates;
}

/**
 * Calculate customs cost
 * Formula: declared_value * duty_rate + processing_fee
 */
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

/**
 * Get all available country codes
 */
export function getAvailableCountries(): string[] {
  return Object.keys(customsRatesData);
}
