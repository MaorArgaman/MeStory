import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../services/api';
import { useLanguage } from './LanguageContext';
import {
  Currency,
  getDefaultCurrency,
  formatCurrency as formatCurrencyUtil,
  formatCurrencyCompact as formatCurrencyCompactUtil,
  convertCurrency as convertCurrencyUtil,
  formatBookPrice as formatBookPriceUtil,
  getCurrencySymbol as getCurrencySymbolUtil,
} from '../utils/currency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  formatCurrency: (amount: number, overrideCurrency?: Currency) => string;
  formatCurrencyCompact: (amount: number, overrideCurrency?: Currency) => string;
  convertCurrency: (amount: number, from: Currency, to: Currency) => number;
  formatBookPrice: (priceUSD: number, priceILS?: number) => { main: string; alt?: string };
  getCurrencySymbol: (overrideCurrency?: Currency) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'mestory-currency';

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [currency, setCurrencyState] = useState<Currency>(() => {
    // Initialize from localStorage or language-based default
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null;
    if (stored && (stored === 'USD' || stored === 'ILS')) {
      return stored;
    }
    return getDefaultCurrency();
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize currency on mount
  useEffect(() => {
    initializeCurrency();
  }, []);

  // Update currency when language changes (if no explicit preference)
  useEffect(() => {
    const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (!storedCurrency) {
      // No explicit preference, use language-based default
      const defaultCurrency = language === 'he' ? 'ILS' : 'USD';
      setCurrencyState(defaultCurrency);
    }
  }, [language]);

  const initializeCurrency = async () => {
    try {
      // First check if user is logged in and has a currency preference
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success && response.data.data.user?.profile?.currency) {
            const userCurrency = response.data.data.user.profile.currency as Currency;
            setCurrencyState(userCurrency);
            localStorage.setItem(CURRENCY_STORAGE_KEY, userCurrency);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to fetch user currency preference:', error);
        }
      }

      // Fall back to localStorage
      const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null;
      if (storedCurrency && (storedCurrency === 'USD' || storedCurrency === 'ILS')) {
        setCurrencyState(storedCurrency);
      } else {
        // Default based on language
        const defaultCurrency = language === 'he' ? 'ILS' : 'USD';
        setCurrencyState(defaultCurrency);
        localStorage.setItem(CURRENCY_STORAGE_KEY, defaultCurrency);
      }
    } catch (error) {
      console.error('Error initializing currency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrency = useCallback(async (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);

    // If user is logged in, save to backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.put('/user/currency', { currency: newCurrency });
      } catch (error) {
        console.error('Failed to save currency preference to server:', error);
        // Don't throw - the currency is still changed locally
      }
    }
  }, []);

  const formatCurrency = useCallback(
    (amount: number, overrideCurrency?: Currency) => {
      return formatCurrencyUtil(amount, overrideCurrency || currency);
    },
    [currency]
  );

  const formatCurrencyCompact = useCallback(
    (amount: number, overrideCurrency?: Currency) => {
      return formatCurrencyCompactUtil(amount, overrideCurrency || currency);
    },
    [currency]
  );

  const convertCurrency = useCallback(
    (amount: number, from: Currency, to: Currency) => {
      return convertCurrencyUtil(amount, from, to);
    },
    []
  );

  const formatBookPrice = useCallback(
    (priceUSD: number, priceILS?: number) => {
      return formatBookPriceUtil(priceUSD, priceILS, currency);
    },
    [currency]
  );

  const getCurrencySymbol = useCallback(
    (overrideCurrency?: Currency) => {
      return getCurrencySymbolUtil(overrideCurrency || currency);
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        formatCurrencyCompact,
        convertCurrency,
        formatBookPrice,
        getCurrencySymbol,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

// Re-export Currency type for convenience
export type { Currency };
