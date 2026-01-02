'use client';

import { getAllLaps } from '@/lib/db';
import type { SavedLap } from '@/types/types';
import { useCallback, useEffect, useState } from 'react';

interface UseLapsResult {
  laps: SavedLap[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Shared hook for loading laps from IndexedDB.
 * Returns laps sorted by date (newest first).
 */
export function useLaps(): UseLapsResult {
  const [laps, setLaps] = useState<SavedLap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLaps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const savedLaps = await getAllLaps();
      setLaps(savedLaps.reverse());
    } catch (err) {
      console.error('Failed to load laps:', err);
      setError(err instanceof Error ? err.message : 'Failed to load laps');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLaps();
  }, [loadLaps]);

  return {
    laps,
    loading,
    error,
    refetch: loadLaps,
  };
}
