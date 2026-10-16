import { describe, expect, it } from "vitest";
import {
  buildUploadBody,
  compareVersions,
  findSameApp,
  getOptions,
  hasGettableBuild,
  latestLiveBuild,
  hasLiveBuild,
  appPlatforms,
  categoryPlatforms,
  historyPlatforms,
  inTab,
  isStorePath,
  latestByEnvironment,
  livePlatforms,
  platformOfFile,
  relativeTime,
  storeAppHref,
  suggestNextVersion,
  versionRows,
  type StoreApp,
  type StoreBuild,
} from "@/lib/store/store-api";

function build(
  id: string,
  platform: StoreBuild["platform"],
  environment: StoreBuild["environment"],
  version: string,
  { createdAt = "2026-10-14T00:00:00Z", removedAt = null }: { createdAt?: string; removedAt?: string | null } = {},
): StoreBuild {
  return {
    id,
    platform,
    version,
    environment,
    notes: "",
    fileName: "app",
    sizeBytes: 10,
    sha256: "0".repeat(64),
    createdAt,
    removedAt,
    status: removedAt ? "removed" : "active",
    uploadedBy: "Admin",
    downloadUrl: removedAt ? null : `/api/v1/store/builds/${id}/download`,
  };
}

function app(builds: StoreBuild[] = [], overrides: Partial<StoreApp> = {}): StoreApp {
  return {
    id: "a",
    number: 394,
    name: "Change Impact Preview",
    category: "mobile",
    description: "",
    isPublic: true,
    logoUrl: null,
    createdAt: "2026-10-14T00:00:00Z",
    updatedAt: "2026-10-14T00:00:00Z",
    builds,
    ...overrides,
  };
}

describe("Store URLs", () => {
  it("puts each app at /store/app-<number>", () => {
    expect(storeAppHref(394)).toBe("/store/app-394");
  });

  it("treats the listing, every app page and the internal route as the Store", () => {
    for (const path of ["/store", "/store/", "/store-1", "/store-394", "/store/3"]) {
      expect(isStorePath(path), path).toBe(true);
    }
    for (const path of ["/stores", "/store-front", "/home", "/store-1a", null]) {
      expect(isStorePath(path), String(path)).toBe(false);
    }
  });
});

describe("platformOfFile", () => {
  it("names the platform from the file type", () => {
    expect(platformOfFile("App.APK")).toBe("android");
    expect(platformOfFile("bundle.aab")).toBe("android");
    expect(platformOfFile("app.ipa")).toBe("ios");
    expect(platformOfFile("Setup.msi")).toBe("windows");
    expect(platformOfFile("COC-Workbench-Setup-1.2.1.exe")).toBe("windows");
    expect(platformOfFile("App.dmg")).toBe("macos");
  });

  it("names none for anything that is not an installer", () => {
    expect(platformOfFile("app.zip")).toBeNull();
    expect(platformOfFile("readme.txt")).toBeNull();
    expect(platformOfFile("apk")).toBeNull();
  });
});

describe("an app spans platforms", () => {
  const a = app([
    build("1", "android", "production", "1.0"),
    build("2", "ios", "production", "1.0", { removedAt: "2026-10-14T01:00:00Z" }),
    build("3", "windows", "development", "2.0"),
  ]);

  it("lists the platforms with a live build, and those with any build for the history tabs", () => {
    expect(livePlatforms(a)).toEqual(["android", "windows"]);
    expect(historyPlatforms(a)).toEqual(["ios", "android", "windows"]);
  });

  it("is under All always, and under Mobile / PC when it has a live build there", () => {
    expect(inTab(a, "all")).toBe(true);
    expect(inTab(a, "mobile")).toBe(true);
    expect(inTab(a, "pc")).toBe(true);
    expect(inTab(app(), "all")).toBe(true);
    expect(inTab(app(), "mobile")).toBe(false);
    expect(inTab(app([build("x", "ios", "production", "1", { removedAt: "2026-10-14T01:00:00Z" })]), "mobile")).toBe(false);
  });
});

describe("compareVersions", () => {
  it("compares numbers as numbers, and puts a pre-release below its release", () => {
    expect(compareVersions("1.10.0", "1.9.9")).toBeGreaterThan(0);
    expect(compareVersions("1.0.3", "1.0.4")).toBeLessThan(0);
    expect(compareVersions("1.2.0-beta", "1.2.0")).toBeLessThan(0);
    expect(compareVersions("2.0", "2.0")).toBe(0);
  });
});

