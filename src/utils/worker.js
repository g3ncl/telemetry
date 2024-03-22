import { goProTelemetry } from "gopro-telemetry";

const progressHandler = (progress) => {
  self.postMessage({ type: "progress", data: progress });
};

self.onmessage = async function (event) {
  console.log(event);
  const data = event.data;
  console.log("receivng data");
  self.postMessage({ type: "progress", data: 1 });
  console.log("starting");
  const telemetry = await goProTelemetry(
    { rawData: data },
    {
      stream: ["GPS"],
      GPSFix: 3,
      preset: "geojson",
      progress: progressHandler,
    }
  );
  console.log("completed", telemetry);
  self.postMessage({ type: "result", data: telemetry });
};
