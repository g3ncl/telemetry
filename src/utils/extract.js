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
      ffmpeg.on("log", ({ message }) => {});
      ffmpeg.on("progress", ({ progress }) => {
        progressFunction(progress / 2);
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

      const worker = new Worker(new URL("./worker.js", import.meta.url));
      var startTime;
      worker.onmessage = function (event) {
        const { type, data } = event.data;
        if (type === "progress") {
          progressFunction(0.5 + data / 2);
        } else if (type === "result") {
          worker.terminate();
          const endTime = performance.now();
          resolve(data);
        }
      };
      startTime = performance.now();
      worker.postMessage(rawFile);
    } catch (error) {
      reject(error);
    }
  });
};

export default extractTelemetry;
