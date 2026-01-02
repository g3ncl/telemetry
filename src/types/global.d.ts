// Global type declarations

declare global {
  // File System Access API types
  interface Window {
    showOpenFilePicker?: (options?: {
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>;
  }
}

export {};
