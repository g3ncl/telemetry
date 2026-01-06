'use client';

import { useMemo } from 'react';

/**
 * Expected site URL from environment (e.g., kart-telemetry.netlify.app).
 * When the current hostname differs, we're being proxied and need a base path.
 */
const EXPECTED_HOST = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SITE_URL;
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
})();

/**
 * Returns the base path prefix based on hostname comparison.
 * When accessed via a different domain (proxy), returns '/telemetry'.
 * Otherwise returns empty string for standalone/local dev.
 */
export function useBasePath(): string {
  const basePath = useMemo(() => {
    if (typeof window === 'undefined') {
      // SSR: can't detect, return empty (will hydrate correctly on client)
      return '';
    }

    const currentHost = window.location.hostname;

    // If we have an expected host and current doesn't match, we're proxied
    if (EXPECTED_HOST && currentHost !== EXPECTED_HOST && currentHost !== 'localhost') {
      return '/telemetry';
    }

    return '';
  }, []);

  return basePath;
}
