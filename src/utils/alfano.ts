import type { GeoJSON, Lap, SavedTrack } from '@/types/types';
import JSZip from 'jszip';

export interface AlfanoParams {
  frontSprocket: number;
  rearSprocket: number;
  wheelCircumference: number; // in meters
  track: SavedTrack;
}

interface AlfanoDataPoint {
  rpm: number;
  temp1: number;
  temp2: number;
}

/**
 * Parse Alfano CSV data and convert to GeoJSON using RPM-based speed calculation.
 */
export const processAlfanoZip = async (
  file: File,
  params: AlfanoParams
): Promise<Lap[]> => {
  const zip = await JSZip.loadAsync(file);
  const laps: Lap[] = [];
  
  // Find all LAP_*.csv files
  const lapFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith('LAP_') && name.endsWith('.csv')
  );

  // Sort files numerically by lap number
  lapFiles.sort((a, b) => {
    const numA = parseInt(a.split('_')[1]);
    const numB = parseInt(b.split('_')[1]);
    return numA - numB;
  });

  const ratio = params.rearSprocket / params.frontSprocket;

  for (const fileName of lapFiles) {
    const content = await zip.files[fileName].async('text');
    const lines = content.trim().split('\n');
    const lapNumber = parseInt(fileName.split('_')[1]);
    
    // Skip header
    const dataPoints: AlfanoDataPoint[] = lines.slice(1).map((line) => {
      const parts = line.split(',');
      return {
        rpm: parseInt(parts[1]) || 0,
        temp1: parseInt(parts[2]) || 0,
        temp2: parseInt(parts[3]) || 0,
      };
    });

    if (dataPoints.length === 0) continue;

    // 1. Calculate raw speed and distance for each point (0.1s interval)
    let totalCalculatedDistance = 0;
    const points = dataPoints.map((dp) => {
      // Speed (m/s) = (RPM / 60) * (1 / Ratio) * Circonferenza
      const speedMs = (dp.rpm / 60) * (1 / ratio) * params.wheelCircumference;
      const dist = speedMs * 0.1;
      totalCalculatedDistance += dist;
      return {
        speed: speedMs * 3.6, // km/h
        dist,
        temp1: dp.temp1,
        temp2: dp.temp2,
      };
    });

    // 2. Rubber Banding: Correct distances to match official track length
    const correctionFactor = params.track.length / totalCalculatedDistance;
    let cumulativeDistance = 0;
    
    const coordinates: [number, number, number][] = [];
    const timestamps: number[] = [];
    const lapStartTime = Date.now() * 1000; // Mock session start in microseconds

    points.forEach((p, i) => {
      cumulativeDistance += p.dist * correctionFactor;
      // Map to a linear "track" [distance, 0, elevation]
      coordinates.push([cumulativeDistance, 0, 0]);
      timestamps.push(lapStartTime + i * 100000); // 0.1s = 100,000 microseconds
    });

    const geojson: GeoJSON = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: {
        device: 'Alfano (Calculated)',
        AbsoluteUtcMicroSec: timestamps,
        sessionStartTime: lapStartTime,
        driverName: '',
      },
    };

    laps.push({
      data: geojson,
      lapTime: points.length * 0.1 * 1000, // in milliseconds
      lapNumber,
    });
  }

  return laps;
};
