import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';

// Import translations
import en from '../locales/en.json';
import ur from '../locales/ur.json';

// Get device locale with fallback
const deviceLocale = Localization.locale || Localization.getLocales?.()?.[0]?.languageCode || 'en';

// Configure i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      ur: { translation: ur },
    },
    lng: typeof deviceLocale === 'string' && deviceLocale.startsWith('ur') ? 'ur' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Enable RTL for Urdu
export const enableRTL = (language: string) => {
  const isRTL = language === 'ur';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    I18nManager.allowRTL(isRTL);
  }
};

export default i18n;

