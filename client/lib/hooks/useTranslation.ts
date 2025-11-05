import { useState, useEffect } from 'react';
import { translations, TranslationKey, Language } from '../translations';

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedAppearance = localStorage.getItem('appearanceSettings');
    if (savedAppearance) {
      const settings = JSON.parse(savedAppearance);
      if (settings.language && translations[settings.language as Language]) {
        setLanguage(settings.language as Language);
      }
    }

    // Listen for language changes
    const handleStorageChange = () => {
      const savedAppearance = localStorage.getItem('appearanceSettings');
      if (savedAppearance) {
        const settings = JSON.parse(savedAppearance);
        if (settings.language && translations[settings.language as Language]) {
          setLanguage(settings.language as Language);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener('languageChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChange', handleStorageChange);
    };
  }, []);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return { t, language, setLanguage };
};
