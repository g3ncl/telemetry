'use client';

import { useEffect, useState } from 'react';

/**
 * Returns the base path prefix based on the current hostname.
 * When accessed via g3n.cl (rewrite proxy), returns '/telemetry'.
 * Otherwise returns empty string for standalone/local dev.
 */
export function useBasePath(): string {
  const [basePath, setBasePath] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'g3n.cl') {
      setBasePath('/telemetry');
    }
  }, []);

  return basePath;
}
