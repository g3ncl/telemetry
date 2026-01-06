'use client';

import { useBasePath } from '@/hooks/useBasePath';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Shared hook for checking if a route is active.
 * Handles base path when proxied via g3n.cl.
 */
export function useActiveRoute() {
  const pathname = usePathname();
  const basePath = useBasePath();

  // Strip base path prefix for route matching
  const normalizedPathname = basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  const isActive = useCallback(
    (path: string) => {
      // Handle root path
      if (!normalizedPathname || normalizedPathname === '/') {
        return false;
      }
      return normalizedPathname === path;
    },
    [normalizedPathname]
  );

  return { isActive, pathname };
}
