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
import { checkPlaneRestrictions } from '../utils/plane-restrictions';
import { calculateBoatShippingDistance } from '../utils/distance-calculator';

// ============================================================================
// Route Complexity Detection
// ============================================================================

/**
 * Detect major shipping routes and return complexity multiplier
 * Suez Canal, Panama Canal, and Cape routes have different complexity
 */
export function detectRouteComplexity(
  originCountry: string,
  destinationCountry: string,
  originLat?: number,
  originLon?: number,
  destinationLat?: number,
  destinationLon?: number
): number {
  // Major shipping routes that require special handling or have tolls
  const routeMultipliers: { [key: string]: number } = {
    // Suez Canal routes (Mediterranean ↔ Red Sea/Indian Ocean)
    'suez': 1.10, // 10% premium (canal tolls, but shorter route)
    // Panama Canal routes (Atlantic ↔ Pacific)
    'panama': 1.10, // 10% premium (canal tolls, but shorter route)
    // Cape of Good Hope (around South Africa)
    'cape_good_hope': 1.25, // 25% premium (much longer route)
    // Cape Horn (around South America)
    'cape_horn': 1.30, // 30% premium (very long and dangerous route)
  };

  // Detect based on countries (simplified detection)
  const originUpper = originCountry.toUpperCase();
  const destUpper = destinationCountry.toUpperCase();

  // Suez Canal detection: Mediterranean countries ↔ Red Sea/Indian Ocean countries
  const mediterraneanCountries = ['EG', 'GR', 'IT', 'ES', 'FR', 'TR', 'CY', 'MT', 'LB', 'SY', 'IL'];
  const redSeaCountries = ['SA', 'YE', 'ER', 'DJ', 'SD', 'EG'];
  const indianOceanCountries = ['IN', 'PK', 'BD', 'LK', 'MV', 'MY', 'SG', 'ID', 'TH', 'MM', 'AU', 'NZ'];
  
  const isMediterranean = mediterraneanCountries.includes(originUpper) || mediterraneanCountries.includes(destUpper);
  const isRedSea = redSeaCountries.includes(originUpper) || redSeaCountries.includes(destUpper);
  const isIndianOcean = indianOceanCountries.includes(originUpper) || indianOceanCountries.includes(destUpper);
  
  if ((isMediterranean && (isRedSea || isIndianOcean)) || (isRedSea && isIndianOcean)) {
    return routeMultipliers.suez;
  }

  // Panama Canal detection: Atlantic countries ↔ Pacific countries
  const atlanticCountries = ['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'VE', 'PE', 'CL', 'EC', 'PA', 'CR', 'NI', 'HN', 'GT', 'BZ', 'JM', 'CU', 'DO', 'HT', 'BS', 'BB', 'TT'];
  const pacificCountries = ['US', 'CA', 'MX', 'CL', 'PE', 'EC', 'CO', 'PA', 'CR', 'NI', 'HN', 'GT', 'BZ', 'AU', 'NZ', 'FJ', 'PG', 'NC', 'PH', 'JP', 'CN', 'KR', 'TW', 'HK', 'SG', 'MY', 'ID', 'TH', 'VN', 'KH', 'LA'];
  
  // Check if route crosses Atlantic-Pacific divide (simplified: both countries in different oceans)
  const originIsAtlantic = atlanticCountries.includes(originUpper) && !pacificCountries.includes(originUpper);
  const destIsPacific = pacificCountries.includes(destUpper) && !atlanticCountries.includes(destUpper);
  const originIsPacific = pacificCountries.includes(originUpper) && !atlanticCountries.includes(originUpper);
  const destIsAtlantic = atlanticCountries.includes(destUpper) && !pacificCountries.includes(destUpper);
  
  if ((originIsAtlantic && destIsPacific) || (originIsPacific && destIsAtlantic)) {
    // Check if it's a long route that would use Panama (not just US coast-to-coast)
    if (originLat && destinationLat) {
      const latDiff = Math.abs(originLat - destinationLat);
      // If significant latitude difference, likely uses Panama Canal
      if (latDiff > 10) {
        return routeMultipliers.panama;
      }
    } else {
      // Default to Panama if crossing Atlantic-Pacific
      return routeMultipliers.panama;
    }
  }

  // Cape of Good Hope detection: Europe/Mediterranean ↔ Asia/Australia (long route)
  const europeCountries = ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'PT', 'GR', 'IE', 'DK', 'SE', 'NO', 'FI', 'PL', 'CZ', 'AT', 'CH', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'EE', 'LV', 'LT'];
  const asiaPacificCountries = ['CN', 'JP', 'KR', 'IN', 'AU', 'NZ', 'SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'TW', 'HK'];
  
  const isEurope = europeCountries.includes(originUpper) || europeCountries.includes(destUpper);
  const isAsiaPacific = asiaPacificCountries.includes(originUpper) || asiaPacificCountries.includes(destUpper);
  
  // If route is Europe ↔ Asia/Australia and doesn't use Suez (already checked above)
  if (isEurope && isAsiaPacific && !isMediterranean && !isRedSea) {
    return routeMultipliers.cape_good_hope;
  }

  // Cape Horn detection: Atlantic ↔ Pacific (southern route, around South America)
  const southAmericaCountries = ['AR', 'CL', 'BR', 'PE', 'EC', 'CO', 'VE', 'UY', 'PY', 'BO'];
  const isSouthAmerica = southAmericaCountries.includes(originUpper) || southAmericaCountries.includes(destUpper);
  
  // If route is around South America (Atlantic ↔ Pacific, southern route)
  if (isSouthAmerica && ((originIsAtlantic && destIsPacific) || (originIsPacific && destIsAtlantic))) {
    if (originLat && destinationLat) {
      // If both are in southern hemisphere, likely Cape Horn
      if (originLat < -20 && destinationLat < -20) {
        return routeMultipliers.cape_horn;
      }
    }
  }

  // Default: no special route complexity
  return 1.0;
}

/**
 * Calculate urgency multiplier based on deadline date
 * Tighter deadlines = higher premium
 */
export function calculateUrgencyMultiplier(deadlineDate?: string): number {
  if (!deadlineDate) {
    return 1.0; // No urgency if no deadline
  }

  try {
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline < 0) {
      return 1.0; // Past deadline, no urgency premium
    }

    if (daysUntilDeadline <= 3) {
      return 1.30; // 30% premium for very urgent (<3 days)
    } else if (daysUntilDeadline <= 7) {
      return 1.15; // 15% premium for urgent (<7 days)
    } else if (daysUntilDeadline <= 14) {
      return 1.05; // 5% premium for somewhat urgent (<14 days)
    }

    return 1.0; // No urgency premium for >14 days
  } catch (error) {
    // Invalid date, no urgency premium
    return 1.0;
  }
}

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
  distanceKm?: number; // Optional distance in kilometers for distance-based pricing
  restrictedItems?: boolean; // Whether item contains restricted goods
  category?: string; // Item category
  fragile?: boolean; // Whether item is fragile and requires extra care
  deadlineDate?: string; // ISO date string for urgency-based pricing
  originLat?: number; // Origin latitude for route detection
  originLon?: number; // Origin longitude for route detection
  destinationLat?: number; // Destination latitude for route detection
  destinationLon?: number; // Destination longitude for route detection
}

