import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

export type Language = 'en' | 'he';
export type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  isRTL: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'mestory-language';

const getDirection = (lang: Language): Direction => {
  return lang === 'he' ? 'rtl' : 'ltr';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language on mount
  useEffect(() => {
    initializeLanguage();
  }, []);

  // Update document direction when language changes
  useEffect(() => {
    const dir = getDirection(language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    document.body.dir = dir;
  }, [language]);

  const initializeLanguage = async () => {
    try {
      // First check if user is logged in and has a language preference
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success && response.data.data.user?.profile?.language) {
            const userLang = response.data.data.user.profile.language as Language;
            setLanguageState(userLang);
            i18n.changeLanguage(userLang);
            localStorage.setItem(LANGUAGE_STORAGE_KEY, userLang);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to fetch user language preference:', error);
        }
      }

      // Fall back to localStorage
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      if (storedLang && (storedLang === 'en' || storedLang === 'he')) {
        setLanguageState(storedLang);
        i18n.changeLanguage(storedLang);
      } else {
        // Default to browser language or English
        const browserLang = navigator.language.startsWith('he') ? 'he' : 'en';
        setLanguageState(browserLang);
        i18n.changeLanguage(browserLang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, browserLang);
      }
    } catch (error) {
      console.error('Error initializing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

    // If user is logged in, save to backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.put('/user/language', { language: lang });
      } catch (error) {
        console.error('Failed to save language preference to server:', error);
        // Don't throw - the language is still changed locally
      }
    }
  }, [i18n]);

  const direction = getDirection(language);
  const isRTL = direction === 'rtl';

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        isRTL,
        setLanguage,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper hook for conditional RTL styling
export const useRTL = () => {
  const { isRTL, direction } = useLanguage();

  return {
    isRTL,
    direction,
    // Helper for flex direction
    flexDir: isRTL ? 'flex-row-reverse' : 'flex-row',
    // Helper for text alignment
    textAlign: isRTL ? 'text-right' : 'text-left',
    // Helper for margin/padding start
    ms: (value: string) => isRTL ? `me-${value}` : `ms-${value}`,
    me: (value: string) => isRTL ? `ms-${value}` : `me-${value}`,
  };
};
