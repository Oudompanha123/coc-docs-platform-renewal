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

function readEntry(entry: FileSystemEntry, prefix: string): Promise<File[]> {
  if (entry.isFile) return readFileEntry(entry as FileSystemFileEntry, prefix);
  if (entry.isDirectory) return readDirectoryEntry(entry as FileSystemDirectoryEntry, prefix);
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
