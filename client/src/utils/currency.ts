/**
 * Currency formatting utilities for MeStory
 * Supports USD and ILS currencies with proper locale-based formatting
 */

export type Currency = 'USD' | 'ILS';

// Exchange rate placeholder - in production, fetch from API
// Rate: 1 USD = ~3.6 ILS (approximate)
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  ILS: 3.6,
};

// Currency symbols
const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  ILS: '₪',
};

// Locale mappings for currencies
const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  ILS: 'he-IL',
};

/**
 * Get user's preferred locale from navigator or default
 */
export function getUserLocale(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.language || 'en-US';
  }
  return 'en-US';
}

/**
 * Detect default currency based on locale
 */
export function getDefaultCurrency(locale?: string): Currency {
  const userLocale = locale || getUserLocale();
  if (userLocale.startsWith('he') || userLocale.includes('IL')) {
    return 'ILS';
  }
  return 'USD';
}

/**
 * Format currency with proper locale formatting
 * @param amount - The amount to format (in base currency, usually USD)
 * @param currency - Target currency (USD or ILS)
 * @param locale - Optional locale override
 * @param options - Additional Intl.NumberFormat options
 */
export function formatCurrency(
  amount: number,
  currency: Currency = 'USD',
  locale?: string,
  options?: Partial<Intl.NumberFormatOptions>
): string {
  const targetLocale = locale || CURRENCY_LOCALES[currency];

  try {
    const formatter = new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    });

    return formatter.format(amount);
  } catch (error) {
    // Fallback formatting if Intl is not supported
    const symbol = CURRENCY_SYMBOLS[currency];
    const formatted = amount.toFixed(2);
    return `${symbol}${formatted}`;
  }
}

/**
 * Format currency with compact notation for large numbers
 * @param amount - The amount to format
 * @param currency - Target currency
 * @param locale - Optional locale override
 */
export function formatCurrencyCompact(
  amount: number,
  currency: Currency = 'USD',
  locale?: string
): string {
  const targetLocale = locale || CURRENCY_LOCALES[currency];

  try {
    const formatter = new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });

    return formatter.format(amount);
  } catch (error) {
    const symbol = CURRENCY_SYMBOLS[currency];
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)}K`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  }
}

/**
 * Convert amount between currencies
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to USD first, then to target currency
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
  return amountInUSD * EXCHANGE_RATES[toCurrency];
}

/**
 * Format amount with conversion to display both currencies
 * @param amountUSD - Amount in USD
 * @param primaryCurrency - Primary currency to display
 * @param showSecondary - Whether to show secondary currency
 */
export function formatWithConversion(
  amountUSD: number,
  primaryCurrency: Currency = 'USD',
  showSecondary: boolean = false
): { primary: string; secondary?: string } {
  const primaryAmount = primaryCurrency === 'USD'
    ? amountUSD
    : convertCurrency(amountUSD, 'USD', primaryCurrency);

  const result: { primary: string; secondary?: string } = {
    primary: formatCurrency(primaryAmount, primaryCurrency),
  };

  if (showSecondary) {
    const secondaryCurrency: Currency = primaryCurrency === 'USD' ? 'ILS' : 'USD';
    const secondaryAmount = primaryCurrency === 'USD'
      ? convertCurrency(amountUSD, 'USD', 'ILS')
      : amountUSD;
    result.secondary = formatCurrency(secondaryAmount, secondaryCurrency);
  }

  return result;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency];
}

/**
 * Format price for display with optional ILS equivalent
 * Used primarily for book prices
 * @param priceUSD - Price in USD
 * @param priceILS - Price in ILS (if available from backend)
 * @param preferredCurrency - User's preferred currency
 */
export function formatBookPrice(
  priceUSD: number,
  priceILS?: number,
  preferredCurrency: Currency = 'USD'
): { main: string; alt?: string } {
  if (priceUSD === 0) {
    return { main: 'Free' };
  }

  if (preferredCurrency === 'ILS') {
    const ilsAmount = priceILS ?? convertCurrency(priceUSD, 'USD', 'ILS');
    return {
      main: formatCurrency(ilsAmount, 'ILS'),
      alt: formatCurrency(priceUSD, 'USD'),
    };
  }

  return {
    main: formatCurrency(priceUSD, 'USD'),
    alt: priceILS ? formatCurrency(priceILS, 'ILS') : undefined,
  };
}

/**
 * Parse a currency string to number
 * @param value - String value like "$25.00" or "₪90.00"
 */
export function parseCurrencyString(value: string): number {
  // Remove currency symbols and whitespace
  const cleaned = value.replace(/[$₪,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Get exchange rate for display
 */
export function getExchangeRate(from: Currency, to: Currency): number {
  return EXCHANGE_RATES[to] / EXCHANGE_RATES[from];
}

/**
 * Update exchange rates (placeholder for API integration)
 * In production, this would fetch from an exchange rate API
 */
export async function fetchExchangeRates(): Promise<Record<Currency, number>> {
  // TODO: Implement API call to get real-time exchange rates
  // For now, return static rates
  return EXCHANGE_RATES;
}
