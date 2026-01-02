import { FFmpeg } from '@ffmpeg/ffmpeg';
import { FFprobeWorker } from 'ffprobe-wasm';
import type { GeoJSON } from '@/types/types';

type ProgressCallback = (progress: number) => void;

interface FFprobeStream {
  index: number;
  tags: {
    handler_name?: string;
  };
}

interface FFprobeResult {
  streams: FFprobeStream[];
}

interface WorkerMessage {
  type: 'progress' | 'result' | 'error';
  data: number | GeoJSON | string;
}

/**
 * Get the stream index of the GoPro MET telemetry stream.
 */
const getStreamIndex = async (file: File): Promise<number> => {
  try {
    const worker = new FFprobeWorker();
    const fileInfo: FFprobeResult = await worker.getFileInfo(file);
    const stream = fileInfo.streams.find((s) =>
      s.tags?.handler_name?.includes('GoPro MET')
    );

    if (stream) {
      return stream.index;
    } else {
      throw new Error('No stream with GoPro MET handler name found.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error('Error while getting stream index: ' + message);
  }
};

/**
 * Extract telemetry from a GoPro MP4 file.
 * @param file The MP4 file to extract telemetry from
 * @param progressCallback Callback for progress updates (0-1)
 * @returns GeoJSON data with telemetry
 */
const extractTelemetry = async (
  file: File,
  progressCallback: ProgressCallback
): Promise<GeoJSON> => {
  const ffmpeg = new FFmpeg();

  // Log handler (can be used for debugging)
  ffmpeg.on('log', ({ message }) => {
    // Logging disabled in production
    if (process.env.NODE_ENV === 'development') {
      console.debug('[FFmpeg]', message);
    }
  });

  // Progress handler (0-50% of total progress)
  ffmpeg.on('progress', ({ progress }) => {
    progressCallback(progress / 2);
  });

  await ffmpeg.load({
    coreURL: '/ffmpeg-core.js',
    wasmURL: '/ffmpeg-core.wasm',
  });

  const index = await getStreamIndex(file);

  const inputDir = '/input';
  const inputFile = `${inputDir}/${file.name}`;

  await ffmpeg.createDir(inputDir);

  // Extended FFmpeg type to include mount method which is missing in the type definitions
  interface FFmpegWithMount {
    mount: (type: string, options: { files: File[] }, path: string) => Promise<void>;
  }

  // WORKERFS is a valid mount type but not in FFmpeg types
  await (ffmpeg as unknown as FFmpegWithMount).mount(
    'WORKERFS',
    {
      files: [file],
    },
    inputDir
  );

  await ffmpeg.exec([
    '-i',
    inputFile,
    '-map',
    `0:${index}`,
    '-copy_unknown',
    '-f',
    'data',
    'telemetry.bin',
  ]);

  const rawFile = await ffmpeg.readFile('telemetry.bin');

  await ffmpeg.unmount(inputDir);
  await ffmpeg.deleteDir(inputDir);
  ffmpeg.terminate();

  // Create worker to parse telemetry
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url));

    worker.onerror = (error) => {
      worker.terminate();
      reject(new Error(`Worker error: ${error.message}`));
    };

    worker.onmessage = function (event: MessageEvent<WorkerMessage>) {
      const { type, data } = event.data;

      if (type === 'progress') {
        progressCallback(0.5 + (data as number) / 2);
      } else if (type === 'result') {
        worker.terminate();
        resolve(data as GeoJSON);
      } else if (type === 'error') {
        worker.terminate();
        reject(new Error(data as string));
      }
    };

    worker.postMessage(rawFile);
  });
};

export default extractTelemetry;
