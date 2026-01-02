'use client';

import { useI18n } from '@/lib/i18n';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Shared hook for checking if a route is active.
 * Handles locale-prefixed paths.
 */
export function useActiveRoute() {
  const { locale } = useI18n();
  const pathname = usePathname();

  const isActive = useCallback(
    (path: string) => pathname === `/${locale}${path}`,
    [pathname, locale]
  );

  return { isActive, pathname, locale };
}
