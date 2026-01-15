import { FileType, TRACK_DETECTION_THRESHOLD_METERS } from '@/constants';
import { useI18n } from '@/lib/i18n';
import { getFileExtension } from '@/lib/utils';
import type { GeoJSON, Lap } from '@/types/types';
import { processAlfanoZip, type AlfanoParams } from '@/utils/alfano';
import { convertCsvToGeoJson } from '@/utils/csvToGeoJson';
import extractTelemetry from '@/utils/extract';
import { convertGpxToGeoJson } from '@/utils/gpxToGeoJson';
import splitTelemetryByLaps from '@/utils/splitLaps';
import { detectTrack } from '@/utils/tracks';
import { useState } from 'react';
import { useTracks } from './useTracks';

const getFileType = (filename: string): FileType | null => {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'mp4':
      return 'mp4';
    case 'gpx':
      return 'gpx';
    case 'geojson':
    case 'json':
      return 'geojson';
    case 'csv':
      return 'csv';
    case 'zip':
      return 'zip';
    default:
      return null;
  }
};

export const useTelemetryExtraction = () => {
  const { t } = useI18n();
  const { tracks } = useTracks();
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [laps, setLaps] = useState<Lap[] | undefined>(undefined);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<string | null>(null);
  const [detectedTrackName, setDetectedTrackName] = useState<string>('');
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pendingAlfanoFile, setPendingAlfanoFile] = useState<File | null>(null);

  const progressFunction = (prog: number) => {
    setProgress(prog * 100);
  };

  const handleError = (err: unknown) => {
    if (err instanceof DOMException && err.name === 'AbortError') {
      setLoading(false);
      setProgress(0);
      return;
    }
    // Log the actual error for debugging
    console.error('Extraction error:', err);

    // Provide detailed error message
    let message = 'Unknown error';
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'string') {
      message = err;
    } else {
      message = 'Unknown error: ' + String(err);
    }

    setError(message);
    setLoading(false);
    setProgress(0);
  };

  const processAlfano = async (params: AlfanoParams) => {
    if (!pendingAlfanoFile) return;
    setLoading(true);
    setError('');
    setProgress(20);
    try {
      const extractedLaps = await processAlfanoZip(pendingAlfanoFile, params);
      setLaps(extractedLaps);
      setDetectedTrackName(params.track.name);
      setPendingAlfanoFile(null);
      setLoading(false);
      setProgress(0);
    } catch (err) {
      handleError(err);
    }
  };

  const processFile = async (file: File) => {
    const detectedType = getFileType(file.name);
    if (!detectedType) {
      setError(t.extract.unsupportedFileType);
      return;
    }

    if (detectedType === 'zip') {
      setPendingAlfanoFile(file);
      setFileType('zip');
      return;
    }

    setFileType(detectedType);
    setLoading(true);
    setError('');
    setProgress(0);
    setLaps(undefined); // Clear previous laps when loading new file
    setDetectedTrackName('');

    try {
      let data: GeoJSON;

      switch (detectedType) {
        case 'mp4':
          data = await extractTelemetry(file, progressFunction);
          data.properties.driverName = '';
          break;
        case 'gpx': {
          setProgress(50);
          const gpxString = await file.text();
          data = await convertGpxToGeoJson(gpxString);
          setProgress(100);
          break;
        }
        case 'geojson': {
          setProgress(50);
          const jsonString = await file.text();
          data = JSON.parse(jsonString) as GeoJSON;
          data.properties.driverName = data.properties.driverName ?? '';
          setProgress(100);
          break;
        }
        case 'csv': {
          setProgress(50);
          const csvString = await file.text();
          data = await convertCsvToGeoJson(csvString);
          setProgress(100);
          break;
        }
      }

      let trackIndex = selectedTrackIndex !== null ? parseInt(selectedTrackIndex) : null;
      let selectedTrack = trackIndex !== null ? tracks[trackIndex] : null;

      if (!selectedTrack) {
        trackIndex = detectTrack(data, tracks, TRACK_DETECTION_THRESHOLD_METERS);
        if (trackIndex === -1) {
          setError(t.extract.couldNotDetectTrack);
          setLoading(false);
          setProgress(0);
          setShowAdvanced(true);
          return;
        }
        selectedTrack = tracks[trackIndex];
        setDetectedTrackName(selectedTrack.name);
      }

      if (!selectedTrack) {
        setError('Track selection failed');
        setLoading(false);
        return;
      }

      const extractedLaps: Lap[] = splitTelemetryByLaps(data, selectedTrack);
      setLaps(extractedLaps);
      setLoading(false);
      setProgress(0);
    } catch (err) {
      handleError(err);
    }
  };

  const getLoadingText = (): string => {
    if (!fileType) return t.extract.processing;
    switch (fileType) {
      case 'mp4':
        return t.extract.extracting;
      case 'gpx':
        return t.extract.convertingGpx;
      case 'geojson':
        return t.extract.parsingGeojson;
      case 'csv':
        return t.extract.parsingCsv;
      case 'zip':
        return t.extract.processing;
    }
  };

  return {
    loading,
    progress,
    error,
    laps,
    selectedTrackIndex,
    setSelectedTrackIndex,
    detectedTrackName,
    fileType,
    showAdvanced,
    setShowAdvanced,
    processFile,
    getLoadingText,
    setError,
    tracks,
    pendingAlfanoFile,
    setPendingAlfanoFile,
    processAlfano,
  };
};