describe("version history per platform", () => {
  const a = app([
    build("p4", "ios", "production", "1.0.4"),
    build("p3", "ios", "production", "1.0.3"),
    build("d3", "ios", "development", "1.0.3"),
    build("p2", "ios", "production", "1.0.2", { removedAt: "2025-01-01T00:00:00Z" }),
    build("a9", "android", "production", "9.9.9"),
  ]);

  it("lists only that platform's versions, highest first, with live / removed / none per environment", () => {
    const rows = versionRows(a, "ios");
    expect(rows.map((r) => r.version)).toEqual(["1.0.4", "1.0.3", "1.0.2"]);
    expect(rows[0]).toMatchObject({ production: { id: "p4" }, development: null });
    expect(rows[1]).toMatchObject({ production: { id: "p3" }, development: { id: "d3" } });
    expect(rows[2]?.production?.removedAt).not.toBeNull();
  });

  it("takes the highest live version per environment as latest", () => {
    expect(latestByEnvironment(a, "ios").production?.version).toBe("1.0.4");
    expect(latestByEnvironment(a, "ios").development?.version).toBe("1.0.3");
    expect(latestByEnvironment(a, "android").development).toBeNull();
  });
});

describe("Next version", () => {
  const a = app([build("p", "android", "production", "1.2.1"), build("d", "android", "development", "1.2.0")]);

  it("suggests the next version for the file's platform, or 1.0.0 for a platform with none", () => {
    expect(suggestNextVersion(a, "android")).toBe("1.2.2");
    expect(suggestNextVersion(a, "ios")).toBe("1.0.0");
  });

  it("knows which platform, version and environment already has a live build", () => {
    expect(hasLiveBuild(a, "android", "1.2.1", "production")).toBe(true);
    expect(hasLiveBuild(a, "android", "1.2.1", "development")).toBe(false);
    expect(hasLiveBuild(a, "ios", "1.2.1", "production")).toBe(false);
  });

  it("sends a 4-byte length, the JSON header, then the file", async () => {
    const file = new File([new Uint8Array([9, 8, 7])], "app.apk");
    const body = new Uint8Array(
      await buildUploadBody({ version: "1.2.2", environments: ["production", "development"], notes: "새 기능", file }).arrayBuffer(),
    );
    const length = new DataView(body.buffer).getUint32(0);
    const header = JSON.parse(new TextDecoder().decode(body.slice(4, 4 + length))) as Record<string, unknown>;

    expect(header).toEqual({ version: "1.2.2", environments: ["production", "development"], notes: "새 기능", fileName: "app.apk" });
    expect([...body.slice(4 + length)]).toEqual([9, 8, 7]);
  });
});

describe("findSameApp", () => {
  const existing = app([], { id: "cip" });

  it("matches the same name anywhere on the Store, ignoring case and spaces", () => {
    expect(findSameApp([existing], "  change impact PREVIEW ")?.id).toBe("cip");
    expect(findSameApp([existing], "Something Else")).toBeNull();
    expect(findSameApp([existing], "  ")).toBeNull();
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  it("reads like the history column", () => {
    expect(relativeTime("2026-10-07T12:00:00Z", now)).toMatch(/7 days ago|last week|1 week ago/);
    expect(relativeTime("2024-10-14T12:00:00Z", now)).toMatch(/2 years ago/);
    expect(relativeTime("2026-10-14T11:59:30Z", now)).toBe("just now");
  });
});

describe("platform tabs follow the app's category", () => {
  it("shows iOS / Android for a Mobile app and Windows / macOS for a PC app, builds or not", () => {
    expect(appPlatforms({ ...app(), category: "mobile" })).toEqual(["ios", "android"]);
    expect(appPlatforms({ ...app(), category: "pc" })).toEqual(["windows", "macos"]);
    expect(categoryPlatforms("pc")).toEqual(["windows", "macos"]);
  });
});

describe("Get on an app card", () => {
  const a = app([
    build("a1", "android", "production", "1.9.0"),
    build("a2", "android", "production", "1.10.0"),
    build("a3", "android", "production", "2.0.0", { removedAt: "2026-10-15T00:00:00Z" }),
    build("a4", "android", "development", "1.11.0-beta"),
  ]);

  it("takes the highest live version, not the last upload and not a removed one", () => {
    expect(latestLiveBuild(a, "android", "production")?.id).toBe("a2");
    expect(latestLiveBuild(a, "android", "development")?.id).toBe("a4");
    expect(latestLiveBuild(a, "ios", "production")).toBeNull();
  });

  it("offers a Mobile app both platforms in each environment, with a build only where one is live", () => {
    expect(getOptions(a, "production").map((o) => [o.platform, o.build?.id ?? null])).toEqual([
      ["ios", null],
      ["android", "a2"],
    ]);
  });

  it("offers a PC app Windows and macOS, plus any other platform it has a live build for", () => {
    const pc = app([build("w1", "windows", "development", "1.0.0"), build("i1", "ios", "development", "1.0.0")], { category: "pc" });
    expect(getOptions(pc, "development").map((o) => o.platform)).toEqual(["ios", "windows", "macos"]);
  });

  it("has something to Get only with a live build", () => {
    expect(hasGettableBuild(a)).toBe(true);
    expect(hasGettableBuild(app([build("r", "ios", "production", "1.0", { removedAt: "2026-10-15T00:00:00Z" })]))).toBe(false);
    expect(hasGettableBuild(app())).toBe(false);
  });
});
