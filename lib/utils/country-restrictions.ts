/**
 * Country-Specific Shipping Restrictions
 *
 * Defines restrictions that apply based on origin or destination country.
 * These are in addition to general airline restrictions.
 */

export interface CountryRestriction {
  countryCode: string; // ISO2 country code
  restrictions: {
    prohibitedCategories?: string[]; // Categories that cannot be shipped to/from this country
    prohibitedItems?: string[]; // Specific items that are prohibited
    requiresDocumentation?: string[]; // Items that require special documentation
    weightLimits?: {
      maxWeight?: number; // kg - stricter than standard airline limits
      maxDimensions?: number; // cm - stricter than standard airline limits
    };
    notes?: string; // Additional notes about restrictions
  };
}

// Country-specific restrictions database
// This should be expanded based on actual regulations
const COUNTRY_RESTRICTIONS: CountryRestriction[] = [
  {
    countryCode: "AU", // Australia
    restrictions: {
      prohibitedCategories: ["food", "medical"], // Strict biosecurity laws
      requiresDocumentation: ["electronics", "tools"],
      notes:
        "Australia has strict biosecurity laws. Food, plants, and some medical items require permits.",
    },
  },
  {
    countryCode: "NZ", // New Zealand
    restrictions: {
      prohibitedCategories: ["food"],
      requiresDocumentation: ["medical"],
      notes:
        "New Zealand has strict biosecurity requirements. Food items generally prohibited.",
    },
  },
  {
    countryCode: "US", // United States
    restrictions: {
      prohibitedItems: ["weapons", "ammunition"],
      requiresDocumentation: ["medical", "electronics"],
      notes:
        "Firearms and ammunition require special permits and documentation.",
    },
  },
  {
    countryCode: "CA", // Canada
    restrictions: {
      prohibitedItems: ["weapons"],
      requiresDocumentation: ["medical", "food"],
      notes: "Firearms require permits. Food items may require inspection.",
    },
  },
  {
    countryCode: "GB", // United Kingdom
    restrictions: {
      prohibitedItems: ["weapons"],
      requiresDocumentation: ["medical", "electronics"],
      notes:
        "Firearms require licenses. Some electronics may require documentation.",
    },
  },
  {
    countryCode: "FR", // France
    restrictions: {
      prohibitedItems: ["weapons"],
      requiresDocumentation: ["medical", "food"],
      notes: "Firearms require permits. Food items may be restricted.",
    },
  },
  {
    countryCode: "DE", // Germany
    restrictions: {
      prohibitedItems: ["weapons"],
      requiresDocumentation: ["medical", "electronics"],
      notes:
        "Firearms require permits. Some electronics may require CE marking documentation.",
    },
  },
  {
    countryCode: "IT", // Italy
    restrictions: {
      prohibitedItems: ["weapons"],
      requiresDocumentation: ["medical", "food"],
      notes: "Firearms require permits. Food items may be restricted.",
    },
  },
  {
    countryCode: "ES", // Spain
    restrictions: {
      prohibitedItems: ["weapons"],
      requiresDocumentation: ["medical", "food"],
      notes:
        "Firearms require permits. Dietary supplements and cosmetics may be restricted.",
    },
  },
  {
    countryCode: "SE", // Sweden
    restrictions: {
      prohibitedItems: ["weapons"],
      requiresDocumentation: ["medical", "food"],
      notes: "Firearms require permits. Dietary supplements may be restricted.",
    },
  },
  {
    countryCode: "JP", // Japan
    restrictions: {
      prohibitedCategories: ["food", "medical"],
      requiresDocumentation: ["electronics"],
      notes:
        "Japan has strict import regulations. Food and medical items require permits. Electronics may need certification.",
    },
  },
  {
    countryCode: "CN", // China
    restrictions: {
      prohibitedCategories: ["food", "medical"],
      requiresDocumentation: ["electronics", "tools"],
      notes:
        "China has strict import regulations. Food, medical items, and electronics require permits and certification.",
    },
  },
  {
    countryCode: "IN", // India
    restrictions: {
      prohibitedCategories: ["food"],
      requiresDocumentation: ["medical", "electronics"],
      notes:
        "Food items may be restricted. Medical items and electronics require documentation.",
    },
  },
  {
    countryCode: "BR", // Brazil
    restrictions: {
      prohibitedCategories: ["food"],
      requiresDocumentation: ["medical", "electronics"],
      notes:
        "Food items may be restricted. Medical items and electronics require ANVISA approval.",
    },
  },
  {
    countryCode: "MX", // Mexico
    restrictions: {
      prohibitedItems: ["weapons"],
      requiresDocumentation: ["medical", "food"],
      notes:
        "Firearms require permits. Medical items and food may require documentation.",
    },
  },
  {
    countryCode: "AE", // United Arab Emirates
    restrictions: {
      prohibitedCategories: ["food", "medical"],
      prohibitedItems: ["weapons"],
      notes:
        "UAE has strict import regulations. Food, medical items, and firearms are heavily restricted.",
    },
  },
  {
    countryCode: "SA", // Saudi Arabia
    restrictions: {
      prohibitedCategories: ["food", "medical"],
      prohibitedItems: ["weapons"],
      notes:
        "Saudi Arabia has strict import regulations. Food, medical items, and firearms are heavily restricted.",
    },
  },
];

