import { INTERPOLATION_FACTOR, MICROSECONDS_PER_MILLISECOND } from '@/constants';
import type { GeoJSON, Lap, Point } from '@/types/types';
import { tracks } from './tracks';

/**
 * Interpolate GPS coordinates to increase temporal resolution.
 * Creates INTERPOLATION_FACTOR intermediate points between each GPS sample.
 */
const interpolateGeoJSON = (geoJSON: GeoJSON): GeoJSON => {
  const { geometry, properties } = geoJSON;

  const newCoordinates: Point[] = [];
  const newTimestamps: number[] = [];

  for (let i = 0; i < geometry.coordinates.length - 1; i++) {
    const currentCoord = geometry.coordinates[i];
    const nextCoord = geometry.coordinates[i + 1];

    const currentTimestamp = properties.AbsoluteUtcMicroSec[i];
    const nextTimestamp = properties.AbsoluteUtcMicroSec[i + 1];

    // Calculate step sizes for coordinates and timestamps
    const coordStep = [
      (nextCoord[0] - currentCoord[0]) / INTERPOLATION_FACTOR,
      (nextCoord[1] - currentCoord[1]) / INTERPOLATION_FACTOR,
      (nextCoord[2] - currentCoord[2]) / INTERPOLATION_FACTOR,
    ];
    const timestampStep = (nextTimestamp - currentTimestamp) / INTERPOLATION_FACTOR;

    // Interpolate new coordinates and timestamps
    for (let j = 0; j < INTERPOLATION_FACTOR; j++) {
      const newCoord: Point = [
        currentCoord[0] + j * coordStep[0],
        currentCoord[1] + j * coordStep[1],
        currentCoord[2] + j * coordStep[2],
      ];
      newCoordinates.push(newCoord);
      newTimestamps.push(currentTimestamp + j * timestampStep);
    }
  }

  // Add the last coordinate and timestamp
  newCoordinates.push(geometry.coordinates[geometry.coordinates.length - 1]);
  newTimestamps.push(properties.AbsoluteUtcMicroSec[properties.AbsoluteUtcMicroSec.length - 1]);

  return {
    type: geoJSON.type,
    geometry: {
      type: geometry.type,
      coordinates: newCoordinates,
    },
    properties: {
      device: properties.device,
      AbsoluteUtcMicroSec: newTimestamps,
      sessionStartTime: properties.AbsoluteUtcMicroSec[0],
      driverName: properties.driverName,
    },
  };
};

/**
 * Calculate orientation of triplet (p, q, r).
 * @returns 0 if collinear, 1 if clockwise, 2 if counterclockwise
 */
const orientation = (
  p: [number, number],
  q: [number, number],
  r: [number, number]
): number => {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (val === 0) return 0; // collinear
  return val > 0 ? 1 : 2; // clockwise or counterclockwise
};

/**
 * Check if point q lies on segment pr.
 */
const onSegment = (
  p: [number, number],
  q: [number, number],
  r: [number, number]
): boolean => {
  return (
    q[0] <= Math.max(p[0], r[0]) &&
    q[0] >= Math.min(p[0], r[0]) &&
    q[1] <= Math.max(p[1], r[1]) &&
    q[1] >= Math.min(p[1], r[1])
  );
};

/**
 * Check if the path from previousPoint to point crosses the finish line.
 * Uses orientation-based line intersection algorithm.
 */
const crossedTheFinishLine = (
  point: [number, number],
  previousPoint: [number, number],
  trackIndex: number = 0
): boolean => {
  const fLStart = tracks[trackIndex].fLStart;
  const fLEnd = tracks[trackIndex].fLEnd;

  // Check if two segments intersect
  const o1 = orientation(previousPoint, point, fLStart);
  const o2 = orientation(previousPoint, point, fLEnd);
  const o3 = orientation(fLStart, fLEnd, previousPoint);
  const o4 = orientation(fLStart, fLEnd, point);

  // General case
  if (o1 !== o2 && o3 !== o4) return true;

  // Special Cases - collinear points
  if (o1 === 0 && onSegment(previousPoint, fLStart, point)) return true;
  if (o2 === 0 && onSegment(previousPoint, fLEnd, point)) return true;
  if (o3 === 0 && onSegment(fLStart, previousPoint, fLEnd)) return true;
  if (o4 === 0 && onSegment(fLStart, point, fLEnd)) return true;

  return false;
};

/**
 * Split telemetry data into individual laps based on finish line crossings.
 * @param data GeoJSON telemetry data
 * @param trackIndex Index of the track to use for finish line detection
 * @returns Array of Lap objects
 */
const splitTelemetryByLaps = (data: GeoJSON, trackIndex: number = 0): Lap[] => {
  try {
    const interpolatedData = interpolateGeoJSON(data);
    const laps: Lap[] = [];
    let lapNumber = 0;
    let currentLap: GeoJSON = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [] },
      properties: {
        device: interpolatedData.properties.device,
        AbsoluteUtcMicroSec: [],
        sessionStartTime: interpolatedData.properties.AbsoluteUtcMicroSec[0] || 0,
        driverName: interpolatedData.properties.driverName,
      },
    };

    let lapStartTimestamp = interpolatedData.properties.AbsoluteUtcMicroSec[0];

    // Iterate through coordinates and split at finish line crossings
    const coordinates = interpolatedData.geometry.coordinates;
    for (let i = 0; i < coordinates.length; i++) {
      const point = coordinates[i];
      const pointTime = interpolatedData.properties.AbsoluteUtcMicroSec[i];

      // Check for finish line crossing
      if (
        i !== 0 &&
        crossedTheFinishLine(
          [point[0], point[1]],
          [coordinates[i - 1][0], coordinates[i - 1][1]],
          trackIndex
        )
      ) {
        // Don't save first segment (incomplete lap before first crossing)
        if (lapNumber > 0) {
          // Save the current lap (convert microseconds to milliseconds)
          laps.push({
            data: currentLap,
            lapTime: (pointTime - lapStartTimestamp) / MICROSECONDS_PER_MILLISECOND,
            lapNumber: lapNumber,
          });
        }

        // Reset for the next lap
        lapNumber++;
        currentLap = {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [] },
          properties: {
            device: interpolatedData.properties.device,
            AbsoluteUtcMicroSec: [],
            sessionStartTime: interpolatedData.properties.AbsoluteUtcMicroSec[0] || 0,
            driverName: interpolatedData.properties.driverName,
          },
        };
        lapStartTimestamp = pointTime;
      }

      // Add the point to the current lap
      currentLap.geometry.coordinates.push(point);
      currentLap.properties.AbsoluteUtcMicroSec.push(pointTime);
    }

    return laps;
  } catch (error) {
    console.error('Error splitting telemetry by laps:', error);
    return [];
  }
};

export default splitTelemetryByLaps;
