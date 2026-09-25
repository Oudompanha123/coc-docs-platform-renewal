import { describe, expect, it } from "vitest";
import { readDroppedFiles, readPickedDirectory, supportsDirectoryDrop, supportsDirectoryPicker } from "./readDroppedFiles";

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

/**
 * The half of the fix that actually prevents the freeze. The folder picker
 * enumerates everything in the browser before handing it over and cannot be
 * told otherwise; this walk is ours, so a dependency tree is never turned
 * into File objects at all.
 */
describe("skipped directories", () => {
  it("never descends into a dependency tree", async () => {
    // A reader that records being asked: the assertion is not merely that
    // the files are absent from the result, but that they were never read.
    let nodeModulesRead = false;
    const nodeModules = {
      isFile: false,
      isDirectory: true,
      name: "node_modules",
      createReader: () => {
        nodeModulesRead = true;
        return { readEntries: (ok: (e: FileSystemEntry[]) => void) => queueMicrotask(() => ok([])) };
      },
    } as unknown as FileSystemDirectoryEntry;

    const dropped = fakeDirEntry("app", [fakeFileEntry("package.json"), nodeModules]);

    const files = await readDroppedFiles(itemsOf([dropped]));

    expect(files.map((f) => f.name)).toEqual(["package.json"]);
    expect(nodeModulesRead).toBe(false);
  });

  it("skips version control and build output too", async () => {
    const dropped = fakeDirEntry("app", [
      fakeFileEntry("index.ts"),
      fakeDirEntry(".git", [fakeFileEntry("HEAD")]),
      fakeDirEntry("dist", [fakeFileEntry("bundle.js")]),
      fakeDirEntry(".next", [fakeFileEntry("build-manifest.json")]),
      fakeDirEntry("target", [fakeFileEntry("app.jar")]),
    ]);

    const files = await readDroppedFiles(itemsOf([dropped]));

    expect(files.map((f) => f.name)).toEqual(["index.ts"]);
  });

  it("skips a dependency tree wherever it is nested, not only at the root", async () => {
    const dropped = fakeDirEntry("app", [
      fakeDirEntry("packages", [
        fakeDirEntry("web", [fakeFileEntry("main.ts"), fakeDirEntry("node_modules", [fakeFileEntry("dep.js")])]),
      ]),
    ]);

    const files = await readDroppedFiles(itemsOf([dropped]));

    expect(files.map((f) => f.name)).toEqual(["main.ts"]);
  });

  it("keeps a real file whose name merely starts with a skipped word", async () => {
    const dropped = fakeDirEntry("app", [fakeFileEntry("distribution.ts"), fakeFileEntry("build-tools.ts")]);

    const files = await readDroppedFiles(itemsOf([dropped]));

    expect(files.map((f) => f.name)).toEqual(["distribution.ts", "build-tools.ts"]);
  });
});

/** A minimal fake implementing just the FileSystemFileHandle shape readPickedDirectory reads. */
function fakeFileHandle(name: string, content = "x"): FileSystemFileHandle {
  return {
    kind: "file",
    name,
    getFile: async () => new File([content], name),
  } as unknown as FileSystemFileHandle;
}

/** A minimal fake implementing just the FileSystemDirectoryHandle shape readPickedDirectory reads — an async-iterable `entries()`, the way a real handle's is. */
function fakeDirHandle(name: string, children: [string, FileSystemFileHandle | FileSystemDirectoryHandle][]): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    name,
    entries: () =>
      (async function* () {
        for (const entry of children) yield entry;
      })(),
  } as unknown as FileSystemDirectoryHandle;
}

/**
 * readPickedDirectory is the fix for the bug readDroppedFiles above never
 * had: `<input webkitdirectory>`'s own FileList enumeration can come back
 * completely empty for a folder living in a cloud-synced location (OneDrive
 * Files On-Demand) even though the folder reads back fine here — because
 * this reads the real filesystem one directory handle at a time, the same
 * way the drag-and-drop walk above reads it one entry at a time, rather than
 * through whatever internal listing the <input> element uses.
 */
describe("readPickedDirectory", () => {
  it("reads a picked folder's contents recursively, with the same webkitRelativePath shape a drop produces", async () => {
    const root = fakeDirHandle("Sample Project Portfolio", [
      ["index.html", fakeFileHandle("index.html")],
      ["styles.css", fakeFileHandle("styles.css")],
      [
        "src",
        fakeDirHandle("src", [
          ["app.js", fakeFileHandle("app.js")],
          ["logo.png", fakeFileHandle("logo.png")],
        ]),
      ],
    ]);

    const files = await readPickedDirectory(root);

    expect(files).toHaveLength(4);
    const paths = files.map((f) => f.webkitRelativePath).sort();
    expect(paths).toEqual([
      "Sample Project Portfolio/index.html",
      "Sample Project Portfolio/src/app.js",
      "Sample Project Portfolio/src/logo.png",
      "Sample Project Portfolio/styles.css",
    ]);
  });

  it("skips a dependency tree the same way the drag-and-drop walk does", async () => {
    const root = fakeDirHandle("app", [
      ["package.json", fakeFileHandle("package.json")],
      ["node_modules", fakeDirHandle("node_modules", [["dep.js", fakeFileHandle("dep.js")]])],
    ]);

    const files = await readPickedDirectory(root);

    expect(files.map((f) => f.name)).toEqual(["package.json"]);
  });
});

describe("supportsDirectoryPicker", () => {
  it("is false in an environment with no showDirectoryPicker (jsdom, Firefox, Safari)", () => {
    expect(supportsDirectoryPicker()).toBe(false);
  });

  it("is true once the browser exposes showDirectoryPicker", () => {
    const original = (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = async () => fakeDirHandle("x", []);
    try {
      expect(supportsDirectoryPicker()).toBe(true);
    } finally {
      (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = original;
    }
  });
});
