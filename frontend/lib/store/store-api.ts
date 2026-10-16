import { AuthApiError, BACKEND_URL, SessionExpiredError } from "@/lib/auth/api";

/**
 * The Store page — `/api/v1/store` for everyone signed in, and
 * `/api/v1/admin/store/apps` for admins (ADR-108, ADR-111). The backend
 * decides who sees what: a user's list holds public apps only, and a private
 * app's page or build answers 404 to anyone but an admin. Nothing here is a
 * permission check.
 *
 * An app is a name, icon, description and visibility; it is not tied to a
 * platform. Each build is one file for one platform — the file's type says
 * which — one version, and one environment ("server type").
 *
 * // req: ADR-108, ADR-111
 */

export type StorePlatform = "android" | "ios" | "windows" | "macos";
export type StoreEnvironment = "production" | "development";
export type StoreTab = "all" | "mobile" | "pc";

export const PLATFORMS: readonly StorePlatform[] = ["ios", "android", "windows", "macos"];

export const PLATFORM_LABELS: Record<StorePlatform, string> = {
  android: "Android",
  ios: "iOS",
  windows: "Windows",
  macos: "macOS",
};

export const ENVIRONMENTS: readonly StoreEnvironment[] = ["production", "development"];

export const ENVIRONMENT_LABELS: Record<StoreEnvironment, string> = {
  production: "Production",
  development: "Development",
};

/** Which platforms each listing tab covers. */
export const TAB_PLATFORMS: Record<Exclude<StoreTab, "all">, readonly StorePlatform[]> = {
  mobile: ["android", "ios"],
  pc: ["windows", "macos"],
};

/** Mirrors `StorePlatform`'s extensions on the backend, which is what decides. */
export const PLATFORM_EXTENSIONS: Record<StorePlatform, readonly string[]> = {
  android: [".apk", ".aab"],
  ios: [".ipa"],
  windows: [".exe", ".msi", ".msix", ".appx"],
  macos: [".dmg", ".pkg"],
};

/** For a file input's `accept`. */
export const ALL_INSTALLER_EXTENSIONS = PLATFORMS.flatMap((p) => PLATFORM_EXTENSIONS[p]);

/** Mirrors the backend's version rule (V85 / `StoreFileStorage.VERSION`). */
export const VERSION_PATTERN = /^[0-9A-Za-z]([0-9A-Za-z._+-]{0,62}[0-9A-Za-z])?$/;

/** The "What's new" limit (V85). */
export const MAX_NOTES = 1500;

export interface StoreBuild {
  id: string;
  platform: StorePlatform;
  version: string;
  environment: StoreEnvironment;
  notes: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
  /** Set once an admin removed this build. Its file is gone; the row stays for the history. */
  removedAt: string | null;
  /** "removed" once an admin removed it (file deleted, row kept); the UI reads `isLive`, which agrees. */
  status: "active" | "removed";
  /** Display name of the uploader; null if that account no longer exists. */
  uploadedBy: string | null;
  /** Relative to the backend (see {@link absoluteUrl}); null for a removed build. */
  downloadUrl: string | null;
}

export interface StoreApp {
  id: string;
  /** The app's number — its page is `/store-<number>` (see {@link storeAppHref}). */
  number: number;
  name: string;
  description: string;
  /** Mobile (iOS / Android builds) or PC (Windows / macOS builds), chosen on Add App. */
  category: StoreCategory;
  isPublic: boolean;
  /** Relative to the backend, or null when there is no icon. */
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  /** Every build, removed ones included, newest first. */
  builds: StoreBuild[];
}

export type StoreCategory = "mobile" | "pc";

export const STORE_CATEGORIES: { value: StoreCategory; label: string; hint: string }[] = [
  { value: "mobile", label: "Mobile", hint: "iOS and Android apps" },
  { value: "pc", label: "PC", hint: "Windows and macOS apps" },
];

export interface StoreAppInput {
  name: string;
  description: string;
  category: StoreCategory;
  isPublic: boolean;
}

export class StoreApiError extends AuthApiError {}

/** A 404: the app or build does not exist, or the caller may not see it — the backend does not say which. */
export class StoreNotFoundError extends StoreApiError {}

export function absoluteUrl(path: string): string {
  return `${BACKEND_URL}${path}`;
}

/** The Store listing. */
export const STORE_HREF = "/store";

