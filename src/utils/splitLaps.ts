const tracks: { fLStart: [number, number]; fLEnd: [number, number] }[] = [
  {
    fLStart: [15.72450497789204, 40.59783849232635],
    fLEnd: [15.72485480362428, 40.59780996381788],
  }, // Tito
  {
    fLStart: [16.311973832554074, 40.56100840695992],
    fLEnd: [16.311696223947372, 40.56096408671552],
  }, // Salandra
];

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
      (nextCoord[0] - currentCoord[0]) / 100,
      (nextCoord[1] - currentCoord[1]) / 100,
      (nextCoord[2] - currentCoord[2]) / 100,
    ];
    const timestampStep = (nextTimestamp - currentTimestamp) / 100;

    // Interpolate new coordinates and timestamps
    for (let j = 0; j < 100; j++) {
      const newCoord: Point = [
        currentCoord[0] + j * coordStep[0],
        currentCoord[1] + j * coordStep[1],
        currentCoord[2] + j * coordStep[2],
      ];
      newCoordinates.push(newCoord);

      const newTimestamp = currentTimestamp + j * timestampStep;
      newTimestamps.push(newTimestamp);
    }
  }

  // Add the last coordinate and timestamp
  newCoordinates.push(geometry.coordinates[geometry.coordinates.length - 1]);
  newTimestamps.push(
    properties.AbsoluteUtcMicroSec[properties.AbsoluteUtcMicroSec.length - 1]
  );

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
    },
  };
};
const crossedTheFinishLine = (
  point: [number, number],
  previousPoint: [number, number],
  trackIndex: number = 0
): boolean => {
  const fLStart = tracks[trackIndex].fLStart;
  const fLEnd = tracks[trackIndex].fLEnd;

  if (
    point[1] <= Math.min(fLStart[1], fLEnd[1]) ||
    point[1] >= Math.max(fLStart[1], fLEnd[1])
  ) {
    return false;
  }
  // Calculate the latitude of the finish line at the point's longitude using linear interpolation
  const finishLineLatitudeAtPoint =
    ((point[0] - fLStart[0]) * (fLEnd[1] - fLStart[1])) /
      (fLEnd[0] - fLStart[0]) +
    fLStart[1];
  const finishLineLatitudeAtPreviousPoint =
    ((previousPoint[0] - fLStart[0]) * (fLEnd[1] - fLStart[1])) /
      (fLEnd[0] - fLStart[0]) +
    fLStart[1];
  // Check if point latitude is greater or less than the finish line latitude at the point's longitude
  if (
    point[1] >= finishLineLatitudeAtPoint &&
    previousPoint[1] < finishLineLatitudeAtPreviousPoint
  ) {
    return true; // Point crossed the finish line
  }
  return false; // Point did not cross the finish line
};

const splitTelemetryByLaps = (data: GeoJSON, trackIndex: number = 0): Lap[] => {
  // Read the GeoJSON file
  try {
    data = interpolateGeoJSON(data);
    const laps: Lap[] = [];
    let lapNumber = 0;
    let currentLap: GeoJSON = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {
        device: data.properties.device,
        AbsoluteUtcMicroSec: [],
        sessionStartTime: data.properties.AbsoluteUtcMicroSec[0] || 0,
      },
    };

    const driverName = "TEST";

    // Extract first point's timestamp
    var lapStartTimestamp = data.properties.AbsoluteUtcMicroSec[0];

    // Iterate through features and split based on conditions
    const coordinates = data.geometry.coordinates;
    for (let i = 0; i < coordinates.length; i++) {
      var point = coordinates[i];
      var pointTime = data.properties.AbsoluteUtcMicroSec[i];

      // Check conditions for longitude and latitude
      if (
        i !== 0 &&
        crossedTheFinishLine(
          [point[0], point[1]],
          [coordinates[i - 1][0], coordinates[i - 1][1]],
          trackIndex
        )
      ) {
        //Not saving first segment, because is not a complete lap
        if (lapNumber > 0) {
          // Save the current lap details
          laps.push({
            data: currentLap,
            lapTime: pointTime - lapStartTimestamp,
            lapNumber: lapNumber,
          });
        }
        // Reset for the next lap
        lapNumber++;
        currentLap = {
          type: "Feature",
          geometry: { type: "LineString", coordinates: [] },
          properties: {
            device: data.properties.device,
            AbsoluteUtcMicroSec: [],
            sessionStartTime: data.properties.AbsoluteUtcMicroSec[0] || 0,
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
    console.error("Error:", error);
    return [];
  }
};
export default splitTelemetryByLaps;
