import { describe, expect, it } from "vitest";
import { buildVerification, computeAttachStats, formatBytes } from "./attachStats";

function fakeFile(path: string, content: string): File {
  const file = new File([content], path.split("/").pop() ?? path, { type: "text/plain" });
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  return file;
}

describe("computeAttachStats", () => {
  it("counts files, bytes, and extensions from a plain static site with no manifest", async () => {
    const files = [
      fakeFile("site/index.html", "<html></html>"),
      fakeFile("site/app.js", "console.log(1)"),
      fakeFile("site/styles.css", "body{}"),
    ];
    const stats = await computeAttachStats(files);
    expect(stats.fileCount).toBe(3);
    expect(stats.extensions).toEqual({ html: 1, js: 1, css: 1 });
    expect(stats.manifestFilename).toBeNull();
    expect(stats.runtime).toBeNull();
    expect(stats.lockfile).toBeNull();
  });

  it("recognizes a manifest and its runtime, matching the backend's own hints", async () => {
    const files = [fakeFile("proj/package.json", "{}"), fakeFile("proj/index.js", "")];
    const stats = await computeAttachStats(files);
    expect(stats.manifestFilename).toBe("package.json");
    expect(stats.runtime).toBe("Node.js");
  });

  it("finds a lockfile independently of the manifest", async () => {
    const files = [fakeFile("proj/package.json", "{}"), fakeFile("proj/package-lock.json", "{}")];
    const stats = await computeAttachStats(files);
    expect(stats.lockfile).toBe("package-lock.json");
  });

  it("flags a build-output directory without reading its contents", async () => {
    const files = [fakeFile("proj/node_modules/pkg/index.js", ""), fakeFile("proj/src/index.js", "")];
    const stats = await computeAttachStats(files);
    expect(stats.buildOutputDirs).toEqual(["node_modules"]);
  });

  it("flags a hardcoded connection string in a small config file, by path only", async () => {
    const files = [fakeFile("proj/db.js", "module.exports = 'postgres://user:pass@host/db'")];
    const stats = await computeAttachStats(files);
    expect(stats.secretsFound).toEqual(["proj/db.js"]);
  });

  it("does not flag an ordinary source file even if it mentions 'password'", async () => {
    const files = [fakeFile("proj/src/login.js", "function login(username, password) { return password.length > 0; }")];
    const stats = await computeAttachStats(files);
    expect(stats.secretsFound).toEqual([]);
  });

  it("tracks the largest file by size", async () => {
    const files = [fakeFile("proj/a.txt", "x"), fakeFile("proj/b.txt", "x".repeat(100))];
    const stats = await computeAttachStats(files);
    expect(stats.largestFile).toEqual({ name: "proj/b.txt", size: 100 });
  });

  it("reads the attached folder's own name off the first file's relative path", async () => {
    const files = [fakeFile("Sample Project Portfolio/src/index.js", ""), fakeFile("Sample Project Portfolio/package.json", "{}")];
    const stats = await computeAttachStats(files);
    expect(stats.rootFolderName).toBe("Sample Project Portfolio");
  });

  it("falls back to the first file's own name when loose files were picked instead of a folder", async () => {
    const file = new File(["console.log(1)"], "app.js", { type: "text/javascript" });
    const stats = await computeAttachStats([file]);
    expect(stats.rootFolderName).toBe("app.js");
  });

  it("is null when nothing was picked", async () => {
    const stats = await computeAttachStats([]);
    expect(stats.rootFolderName).toBeNull();
  });
});

describe("buildVerification", () => {
  it("reports a warning, not an error, when no manifest is found", async () => {
    const stats = await computeAttachStats([fakeFile("site/index.html", "")]);
    const rows = buildVerification(stats);
    const manifestRow = rows.find((r) => r.title === "No manifest found");
    expect(manifestRow?.status).toBe("warn");
  });

  it("reports the manifest and detected runtime together when found", async () => {
    const stats = await computeAttachStats([fakeFile("proj/pom.xml", "")]);
    const rows = buildVerification(stats);
    const manifestRow = rows.find((r) => r.title === "Manifest found");
    expect(manifestRow?.status).toBe("ok");
    expect(manifestRow?.detail).toContain("Java project");
  });
});

describe("formatBytes", () => {
  it("scales the unit with the size", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1_048_576)).toBe("5.0 MB");
  });
});

// The reason attaching a real project used to fail. Measured on this
// repository: 295 source files against 37,933 in node_modules — 128 times
// more files, describing nothing a migration plan needs.
describe("dependency and build directories", () => {
  it("counts the project's own files, not its dependencies", async () => {
    const files = [
      fakeFile("app/src/index.ts", "export {}"),
      fakeFile("app/package.json", "{}"),
      fakeFile("app/node_modules/left-pad/index.js", "module.exports = 1"),
      fakeFile("app/node_modules/left-pad/package.json", "{}"),
      fakeFile("app/.git/HEAD", "ref: refs/heads/main"),
      fakeFile("app/dist/bundle.js", "!function(){}()"),
    ];

    const stats = await computeAttachStats(files);

    expect(stats.fileCount).toBe(2);
    expect(stats.skippedCount).toBe(4);
  });

  it("keeps the extension breakdown about the project", async () => {
    // Without this, one dependency tree of .js files makes every project
    // look like a JavaScript project whatever it actually is.
    const files = [
      fakeFile("app/main.py", "print(1)"),
      fakeFile("app/node_modules/x/a.js", "1"),
      fakeFile("app/node_modules/x/b.js", "2"),
      fakeFile("app/node_modules/x/c.js", "3"),
    ];

    const stats = await computeAttachStats(files);

    expect(stats.extensions).toEqual({ py: 1 });
  });

  it("still reports that build output is committed, having skipped its contents", async () => {
    // The two are one judgement, not a conflict: the finding is that these
    // directories exist, which is exactly why reading them is pointless.
    const files = [
      fakeFile("app/index.js", "1"),
      fakeFile("app/node_modules/dep/index.js", "2"),
      fakeFile("app/dist/out.js", "3"),
    ];

    const stats = await computeAttachStats(files);

    expect(stats.buildOutputDirs).toEqual(expect.arrayContaining(["node_modules", "dist"]));
    expect(stats.fileCount).toBe(1);
  });

  it("keeps the folder's name even when almost everything in it was skipped", async () => {
    const files = [
      fakeFile("legacy-app/package.json", "{}"),
      fakeFile("legacy-app/node_modules/a/i.js", "1"),
    ];

    const stats = await computeAttachStats(files);

    expect(stats.rootFolderName).toBe("legacy-app");
  });

  it("reports nothing skipped for a folder that has no dependency tree", async () => {
    const files = [fakeFile("site/index.html", "<html></html>")];

    const stats = await computeAttachStats(files);

    expect(stats.skippedCount).toBe(0);
  });

  it("does not skip a file that merely mentions a skipped name", async () => {
    // "dist" as a path segment, not as a substring of a real filename.
    const files = [
      fakeFile("app/distribution.ts", "export {}"),
      fakeFile("app/build-tools.ts", "export {}"),
    ];

    const stats = await computeAttachStats(files);

    expect(stats.fileCount).toBe(2);
    expect(stats.skippedCount).toBe(0);
  });
});
