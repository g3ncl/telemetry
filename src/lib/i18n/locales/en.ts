// Translation structure interface
export interface TranslationKeys {
  appName: string;
  appDescription: string;
  nav: {
    extract: string;
    savedLaps: string;
    analyze: string;
    settings: string;
    tracks: string;
  };
  tracks: {
    title: string;
    subtitle: string;
    noTracks: string;
    addTrack: string;
    editTrack: string;
    deleteTrack: string;
    name: string;
    length: string;
    notes: string;
    confirmDelete: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    nameRequired: string;
    lengthRequired: string;
  };
  extract: {
    title: string;
    subtitle: string;
    loadFile: string;
    extracting: string;
    convertingGpx: string;
    parsingGeojson: string;
    parsingCsv: string;
    processing: string;
    advancedSettings: string;
    hideSettings: string;
    forceTrack: string;
    overrideAutoDetect: string;
    autoDetect: string;
    driverName: string;
    saveSelected: string;
    lap: string;
    time: string;
    noLapsFound: string;
    unsupportedFileType: string;
    couldNotDetectTrack: string;
    alfanoTitle: string;
    alfanoSubtitle: string;
    alfanoDisclaimer: string;
    pignone: string;
    corona: string;
    wheelCircumference: string;
    selectTrack: string;
  };
  saved: {
    title: string;
    lapsCount: string;
    lapsCountPlural: string;
    noSavedLaps: string;
    goToExtract: string;
    driver: string;
    track: string;
    session: string;
    confirmDelete: string;
    namePlaceholder: string;
  };
  analyze: {
    title: string;
    subtitle: string;
    needTwoLaps: string;
    lap1Label: string;
    lap2Label: string;
    selectPlaceholder: string;
    selectTwoLaps: string;
    speedComparison: string;
    speedUnit: string;
    distanceUnit: string;
    deltaTime: string;
    driver1: string;
    driver2: string;
    delta: string;
    deltaVs: string;
  };
  settings: {
    title: string;
    subtitle: string;
    theme: string;
    themeDescription: string;
    themeDark: string;
    themeLight: string;
    language: string;
    languageDescription: string;
    clearData: string;
    clearDataDescription: string;
    clearButton: string;
    confirmClear: string;
    dataCleared: string;
    clearFailed: string;
    chartColors: string;
    chartColorsDescription: string;
    color1: string;
    color2: string;
    dataManagement: string;
    dataManagementDescription: string;
    export: string;
    exportSuccess: string;
    import: string;
    importConfirmTitle: string;
    importConfirmBody: string;
    importSuccess: string;
    importError: string;
  };
  common: {
    download: string;
    save: string;
    confirm: string;
    cancel: string;
    delete: string;
    edit: string;
    unknown: string;
    success: string;
    error: string;
    loading: string;
  };
}

