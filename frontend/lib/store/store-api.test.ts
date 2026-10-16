import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionExpiredError } from "@/lib/auth/api";
import { translations } from "@/lib/i18n/translations";
import { storeErrorMessage } from "@/lib/store/store-i18n";
import {
  StoreApiError,
  buildUploadBody,
  fetchStoreApps,
  compareVersions,
  featuredApp,
  lastActivity,
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
    bannerUrl: null,
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
  it("speaks the page's language when given one", () => {
    expect(relativeTime("2026-10-07T12:00:00Z", now, { locale: "ko" })).toMatch(/일 전|지난주|주 전/);
    expect(relativeTime("2026-10-14T11:59:30Z", now, { locale: "km", justNow: "អម្បាញ់មិញ" })).toBe("អម្បាញ់មិញ");
  });
});

describe("Store errors say where their message came from, so the page can translate it", () => {
  afterEach(() => vi.unstubAllGlobals());

  const failWith = (response: Response | Error) =>
    vi.stubGlobal("fetch", vi.fn(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response))));

  it("tags a network failure, a 403, a bare failure and a backend detail", async () => {
    failWith(new TypeError("offline"));
    await expect(fetchStoreApps()).rejects.toMatchObject({ code: "network" });
    failWith(new Response(null, { status: 403 }));
    await expect(fetchStoreApps()).rejects.toMatchObject({ code: "forbidden" });
    failWith(new Response("oops", { status: 500 }));
    await expect(fetchStoreApps()).rejects.toMatchObject({ code: "fallback" });
    failWith(new Response(JSON.stringify({ detail: "name already used" }), { status: 409 }));
    await expect(fetchStoreApps()).rejects.toMatchObject({ code: "server", message: "Name already used" });
  });

  it("words each in the reader's language, keeping only the backend's own text as sent", () => {
    const ko = translations.ko;
    expect(storeErrorMessage(new StoreApiError("x", "network"), ko, "fb")).toBe(ko.storeErrors.network);
    expect(storeErrorMessage(new StoreApiError("x", "forbidden"), ko, "fb")).toBe(ko.storeErrors.forbidden);
    expect(storeErrorMessage(new StoreApiError("x", "tooLarge"), ko, "fb")).toBe(ko.storeErrors.tooLarge);
    expect(storeErrorMessage(new StoreApiError("x", "fallback"), ko, "fb")).toBe("fb");
    expect(storeErrorMessage(new StoreApiError("Name already used", "server"), ko, "fb")).toBe("Name already used");
    expect(storeErrorMessage(new SessionExpiredError("x"), ko, "fb")).toBe(ko.storeErrors.sessionExpired);
    expect(storeErrorMessage(new Error("boom"), ko, "fb")).toBe("fb");
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

describe("featuredApp", () => {
  it("features the app with the newest upload", () => {
    const older = app([build("1", "android", "production", "1.0.0", { createdAt: "2026-10-10T00:00:00Z" })], { id: "old" });
    const newer = app([build("2", "ios", "development", "2.0.0", { createdAt: "2026-10-15T00:00:00Z" })], { id: "new" });

    expect(featuredApp([older, newer])?.id).toBe("new");
  });

  it("counts an edit to the app as activity too", () => {
    const uploaded = app([build("1", "android", "production", "1.0.0", { createdAt: "2026-10-12T00:00:00Z" })], { id: "up" });
    const edited = app([build("2", "android", "production", "1.0.0", { createdAt: "2026-10-01T00:00:00Z" })], {
      id: "ed",
      updatedAt: "2026-10-16T00:00:00Z",
    });

    expect(featuredApp([uploaded, edited])?.id).toBe("ed");
  });

  it("skips apps with nothing to download, and returns null when none has", () => {
    const empty = app([], { id: "empty", updatedAt: "2026-10-20T00:00:00Z" });
    const removed = app([build("9", "ios", "production", "1.0.0", { removedAt: "2026-10-15T00:00:00Z" })], { id: "gone" });

    expect(featuredApp([empty, removed])).toBeNull();
    expect(featuredApp([])).toBeNull();
  });

  it("ignores a removed build's date", () => {
    const withRemoved = app([
      build("1", "android", "production", "1.0.0", { createdAt: "2026-10-05T00:00:00Z" }),
      build("2", "android", "production", "2.0.0", { createdAt: "2026-10-18T00:00:00Z", removedAt: "2026-10-19T00:00:00Z" }),
    ]);

    expect(lastActivity(withRemoved)).toBe("2026-10-14T00:00:00Z");
  });

  it("features the app an admin pinned, even over a newer upload", () => {
    const pinned = app([build("1", "android", "production", "1.0.0", { createdAt: "2026-10-01T00:00:00Z" })], { id: "pin" });
    const newer = app([build("2", "ios", "production", "2.0.0", { createdAt: "2026-10-15T00:00:00Z" })], { id: "new" });

    expect(featuredApp([pinned, newer], "pin")?.id).toBe("pin");
  });

  it("falls back to the latest when the pinned app is not in the reader's list", () => {
    const newer = app([build("2", "ios", "production", "2.0.0")], { id: "new" });

    expect(featuredApp([newer], "gone-or-private")?.id).toBe("new");
  });
});
