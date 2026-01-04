import { TRACK_DETECTION_THRESHOLD_METERS } from '@/constants';
import { haversineDistance } from '@/lib/utils';
import type { GeoJSON, SavedTrack, Track } from '@/types/types';

// Track definitions with names and finish line coordinates
export const tracks: Track[] = [
  {
    name: 'Tito',
    length: 424,
    fLStart: [15.724561, 40.597828],
    fLEnd: [15.724723, 40.59782],
  },
  {
    name: 'Salandra',
    length: 915,
    fLStart: [16.311973832554074, 40.56100840695992],
    fLEnd: [16.311696223947372, 40.56096408671552],
  },
];

/**
 * Calculate center point of a track (midpoint of finish line).
 * @returns [lon, lat] coordinates
 */
const getTrackCenter = (track: Track): [number, number] => {
  return [
    (track.fLStart[0] + track.fLEnd[0]) / 2,
    (track.fLStart[1] + track.fLEnd[1]) / 2,
  ];
};

/**
 * Calculate average coordinate from GeoJSON data.
 * @returns [lon, lat] coordinates
 */
const getAverageCoordinate = (data: GeoJSON): [number, number] => {
  const coords = data.geometry.coordinates;
  if (coords.length === 0) return [0, 0];

  const sum = coords.reduce(
    (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
    [0, 0]
  );
  return [sum[0] / coords.length, sum[1] / coords.length];
};

/**
 * Detect track from GPS data.
 * @param data GeoJSON telemetry data
 * @param availableTracks List of tracks to check against
 * @param thresholdMeters Maximum distance in meters to consider a match
 * @returns Track index or -1 if no track found within threshold
 */
export const detectTrack = (
  data: GeoJSON,
  availableTracks: (Track | SavedTrack)[],
  thresholdMeters: number = TRACK_DETECTION_THRESHOLD_METERS
): number => {
  const avgCoord = getAverageCoordinate(data);

  let closestIndex = -1;
  let closestDistance = Infinity;

  for (let i = 0; i < availableTracks.length; i++) {
    const track = availableTracks[i];
    // Skip tracks without coordinates
    if (!track.fLStart || !track.fLEnd) continue;

    const trackCenter = getTrackCenter(track as Track);
    // Note: haversineDistance expects (lat1, lon1, lat2, lon2)
    // avgCoord and trackCenter are [lon, lat]
    const distance = haversineDistance(
      avgCoord[1],
      avgCoord[0],
      trackCenter[1],
      trackCenter[0]
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }

  return closestDistance <= thresholdMeters ? closestIndex : -1;
};

/**
 * Get array of track names.
 */
export const getTrackNames = (): string[] => tracks.map((t) => t.name);
