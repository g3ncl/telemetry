import type { GeoJSON, Point } from '@/types/types';

export async function convertCsvToGeoJson(csvString: string): Promise<GeoJSON> {
  const lines = csvString.split(/\r?\n/);
  
  let dateStr = '';
  let timeStr = '';
  let driverName = '';
  let sessionStartTime = 0; // in ms
  
  // Find metadata
  for (const line of lines) {
    if (line.startsWith('"Date"')) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        // Handle cases where date might contain commas like "Sunday, December 7, 2025"
        // The first part is "Date", the rest is the date string
        // But since it is quoted "Sunday, December 7, 2025", split(',') might split inside the quotes if not careful?
        // Actually, looking at the sample: "Date","Sunday, December 7, 2025"
        // Simple split(',') might give ['"Date"', '"Sunday', ' December 7', ' 2025"']
        // We should probably rely on the fact it's quoted.
        
        // Let's use a simple regex to extract content inside quotes if possible, or just join back.
        // Or simpler: match everything after "Date",
        const match = line.match(/"Date","(.*)"/);
        if (match) {
          dateStr = match[1];
        } else {
           // Fallback for simple structure
           dateStr = parts.slice(1).join(',').replace(/"/g, '').trim();
        }
      }
    }
    if (line.startsWith('"Time"') && !line.includes('"GPS Speed"')) { // Distinguish from data header
      const parts = line.split(',');
      if (parts.length >= 2) {
         timeStr = parts[1].replace(/"/g, '').trim();
      }
    }
    if (line.startsWith('"Racer"')) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        driverName = parts[1].replace(/"/g, '').trim();
      }
    }
    // Stop looking for metadata when we hit the data header usually
    if (line.startsWith('"Time","GPS Speed"')) break;
  }

  if (dateStr) {
    // Attempt to parse date and time
    // format: "Sunday, December 7, 2025" and "1:33 PM"
    const dateTimeStr = `${dateStr} ${timeStr}`.trim();
    const timestamp = Date.parse(dateTimeStr);
    if (!isNaN(timestamp)) {
      sessionStartTime = timestamp;
    }
  }

  // If sessionStartTime is still 0 (failed to parse or missing), default to now or 0
  if (sessionStartTime === 0) {
      sessionStartTime = Date.now();
  }

  // Find data start
  let dataStartIndex = -1;
  let latIndex = -1;
  let lonIndex = -1;
  let altIndex = -1;
  let timeIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('"Time","GPS Speed"')) {
      // Parse header line to find columns
      // We assume headers are quoted
      const headers = line.split(',').map(h => h.replace(/"/g, '').trim());
      timeIndex = headers.indexOf('Time');
      latIndex = headers.indexOf('GPS Latitude');
      lonIndex = headers.indexOf('GPS Longitude');
      altIndex = headers.indexOf('GPS Altitude');
      
      // Data usually starts after this line. 
      // We need to skip units line and potentially empty lines.
      // We will loop from i+1 and check for valid data.
      dataStartIndex = i + 1; 
      break;
    }
  }

  if (latIndex === -1 || lonIndex === -1 || timeIndex === -1) {
    throw new Error('Invalid CSV format: Missing required GPS columns (Time, GPS Latitude, GPS Longitude)');
  }

  const coordinates: Point[] = [];
  const timestamps: number[] = [];

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
    
    // Check if it's a data line (Time should be a number)
    const relativeTimeS = parseFloat(parts[timeIndex]);
    if (isNaN(relativeTimeS)) continue;

    const lat = parseFloat(parts[latIndex]);
    const lon = parseFloat(parts[lonIndex]);
    const ele = altIndex !== -1 ? parseFloat(parts[altIndex]) : 0;

    // Skip invalid coordinates
    if (isNaN(lat) || isNaN(lon)) continue;

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

    coordinates.push([lon, lat, ele]);
    
    // Calculate absolute time in microseconds
    // sessionStartTime is in ms
    // relativeTimeS is in seconds -> convert to ms then to micro if needed?
    // GeoJSON properties.AbsoluteUtcMicroSec expects microseconds.
    // (sessionStartTime * 1000) + (relativeTimeS * 1000000)
    const absoluteTimeMicro = (sessionStartTime * 1000) + (relativeTimeS * 1000000);
    timestamps.push(absoluteTimeMicro);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates,
    },
    properties: {
      device: 'AiM CSV',
      AbsoluteUtcMicroSec: timestamps,
      sessionStartTime: sessionStartTime, // in ms for display
      driverName,
    },
  };
}
