import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import nlCommon from './locales/nl/common.json';
import frCommon from './locales/fr/common.json';
import zhHKCommon from './locales/zh-HK/common.json';

const resources = {
  en: {
    common: enCommon,
  },
  nl: {
    common: nlCommon,
  },
  fr: {
    common: frCommon,
  },
  'zh-HK': {
    common: zhHKCommon,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    // Default namespace
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    // Supported languages
    supportedLngs: ['en', 'nl', 'fr', 'zh-HK'],
    
    // Return key if translation is missing
    returnKeyIfMissing: true,
  });

export default i18n;