export const en: TranslationKeys = {
  // App
  appName: 'Kart Telemetry',
  appDescription: 'GPS telemetry extraction and lap analysis',

  // Navigation
  nav: {
    extract: 'Extract',
    savedLaps: 'Saved Laps',
    analyze: 'Analyze',
    settings: 'Settings',
    tracks: 'Tracks',
  },

  // Tracks Section
  tracks: {
    title: 'Track Manager',
    subtitle: 'Manage track details and reference lengths',
    noTracks: 'No tracks found. Create one to get started.',
    addTrack: 'Add Track',
    editTrack: 'Edit Track',
    deleteTrack: 'Delete Track',
    name: 'Track Name',
    length: 'Length (m)',
    notes: 'Notes',
    confirmDelete: 'Delete this track? This will not delete associated laps.',
    createSuccess: 'Track created successfully',
    updateSuccess: 'Track updated successfully',
    deleteSuccess: 'Track deleted successfully',
    nameRequired: 'Track name is required',
    lengthRequired: 'Track length is required',
  },

  // Extract Section
  extract: {
    title: 'Extract Telemetry',
    subtitle: 'Load MP4, GPX, GeoJSON, or CSV files',
    loadFile: 'Load File',
    extracting: 'Extracting telemetry...',
    convertingGpx: 'Converting GPX...',
    parsingGeojson: 'Parsing GeoJSON...',
    parsingCsv: 'Parsing CSV...',
    processing: 'Processing...',
    advancedSettings: 'Advanced Settings',
    hideSettings: 'Hide settings',
    forceTrack: 'Force Track',
    overrideAutoDetect: 'Override auto-detection',
    autoDetect: 'Auto-detect',
    driverName: 'Driver name',
    saveSelected: 'Save Selected',
    lap: 'Lap',
    time: 'Time',
    noLapsFound: 'No laps found. Make sure you crossed the finish line.',
    unsupportedFileType: 'Unsupported file type. Use MP4, GPX, GeoJSON, CSV or Alfano ZIP.',
    couldNotDetectTrack:
      'Could not detect track. GPS data is not within 2km of known track. Use Advanced Settings to manually select a track.',
    alfanoTitle: 'Alfano Import',
    alfanoSubtitle: 'No GPS detected. Configure parameters to calculate speed and distance.',
    alfanoDisclaimer: 'Note: Speed and distance are calculated based on RPM and gear ratio. This data is an approximation and may not be precise due to wheel spin and line variations.',
    pignone: 'Engine Sprocket',
    corona: 'Rear Sprocket',
    wheelCircumference: 'Wheel Circumference (m)',
    selectTrack: 'Select Track (for length calibration)',
  },

  // Saved Laps Section
  saved: {
    title: 'Saved Laps',
    lapsCount: '{count} lap saved',
    lapsCountPlural: '{count} laps saved',
    noSavedLaps: 'No saved laps yet',
    goToExtract: 'Go to Extract section to load and save laps',
    driver: 'Driver',
    track: 'Track',
    session: 'Session',
    confirmDelete: 'Delete this lap?',
    namePlaceholder: 'Name',
  },

  // Analyze Section
  analyze: {
    title: 'Analyze',
    subtitle: 'Compare two laps',
    needTwoLaps: 'Need at least 2 saved laps',
    lap1Label: 'Lap 1',
    lap2Label: 'Lap 2',
    selectPlaceholder: 'Select...',
    selectTwoLaps: 'Select two laps above to compare',
    speedComparison: 'Speed Comparison',
    speedUnit: 'Speed (km/h)',
    distanceUnit: 'Distance (m)',
    deltaTime: 'Delta (s)',
    driver1: 'Driver 1',
    driver2: 'Driver 2',
    delta: 'Delta',
    deltaVs: 'Delta ({driver2} vs {driver1})',
  },

  // Settings Section
  settings: {
    title: 'Settings',
    subtitle: 'Configure app preferences',
    theme: 'Theme',
    themeDescription: 'Select appearance mode',
    themeDark: 'Dark',
    themeLight: 'Light',
    language: 'Language',
    languageDescription: 'Select display language',
    clearData: 'Clear All Data',
    clearDataDescription: 'Delete all saved laps from browser',
    clearButton: 'Clear',
    confirmClear: 'Delete all saved laps? This cannot be undone.',
    dataCleared: 'All data cleared.',
    clearFailed: 'Failed to clear data.',
    chartColors: 'Chart Colors',
    chartColorsDescription: 'Customize chart line colors',
    color1: 'Driver 1 Color',
    color2: 'Driver 2 Color',
    dataManagement: 'Data Management',
    dataManagementDescription: 'Export or import your data (laps and settings)',
    export: 'Export',
    exportSuccess: 'Data exported successfully',
    import: 'Import',
    importConfirmTitle: 'Import Data',
    importConfirmBody: 'Are you sure you want to import data? This will overwrite all current laps and settings. This action cannot be undone.',
    importSuccess: 'Data imported successfully. Page will reload.',
    importError: 'Error importing data',
  },

  // Common
  common: {
    download: 'Download',
    save: 'Save',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    unknown: 'Unknown',
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
  },
};