/**
 * An app's page, `/store/app-<number>` (`app/(member)/store/[slug]`).
 * `middleware.ts` redirects the earlier `/store-<number>` form here.
 */
export function storeAppHref(number: number): string {
  return `/store/app-${number}`;
}

/** The app number in a `[slug]` route segment like `app-7`; null if it isn't one. */
export function storeAppNumber(slug: string): number | null {
  const match = /^app-(\d+)$/.exec(slug);
  return match ? Number(match[1]) : null;
}

/** `/store` and everything under it, plus the earlier `/store-<n>` — the header's "Store" is active on all. */
export function isStorePath(pathname: string | null | undefined): boolean {
  return !!pathname && /^\/store(?:-\d+)?(?:\/|$)/.test(pathname);
}

/** The platform an install file is for, from its extension; null for any other file. */
export function platformOfFile(fileName: string): StorePlatform | null {
  const name = fileName.trim().toLowerCase();
  return PLATFORMS.find((p) => PLATFORM_EXTENSIONS[p].some((ext) => name.endsWith(ext))) ?? null;
}

export function isLive(build: StoreBuild): boolean {
  // `== null`: a backend older than V85 sends no `removedAt` at all, and such a build is live — not "Removed".
  return build.removedAt == null;
}

/** The platforms an app has at least one live build for, in tab order. */
export function livePlatforms(app: StoreApp): StorePlatform[] {
  return PLATFORMS.filter((p) => app.builds.some((b) => b.platform === p && isLive(b)));
}

/** The platforms an app of this category can have builds for: iOS / Android for Mobile, Windows / macOS for PC. */
export function categoryPlatforms(category: StoreCategory): readonly StorePlatform[] {
  // An older backend (before V86) sends no category; treat that app as Mobile, as the migration does.
  return TAB_PLATFORMS[category] ?? TAB_PLATFORMS.mobile;
}

/** The platform tabs an app's page shows: its category's platforms, plus any other it already has builds for. */
export function appPlatforms(app: StoreApp): StorePlatform[] {
  const own = categoryPlatforms(app.category);
  return PLATFORMS.filter((p) => own.includes(p) || app.builds.some((b) => b.platform === p));
}

/** The platforms an app has ever had a build for — live or removed — in tab order. */
export function historyPlatforms(app: StoreApp): StorePlatform[] {
  return PLATFORMS.filter((p) => app.builds.some((b) => b.platform === p));
}

/** Whether the app belongs under a listing tab: "All" always; Mobile / PC when it has a live build there. */
export function inTab(app: StoreApp, tab: StoreTab): boolean {
  return tab === "all" || livePlatforms(app).some((p) => TAB_PLATFORMS[tab].includes(p));
}

/**
 * Orders two versions: dot-separated parts, numbers compared as numbers
 * (`1.10` > `1.9`), and a pre-release below its release (`1.2.0-beta` <
 * `1.2.0`). Negative when `a` is older. Nothing here throws.
 */
export function compareVersions(a: string, b: string): number {
  const [aMain = "", aPre] = splitPre(a);
  const [bMain = "", bPre] = splitPre(b);
  const byParts = compareParts(aMain.split(/[._]/), bMain.split(/[._]/));
  if (byParts !== 0) return byParts;
  if (aPre === undefined || bPre === undefined) return aPre === bPre ? 0 : aPre === undefined ? 1 : -1;
  return compareParts(aPre.split(/[.\-_]/), bPre.split(/[.\-_]/));
}

function splitPre(version: string): [string, string | undefined] {
  const plain = version.split("+")[0] ?? version;
  const dash = plain.indexOf("-");
  return dash < 0 ? [plain, undefined] : [plain.slice(0, dash), plain.slice(dash + 1)];
}

