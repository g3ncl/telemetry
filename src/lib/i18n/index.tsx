'use client';

import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from '@/constants';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { en, type TranslationKeys } from './locales/en';
import { it } from './locales/it';

// Locale storage key
export const LOCALE_STORAGE_KEY = 'telemetry-locale';

// Translations map
const translations: Record<Locale, TranslationKeys> = {
  en,
  it,
};

// Locale display names
export const localeNames: Record<Locale, string> = {
  en: 'English',
  it: 'Italiano',
};

// Context type
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}

// Create context
const I18nContext = createContext<I18nContextType | null>(null);

// Provider props
interface I18nProviderProps {
  children: ReactNode;
}

/**
 * Get initial locale from localStorage or browser preference
 */
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  // Check localStorage first
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }

  // Fallback to browser language
  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  return DEFAULT_LOCALE;
}

// Provider component
export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize locale from localStorage on mount (client-side only)
  useEffect(() => {
    const initialLocale = getInitialLocale();
    setLocaleState(initialLocale);
    setIsInitialized(true);
  }, []);

  const t = translations[locale] ?? translations[DEFAULT_LOCALE];

  // Set locale - updates state and localStorage only (no navigation)
  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    setLocaleState(newLocale);
  }, []);

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
  };

  // Prevent hydration mismatch by not rendering until initialized
  if (!isInitialized) {
    return null;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Hook to use i18n
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

// Helper to interpolate variables in translation strings
export function interpolate(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(variables[key] ?? `{${key}}`));
}

// Get translations for a locale (for use outside React)
export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

// Re-export types and locales
export type { TranslationKeys };
export { SUPPORTED_LOCALES, type Locale };

