# Telemetry

A web application for extracting, visualizing, and analyzing GPS telemetry data from GoPro video files and standard telemetry formats.

## Description

This project processes telemetry data locally in the browser. It extracts GPS streams (GoPro MET) from MP4 files or parses GPX/GeoJSON/CSV files to identify tracks, split data into laps, and compare performance between different sessions.

## Features

- **Local Processing:** Extracts telemetry from MP4 files using FFmpeg.wasm entirely within the browser.
- **Multi-Format Support:** Supports MP4 (GoPro), GPX, GeoJSON, and CSV (AiM format) files.
- **Lap Detection:** Automatically identifies tracks and splits continuous telemetry data into individual laps.
- **Analysis:** Compares two selected laps, visualizing speed and time delta (gap) over distance.
- **Data Persistence:** Stores extracted laps locally using IndexedDB.
- **Export:** Allows downloading extracted lap data as GeoJSON and analysis charts as PNG images.
- **Data Backup:** Export and import all data (laps and settings) for backup or transfer.
- **Multilingual:** Supports English and Italian (default: Italian). Language preference stored in localStorage.

## Routes

- `/extract` - Upload and process telemetry files
- `/saved` - View and manage saved laps
- `/analyze` - Compare lap performance
- `/settings` - Configure theme, language, and data management

## Requirements

- Modern browser with WebAssembly support (Chrome, Firefox, Edge, Safari)
- IndexedDB support for local data storage

## Installation

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
npm run start
```

## Usage

1. **Extract:** Navigate to `/extract` and upload an MP4, GPX, GeoJSON, or CSV file. The app will process the file and display detected laps.
2. **Save:** Enter a driver name and select laps to save them to the local database.
3. **Analyze:** Go to `/analyze`. Select two saved laps from the same track to compare their speed profiles and time deltas.
4. **Export:** Use the download button to save the comparison chart as a PNG image.
5. **Settings:** Configure theme, language, chart colors, and manage data backups at `/settings`.

## Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI:** Mantine v8, Lucide React
- **Processing:** @ffmpeg/ffmpeg (WASM), gopro-telemetry
- **Visualization:** Chart.js, React-Chartjs-2
- **Storage:** IndexedDB (idb), localStorage (settings)

## Supported Tracks

The application currently supports the following tracks:
- Tito
- Salandra

To add a new track, edit `src/utils/tracks.ts` and add the finish line coordinates.