export interface ShippingEstimateResult {
  courierPrice: number;
  courierTotal: number;
  customsCost: number;
  customsBreakdown?: {
    duty: number;
    tax: number;
    taxName?: string;
    processingFee: number;
  };
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
  canTransportByPlane?: boolean;
  planeRestrictionReason?: string;
  distanceKm?: number; // Straight-line distance
  boatDistanceKm?: number; // Adjusted shipping route distance for boats (accounts for actual shipping routes)
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
    fuel_surcharge_percent?: number;
    zone_multipliers?: {
      domestic: number;
      neighboring: number;
      regional: number;
      international_short: number;
      international_long: number;
      international_remote: number;
    };
    weight_tiers?: {
      [key: string]: { multiplier: number };
    };
    remote_area_surcharge_percent?: number;
  };
}

export interface CourierRateConfig {
  base_rate: number;
  per_kg_rate: number;
  fuel_surcharge_percent?: number;
  zone_multipliers?: {
    domestic: number;
    neighboring: number;
    regional: number;
    international_short: number;
    international_long: number;
    international_remote: number;
  };
  weight_tiers?: {
    [key: string]: { multiplier: number };
  };
  remote_area_surcharge_percent?: number;
}

export interface CustomsRates {
  [countryCode: string]: {
    duty_rate: number;
    tax_rate: number;
    tax_name?: string; // e.g., "VAT", "GST", "Sales Tax"
    de_minimis_usd?: number; // Minimum value threshold before tax applies
    processing_fee: number;
  };
}

