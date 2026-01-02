import type { GeoJSON } from '@/types/types';

/**
 * Converts a GPX XML string to a GeoJSON object.
 * Only supports basic GPX with <trkpt> elements.
 */
export async function convertGpxToGeoJson(gpxString: string): Promise<GeoJSON> {
  // Validate XML structure
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxString, "application/xml");

  // Check for XML parsing errors
  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Invalid GPX file: XML parsing failed");
  }
  const trkpts = Array.from(xmlDoc.getElementsByTagName("trkpt"));

  if (trkpts.length === 0) {
    throw new Error("Invalid GPX file: No track points found");
  }

  // Extract coordinates and timestamps
  const coordinates: [number, number, number][] = [];
  const timestamps: number[] = [];

  for (const pt of trkpts) {
    const lat = parseFloat(pt.getAttribute("lat") || "0");
    const lon = parseFloat(pt.getAttribute("lon") || "0");
    const ele = parseFloat(
      pt.getElementsByTagName("ele")[0]?.textContent || "0"
    );
    const timeStr = pt.getElementsByTagName("time")[0]?.textContent || "";
    const time = timeStr ? Date.parse(timeStr) * 1000 : 0; // Convert ms to microseconds

    coordinates.push([lon, lat, ele]);
    timestamps.push(time);
  }

  // Use the first timestamp as sessionStartTime (in ms for display)
  const sessionStartTime = timestamps[0] ? timestamps[0] / 1000 : 0;

  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates,
    },
    properties: {
      device: "GPX",
      AbsoluteUtcMicroSec: timestamps,
      sessionStartTime,
      driverName: "",
    },
  };
}
