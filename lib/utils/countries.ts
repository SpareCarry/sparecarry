/**
 * Country and Currency Utilities
 * Shared constants for country selection and currency mapping
 */

export interface Country {
  code: string;
  name: string;
}

// Country to currency mapping
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  CH: "CHF",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  PT: "EUR",
  IE: "EUR",
  FI: "EUR",
  GR: "EUR",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  MX: "MXN",
  BR: "BRL",
  AR: "ARS",
  IN: "INR",
  CN: "CNY",
  KR: "KRW",
  SG: "SGD",
  HK: "HKD",
  AE: "AED",
  SA: "SAR",
  ZA: "ZAR",
  ID: "IDR",
  TH: "THB",
  MY: "MYR",
  PH: "PHP",
  VN: "VND",
};

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "CH", name: "Switzerland" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "PT", name: "Portugal" },
  { code: "IE", name: "Ireland" },
  { code: "FI", name: "Finland" },
  { code: "GR", name: "Greece" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "PL", name: "Poland" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "ZA", name: "South Africa" },
  { code: "ID", name: "Indonesia" },
  { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
];

/**
 * Get currency code for a country
 */
export function getCurrencyForCountry(countryCode: string): string | null {
  return COUNTRY_TO_CURRENCY[countryCode] || null;
}