export interface CustomsCost {
  duty: number;
  tax: number;
  taxName?: string;
  processingFee: number;
  total: number;
}

type ShippingZone =
  | 'domestic'
  | 'neighboring'
  | 'regional'
  | 'international_short'
  | 'international_long'
  | 'international_remote';

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
    fuel_surcharge_percent: rates.fuel_surcharge_percent,
    zone_multipliers: rates.zone_multipliers,
    weight_tiers: rates.weight_tiers,
    remote_area_surcharge_percent: rates.remote_area_surcharge_percent,
  };
}

/**
 * Determine shipping zone based on distance and country pairs
 * Some routes are inherently more expensive regardless of distance
 */
function getShippingZone(
  distanceKm: number | undefined, 
  isInternational: boolean,
  originCountry?: string,
  destinationCountry?: string
): ShippingZone {
  if (!isInternational || !distanceKm) {
    return 'domestic';
  }
  
  // Country-specific route adjustments (expensive routes)
  const expensiveRoutes: { [key: string]: boolean } = {
    'AU-ID': true, // Australia to Indonesia (island routes)
    'AU-NZ': false, // Australia to New Zealand (neighboring, cheaper)
    'US-CN': true, // US to China (complex customs)
    'US-RU': true, // US to Russia (sanctions/complex)
    'GB-AU': true, // UK to Australia (very long)
    'GB-NZ': true, // UK to New Zealand (very long)
  };
  
  const routeKey = originCountry && destinationCountry 
    ? `${originCountry}-${destinationCountry}` 
    : null;
  const isExpensiveRoute = routeKey && expensiveRoutes[routeKey];
  
  // Adjust zone based on distance and route complexity
  if (distanceKm < 500) {
    return isExpensiveRoute ? 'regional' : 'neighboring';
  } else if (distanceKm < 2000) {
    return isExpensiveRoute ? 'international_short' : 'regional';
  } else if (distanceKm < 5000) {
    return isExpensiveRoute ? 'international_long' : 'international_short';
  } else if (distanceKm < 10000) {
    return 'international_long';
  } else {
    return 'international_remote';
  }
}

/**
 * Get weight tier multiplier based on chargeable weight
 * Heavier packages get volume discounts per kg
 */
function getWeightTierMultiplier(weight: number, weightTiers?: { [key: string]: { multiplier: number } }): number {
  if (!weightTiers) return 1.0;
  
  // Find the appropriate tier
  const tierKeys = Object.keys(weightTiers).sort((a, b) => {
    const aMax = parseFloat(a.split('-')[1] || '999');
    const bMax = parseFloat(b.split('-')[1] || '999');
    return aMax - bMax;
  });
  
  for (const tierKey of tierKeys) {
    const [min, max] = tierKey.split('-').map(parseFloat);
    if (weight >= min && (weight < max || !max)) {
      return weightTiers[tierKey].multiplier;
    }
  }
  
  // Default to highest tier if weight exceeds all
  const lastTier = tierKeys[tierKeys.length - 1];
  return weightTiers[lastTier]?.multiplier || 1.0;
}

/**
 * Check if destination is a remote area
 * Remote areas typically have surcharges
 */
