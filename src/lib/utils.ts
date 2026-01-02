import {
    EARTH_RADIUS_METERS,
    MILLISECONDS_PER_SECOND,
    SECONDS_PER_MINUTE,
} from '@/constants';

/**
 * Calculate the Haversine distance between two geographic points.
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in meters
 */
export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Format lap time in milliseconds to a readable string.
 * @param lapTimeMs Lap time in milliseconds
 * @returns Formatted string like "1:23.45" or "23.45"
 */
export const formatLapTime = (lapTimeMs: number | null | undefined): string => {
  if (lapTimeMs === null || lapTimeMs === undefined || isNaN(lapTimeMs)) {
    return 'N/A';
  }

  const minutes = Math.floor(lapTimeMs / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE));
  const seconds = Math.floor(
    (lapTimeMs % (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE)) / MILLISECONDS_PER_SECOND
  );
  const centiseconds = Math.floor((lapTimeMs % MILLISECONDS_PER_SECOND) / 10);
  const ms = centiseconds.toString().padStart(2, '0');

  return minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}.${ms}`
    : `${seconds}.${ms}`;
};

/**
 * Format a timestamp to a localized date string.
 * @param timestampMs Timestamp in milliseconds
 * @param locale Locale for formatting (defaults to browser locale)
 * @param options Intl.DateTimeFormat options
 */
export const formatTimestamp = (
  timestampMs: number | null | undefined,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!timestampMs || isNaN(timestampMs)) {
    return '—';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  };

  return new Intl.DateTimeFormat(locale ?? navigator.language, options ?? defaultOptions).format(
    new Date(timestampMs)
  );
};

/**
 * Format a short date (without year).
 */
export const formatShortDate = (timestampMs: number | null | undefined, locale?: string): string => {
  return formatTimestamp(timestampMs, locale, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: 'numeric',
  });
};

/**
 * Download data as a file.
 * @param data Data to download (string or object to be JSON stringified)
 * @param filename Filename for the download
 * @param mimeType MIME type of the file
 */
export const downloadFile = (
  data: string | object,
  filename: string,
  mimeType: string = 'application/json'
): void => {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Get file extension from filename.
 */
export const getFileExtension = (filename: string): string => {
  return filename.toLowerCase().split('.').pop() ?? '';
};

/**
 * Blend two hex colors at a given opacity.
 * @param foreground Foreground hex color (e.g., '#ff0000')
 * @param background Background hex color (e.g., '#ffffff')
 * @param opacity Opacity of foreground (0-1)
 * @returns Blended color as rgb() string
 */
export const blendColors = (foreground: string, background: string, opacity: number): string => {
  const fg = foreground.replace('#', '');
  const r1 = parseInt(fg.substring(0, 2), 16);
  const g1 = parseInt(fg.substring(2, 4), 16);
  const b1 = parseInt(fg.substring(4, 6), 16);
  const bg = background.replace('#', '');
  const r2 = parseInt(bg.substring(0, 2), 16);
  const g2 = parseInt(bg.substring(2, 4), 16);
  const b2 = parseInt(bg.substring(4, 6), 16);
  const r = Math.round(r1 * opacity + r2 * (1 - opacity));
  const g = Math.round(g1 * opacity + g2 * (1 - opacity));
  const b = Math.round(b1 * opacity + b2 * (1 - opacity));
  return `rgb(${r}, ${g}, ${b})`;
};
