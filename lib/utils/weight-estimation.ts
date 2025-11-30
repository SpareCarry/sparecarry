/**
 * Weight Estimation Utilities
 *
 * Provides intelligent weight estimation using multiple methods:
 * 1. Text detection (extract weight from title/description)
 * 2. Common items database (keyword matching)
 * 3. Category-based defaults
 * 4. Weight feel estimation (from dimensions + feel)
 * 5. Validation warnings for inconsistencies
 */

export type WeightFeel =
  | "very_light"
  | "light"
  | "medium"
  | "heavy"
  | "very_heavy";

export interface WeightEstimate {
  weight: number;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface WeightRange {
  min: number;
  max: number;
  typical?: number;
}

export interface ReferenceItem {
  name: string;
  weight: number;
  dimensions: string;
  category?: string;
}

// Weight feel density ranges (kg/L)
export const WEIGHT_FEEL_DENSITIES: Record<
  WeightFeel,
  { min: number; max: number; typical: number }
> = {
  very_light: { min: 0.01, max: 0.1, typical: 0.05 }, // foam, fabric, air-filled
  light: { min: 0.1, max: 0.5, typical: 0.3 }, // electronics, plastic, wood
  medium: { min: 0.5, max: 1.5, typical: 1.0 }, // water, most common items
  heavy: { min: 1.5, max: 3.0, typical: 2.2 }, // metal, dense materials
  very_heavy: { min: 3.0, max: 10.0, typical: 5.0 }, // lead, very dense metals
};

// Common items database with keyword matching
const COMMON_ITEMS: Record<string, Record<string, number>> = {
  battery: {
    "100ah": 12,
    "100 ah": 12,
    "150ah": 18,
    "150 ah": 18,
    "200ah": 24,
    "200 ah": 24,
    "300ah": 35,
    "300 ah": 35,
    default: 20, // Typical marine battery
  },
  anchor: {
    "5kg": 5,
    "5 kg": 5,
    "10kg": 10,
    "10 kg": 10,
    "15kg": 15,
    "15 kg": 15,
    "20kg": 20,
    "20 kg": 20,
    "25kg": 25,
    "25 kg": 25,
    default: 12, // Typical anchor
  },
  sail: {
    genoa: 3,
    jib: 2,
    mainsail: 5,
    "main sail": 5,
    spinnaker: 2,
    default: 4,
  },
  electronics: {
    chartplotter: 1.5,
    "chart plotter": 1.5,
    gps: 0.5,
    vhf: 1,
    radio: 1,
    autopilot: 3,
    "auto pilot": 3,
    default: 1,
  },
  tools: {
    winch: 5,
    windlass: 15,
    default: 3,
  },
};

// Category-based default weights
const CATEGORY_DEFAULTS: Record<string, WeightRange> = {
  electronics: { min: 0.5, max: 5, typical: 1 },
  marine: { min: 5, max: 30, typical: 15 },
  food: { min: 0.5, max: 10, typical: 2 },
  clothing: { min: 0.1, max: 3, typical: 0.5 },
  tools: { min: 1, max: 20, typical: 3 },
  medical: { min: 0.5, max: 5, typical: 1.5 },
  automotive: { min: 5, max: 50, typical: 15 },
  sports: { min: 1, max: 15, typical: 5 },
  books: { min: 0.5, max: 3, typical: 1 },
};

// Reference items for comparison
export const REFERENCE_ITEMS: ReferenceItem[] = [
  {
    name: "Laptop",
    weight: 2,
    dimensions: "35×25×2 cm",
    category: "electronics",
  },
  {
    name: "Car Battery",
    weight: 15,
    dimensions: "30×20×20 cm",
    category: "automotive",
  },
  {
    name: "Suitcase (empty)",
    weight: 3,
    dimensions: "70×45×25 cm",
    category: "clothing",
  },
  {
    name: "Suitcase (packed)",
    weight: 20,
    dimensions: "70×45×25 cm",
    category: "clothing",
  },
  {
    name: "Marine Battery 100Ah",
    weight: 12,
    dimensions: "30×20×20 cm",
    category: "marine",
  },
  {
    name: "Marine Battery 200Ah",
    weight: 24,
    dimensions: "35×25×25 cm",
    category: "marine",
  },
  {
    name: "Anchor (typical)",
    weight: 12,
    dimensions: "40×30×10 cm",
    category: "marine",
  },
  {
    name: "Sail (Genoa)",
    weight: 3,
    dimensions: "Rolls up small",
    category: "marine",
  },
  {
    name: "Sail (Mainsail)",
    weight: 5,
    dimensions: "Rolls up small",
    category: "marine",
  },
  {
    name: "Chartplotter",
    weight: 1.5,
    dimensions: "25×15×5 cm",
    category: "electronics",
  },
  {
    name: "VHF Radio",
    weight: 1,
    dimensions: "20×10×5 cm",
    category: "electronics",
  },
  { name: "Winch", weight: 5, dimensions: "15×15×15 cm", category: "tools" },
  {
    name: "Windlass",
    weight: 15,
    dimensions: "30×25×20 cm",
    category: "tools",
  },
];

/**
 * Detect weight from text (title/description) and category
 * Priority: 1) Weight in text, 2) Common item match, 3) Category default
 */
export function detectWeightFromText(
  title: string,
  description: string,
  category?: string
): WeightEstimate | null {
  const searchText = `${title} ${description}`.toLowerCase();

  // 1. Try to extract weight directly from text (e.g., "15kg anchor")
  const weightPatterns = [
    /(\d+(?:\.\d+)?)\s*kg/i, // "15kg" or "15 kg"
    /(\d+(?:\.\d+)?)\s*kilogram/i, // "15 kilogram"
    /(\d+(?:\.\d+)?)\s*lb/i, // "15lb" (convert to kg)
    /(\d+(?:\.\d+)?)\s*pound/i, // "15 pound"
    /weight[:\s]+(\d+(?:\.\d+)?)/i, // "Weight: 15"
  ];

  for (const pattern of weightPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      let weight = parseFloat(match[1]);

      // Convert lbs to kg if needed
      if (pattern.source.includes("lb") || pattern.source.includes("pound")) {
        weight = weight * 0.453592;
      }

      if (weight > 0 && weight < 1000) {
        // Sanity check
        return {
          weight: Math.round(weight * 10) / 10,
          confidence: "high",
          source: "Found weight in text",
        };
      }
    }
  }

