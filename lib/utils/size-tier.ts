/**
 * Size Tier Utilities
 * 4 tiers: Small, Medium, Large, Extra Large
 */

export type SizeTier = "small" | "medium" | "large" | "extra_large";

export interface SizeTierInfo {
  id: SizeTier;
  label: string;
  weightRange: string;
  examples: string;
  maxWeightKg: number;
}

export const SIZE_TIERS: SizeTierInfo[] = [
  {
    id: "small",
    label: "Small",
    weightRange: "Up to 5 kg",
    examples: "Laptop, shoes, drone, small spare part",
    maxWeightKg: 5,
  },
  {
    id: "medium",
    label: "Medium",
    weightRange: "5–15 kg",
    examples: "Suitcase, dive bag, speargun, small outboard impeller",
    maxWeightKg: 15,
  },
  {
    id: "large",
    label: "Large",
    weightRange: "15–30 kg",
    examples: "Surfboard, sailbag, folding kayak, 15 HP lower unit",
    maxWeightKg: 30,
  },
  {
    id: "extra_large",
    label: "Extra Large",
    weightRange: "30+ kg",
    examples:
      "Standing rigging, mainsail, windlass, 40–60 HP outboard, anchor + chain",
    maxWeightKg: Infinity,
  },
];

export function getSizeTier(weightKg: number): SizeTier {
  if (weightKg <= 5) return "small";
  if (weightKg <= 15) return "medium";
  if (weightKg <= 30) return "large";
  return "extra_large";
}

export function getSizeTierInfo(tier: SizeTier): SizeTierInfo {
  return SIZE_TIERS.find((t) => t.id === tier) || SIZE_TIERS[0];
}
