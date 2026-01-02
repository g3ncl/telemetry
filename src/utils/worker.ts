import { goProTelemetry } from 'gopro-telemetry';

interface WorkerMessageData {
  type: 'progress' | 'result' | 'error';
  data: number | unknown | string;
}

const progressHandler = (progress: number): void => {
  self.postMessage({ type: 'progress', data: progress } as WorkerMessageData);
};

self.onmessage = async function (event: MessageEvent<ArrayBuffer | Uint8Array>) {
  try {
    // Convert to Uint8Array if ArrayBuffer
    const rawData = event.data instanceof ArrayBuffer
      ? new Uint8Array(event.data)
      : event.data;
    self.postMessage({ type: 'progress', data: 0.01 } as WorkerMessageData);

    const telemetry = await goProTelemetry(
      { rawData },
      {
        stream: ['GPS'],
        GPSFix: 3,
        GPSPrecision: 300,
        preset: 'geojson',
        progress: progressHandler,
      }
    );

    self.postMessage({ type: 'result', data: telemetry } as WorkerMessageData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({ type: 'error', data: message } as WorkerMessageData);
  }
};
