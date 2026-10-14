import { describe, expect, it } from "vitest";
import { EMPTY_RELEASE, releaseProblem } from "@/components/store/ReleaseFields";
import {
  formatBytes,
  isStorePath,
  latestByEnvironment,
  storeAppHref,
  suggestFromFileName,
  tabOf,
  type StoreApp,
  type StoreRelease,
} from "@/lib/store/store-api";

function release(id: string, environment: StoreRelease["environment"], version: string): StoreRelease {
  return {
    id,
    version,
    environment,
    notes: "",
    fileName: "app.apk",
    sizeBytes: 10,
    sha256: "0".repeat(64),
    createdAt: "2026-10-14T00:00:00Z",
    downloadUrl: `/api/v1/store/releases/${id}/download`,
  };
}

function app(releases: StoreRelease[]): StoreApp {
  return {
    id: "a",
    number: 1,
    name: "App",
    description: "",
    platform: "android",
    isPublic: true,
    logoUrl: null,
    createdAt: "2026-10-14T00:00:00Z",
    updatedAt: "2026-10-14T00:00:00Z",
    releases,
  };
}

describe("latestByEnvironment", () => {
  it("takes the newest build of each environment (releases arrive newest first)", () => {
    const latest = latestByEnvironment(
      app([release("3", "development", "2.1-dev"), release("2", "production", "2.0"), release("1", "production", "1.0")]),
    );
    expect(latest.production?.version).toBe("2.0");
    expect(latest.development?.version).toBe("2.1-dev");
  });

  it("answers null for an environment with no build", () => {
    expect(latestByEnvironment(app([release("1", "production", "1.0")])).development).toBeNull();
  });
});

describe("tabOf", () => {
  it("puts phones under Mobile and computers under PC", () => {
    expect(tabOf("android")).toBe("mobile");
    expect(tabOf("ios")).toBe("mobile");
    expect(tabOf("windows")).toBe("pc");
    expect(tabOf("macos")).toBe("pc");
  });
});

describe("formatBytes", () => {
  it("picks a readable unit", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(250 * 1024 * 1024)).toBe("250 MB");
    expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe("3.0 GB");
  });
});

describe("releaseProblem", () => {
  const apk = new File(["x"], "app.apk");

  it("accepts a well-formed build", () => {
    expect(releaseProblem({ ...EMPTY_RELEASE, version: "1.2.3-beta+4", file: apk }, "android")).toBeNull();
  });

  it("refuses a version that could not be a folder name", () => {
    expect(releaseProblem({ ...EMPTY_RELEASE, version: "../1", file: apk }, "android")).toMatch(/version/i);
    expect(releaseProblem({ ...EMPTY_RELEASE, version: "1.0.", file: apk }, "android")).toMatch(/version/i);
  });

  it("refuses a file the platform does not install", () => {
    expect(releaseProblem({ ...EMPTY_RELEASE, version: "1.0", file: apk }, "ios")).toMatch(/\.ipa/);
  });

  it("asks for a file", () => {
    expect(releaseProblem({ ...EMPTY_RELEASE, version: "1.0" }, "android")).toMatch(/file/i);
  });
});

describe("Store URLs", () => {
  it("puts each app at /store-<number>", () => {
    expect(storeAppHref(1)).toBe("/store-1");
    expect(storeAppHref(42)).toBe("/store-42");
  });

  it("treats the listing, every app page and the internal route as the Store", () => {
    for (const path of ["/store", "/store/", "/store-1", "/store-42", "/store/3"]) {
      expect(isStorePath(path), path).toBe(true);
    }
    for (const path of ["/stores", "/store-front", "/home", "/store-1a", null]) {
      expect(isStorePath(path), String(path)).toBe(false);
    }
  });
});

describe("suggestFromFileName", () => {
  it("uses the file name exactly as uploaded, and the version in it", () => {
    expect(suggestFromFileName("COC-Workbench-Setup-1.2.1.exe")).toEqual({
      name: "COC-Workbench-Setup-1.2.1.exe",
      version: "1.2.1",
    });
  });

  it("offers no version when the file name has none", () => {
    expect(suggestFromFileName("wallet.apk")).toEqual({ name: "wallet.apk", version: null });
  });

  it("keeps the name within the 80-character limit", () => {
    expect(suggestFromFileName(`${"x".repeat(100)}.exe`).name).toHaveLength(80);
  });
});
