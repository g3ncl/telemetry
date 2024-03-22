import { FFmpeg } from "@ffmpeg/ffmpeg";
import { FFprobeWorker } from "ffprobe-wasm";
//import pako from "pako";
//import { goProTelemetry } from "gopro-telemetry";

/*async function bufferToBase64(buffer) {
  // use a FileReader to generate a base64 data URI:
  const base64url = await new Promise((r) => {
    const reader = new FileReader();
    reader.onload = () => r(reader.result);
    reader.readAsDataURL(new Blob([buffer]));
  });
  // remove the `data:...;base64,` part from the start
  return base64url.slice(base64url.indexOf(",") + 1);
}*/

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

      const blob = new Blob([rawFile], { type: "application/octet-stream" });
      const formData = new FormData();

      // Append the File object to the FormData object
      formData.append("file", blob);
      // Make a POST request using fetch
      fetch("/api/extraction/raw-to-gps", {
        method: "POST",
        body: formData,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data)]);
        const url = URL.createObjectURL(blob);
        resolve(url);
      });

      //const compressedData = pako.deflate(rawFile);
      //const base64data = await bufferToBase64(rawFile);
      //resolve(base64data);
      //resolve(rawFile);
      /*const buffer = await blob.arrayBuffer();
      const worker = new Worker(new URL("./worker.js", import.meta.url));
      worker.onmessage = function (event) {
        const { type, data } = event.data;
        if (type === "progress") {
          console.log("Progress:", data);
          progressFunction(data);
        } else if (type === "result") {
          worker.terminate();
          const blob = new Blob([JSON.stringify(data)]);
          const url = URL.createObjectURL(blob);
          console.log(data);
          resolve(url); // Resolve the promise with the URL
        }
      };
      worker.postMessage(Buffer.from(buffer));*/
    } catch (error) {
      reject(error); // Reject the promise if any error occurs
    }
  });
};

export default extractTelemetry;
