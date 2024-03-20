import { FFmpeg } from "@ffmpeg/ffmpeg";
import { FFprobeWorker } from "ffprobe-wasm";

const getStreamIndex = async (file) => {
  try {
    const worker = new FFprobeWorker();
    const fileInfo = await worker.getFileInfo(file);
    const stream = fileInfo.streams.find((stream) =>
      stream.tags.handler_name.includes("GoPro MET")
    );
    if (stream) {
      return stream.index;
    } else {
      throw new Error("No stream with GoPro MET handler name found.");
    }
  } catch (error) {
    throw new Error("Error while getting stream index: " + error.message);
  }
};

const extractTelemetry = async (file, progressFunction) => {
  return new Promise(async (resolve, reject) => {
    try {
      const ffmpeg = new FFmpeg();
      ffmpeg.on("log", ({ message }) => {
        console.log(message);
      });
      ffmpeg.on("progress", ({ progress }) => {
        progressFunction(progress);
        console.log(progress * 100);
      });

      await ffmpeg.load({
        coreURL: `/ffmpeg-core.js`,
        wasmURL: `/ffmpeg-core.wasm`,
      });

      const index = await getStreamIndex(file);

      const inputDir = "/input";
      const inputFile = `${inputDir}/${file.name}`;
      await ffmpeg.createDir(inputDir);
      await ffmpeg.mount(
        "WORKERFS",
        {
          files: [file],
        },
        inputDir
      );

      await ffmpeg.exec([
        "-i",
        inputFile,
        "-map",
        `0:${index}`,
        "-copy_unknown",
        "-f",
        "data",
        "telemetry.bin",
      ]);
      const rawFile = await ffmpeg.readFile("telemetry.bin");
      await ffmpeg.unmount(inputDir);
      await ffmpeg.deleteDir(inputDir);
      ffmpeg.terminate();

      const fileReader = new FileReader();
      fileReader.onload = function (event) {
        const base64String = btoa(event.target.result);

        // Create a JSON object including the Base64 string
        const jsonObject = {
          binaryData: base64String,
        };

        // Convert JSON object to a JSON string
        const jsonString = JSON.stringify(jsonObject);

        // Make the POST request
        fetch("/api/telemetry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Specify JSON content type
          },
          body: jsonString,
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch GeoJSON: ${response.status}`);
            }
            const geojsonBlob = await response.blob();
            const geojsonURL = URL.createObjectURL(geojsonBlob);
            resolve(geojsonURL);
          })
          .catch((error) => {
            reject(error);
          });
      };

      // Read the file
      const blob = new Blob([rawFile]);
      fileReader.readAsBinaryString(blob);
    } catch (error) {
      reject(error);
    }
  });
};

export default extractTelemetry;