function compareParts(a: string[], b: string[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i];
    const y = b[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = /^\d+$/.test(x) ? Number(x) : null;
    const ny = /^\d+$/.test(y) ? Number(y) : null;
    const diff =
      nx !== null && ny !== null ? nx - ny : nx !== null ? 1 : ny !== null ? -1 : x.localeCompare(y, undefined, { sensitivity: "base" });
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

/** The latest live build of a platform in each environment — the highest version, not the last upload. */
export function latestByEnvironment(app: StoreApp, platform: StorePlatform): Record<StoreEnvironment, StoreBuild | null> {
  const latest = (env: StoreEnvironment) =>
    app.builds
      .filter((b) => b.platform === platform && b.environment === env && isLive(b))
      .reduce<StoreBuild | null>((best, b) => (!best || compareVersions(b.version, best.version) > 0 ? b : best), null);
  return { production: latest("production"), development: latest("development") };
}

/** One row of a platform's version history: a version and what exists of it in each environment. */
export interface VersionRow {
  version: string;
  /** The live build, else the most recently removed one, else null (never uploaded — "N/A"). */
  production: StoreBuild | null;
  development: StoreBuild | null;
}

/** Every version a platform of the app has had, highest first, with its Production and Development builds. */
export function versionRows(app: StoreApp, platform: StorePlatform): VersionRow[] {
  const rows = new Map<string, VersionRow>();
  for (const b of app.builds.filter((b) => b.platform === platform)) {
    const row = rows.get(b.version) ?? { version: b.version, production: null, development: null };
    const current = row[b.environment];
    // A live build wins over a removed one; between two removed, the later removal.
    if (!current || (isLive(b) && !isLive(current)) || (!isLive(b) && !isLive(current) && b.removedAt! > current.removedAt!)) {
      row[b.environment] = b;
    }
    rows.set(b.version, row);
  }
  return [...rows.values()].sort((a, b) => compareVersions(b.version, a.version));
}

/** Whether a live build of this platform and version already exists in this environment — the backend's 409, said first. */
export function hasLiveBuild(app: StoreApp, platform: StorePlatform, version: string, environment: StoreEnvironment): boolean {
  return app.builds.some(
    (b) => isLive(b) && b.platform === platform && b.environment === environment && b.version === version.trim(),
  );
}

/**
 * The version a new upload for this platform most likely is: its highest
 * version so far with the last number raised by one (`1.2.1` → `1.2.2`).
 * `1.0.0` for a platform with no builds yet.
 */
export function suggestNextVersion(app: StoreApp, platform: StorePlatform): string {
  const highest = versionRows(app, platform)[0]?.version;
  if (!highest) return "1.0.0";
  const match = /^(.*?)(\d+)$/.exec(splitPre(highest)[0]);
  const next = match ? `${match[1]}${Number(match[2]) + 1}` : "";
  return VERSION_PATTERN.test(next) ? next : "";
}

/** The existing app with this name, if any — ignoring case and spaces, as the backend does (409). */
export function findSameApp(apps: StoreApp[], name: string): StoreApp | null {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return apps.find((a) => a.name.trim().toLowerCase() === key) ?? null;
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "7 days ago", "last month", "2 years ago" — how long ago, at a glance. The exact date goes in a tooltip. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(2)} ${units[unit]}`;
}

function problemMessage(detail: string | null | undefined, fallback: string): string {
  return detail ? detail.charAt(0).toUpperCase() + detail.slice(1) : fallback;
}

async function request<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { credentials: "include", ...init });
  } catch {
    throw new StoreApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401) {
    throw new SessionExpiredError("Your session has ended. Please sign in again.");
  }
  if (response.status === 403) {
    throw new StoreApiError("Only an admin can manage the Store.");
  }
  if (!response.ok) {
    let detail: string | null = null;
    try {
      detail = ((await response.json()) as { detail?: string }).detail ?? null;
    } catch {
      // Not a problem document — use the fallback.
    }
    const message = problemMessage(detail, fallback);
    throw response.status === 404 ? new StoreNotFoundError(message) : new StoreApiError(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const ADMIN = `${BACKEND_URL}/api/v1/admin/store/apps`;

/** Every public app — what every user sees. */
export function fetchStoreApps(): Promise<StoreApp[]> {
  return request<StoreApp[]>(`${BACKEND_URL}/api/v1/store/apps`, {}, "Couldn't load the Store.");
}

/** One app, by the number in its page URL. A user gets 404 for a private app; an admin gets every app. */
export async function fetchStoreApp(number: number): Promise<StoreApp> {
  try {
    return await request<StoreApp>(`${BACKEND_URL}/api/v1/store/apps/${number}`, {}, "Couldn't load this app.");
  } catch (err) {
    if (err instanceof StoreNotFoundError) {
      throw new StoreNotFoundError("This app isn't available. It may have been removed or made private.");
    }
    throw err;
  }
}

/** Every app, private ones included. Admin only. */
export function fetchAllStoreApps(): Promise<StoreApp[]> {
  return request<StoreApp[]>(ADMIN, {}, "Couldn't load the Store.");
}

export function createStoreApp(input: StoreAppInput): Promise<StoreApp> {
  return request<StoreApp>(
    ADMIN,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "Couldn't add the app.",
  );
}

export function updateStoreApp(id: string, input: StoreAppInput): Promise<StoreApp> {
  return request<StoreApp>(
    `${ADMIN}/${encodeURIComponent(id)}`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "Couldn't save the app.",
  );
}

export function deleteStoreApp(id: string): Promise<void> {
  return request<void>(`${ADMIN}/${encodeURIComponent(id)}`, { method: "DELETE" }, "Couldn't delete the app.");
}

/** The raw image is the body — see AdminStoreController for why not multipart. */
export function uploadStoreLogo(id: string, file: File): Promise<StoreApp> {
  return request<StoreApp>(
    `${ADMIN}/${encodeURIComponent(id)}/logo`,
    { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file },
    "Couldn't upload the app icon.",
  );
}

export interface NextVersionInput {
  version: string;
  environments: StoreEnvironment[];
  notes: string;
  file: File;
}

/**
 * The body of a build upload: a 4-byte big-endian length, that many bytes of
 * UTF-8 JSON, then the file — see `AdminStoreController#uploadBuild` for why.
 * Built as a Blob, so the file is never read into memory here.
 */
export function buildUploadBody(input: NextVersionInput): Blob {
  const header = new TextEncoder().encode(
    JSON.stringify({ version: input.version, environments: input.environments, notes: input.notes, fileName: input.file.name }),
  );
  const length = new ArrayBuffer(4);
  new DataView(length).setUint32(0, header.byteLength);
  return new Blob([length, header, input.file]);
}

/**
 * Uploads the next version of an app. `XMLHttpRequest` rather than `fetch`
 * only because fetch cannot report upload progress, and an installer can
 * take a while.
 */
export function uploadNextVersion(appId: string, input: NextVersionInput, onProgress?: (fraction: number) => void): Promise<StoreApp> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${ADMIN}/${encodeURIComponent(appId)}/builds`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new StoreApiError("Couldn't reach the server. Check your connection and try again."));
    xhr.onload = () => {
      if (xhr.status === 401) return reject(new SessionExpiredError("Your session has ended. Please sign in again."));
      if (xhr.status === 403) return reject(new StoreApiError("Only an admin can manage the Store."));
      if (xhr.status === 413) return reject(new StoreApiError("The file is larger than the Store allows."));
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Fall through to the generic message below.
      }
      if (xhr.status >= 200 && xhr.status < 300 && body) return resolve(body as StoreApp);
      reject(new StoreApiError(problemMessage((body as { detail?: string } | null)?.detail, "Couldn't upload the file.")));
    };
    xhr.send(buildUploadBody(input));
  });
}

/** Removes one build. Its file is deleted; it stays in the history as "Removed". */
export function removeStoreBuild(appId: string, buildId: string): Promise<StoreApp> {
  return request<StoreApp>(
    `${ADMIN}/${encodeURIComponent(appId)}/builds/${encodeURIComponent(buildId)}`,
    { method: "DELETE" },
    "Couldn't remove the build.",
  );
}

/**
 * The newest live build of a platform in an environment — what "Get" on an
 * app card downloads. The highest version wins (1.10.0 beats 1.9.0), and a
 * version whose build in this environment was removed is skipped. Null when
 * there is none.
 */
export function latestLiveBuild(app: StoreApp, platform: StorePlatform, environment: StoreEnvironment): StoreBuild | null {
  const build = latestByEnvironment(app, platform)[environment];
  return build?.downloadUrl ? build : null;
}

/**
 * The platforms offered in the Get dialog for an environment: the ones the
 * app's category covers (iOS / Android for Mobile, Windows / macOS for PC),
 * plus any other it has a live build for — each with its latest live build,
 * or null when that platform has nothing in this environment yet.
 */
export function getOptions(app: StoreApp, environment: StoreEnvironment): Array<{ platform: StorePlatform; build: StoreBuild | null }> {
  const own = categoryPlatforms(app.category);
  return PLATFORMS.filter((p) => own.includes(p) || latestLiveBuild(app, p, environment) !== null).map((platform) => ({
    platform,
    build: latestLiveBuild(app, platform, environment),
  }));
}

/** Whether the app has anything to Get: a live build with a download link, in any environment. */
export function hasGettableBuild(app: StoreApp): boolean {
  return app.builds.some((b) => isLive(b) && !!b.downloadUrl);
}