function isRemoteArea(destinationCountry?: string): boolean {
  if (!destinationCountry) return false;
  
  const remoteCountries = [
    'PF', // French Polynesia
    'NC', // New Caledonia
    'FJ', // Fiji
    'PG', // Papua New Guinea
    'SB', // Solomon Islands
    'VU', // Vanuatu
    'WS', // Samoa
    'TO', // Tonga
    'CK', // Cook Islands
    'NU', // Niue
    'AS', // American Samoa
    'GU', // Guam
    'MP', // Northern Mariana Islands
    'MH', // Marshall Islands
    'FM', // Micronesia
    'PW', // Palau
    'KI', // Kiribati
    'TV', // Tuvalu
    'NR', // Nauru
  ];
  
  return remoteCountries.includes(destinationCountry.toUpperCase());
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
  actualWeight: number,
  distanceKm?: number, // Optional distance for zone-based pricing
  originCountry?: string, // Optional origin country for route adjustments
  destinationCountry?: string // Optional destination country for route adjustments and remote area detection
): number | null {
  const rates = getCourierRates(courier, isInternational);
  if (!rates) return null;

  const dimensionalWeight = calculateDimensionalWeight(length, width, height);
  const chargeableWeight = calculateChargeableWeight(actualWeight, dimensionalWeight);

  // Base price calculation
  let price = rates.base_rate + (rates.per_kg_rate * chargeableWeight);
  
  // Apply weight tier multiplier (volume discounts for heavier packages)
  const weightTierMultiplier = getWeightTierMultiplier(chargeableWeight, rates.weight_tiers);
  price = price * weightTierMultiplier;
  
  // Apply zone-based multiplier if available
  if (rates.zone_multipliers && distanceKm !== undefined) {
    const zone = getShippingZone(distanceKm, isInternational, originCountry, destinationCountry);
    const zoneMultiplier = rates.zone_multipliers[zone] || 1.0;
    price = price * zoneMultiplier;
  }
  
  // Apply remote area surcharge if applicable
  if (isRemoteArea(destinationCountry) && rates.remote_area_surcharge_percent) {
    price = price * (1 + rates.remote_area_surcharge_percent);
  }
  
  // Apply fuel surcharge if available
  if (rates.fuel_surcharge_percent) {
    price = price * (1 + rates.fuel_surcharge_percent);
  }
  
  return Math.round(price * 100) / 100;
}

// ============================================================================
// Customs Functions
// ============================================================================

export function getCustomsRates(countryCode: string): { 
  duty_rate: number; 
  tax_rate: number;
  tax_name?: string;
  de_minimis_usd?: number;
  processing_fee: number;
} | null {
  const rates = loadCustomsRates()[countryCode.toUpperCase()];
  if (!rates) return null;
  return rates;
}

