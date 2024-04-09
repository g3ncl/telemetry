type Point = [number, number, number];

type GeoJSON = {
  type: string;
  geometry: {
    type: string;
    coordinates: Point[];
  };
  properties: {
    device: string;
    AbsoluteUtcMicroSec: number[];
    sessionStartTime: number;
  };
};
type Lap = { data: GeoJSON; lapTime: number; lapNumber: number };
