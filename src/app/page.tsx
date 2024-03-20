"use client";
import React, { useState, ChangeEvent } from "react";
import styles from "./page.module.css";
import extractTelemetry from "@/utils/utils";

const Home: React.FC = () => {
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [resultLink, setResultLink] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [elapsed, setElapsed] = useState<number | null>(null);
  const progressFunction = (progress: number) => {
    setProgress(progress * 100);
  };
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      try {
        setLoading(true);
        const startTime = performance.now();
        const result = await extractTelemetry(file, progressFunction);
        const endTime = performance.now();
        setElapsed((endTime - startTime) / 1000);

        setResultLink(result);
        setLoading(false);
      } catch (error) {
        console.error("Error extracting telemetry from file:", error);
        setError("Error extracting telemetry from file: " + error);
        setLoading(false);
      }
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.inputContainer}>
        <input type="file" accept="video/mp4" onChange={handleFileChange} />
      </div>

      {fileName && <p>Uploaded file: {fileName}</p>}

      {loading ? (
        <p>Extracting telemetry... Progress: {progress}%</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        resultLink && (
          <>
            <a href={resultLink} download="telemetry.geojson">
              Download
            </a>
            <p>Elapsed time: {elapsed}s</p>
          </>
        )
      )}
    </main>
  );
};

export default Home;
