import { deleteTrack, getAllTracks, saveTrack } from '@/lib/db';
import type { SavedTrack } from '@/types/types';
import { useCallback, useEffect, useState } from 'react';

export const useTracks = () => {
  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllTracks();
      // Sort by name by default
      data.sort((a, b) => a.name.localeCompare(b.name));
      setTracks(data);
    } catch (err) {
      console.error('Failed to fetch tracks:', err);
      setError('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  }, []);

  const addOrUpdateTrack = async (track: Omit<SavedTrack, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    try {
      await saveTrack(track);
      await fetchTracks();
    } catch (err) {
      console.error('Failed to save track:', err);
      throw new Error('Failed to save track');
    }
  };

  const removeTrack = async (id: string) => {
    try {
      await deleteTrack(id);
      await fetchTracks();
    } catch (err) {
      console.error('Failed to delete track:', err);
      throw new Error('Failed to delete track');
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  return {
    tracks,
    loading,
    error,
    refreshTracks: fetchTracks,
    addOrUpdateTrack,
    removeTrack,
  };
};