  // 2. Try to find exact matches in common items
  for (const [itemType, variants] of Object.entries(COMMON_ITEMS)) {
    if (searchText.includes(itemType)) {
      // Check for specific variants (e.g., "200ah battery")
      for (const [variant, weight] of Object.entries(variants)) {
        if (variant !== "default" && searchText.includes(variant)) {
          return {
            weight,
            confidence: "high",
            source: `Matched: ${itemType} (${variant})`,
          };
        }
      }

      // Use default for this item type
      if (variants.default) {
        return {
          weight: variants.default,
          confidence: "medium",
          source: `Matched: ${itemType} (typical)`,
        };
      }
    }
  }

  // 3. Use category default as last resort
  if (category && CATEGORY_DEFAULTS[category]) {
    const range = CATEGORY_DEFAULTS[category];
    return {
      weight: range.typical || (range.min + range.max) / 2,
      confidence: "low",
      source: `Category default: ${category}`,
    };
  }

  return null;
}

/**
 * Estimate weight from dimensions and feel
 */
export function estimateWeightFromFeel(
  length: number,
  width: number,
  height: number,
  feel: WeightFeel
): number {
  const volumeLiters = (length * width * height) / 1000;
  const density = WEIGHT_FEEL_DENSITIES[feel].typical;
  const estimatedWeight = volumeLiters * density;

  // Round to reasonable precision
  return Math.round(estimatedWeight * 10) / 10; // 0.1kg precision
}

/**
 * Validate weight against dimensions (warn on extreme inconsistencies)
 */
export function validateWeightDimensions(
  weight: number,
  length: number,
  width: number,
  height: number
): { isValid: boolean; warning?: string } {
  if (
    !weight ||
    !length ||
    !width ||
    !height ||
    weight <= 0 ||
    length <= 0 ||
    width <= 0 ||
    height <= 0
  ) {
    return { isValid: true }; // Can't validate without all values
  }

  const volumeLiters = (length * width * height) / 1000;
  const density = weight / volumeLiters;

  // Extreme cases only (not accurate estimates)
  // Lead density ~11 kg/L, water ~1 kg/L, air ~0.001 kg/L
  if (density > 10) {
    return {
      isValid: false,
      warning:
        "This seems very heavy (denser than lead). Please double-check the weight.",
    };
  }

  if (density < 0.01 && volumeLiters > 10) {
    return {
      isValid: false,
      warning:
        "This seems very light for this size. Please double-check the weight.",
    };
  }

  return { isValid: true };
}

/**
 * Get weight range for a category
 */
export function getCategoryWeightRange(category: string): WeightRange | null {
  return CATEGORY_DEFAULTS[category] || null;
}

/**
 * Get reference items (optionally filtered by category)
 */
export function getReferenceItems(category?: string): ReferenceItem[] {
  if (category) {
    return REFERENCE_ITEMS.filter((item) => item.category === category);
  }
  return REFERENCE_ITEMS;
}
