// Earth constants
export const EARTH_RADIUS_METERS = 6371000;

// GPS interpolation
export const INTERPOLATION_FACTOR = 100; // Points between each GPS sample

// Track detection
export const TRACK_DETECTION_THRESHOLD_METERS = 2000;

// Chart configuration
export const CHART_RESAMPLING_POINTS = 200;

// Default chart colors
export const DEFAULT_CHART_COLORS = {
  driver1: '#3b82f6', // Blue
  driver2: '#f97316', // Orange
};

// Time units
export const MICROSECONDS_PER_MILLISECOND = 1000;
export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;

// File types
export type FileType = 'mp4' | 'gpx' | 'geojson' | 'csv';

// Locales
export const SUPPORTED_LOCALES = ['en', 'it'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'it';
