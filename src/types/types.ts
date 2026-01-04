/** A point with longitude, latitude, and elevation [lon, lat, elevation] */
export type Point = [number, number, number];

/** GeoJSON Feature for telemetry data */
export interface GeoJSON {
  type: string;
  geometry: {
    type: string;
    coordinates: Point[];
  };
  properties: {
    device: string;
    AbsoluteUtcMicroSec: number[];
    sessionStartTime: number;
    driverName: string;
  };
}

/** A single lap extracted from telemetry */
export interface Lap {
  data: GeoJSON;
  lapTime: number;
  lapNumber: number;
}

/** A lap saved to IndexedDB */
export interface SavedLap {
  id: string;
  driverName: string;
  trackName: string;
  lapNumber: number;
  lapTime: number;
  /** Session start time in milliseconds */
  sessionTime: number;
  data: GeoJSON;
  savedAt: number;
}

/** Track definition with finish line coordinates */
export interface Track {
  name: string;
  length: number;
  /** Finish line start point [lon, lat] */
  fLStart: [number, number];
  /** Finish line end point [lon, lat] */
  fLEnd: [number, number];
}

/** A track saved in the database for reference (especially for non-GPS telemetry) */
export interface SavedTrack {
  id: string;
  name: string;
  length: number; // in meters
  fLStart?: [number, number];
  fLEnd?: [number, number];
  notes?: string;
  isSystem?: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Navigation section identifiers */
export type Section = 'extract' | 'saved' | 'analyze' | 'settings' | 'tracks';

/** Navigation item configuration */
export interface NavItem {
  id: Section;
  labelKey: string;
  icon: React.ReactNode;
}
