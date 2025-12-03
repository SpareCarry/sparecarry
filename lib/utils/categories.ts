/**
 * Comprehensive category list for item categorization
 * Used in Post Request form and Shipping Estimator
 */

export interface Category {
  value: string;
  label: string;
}

export const ITEM_CATEGORIES: Category[] = [
  // Boat-specific categories (prioritized at top)
  { value: "marine_electronics", label: "Marine Electronics" },
  { value: "electrical_systems", label: "Electrical Systems" },
  { value: "sails_rigging", label: "Sails & Rigging" },
  { value: "anchoring", label: "Anchoring" },
  { value: "engine_parts", label: "Engine Parts" },
  { value: "safety_equipment", label: "Safety Equipment" },
  { value: "deck_hardware", label: "Deck Hardware" },
  { value: "hull_parts", label: "Hull Parts" },
  { value: "plumbing_systems", label: "Plumbing Systems" },
  { value: "galley_equipment", label: "Galley Equipment" },
  
  // Backward compatibility - keep existing "marine" category
  { value: "marine", label: "Marine Equipment" },
  
  // General categories
  { value: "electronics", label: "Electronics" },
  { value: "food", label: "Food & Beverages" },
  { value: "clothing", label: "Clothing & Apparel" },
  { value: "tools", label: "Tools & Hardware" },
  { value: "medical", label: "Medical Supplies" },
  { value: "automotive", label: "Automotive Parts" },
  { value: "sports", label: "Sports & Recreation" },
  { value: "books", label: "Books & Media" },
  { value: "appliances", label: "Appliances" },
  { value: "cosmetics", label: "Cosmetics & Personal Care" },
  { value: "pet_supplies", label: "Pet Supplies" },
  { value: "jewelry", label: "Jewelry & Watches" },
  { value: "furniture", label: "Furniture" },
  { value: "musical_instruments", label: "Musical Instruments" },
  { value: "art", label: "Art & Collectibles" },
  { value: "garden", label: "Garden & Outdoor" },
  { value: "baby", label: "Baby & Kids Items" },
  { value: "office", label: "Office Supplies" },
  
  // Always last
  { value: "other", label: "Other" },
];

/**
 * Get category label by value
 */
export function getCategoryLabel(value: string): string {
  const category = ITEM_CATEGORIES.find((cat) => cat.value === value);
  return category?.label || value;
}

