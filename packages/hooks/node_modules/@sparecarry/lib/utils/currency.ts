/**
 * Currency Conversion Utilities
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound" },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  NZD: { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
};

// Exchange rates (simplified - in production, use real-time API)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.35,
  AUD: 1.52,
  JPY: 149.5,
  CHF: 0.88,
  NZD: 1.64,
};

/**
 * Detect user currency from device locale
 * NOTE: This is only used as a fallback when user hasn't set a preferred currency.
 * The user's preferred_currency from their profile always takes priority.
 * This function does NOT use IP geolocation - it only uses device locale settings.
 */
export function detectUserCurrency(): string {
  try {
    // For React Native, use expo-localization
    // Use dynamic require with error handling for native module
    try {
      const localization = require("expo-localization");
      if (localization && localization.getLocales) {
        const locales = localization.getLocales();
        if (locales && locales.length > 0) {
          const regionCode = locales[0].regionCode || "US";

          const regionToCurrency: Record<string, string> = {
            US: "USD",
            GB: "GBP",
            CA: "CAD",
            AU: "AUD",
            NZ: "NZD",
            JP: "JPY",
            CH: "CHF",
            AT: "EUR",
            BE: "EUR",
            DE: "EUR",
            ES: "EUR",
            FR: "EUR",
            IE: "EUR",
            IT: "EUR",
            NL: "EUR",
            PT: "EUR",
          };

          return regionToCurrency[regionCode] || "USD";
        }
      }
    } catch (localizationError) {
      // Native module not available - fallback to USD
      // This can happen if the app hasn't been rebuilt after adding the package
      console.warn("expo-localization not available, defaulting to USD");
      return "USD";
    }
    return "USD";
  } catch {
    return "USD";
  }
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string
): number {
  if (from === to) return amount;
  const fromRate = EXCHANGE_RATES[from] || 1;
  const toRate = EXCHANGE_RATES[to] || 1;
  return (amount / fromRate) * toRate;
}

export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  const info = CURRENCIES[currency] || CURRENCIES.USD;
  return `${info.symbol}${amount.toFixed(2)}`;
}

export function formatCurrencyWithConversion(
  amount: number,
  userCurrency: string,
  originalCurrency: string = "USD"
): { primary: string; secondary: string | null } {
  if (userCurrency === originalCurrency) {
    return {
      primary: formatCurrency(amount, originalCurrency),
      secondary: null,
    };
  }

  const converted = convertCurrency(amount, originalCurrency, userCurrency);
  return {
    primary: formatCurrency(converted, userCurrency),
    secondary: formatCurrency(amount, originalCurrency),
  };
}
