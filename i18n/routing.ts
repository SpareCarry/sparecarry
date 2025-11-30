// next-intl v2 routing configuration
export const locales = ["en", "es", "fr"] as const;
export const defaultLocale = "en" as const;
export type Locale = (typeof locales)[number];

// Routing configuration for v2 (compatible with static export)
export const routing = {
  locales: locales as readonly string[],
  defaultLocale: defaultLocale as string,
  localePrefix: "as-needed" as const, // Only show locale prefix for non-default locale
};
