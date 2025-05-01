"use client";
import React, { useState, ChangeEvent, useRef } from "react";
import styles from "./page.module.css";
import extractTelemetry from "@/utils/extract";
import splitTelemetryByLaps from "@/utils/splitLaps";

const tracks = ["Tito", "Salandra"];

const Home: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [laps, setLaps] = useState<Lap[] | undefined>(undefined);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0); // Default to the first track

  const fileInputRef = useRef<HTMLInputElement>(null);

  const progressFunction = (progress: number) => {
    setProgress(progress * 100);
  };

  const formatLapTime = (lapTime: number): string => {
    var result = "N/A";
    if (lapTime !== null) {
      //const minutes = Math.floor(lapTime / (1000 * 60));
      const seconds = Math.floor((lapTime % (1000 * 60)) / 1000);
      const formattedMilliseconds = (
        "00" + Math.floor((lapTime % 1000) / 10)
      ).slice(-2);
      result = `${seconds}.${formattedMilliseconds}`;
    }
    return result;
  };

  const formatTimestamp = (timestamp: number): string => {
    const utcDate = new Date(timestamp); // Original UTC timestamp
    const localDate = new Date(
      utcDate.getTime() + utcDate.getTimezoneOffset() * 60000
    ); // Convert to local time

    // Format date part (day, month, year)
    const dateFormatter = new Intl.DateTimeFormat(navigator.language, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formattedDate = dateFormatter.format(localDate);

    // Format time part (localized time)
    const timeFormatter = new Intl.DateTimeFormat(navigator.language, {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    const formattedTime = timeFormatter.format(localDate);

    return `${formattedDate}, ${formattedTime}`;
  };

  const processFile = async (file: File) => {
    try {
      setLoading(true);
      const data: GeoJSON = await extractTelemetry(file, progressFunction);
      const extractedLaps: Lap[] = splitTelemetryByLaps(data);
      setLaps(extractedLaps);
      setLoading(false);
      setProgress(0);
    } catch (error) {
      handleError(error);
    }
  };

  const handleFileSelect = async () => {
    if ("showOpenFilePicker" in window) {
      try {
        // @ts-ignore: The File System Access API is not yet recognized by TypeScript
        const [fileHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: "Video Files",
              accept: {
                "video/mp4": [".mp4"],
              },
            },
          ],
        });
        const file = await fileHandle.getFile();
        await processFile(file);
      } catch (error) {
        handleError(error);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleError = (error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log("File selection was cancelled by the user.");
      setLoading(false);
      setProgress(0);
      return;
    }

    if (error instanceof Error) {
      console.error("Error processing file:", error);
      setError("Error processing file: " + error.message);
    } else {
      console.error("An unknown error occurred");
      setError("An unknown error occurred");
    }
    setLoading(false);
    setProgress(0);
  };
  const handleTrackChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrackIndex(parseInt(event.target.value));
  };

  return (
    <main className={styles.container}>
      <div className={styles.trackSelectContainer}>
        <label htmlFor="trackSelect" className={styles.trackSelectLabel}>
          Select Track:
        </label>
        <select
          id="trackSelect"
          value={selectedTrackIndex}
          onChange={handleTrackChange}
          className={styles.trackSelect}
        >
          {tracks.map((track, index) => (
            <option key={index} value={index}>
              {track}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.inputContainer}>
        <button
          disabled={loading}
          className={styles.fileInput}
          onClick={handleFileSelect}
        >
          Load File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="video/mp4"
          onChange={handleFileChange}
        />
      </div>

      {loading ? (
        <div className={styles.progressMessage}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      ) : error ? (
        <p className={styles.errorMessage}>Error: {error}</p>
      ) : (
        laps !== undefined &&
        (laps.length > 0 ? (
          <>
            <div className={styles.sessionStart}>
              {`Inizio Sessione: ${formatTimestamp(
                laps[0].data.properties.sessionStartTime
              )}`}
            </div>
            <div className={styles.lapsContainer}>
              <table>
                <thead className={styles.lapsTableHeader}>
                  <tr>
                    <th>Lap Number</th>
                    <th>Lap Time</th>
                    <th>File</th>
                  </tr>
                </thead>
                <tbody>
                  {laps.map((lap) => {
                    let url = URL.createObjectURL(
                      new Blob([JSON.stringify(lap.data)], {
                        type: "application/json",
                      })
                    );

                    return (
                      <tr key={lap.lapNumber} className={styles.lapRow}>
                        <td>{lap.lapNumber}</td>
                        <td>{formatLapTime(lap.lapTime)}</td>
                        <td>
                          <a
                            className={styles.downloadLink}
                            href={url}
                            download={`telemetry-lap-${lap.lapNumber}.geojson`}
                          >
                            Download
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className={styles.errorMessage}>No laps found</div>
        ))
      )}
    </main>
  );
};

export default Home;
