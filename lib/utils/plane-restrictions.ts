/**
 * Plane Transport Restrictions
 *
 * Checks if an item can be transported by plane based on:
 * - Weight limits (carry-on vs checked baggage)
 * - Size/dimension limits
 * - Dangerous goods restrictions
 * - Category-based restrictions
 * - Country-specific restrictions
 */

import { checkCountryRestrictions } from "./country-restrictions";

export interface PlaneRestrictionCheck {
  canTransportByPlane: boolean;
  reason?: string;
  restrictionType?:
    | "weight"
    | "size"
    | "dangerous_goods"
    | "category"
    | "oversized"
    | "country";
  suggestedMethod?: "boat";
}

export interface ItemSpecs {
  weight: number; // kg
  length: number; // cm
  width: number; // cm
  height: number; // cm
  restrictedItems?: boolean; // Lithium batteries, flammable items, etc.
  category?: string; // Item category
  originCountry?: string; // ISO2 country code for origin
  destinationCountry?: string; // ISO2 country code for destination
}

// Standard airline limits
const CARRY_ON_MAX_WEIGHT = 7; // kg (typical airline limit)
const CARRY_ON_MAX_LENGTH = 55; // cm (typical airline limit)
const CARRY_ON_MAX_WIDTH = 40; // cm
const CARRY_ON_MAX_HEIGHT = 23; // cm
const CARRY_ON_MAX_LINEAR_DIMENSIONS = 115; // cm (length + width + height)

const CHECKED_BAGGAGE_MAX_WEIGHT = 32; // kg (typical airline limit for checked baggage)
const CHECKED_BAGGAGE_MAX_LENGTH = 158; // cm (typical airline limit)
const CHECKED_BAGGAGE_MAX_WIDTH = 158; // cm
const CHECKED_BAGGAGE_MAX_HEIGHT = 158; // cm
const CHECKED_BAGGAGE_MAX_LINEAR_DIMENSIONS = 300; // cm (length + width + height)

// Oversized/overweight limits (may incur extra fees, but still allowed)
const OVERSIZED_MAX_WEIGHT = 45; // kg (some airlines allow up to 45kg with fees)
const OVERSIZED_MAX_LINEAR_DIMENSIONS = 320; // cm (some airlines allow oversized with fees)

// Categories that cannot be transported by plane
const PROHIBITED_CATEGORIES = [
  "explosives",
  "flammable",
  "toxic",
  "radioactive",
  "corrosive",
  "weapons",
  "ammunition",
];

/**
 * Check if an item can be transported by plane
 */
