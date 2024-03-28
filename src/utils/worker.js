import { goProTelemetry } from "gopro-telemetry";

const progressHandler = (progress) => {
  self.postMessage({ type: "progress", data: progress });
};

self.onmessage = async function (event) {
  const data = event.data;
  self.postMessage({ type: "progress", data: 1 });
  const telemetry = await goProTelemetry(
    { rawData: data },
    {
      stream: ["GPS"],
      GPSFix: 3,
      preset: "geojson",
      progress: progressHandler,
    }
  );
  self.postMessage({ type: "result", data: telemetry });
};
