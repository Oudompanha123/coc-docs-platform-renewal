/**
 * Recursively reads a drag-and-dropped folder into a flat array of Files,
 * each carrying a `webkitRelativePath` shaped the same way `<input
 * webkitdirectory>` produces one (e.g. "my-project/src/index.js") — so a
 * dropped folder is scanned identically to one chosen through the folder
 * picker button.
 *
 * Without this, `DataTransfer.files` treats a dropped *folder* as a single
 * zero-byte, extension-less pseudo-file named after the folder — the plain
 * drag-and-drop File API has no built-in recursive read, unlike
 * `<input webkitdirectory>`. This walks the non-standard but near-universally
 * supported `webkitGetAsEntry()` / FileSystemEntry API (Chrome, Edge,
 * Firefox, Safari) to do that walk ourselves.
 */
export async function readDroppedFiles(items: DataTransferItemList): Promise<File[]> {
  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i]?.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }
  if (entries.length === 0) return [];
  const results = await Promise.all(entries.map((entry) => readEntry(entry, "")));
  return results.flat();
}

/** True in every browser that supports the drag-and-drop directory read this module does; the caller falls back to plain `DataTransfer.files` when this is false. */
export function supportsDirectoryDrop(items: DataTransferItemList): boolean {
  return items.length > 0 && typeof items[0]?.webkitGetAsEntry === "function";
}

/**
 * Directories walked past without descending into them.
 *
 * <p>Measured on this repository: 295 source files against 37,933 in
 * `node_modules` — 128 times more files, none of which say anything about
 * the project being migrated. Reading them is not merely wasteful, it is
 * what makes attaching a real project fail: every entry becomes a `File`
 * object held in memory, and a browser asked for a hundred thousand of them
 * stops responding.
 *
 * Each of these is either a dependency tree, build output, or version-control
 * metadata — restorable from the manifest and the repository, and therefore
 * describing nothing a migration plan needs to know.
 */
const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "target",
  "vendor",
  ".venv",
  "__pycache__",
  ".gradle",
  ".idea",
  ".vscode",
]);

/** Whether this directory is walked past rather than into. Exported for the test that pins the list. */
export function isSkippedDirectory(name: string): boolean {
  return SKIPPED_DIRECTORIES.has(name);
}

function readEntry(entry: FileSystemEntry, prefix: string): Promise<File[]> {
  if (entry.isFile) return readFileEntry(entry as FileSystemFileEntry, prefix);
  if (entry.isDirectory) {
    if (isSkippedDirectory(entry.name)) return Promise.resolve([]);
    return readDirectoryEntry(entry as FileSystemDirectoryEntry, prefix);
  }
  return Promise.resolve([]);
}

function readFileEntry(entry: FileSystemFileEntry, prefix: string): Promise<File[]> {
  return new Promise((resolve) => {
    entry.file(
      (file) => {
        // A File read off a FileSystemEntry has no `webkitRelativePath` of
        // its own (that's only ever set by the browser for an
        // `<input webkitdirectory>` pick) — set here so `attachStats.ts`'s
        // `pathOf()` sees the same folder-relative path either way.
        Object.defineProperty(file, "webkitRelativePath", { value: `${prefix}${file.name}`, configurable: true });
        resolve([file]);
      },
      () => resolve([]),
    );
  });
}

async function readDirectoryEntry(entry: FileSystemDirectoryEntry, prefix: string): Promise<File[]> {
  const children = await readAllEntries(entry.createReader());
  const nested = await Promise.all(children.map((child) => readEntry(child, `${prefix}${entry.name}/`)));
  return nested.flat();
}

/** `readEntries()` returns only one batch per call and must be called repeatedly until it returns empty — true of every real implementation of this API, not an edge case. */
function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve) => {
    const all: FileSystemEntry[] = [];
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all);
        } else {
          all.push(...batch);
          readBatch();
        }
      }, () => resolve(all));
    };
    readBatch();
  });
}

/** True in every browser that offers `showDirectoryPicker` (Chrome, Edge — not Firefox or Safari, which fall back to `<input webkitdirectory>`). */
export function supportsDirectoryPicker(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/**
 * Reads a folder chosen via the File System Access API (`showDirectoryPicker`)
 * into the same flat `File[]` shape `readDroppedFiles` produces for a
 * drag-and-dropped folder — same recursive walk, same skip list, same
 * `webkitRelativePath` convention — so a folder chosen this way is scanned
 * identically either way.
 *
 * Exists because `<input webkitdirectory>`'s own FileList enumeration can
 * come back completely empty for a folder that reads back fine here and via
 * drag-and-drop's `webkitGetAsEntry()` walk — a cloud-synced folder (OneDrive
 * Files On-Demand is the common case) whose files aren't fully downloaded to
 * this device is the known real-world trigger. Both this and the
 * drag-and-drop path read the real filesystem one directory handle/entry at a
 * time; only the `<input>`'s own built-in enumeration goes through whatever
 * internal listing Chromium uses for that element, which is where the gap is.
 */
export async function readPickedDirectory(handle: FileSystemDirectoryHandle): Promise<File[]> {
  return readDirectoryHandle(handle, `${handle.name}/`);
}

async function readDirectoryHandle(handle: FileSystemDirectoryHandle, prefix: string): Promise<File[]> {
  const results: File[] = [];
  for await (const [name, child] of handle.entries()) {
    if (child.kind === "file") {
      const file = await (child as FileSystemFileHandle).getFile();
      // Same reasoning as readFileEntry above: give this File the same
      // webkitRelativePath shape an <input webkitdirectory> pick produces.
      Object.defineProperty(file, "webkitRelativePath", { value: `${prefix}${name}`, configurable: true });
      results.push(file);
    } else if (!isSkippedDirectory(name)) {
      results.push(...(await readDirectoryHandle(child as FileSystemDirectoryHandle, `${prefix}${name}/`)));
    }
  }
  return results;
}
