import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enEditor from './locales/en/editor.json';
import enSettings from './locales/en/settings.json';
import enMarketplace from './locales/en/marketplace.json';
import enMemorial from './locales/en/memorial.json';

// Import Hebrew translations
import heCommon from './locales/he/common.json';
import heAuth from './locales/he/auth.json';
import heDashboard from './locales/he/dashboard.json';
import heEditor from './locales/he/editor.json';
import heSettings from './locales/he/settings.json';
import heMarketplace from './locales/he/marketplace.json';
import heMemorial from './locales/he/memorial.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    editor: enEditor,
    settings: enSettings,
    marketplace: enMarketplace,
    memorial: enMemorial,
  },
  he: {
    common: heCommon,
    auth: heAuth,
    dashboard: heDashboard,
    editor: heEditor,
    settings: heSettings,
    marketplace: heMarketplace,
    memorial: heMemorial,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'he'],
    ns: ['common', 'auth', 'dashboard', 'editor', 'settings', 'marketplace', 'memorial'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'mestory-language',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