/**
 * Get restrictions for a specific country
 */
export function getCountryRestrictions(
  countryCode: string
): CountryRestriction | undefined {
  return COUNTRY_RESTRICTIONS.find(
    (r) => r.countryCode === countryCode.toUpperCase()
  );
}

/**
 * Check if an item category is prohibited for a country
 */
export function isCategoryProhibitedForCountry(
  category: string,
  countryCode: string
): boolean {
  const restriction = getCountryRestrictions(countryCode);
  if (!restriction) return false;

  const categoryLower = category.toLowerCase();
  return (
    restriction.restrictions.prohibitedCategories?.some((prohibited) =>
      categoryLower.includes(prohibited.toLowerCase())
    ) ?? false
  );
}

/**
 * Check if an item requires documentation for a country
 */
export function requiresDocumentationForCountry(
  category: string,
  countryCode: string
): boolean {
  const restriction = getCountryRestrictions(countryCode);
  if (!restriction) return false;

  const categoryLower = category.toLowerCase();
  return (
    restriction.restrictions.requiresDocumentation?.some((required) =>
      categoryLower.includes(required.toLowerCase())
    ) ?? false
  );
}

/**
 * Get country-specific restriction message
 */
export function getCountryRestrictionMessage(
  countryCode: string,
  category?: string
): string | undefined {
  const restriction = getCountryRestrictions(countryCode);
  if (!restriction) return undefined;

  if (category && isCategoryProhibitedForCountry(category, countryCode)) {
    return `${restriction.restrictions.notes || ""} Items in the "${category}" category are prohibited for ${countryCode}.`;
  }

  if (category && requiresDocumentationForCountry(category, countryCode)) {
    return `${restriction.restrictions.notes || ""} Items in the "${category}" category may require special documentation for ${countryCode}.`;
  }

  return restriction.restrictions.notes;
}

/**
 * Check if route has country-specific restrictions
 */
export function checkCountryRestrictions(
  originCountry: string,
  destinationCountry: string,
  category?: string
): {
  isRestricted: boolean;
  reason?: string;
  restrictionType?: "prohibited" | "requires_documentation";
} {
  // Check destination country restrictions (most important)
  if (category) {
    if (isCategoryProhibitedForCountry(category, destinationCountry)) {
      return {
        isRestricted: true,
        reason: getCountryRestrictionMessage(destinationCountry, category),
        restrictionType: "prohibited",
      };
    }

    if (requiresDocumentationForCountry(category, destinationCountry)) {
      return {
        isRestricted: false, // Not prohibited, but requires documentation
        reason: getCountryRestrictionMessage(destinationCountry, category),
        restrictionType: "requires_documentation",
      };
    }
  }

  // Check origin country restrictions
  if (category) {
    if (isCategoryProhibitedForCountry(category, originCountry)) {
      return {
        isRestricted: true,
        reason: getCountryRestrictionMessage(originCountry, category),
        restrictionType: "prohibited",
      };
    }
  }

  return {
    isRestricted: false,
  };
}
