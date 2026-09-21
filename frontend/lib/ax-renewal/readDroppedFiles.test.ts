import { describe, expect, it } from "vitest";
import { readDroppedFiles, supportsDirectoryDrop } from "./readDroppedFiles";

/** A minimal fake implementing just the FileSystemFileEntry shape this module reads. */
function fakeFileEntry(name: string, content = "x"): FileSystemFileEntry {
  return {
    isFile: true,
    isDirectory: false,
    name,
    file: (success: (file: File) => void) => success(new File([content], name)),
  } as unknown as FileSystemFileEntry;
}

/**
 * A minimal fake implementing just the FileSystemDirectoryEntry shape this
 * module reads, batching `readEntries` the way a real browser does (one call
 * for the batch, then an empty call to signal the end) — and, critically,
 * resolving asynchronously: a real implementation never calls back
 * synchronously, and `readAllEntries`'s recursive `readBatch()` relies on
 * that (a synchronous mock here recurses the whole read in one call stack
 * instead of unwinding between batches, which only this mock would ever do).
 */
function fakeDirEntry(name: string, children: FileSystemEntry[]): FileSystemDirectoryEntry {
  return {
    isFile: false,
    isDirectory: true,
    name,
    createReader: () => {
      let served = false;
      return {
        readEntries: (success: (entries: FileSystemEntry[]) => void) => {
          queueMicrotask(() => {
            success(served ? [] : children);
            served = true;
          });
        },
      };
    },
  } as unknown as FileSystemDirectoryEntry;
}

function itemsOf(entries: FileSystemEntry[]): DataTransferItemList {
  return entries.map((entry) => ({ webkitGetAsEntry: () => entry })) as unknown as DataTransferItemList;
}

describe("readDroppedFiles", () => {
  it("reads a dropped folder's contents recursively, unlike plain DataTransfer.files", async () => {
    const dropped = fakeDirEntry("Sample Project Portfolio", [
      fakeFileEntry("index.html"),
      fakeFileEntry("styles.css"),
      fakeDirEntry("src", [fakeFileEntry("app.js"), fakeFileEntry("logo.png")]),
    ]);

    const files = await readDroppedFiles(itemsOf([dropped]));

    expect(files).toHaveLength(4);
    const paths = files.map((f) => f.webkitRelativePath).sort();
    expect(paths).toEqual([
      "Sample Project Portfolio/index.html",
      "Sample Project Portfolio/src/app.js",
      "Sample Project Portfolio/src/logo.png",
      "Sample Project Portfolio/styles.css",
    ]);
  });

  it("reads one or more loose dropped files without a folder", async () => {
    const files = await readDroppedFiles(itemsOf([fakeFileEntry("readme.md")]));
    expect(files).toHaveLength(1);
    expect(files[0]!.webkitRelativePath).toBe("readme.md");
  });
});

describe("supportsDirectoryDrop", () => {
  it("is true when the browser exposes webkitGetAsEntry", () => {
    expect(supportsDirectoryDrop(itemsOf([fakeFileEntry("a.txt")]))).toBe(true);
  });

  it("is false for an empty item list", () => {
    expect(supportsDirectoryDrop(itemsOf([]))).toBe(false);
  });
});