export function checkPlaneRestrictions(
  specs: ItemSpecs
): PlaneRestrictionCheck {
  // Check for restricted/dangerous goods
  if (specs.restrictedItems) {
    return {
      canTransportByPlane: false,
      reason:
        "Restricted items (lithium batteries, flammable materials, etc.) cannot be transported by plane due to airline regulations.",
      restrictionType: "dangerous_goods",
      suggestedMethod: "boat",
    };
  }

  // Check country-specific restrictions (check before general category restrictions)
  if (specs.category && (specs.originCountry || specs.destinationCountry)) {
    const countryCheck = checkCountryRestrictions(
      specs.originCountry || "",
      specs.destinationCountry || "",
      specs.category
    );

    if (
      countryCheck.isRestricted &&
      countryCheck.restrictionType === "prohibited"
    ) {
      return {
        canTransportByPlane: false,
        reason:
          countryCheck.reason ||
          `Items in the "${specs.category}" category are prohibited for this route due to country-specific regulations.`,
        restrictionType: "country",
        suggestedMethod: "boat",
      };
    }
  }

  // Check category restrictions
  if (specs.category) {
    const categoryLower = specs.category.toLowerCase();
    const isProhibited = PROHIBITED_CATEGORIES.some((prohibited) =>
      categoryLower.includes(prohibited)
    );

    if (isProhibited) {
      return {
        canTransportByPlane: false,
        reason: `Items in the "${specs.category}" category cannot be transported by plane due to safety regulations.`,
        restrictionType: "category",
        suggestedMethod: "boat",
      };
    }
  }

  const linearDimensions = specs.length + specs.width + specs.height;
  const maxDimension = Math.max(specs.length, specs.width, specs.height);

  // Check if it fits in carry-on
  const fitsCarryOn =
    specs.weight <= CARRY_ON_MAX_WEIGHT &&
    specs.length <= CARRY_ON_MAX_LENGTH &&
    specs.width <= CARRY_ON_MAX_WIDTH &&
    specs.height <= CARRY_ON_MAX_HEIGHT &&
    linearDimensions <= CARRY_ON_MAX_LINEAR_DIMENSIONS;

  if (fitsCarryOn) {
    return {
      canTransportByPlane: true,
    };
  }

  // Check if it fits in checked baggage
  const fitsCheckedBaggage =
    specs.weight <= CHECKED_BAGGAGE_MAX_WEIGHT &&
    maxDimension <= CHECKED_BAGGAGE_MAX_LENGTH &&
    linearDimensions <= CHECKED_BAGGAGE_MAX_LINEAR_DIMENSIONS;

  if (fitsCheckedBaggage) {
    return {
      canTransportByPlane: true,
    };
  }

  // Check if it fits in oversized/overweight baggage (with extra fees)
  const fitsOversized =
    specs.weight <= OVERSIZED_MAX_WEIGHT &&
    linearDimensions <= OVERSIZED_MAX_LINEAR_DIMENSIONS;

  if (fitsOversized) {
    return {
      canTransportByPlane: true,
      reason:
        "Item exceeds standard checked baggage limits but may be accepted as oversized/overweight baggage (additional airline fees may apply).",
      restrictionType: "oversized",
    };
  }

  // Too large or heavy for plane transport
  if (specs.weight > OVERSIZED_MAX_WEIGHT) {
    return {
      canTransportByPlane: false,
      reason: `Item weight (${specs.weight}kg) exceeds maximum allowed weight (${OVERSIZED_MAX_WEIGHT}kg) for plane transport.`,
      restrictionType: "weight",
      suggestedMethod: "boat",
    };
  }

  if (linearDimensions > OVERSIZED_MAX_LINEAR_DIMENSIONS) {
    return {
      canTransportByPlane: false,
      reason: `Item dimensions (${linearDimensions}cm total) exceed maximum allowed size (${OVERSIZED_MAX_LINEAR_DIMENSIONS}cm) for plane transport.`,
      restrictionType: "size",
      suggestedMethod: "boat",
    };
  }

  // Default: cannot transport by plane
  return {
    canTransportByPlane: false,
    reason: "Item exceeds plane transport size and weight limits.",
    restrictionType: "size",
    suggestedMethod: "boat",
  };
}

/**
 * Get human-readable restriction details
 */
export function getPlaneRestrictionDetails(specs: ItemSpecs): {
  fitsCarryOn: boolean;
  fitsCheckedBaggage: boolean;
  fitsOversized: boolean;
  restrictionMessage?: string;
} {
  const check = checkPlaneRestrictions(specs);
  const linearDimensions = specs.length + specs.width + specs.height;
  const maxDimension = Math.max(specs.length, specs.width, specs.height);

  const fitsCarryOn =
    specs.weight <= CARRY_ON_MAX_WEIGHT &&
    specs.length <= CARRY_ON_MAX_LENGTH &&
    specs.width <= CARRY_ON_MAX_WIDTH &&
    specs.height <= CARRY_ON_MAX_HEIGHT &&
    linearDimensions <= CARRY_ON_MAX_LINEAR_DIMENSIONS;

  const fitsCheckedBaggage =
    specs.weight <= CHECKED_BAGGAGE_MAX_WEIGHT &&
    maxDimension <= CHECKED_BAGGAGE_MAX_LENGTH &&
    linearDimensions <= CHECKED_BAGGAGE_MAX_LINEAR_DIMENSIONS;

  const fitsOversized =
    specs.weight <= OVERSIZED_MAX_WEIGHT &&
    linearDimensions <= OVERSIZED_MAX_LINEAR_DIMENSIONS;

  return {
    fitsCarryOn,
    fitsCheckedBaggage,
    fitsOversized,
    restrictionMessage: check.reason,
  };
}
