'use client';

import { useBasePath } from '@/hooks/useBasePath';
import { useI18n } from '@/lib/i18n';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Shared hook for checking if a route is active.
 * Handles locale-prefixed paths and base path when proxied via g3n.cl.
 */
export function useActiveRoute() {
  const { locale } = useI18n();
  const pathname = usePathname();
  const basePath = useBasePath();

  // Strip base path prefix for route matching
  const normalizedPathname = basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  const isActive = useCallback(
    (path: string) => {
      const expectedPath = `/${locale}${path}`;
      // Handle root path: /telemetry normalizes to empty, which should NOT match any specific route
      if (!normalizedPathname || normalizedPathname === '/') {
        return false;
      }
      return normalizedPathname === expectedPath;
    },
    [normalizedPathname, locale]
  );

  return { isActive, pathname, locale };
}

