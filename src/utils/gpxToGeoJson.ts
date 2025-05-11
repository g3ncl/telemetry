/**
 * Converts a GPX XML string to a GeoJSON object.
 * Only supports basic GPX with <trkpt> elements.
 */
export async function convertGpxToGeoJson(gpxString: string): Promise<GeoJSON> {
  // Parse the GPX XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxString, "application/xml");
  const trkpts = Array.from(xmlDoc.getElementsByTagName("trkpt"));

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
    const time = timeStr ? Date.parse(timeStr) : 0;

    coordinates.push([lon, lat, ele]);
    timestamps.push(time);
  }

  // Use the first timestamp as sessionStartTime
  const sessionStartTime = timestamps[0] || 0;

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
    },
  };
}
