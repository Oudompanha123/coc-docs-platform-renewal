// Minimal ambient typing for the File System Access API's directory picker.
// TypeScript's bundled DOM lib types the FileSystemDirectoryHandle/
// FileSystemFileHandle interfaces themselves (with dom.asynciterable, see
// tsconfig.json) but not the `window.showDirectoryPicker` entry point that
// produces one — this is the one piece missing to call it.
//
// // req: readDroppedFiles.ts's readPickedDirectory / AttachSourceSection.tsx

interface Window {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}
