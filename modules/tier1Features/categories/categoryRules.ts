/**
 * Category Auto-Detection Rules
 *
 * Uses keyword matching to automatically detect item category from text
 */

export interface CategoryMatch {
  category: string;
  confidence: number; // 0-1
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  electronics: [
    "iphone",
    "ipad",
    "laptop",
    "computer",
    "tablet",
    "phone",
    "smartphone",
    "headphone",
    "earbud",
    "charger",
    "cable",
    "battery",
    "power bank",
    "electronic",
    "device",
    "gadget",
    "tv",
    "monitor",
    "screen",
  ],
  clothing: [
    "shirt",
    "pants",
    "dress",
    "jacket",
    "coat",
    "sweater",
    "hoodie",
    "jeans",
    "shorts",
    "skirt",
    "clothing",
    "apparel",
    "fashion",
    "t-shirt",
    "tshirt",
    "top",
    "bottom",
    "outfit",
  ],
  shoes: [
    "shoe",
    "boot",
    "sneaker",
    "sandal",
    "flip flop",
    "heels",
    "running shoe",
    "footwear",
    "slipper",
  ],
  cosmetics: [
    "makeup",
    "cosmetic",
    "perfume",
    "lotion",
    "cream",
    "shampoo",
    "soap",
    "skincare",
    "beauty",
    "lipstick",
    "mascara",
  ],
  tools: [
    "tool",
    "screwdriver",
    "hammer",
    "wrench",
    "drill",
    "saw",
    "equipment",
    "hardware",
  ],
  books: [
    "book",
    "novel",
    "textbook",
    "magazine",
    "manual",
    "guide",
    "literature",
    "reading",
  ],
  food: [
    "food",
    "snack",
    "chocolate",
    "coffee",
    "tea",
    "spice",
    "ingredient",
    "grocery",
    "drink",
    "beverage",
  ],
};

/**
 * Auto-detect category from text
 */
export function autoDetectCategory(text: string): CategoryMatch {
  if (!text || typeof text !== "string") {
    return { category: "other", confidence: 0 };
  }

  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/);

  const categoryScores: Record<string, number> = {};

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matches = 0;

    for (const keyword of keywords) {
      // Check if keyword appears in text (exact or as part of word)
      if (textLower.includes(keyword)) {
        matches++;
      }

      // Also check plural forms
      const plural = keyword + "s";
      if (textLower.includes(plural)) {
        matches++;
      }
    }

    if (matches > 0) {
      categoryScores[category] = matches;
    }
  }

  // Find category with highest score
  const entries = Object.entries(categoryScores);
  if (entries.length === 0) {
    return { category: "other", confidence: 0 };
  }

  // Sort by score (descending)
  entries.sort((a, b) => b[1] - a[1]);

  const [topCategory, topScore] = entries[0];

  // Calculate confidence (normalize score, max 1.0)
  const maxPossibleScore = 5; // Reasonable max
  const confidence = Math.min(1.0, topScore / maxPossibleScore);

  // Minimum confidence threshold
  if (confidence < 0.3) {
    return { category: "other", confidence: confidence };
  }

  return {
    category: topCategory,
    confidence: Math.min(1.0, confidence),
  };
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  return Object.keys(CATEGORY_KEYWORDS);
}
