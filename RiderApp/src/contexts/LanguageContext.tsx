import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n/config';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = '@app_language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState(i18n.language);
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  useEffect(() => {
    // Load saved language on mount
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        await changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const changeLanguage = async (lang: string) => {
    try {
      // Change i18n language
      await i18n.changeLanguage(lang);
      
      // Update RTL
      const newIsRTL = lang === 'ur';
      if (I18nManager.isRTL !== newIsRTL) {
        I18nManager.forceRTL(newIsRTL);
        I18nManager.allowRTL(newIsRTL);
      }
      
      setLanguageState(lang);
      setIsRTL(newIsRTL);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const setLanguage = async (lang: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      await changeLanguage(lang);
      
      // Note: For RTL to fully take effect, app needs to be restarted
      // You might want to show an alert to the user about this
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};



