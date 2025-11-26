/**
 * Currency Conversion Utilities
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
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

export function detectUserCurrency(): string {
  if (typeof window === 'undefined') return 'USD';
  
  try {
    const locale = navigator.language || 'en-US';
    const region = locale.split('-')[1] || 'US';
    
    const regionToCurrency: Record<string, string> = {
      US: 'USD',
      GB: 'GBP',
      CA: 'CAD',
      AU: 'AUD',
      NZ: 'NZD',
      JP: 'JPY',
      CH: 'CHF',
      EU: 'EUR',
    };
    
    return regionToCurrency[region] || 'USD';
  } catch {
    return 'USD';
  }
}

export function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const fromRate = EXCHANGE_RATES[from] || 1;
  const toRate = EXCHANGE_RATES[to] || 1;
  return (amount / fromRate) * toRate;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const info = CURRENCIES[currency] || CURRENCIES.USD;
  return `${info.symbol}${amount.toFixed(2)}`;
}

export function formatCurrencyWithConversion(
  amount: number,
  userCurrency: string,
  originalCurrency: string = 'USD'
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

