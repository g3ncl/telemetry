"use client";
import React, { useState, ChangeEvent } from "react";
import styles from "./page.module.css";
import extractTelemetry from "@/utils/extract";
import splitTelemetryByLaps from "@/utils/splitLaps";

const Home: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [laps, setLaps] = useState<Lap[] | undefined>(undefined);

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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      try {
        setLoading(true);
        const data: GeoJSON = await extractTelemetry(file, progressFunction);
        const laps: Lap[] = splitTelemetryByLaps(data);
        setLaps(laps);
        setLoading(false);
        setProgress(0);
      } catch (error) {
        console.error("Error extracting telemetry from file:", error);
        setError("Error extracting telemetry from file: " + error);
        setLoading(false);
        setProgress(0);
      }
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.inputContainer}>
        <label className={styles.fileInput} htmlFor="upload">
          <input
            type="file"
            id="upload"
            className={styles.uploadInput}
            accept="video/mp4"
            onChange={handleFileChange}
          />
          Load File
        </label>
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
