import { tracks as HARDCODED_TRACKS } from '@/utils/tracks';
import type { Lap, SavedLap, SavedTrack } from '@/types/types';
import { DBSchema, IDBPDatabase, openDB } from 'idb';

// Fallback UUID generator for browsers without crypto.randomUUID
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers or non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface TelemetryDB extends DBSchema {
  laps: {
    key: string;
    value: SavedLap;
    indexes: { 'by-date': number };
  };
  tracks: {
    key: string;
    value: SavedTrack;
    indexes: { 'by-name': string };
  };
}

const DB_NAME = 'kart-telemetry';
const DB_VERSION = 4; // Incremented for system track flag

let dbPromise: Promise<IDBPDatabase<TelemetryDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<TelemetryDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<TelemetryDB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('laps', { keyPath: 'id' });
          store.createIndex('by-date', 'savedAt');
        }
        if (oldVersion < 2) {
          const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
          trackStore.createIndex('by-name', 'name');
        }
        
        const trackStore = transaction.objectStore('tracks');
        
        // Ensure system tracks exist and are marked as system
        const now = Date.now();
        for (const track of HARDCODED_TRACKS) {
           // Try to find existing track by name (scan) or just add if empty
           let existingId: string | undefined;
           let cursor = await trackStore.index('by-name').openCursor(track.name);
           if (cursor) {
             existingId = cursor.value.id;
           }

           const savedTrack: SavedTrack = {
             id: existingId ?? generateId(),
             name: track.name,
             length: track.length, 
             fLStart: track.fLStart,
             fLEnd: track.fLEnd,
             createdAt: cursor?.value.createdAt ?? now,
             updatedAt: now,
             notes: 'Preloaded system track',
             isSystem: true,
           };
           await trackStore.put(savedTrack);
        }
      },
    });
  }
  return dbPromise;
};

/**
 * Find an existing lap by session, track, and lap number.
 * Used to detect duplicates.
 */
const findExistingLap = async (
  sessionTime: number,
  trackName: string,
  lapNumber: number
): Promise<SavedLap | undefined> => {
  const db = await getDB();
  const allLaps = await db.getAll('laps');
  return allLaps.find(
    (l) =>
      l.sessionTime === sessionTime &&
      l.trackName === trackName &&
      l.lapNumber === lapNumber
  );
};

/**
 * Save a lap to the database.
 * If a lap with the same session, track, and lap number exists, it will be overwritten.
 */
export const saveLap = async (
  lap: Lap,
  driverName: string,
  trackName: string,
  sessionTime: number
): Promise<SavedLap> => {
  try {
    const db = await getDB();

    // Check for existing lap (same session + track + lap number)
    const existingLap = await findExistingLap(sessionTime, trackName, lap.lapNumber);

    const savedLap: SavedLap = {
      // Keep existing ID if updating, otherwise generate new one
      id: existingLap?.id ?? generateId(),
      driverName,
      trackName,
      lapNumber: lap.lapNumber,
      lapTime: lap.lapTime,
      sessionTime,
      data: lap.data,
      savedAt: Date.now(),
    };

    await db.put('laps', savedLap);
    return savedLap;
  } catch (error) {
    console.error('Failed to save lap to IndexedDB:', error);
    throw error;
  }
};

export const getAllLaps = async (): Promise<SavedLap[]> => {
  const db = await getDB();
  return db.getAllFromIndex('laps', 'by-date');
};

export const deleteLap = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('laps', id);
};

export const updateLapDriver = async (
  id: string,
  driverName: string
): Promise<void> => {
  const db = await getDB();
  const lap = await db.get('laps', id);
  if (lap) {
    lap.driverName = driverName;
    await db.put('laps', lap);
  }
};

export const clearAllLaps = async (): Promise<void> => {
  const db = await getDB();
  await db.clear('laps');
};

/**
 * Bulk import laps.
 * Note: This does not clear existing laps, it appends/overwrites based on key.
 * The caller should handle clearing if a full restore is desired.
 */
export const importLaps = async (laps: SavedLap[]): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('laps', 'readwrite');
  const store = tx.objectStore('laps');
  await Promise.all(laps.map((lap) => store.put(lap)));
  await tx.done;
};

// --- Track Management ---

export const saveTrack = async (track: Omit<SavedTrack, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<SavedTrack> => {
  const db = await getDB();
  const now = Date.now();
  
  if (track.id) {
    const existing = await db.get('tracks', track.id);
    if (existing?.isSystem) {
      throw new Error('Cannot edit system tracks');
    }
  }

  const savedTrack: SavedTrack = {
    id: track.id ?? generateId(),
    name: track.name,
    length: track.length,
    fLStart: track.fLStart,
    fLEnd: track.fLEnd,
    notes: track.notes,
    createdAt: track.id ? (await db.get('tracks', track.id))?.createdAt ?? now : now,
    updatedAt: now,
  };

  await db.put('tracks', savedTrack);
  return savedTrack;
};

export const getAllTracks = async (): Promise<SavedTrack[]> => {
  const db = await getDB();
  return db.getAllFromIndex('tracks', 'by-name');
};

export const deleteTrack = async (id: string): Promise<void> => {
  const db = await getDB();
  const track = await db.get('tracks', id);
  if (track?.isSystem) {
    throw new Error('Cannot delete system tracks');
  }
  await db.delete('tracks', id);
};