export function calculateCustomsCost(
  countryCode: string,
  declaredValue: number,
  shippingCost: number = 0 // Shipping cost for CIF calculation (Cost, Insurance, Freight)
): CustomsCost | null {
  const rates = getCustomsRates(countryCode);
  if (!rates) return null;

  // Calculate CIF value (Cost + Insurance + Freight)
  // For simplicity, we use declaredValue + shippingCost as CIF
  const cifValue = declaredValue + shippingCost;

  // Calculate duty on CIF value
  const duty = cifValue * rates.duty_rate;

  // Calculate tax on (CIF + Duty) - standard practice
  // Tax is only applied if value exceeds de minimis threshold
  let tax = 0;
  const deMinimis = rates.de_minimis_usd || 0;
  if (cifValue > deMinimis) {
    // Tax is calculated on (CIF value + Duty)
    const taxableBase = cifValue + duty;
    tax = taxableBase * rates.tax_rate;
  }

  const processingFee = rates.processing_fee;
  const total = duty + tax + processingFee;

  return {
    duty: Math.round(duty * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    taxName: rates.tax_name || 'Tax',
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

/**
 * Calculate base price for plane transport
 * Factors: weight, distance, dimensional weight, fragile items, item value, urgency
 */
export function calculateSpareCarryPlaneBasePrice(
  weight: number,
  distanceKm?: number,
  length?: number,
  width?: number,
  height?: number,
  declaredValue?: number,
  fragile?: boolean,
  urgencyMultiplier?: number
): number {
  // Base price per kg - Planes should be SIGNIFICANTLY MORE expensive than boats
  // Planes are faster, more convenient, and have stricter limits
  // Base pricing: 4-5x higher than boat base to ensure planes are always more expensive
  // Even for small packages, planes should cost more due to speed and convenience
  let basePricePerKg = 4.5;
  let baseFee = 12;

  // Distance-based pricing (if distance is provided)
  if (distanceKm && distanceKm > 0) {
    // For short distances (< 500km), slightly lower per-kg rate
    // For medium distances (500-2000km), standard rate
    // For long distances (> 2000km), higher per-kg rate
    if (distanceKm < 500) {
      basePricePerKg = 4.0;
      baseFee = 10;
    } else if (distanceKm <= 2000) {
      basePricePerKg = 4.5;
      baseFee = 12;
    } else {
      basePricePerKg = 5.0;
      baseFee = 15;
    }
  }

  // Calculate dimensional weight if dimensions provided
  let chargeableWeight = weight;
  if (length && width && height) {
    const dimensionalWeight = calculateDimensionalWeight(length, width, height);
    chargeableWeight = Math.max(weight, dimensionalWeight);
  }

  // Base price calculation
  let price = basePricePerKg * chargeableWeight + baseFee;

  // Distance multiplier (if distance provided)
  // Planes have less distance impact than boats (planes are fast regardless of distance)
  if (distanceKm && distanceKm > 0) {
    // Smaller distance multiplier for planes (they're fast regardless)
    const distanceMultiplier = Math.min(1 + (distanceKm / 15000), 1.3); // Max 30% increase (less than boats)
    price = price * distanceMultiplier;
  }

  // Item value premium (higher value = more responsibility = higher price)
  // Planes carry valuable items more securely, but also have more responsibility
  let valueMultiplier = 1.0;
  if (declaredValue && declaredValue > 0) {
    if (declaredValue >= 5000) {
      valueMultiplier = 1.15; // 15% premium for items >$5000 (less than boat's 20% since planes are more secure)
    } else if (declaredValue >= 1000) {
      valueMultiplier = 1.08; // 8% premium for items >$1000 (less than boat's 10%)
    }
  }

  // Fragile items premium (requires extra care and handling)
  // Planes have more handling points, so fragile items need extra care
  let fragileMultiplier = 1.0;
  if (fragile) {
    fragileMultiplier = 1.12; // 12% premium for fragile items (less than boat's 15% since planes have better handling)
  }

  // Apply value and fragile multipliers
  price = price * valueMultiplier * fragileMultiplier;

  // Apply urgency multiplier (separate, not capped)
  // Urgent shipments on planes are more valuable (faster delivery)
  if (urgencyMultiplier && urgencyMultiplier > 1.0) {
    price = price * urgencyMultiplier;
  }

  // Minimum price floor to ensure planes are always more expensive than boats
  // Even for very small packages, planes should have a premium
  const minPrice = 35; // Minimum $35 for plane transport
  price = Math.max(price, minPrice);

  return Math.round(price * 100) / 100;
}

/**
 * Calculate base price for boat transport
 * Factors: weight, distance, dimensional weight, restricted items, size, dangerous goods,
 * item value, fragile items, route complexity, urgency
 */
export function calculateSpareCarryBoatBasePrice(
  weight: number,
  distanceKm?: number,
  length?: number,
  width?: number,
  height?: number,
  restrictedItems?: boolean,
  category?: string,
  declaredValue?: number,
  fragile?: boolean,
  routeComplexity?: number,
  urgencyMultiplier?: number
): number {
  // Base price per kg (lower than plane, but will be adjusted)
  let basePricePerKg = 0.7;
  let baseFee = 4;

  // Calculate dimensional weight if dimensions provided
  let chargeableWeight = weight;
  if (length && width && height) {
    const dimensionalWeight = calculateDimensionalWeight(length, width, height);
    chargeableWeight = Math.max(weight, dimensionalWeight);
  }

  // Calculate volume in cubic meters for size-based pricing
  const volumeM3 = length && width && height ? (length * width * height) / 1000000 : 0;
  
  // Size-based premium (for large/extra large items)
  let sizeMultiplier = 1.0;
  if (volumeM3 > 0.2) { // Extra large (>200L)
    sizeMultiplier = 1.5; // 50% premium for extra large items
  } else if (volumeM3 > 0.1) { // Large (100-200L)
    sizeMultiplier = 1.2; // 20% premium for large items
  }

  // Weight-based premium (for heavy items) - reduced to target ~50% of courier
  let weightMultiplier = 1.0;
  if (chargeableWeight >= 50) {
    weightMultiplier = 1.5; // 50% premium for 50kg+ (reduced from 80%)
  } else if (chargeableWeight >= 30) {
    weightMultiplier = 1.3; // 30% premium for 30-50kg (reduced from 40%)
  } else if (chargeableWeight >= 20) {
    weightMultiplier = 1.15; // 15% premium for 20-30kg (reduced from 20%)
  }

  // Restricted items premium (items that can ONLY go by boat) - reduced
  let restrictedMultiplier = 1.0;
  if (restrictedItems) {
    restrictedMultiplier = 1.3; // 30% premium for restricted items (reduced from 60%)
  }

  // Dangerous goods premium (based on category) - reduced
  let dangerousMultiplier = 1.0;
  if (category) {
    const categoryLower = category.toLowerCase();
    // Categories that are considered dangerous or require special handling
    if (categoryLower.includes('battery') || categoryLower.includes('lithium') || 
        categoryLower.includes('flammable') || categoryLower.includes('chemical') ||
        categoryLower.includes('fuel') || categoryLower.includes('gas')) {
      dangerousMultiplier = 1.25; // 25% premium for dangerous goods (reduced from 40%)
    }
  }

  // Item value premium (higher value = more responsibility = higher price)
  let valueMultiplier = 1.0;
  if (declaredValue && declaredValue > 0) {
    if (declaredValue >= 5000) {
      valueMultiplier = 1.20; // 20% premium for items >$5000
    } else if (declaredValue >= 1000) {
      valueMultiplier = 1.10; // 10% premium for items >$1000
    }
  }

  // Fragile items premium (requires extra care and handling)
  let fragileMultiplier = 1.0;
  if (fragile) {
    fragileMultiplier = 1.15; // 15% premium for fragile items
  }

  // Route complexity multiplier (applied separately, not capped with other multipliers)
  let routeComplexityMultiplier = routeComplexity || 1.0;

  // Distance-based pricing (if distance is provided)
  // Distance has a BIGGER impact on boat pricing since people are less willing on longer trips
  if (distanceKm && distanceKm > 0) {
    // Distance-based pricing for boats - adjusted to target ~50% of courier
    if (distanceKm < 500) {
      basePricePerKg = 0.8;
      baseFee = 5;
    } else if (distanceKm < 1000) {
      basePricePerKg = 0.9;
      baseFee = 6;
    } else if (distanceKm <= 2000) {
      basePricePerKg = 1.1;
      baseFee = 7;
    } else if (distanceKm <= 5000) {
      basePricePerKg = 1.3; // Reduced from 1.5
      baseFee = 8; // Reduced from 10
    } else {
      basePricePerKg = 1.6; // Reduced from 2.0
      baseFee = 12; // Reduced from 15
    }
    
    // Distance multiplier - still important but reduced to hit ~50% target
    let distanceMultiplier = 1.0;
    if (distanceKm > 5000) {
      distanceMultiplier = 1.4; // 40% premium for very long distances (reduced from 80%)
    } else if (distanceKm > 2000) {
      distanceMultiplier = 1.3; // 30% premium for long distances (reduced from 50%)
    } else if (distanceKm > 1000) {
      distanceMultiplier = 1.2; // 20% premium for medium-long distances (reduced from 30%)
    } else if (distanceKm > 500) {
      distanceMultiplier = 1.1; // 10% premium for medium distances (reduced from 15%)
    }
    
    // Base price calculation with distance
    let price = basePricePerKg * chargeableWeight + baseFee;
    price = price * distanceMultiplier;
    
    // Apply all multipliers, but cap total multiplier to target ~50% of courier price
    // This ensures we stay competitive while still incentivizing travelers
    const totalMultiplier = sizeMultiplier * weightMultiplier * restrictedMultiplier * dangerousMultiplier * valueMultiplier * fragileMultiplier;
    const cappedMultiplier = Math.min(totalMultiplier, 2.0); // Cap at 2.0x (100% premium max) - reduced to hit ~50% target
    price = price * cappedMultiplier;
    
    // Apply route complexity (separate multiplier, not capped)
    price = price * routeComplexityMultiplier;
    
    // Apply urgency multiplier (separate, not capped)
    if (urgencyMultiplier && urgencyMultiplier > 1.0) {
      price = price * urgencyMultiplier;
    }
    
    return Math.round(price * 100) / 100;
  }

  // Base price calculation (no distance)
  // When distance is not available, assume it's an international shipment
  // Use pricing for long distance (5000km range) to target ~50% of courier
  // This ensures pricing is reasonable even without exact coordinates
  if (!distanceKm || distanceKm === 0) {
    // Assume long international distance when coordinates not available
    // This targets ~50% of courier price for typical international shipments
    basePricePerKg = 1.3; // Use 5000km pricing (1.3)
    baseFee = 8;
    // Apply distance multiplier for long distance
    const assumedDistanceMultiplier = 1.3; // 30% premium for assumed long distance
    let price = basePricePerKg * chargeableWeight + baseFee;
    price = price * assumedDistanceMultiplier;
    
    // Apply all multipliers with cap
    const totalMultiplier = sizeMultiplier * weightMultiplier * restrictedMultiplier * dangerousMultiplier * valueMultiplier * fragileMultiplier;
    const cappedMultiplier = Math.min(totalMultiplier, 2.0);
    price = price * cappedMultiplier;
    
    // Apply route complexity (separate multiplier, not capped)
    price = price * routeComplexityMultiplier;
    
    // Apply urgency multiplier (separate, not capped)
    if (urgencyMultiplier && urgencyMultiplier > 1.0) {
      price = price * urgencyMultiplier;
    }
    
    return Math.round(price * 100) / 100;
  }

  // This should never be reached, but keep as fallback
  let price = basePricePerKg * chargeableWeight + baseFee;
  const totalMultiplier = sizeMultiplier * weightMultiplier * restrictedMultiplier * dangerousMultiplier;
  const cappedMultiplier = Math.min(totalMultiplier, 2.0);
  price = price * cappedMultiplier;

  return Math.round(price * 100) / 100;
}

export function calculateSpareCarryPlanePrice(
  weight: number,
  isPremium: boolean = false,
  distanceKm?: number,
  length?: number,
  width?: number,
  height?: number,
  declaredValue?: number,
  fragile?: boolean,
  urgencyMultiplier?: number
): number {
  const basePrice = calculateSpareCarryPlaneBasePrice(weight, distanceKm, length, width, height, declaredValue, fragile, urgencyMultiplier);
  const platformFee = calculatePlatformFee(basePrice, isPremium);
  const totalPrice = basePrice + platformFee;
  return Math.round(totalPrice * 100) / 100;
}

export function calculateSpareCarryBoatPrice(
  weight: number,
  isPremium: boolean = false,
  distanceKm?: number,
  length?: number,
  width?: number,
  height?: number,
  restrictedItems?: boolean,
  category?: string
): number {
  const basePrice = calculateSpareCarryBoatBasePrice(weight, distanceKm, length, width, height, restrictedItems, category);
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

  // Calculate courier price (with distance, origin, and destination for accurate pricing)
  const courierPrice = calculateCourierPrice(
    input.selectedCourier,
    isInternational,
    input.length,
    input.width,
    input.height,
    input.weight,
    input.distanceKm, // Pass distance for zone-based pricing
    input.originCountry, // Pass origin for route adjustments
    input.destinationCountry // Pass destination for route adjustments and remote area detection
  );

  if (courierPrice === null) {
    return null;
  }

  // Calculate customs cost (only for international)
  // Pass shipping cost for accurate CIF (Cost, Insurance, Freight) calculation
  let customsCost = 0;
  let customsBreakdown: CustomsCost | null = null;
  if (isInternational && input.declaredValue > 0) {
    customsBreakdown = calculateCustomsCost(input.destinationCountry, input.declaredValue, courierPrice || 0);
    customsCost = customsBreakdown ? customsBreakdown.total : 0;
  }

  const courierTotal = courierPrice + customsCost;

  // Check plane restrictions
  let canTransportByPlane = true;
  let planeRestrictionReason: string | undefined;
  
  if (input.restrictedItems || input.category) {
    const restrictionCheck = checkPlaneRestrictions({
      weight: input.weight,
      length: input.length,
      width: input.width,
      height: input.height,
      restrictedItems: input.restrictedItems,
      category: input.category,
      originCountry: input.originCountry,
      destinationCountry: input.destinationCountry,
    });
    canTransportByPlane = restrictionCheck.canTransportByPlane;
    planeRestrictionReason = restrictionCheck.reason;
  }

  // Adjust distance for boat shipping (boats follow shipping routes, not straight lines)
  // For boats, actual shipping distance is typically 10-30% longer than straight-line
  let boatDistanceKm = input.distanceKm;
  if (input.distanceKm && input.distanceKm > 0) {
    // Apply shipping route multiplier for boats
    // Straight-line distance is typically 70-90% of actual shipping route distance
    let routeMultiplier = 1.15; // Default 15% increase for typical routes
    
    // For very long distances (trans-oceanic), routes are more optimized
    if (input.distanceKm > 10000) {
      routeMultiplier = 1.10; // 10% increase for very long routes
    } else if (input.distanceKm > 5000) {
      routeMultiplier = 1.20; // 20% increase for long routes (more detours)
    } else if (input.distanceKm > 2000) {
      routeMultiplier = 1.25; // 25% increase for medium routes (coastal navigation)
    } else if (input.distanceKm < 500) {
      routeMultiplier = 1.30; // 30% increase for short routes (more coastal navigation)
    }
    
    boatDistanceKm = input.distanceKm * routeMultiplier;
  }

  // Detect route complexity (Suez/Panama/Cape routes)
  const routeComplexity = detectRouteComplexity(
    input.originCountry,
    input.destinationCountry,
    input.originLat,
    input.originLon,
    input.destinationLat,
    input.destinationLon
  );

  // Calculate urgency multiplier based on deadline
  const urgencyMultiplier = calculateUrgencyMultiplier(input.deadlineDate);

  // Calculate SpareCarry base prices (with distance if provided)
  const planeBasePrice = canTransportByPlane
    ? calculateSpareCarryPlaneBasePrice(
        input.weight,
        input.distanceKm, // Plane uses straight-line distance
        input.length,
        input.width,
        input.height,
        input.declaredValue, // Item value for premium calculation
        input.fragile, // Fragile items premium
        urgencyMultiplier // Urgency multiplier
      )
    : 0;
  const boatBasePrice = calculateSpareCarryBoatBasePrice(
    input.weight,
    boatDistanceKm, // Boat uses adjusted shipping route distance
    input.length,
    input.width,
    input.height,
    input.restrictedItems,
    input.category,
    input.declaredValue, // Item value for premium calculation
    input.fragile, // Fragile items premium
    routeComplexity, // Route complexity multiplier
    urgencyMultiplier // Urgency multiplier
  );

  // Calculate platform fees (baked into final prices)
  const platformFeePlane = canTransportByPlane ? calculatePlatformFee(planeBasePrice, isPremium) : 0;
  const platformFeeBoat = calculatePlatformFee(boatBasePrice, isPremium);

  // Calculate final SpareCarry prices (base + platform fee)
  const spareCarryPlanePrice = canTransportByPlane ? planeBasePrice + platformFeePlane : 0;
  const spareCarryBoatPrice = boatBasePrice + platformFeeBoat;

  // Calculate Stripe fees internally (for net revenue tracking)
  const stripeFeePlane = canTransportByPlane ? calculateStripeFee(spareCarryPlanePrice) : 0;
  const stripeFeeBoat = calculateStripeFee(spareCarryBoatPrice);

  // Calculate net revenue (platform fee - Stripe fee)
  const netRevenuePlane = canTransportByPlane ? calculateNetRevenue(platformFeePlane, spareCarryPlanePrice) : 0;
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

  // Calculate savings (only if plane transport is allowed)
  const savingsPlane = canTransportByPlane ? courierTotal - spareCarryPlanePrice : 0;
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
    const premiumFeePlane = canTransportByPlane ? calculatePlatformFee(planeBasePrice, true) : 0;
    const premiumFeeBoat = calculatePlatformFee(boatBasePrice, true);
    premiumPlanePrice = canTransportByPlane ? planeBasePrice + premiumFeePlane : undefined;
    premiumBoatPrice = boatBasePrice + premiumFeeBoat;
    premiumSavingsPlane = canTransportByPlane && premiumPlanePrice ? courierTotal - premiumPlanePrice : undefined;
    premiumSavingsBoat = courierTotal - premiumBoatPrice;
    premiumSavingsPercentagePlane = courierTotal > 0 && premiumSavingsPlane !== undefined
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
    customsBreakdown: customsBreakdown ? {
      duty: customsBreakdown.duty,
      tax: customsBreakdown.tax,
      taxName: customsBreakdown.taxName,
      processingFee: customsBreakdown.processingFee,
    } : undefined,
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
    canTransportByPlane,
    planeRestrictionReason,
    distanceKm: input.distanceKm, // Return original straight-line distance
    boatDistanceKm: boatDistanceKm ? Math.round(boatDistanceKm * 100) / 100 : undefined, // Return adjusted boat shipping distance
  };
}

