'use client';

import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from '@/constants';
import { useBasePath } from '@/hooks/useBasePath';
import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { en, type TranslationKeys } from './locales/en';
import { it } from './locales/it';

// Locale cookie name
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

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
  locale: Locale;
}

// Provider component
export function I18nProvider({ children, locale }: I18nProviderProps) {
  const t = translations[locale] ?? translations[DEFAULT_LOCALE];
  const router = useRouter();
  const pathname = usePathname();
  const basePath = useBasePath();

  // Sync localStorage to cookie on mount (in case cookie was cleared but localStorage exists)
  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_COOKIE_NAME);
    if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale as Locale)) {
      // Ensure cookie matches localStorage
      document.cookie = `${LOCALE_COOKIE_NAME}=${storedLocale};path=/;max-age=31536000`;
    } else {
      // Save current locale to localStorage
      localStorage.setItem(LOCALE_COOKIE_NAME, locale);
    }
  }, [locale]);

  // Set locale by navigating and setting cookie + localStorage
  const setLocale = useCallback(
    (newLocale: Locale) => {
      // Set cookie for middleware
      document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale};path=/;max-age=31536000`;
      // Also save to localStorage for persistence
      localStorage.setItem(LOCALE_COOKIE_NAME, newLocale);

      // Strip basePath first, then locale
      let normalizedPath = pathname;
      if (basePath && normalizedPath.startsWith(basePath)) {
        normalizedPath = normalizedPath.slice(basePath.length);
      }
      const pathWithoutLocale = normalizedPath.replace(/^\/(en|it)/, '');
      const newPath = `${basePath}/${newLocale}${pathWithoutLocale || '/'}`;
      router.push(newPath);
    },
    [pathname, router, basePath]
  );

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
  };

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
