import { AuthApiError, BACKEND_URL, SessionExpiredError } from "@/lib/auth/api";

/**
 * The Store page — `/api/v1/store` for everyone signed in, and
 * `/api/v1/admin/store/apps` for admins (ADR-108). The backend decides who
 * sees what: a user's list holds public apps only, and a private app's build
 * answers 404 to anyone but an admin. Nothing here is a permission check.
 *
 * // req: ADR-108
 */

export type StorePlatform = "android" | "ios" | "windows" | "macos";
export type StoreEnvironment = "production" | "development";
export type StoreTab = "mobile" | "pc";

export const PLATFORM_LABELS: Record<StorePlatform, string> = {
  android: "Android",
  ios: "iOS",
  windows: "Windows",
  macos: "macOS",
};

export const ENVIRONMENT_LABELS: Record<StoreEnvironment, string> = {
  production: "Production",
  development: "Development",
};

/** Which tab each platform is listed under. */
export const TAB_PLATFORMS: Record<StoreTab, readonly StorePlatform[]> = {
  mobile: ["android", "ios"],
  pc: ["windows", "macos"],
};

/** Mirrors `StorePlatform`'s extension lists on the backend — the backend is what enforces them. */
export const PLATFORM_EXTENSIONS: Record<StorePlatform, readonly string[]> = {
  android: [".apk", ".aab"],
  ios: [".ipa"],
  windows: [".exe", ".msi", ".msix", ".appx", ".zip"],
  macos: [".dmg", ".pkg", ".zip"],
};

/** Mirrors the backend's version rule (V82 / `StoreFileStorage.VERSION`). */
export const VERSION_PATTERN = /^[0-9A-Za-z]([0-9A-Za-z._+-]{0,62}[0-9A-Za-z])?$/;

export const MAX_NOTES = 500;

export interface StoreRelease {
  id: string;
  version: string;
  environment: StoreEnvironment;
  notes: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
  /** Relative to the backend; see {@link absoluteUrl}. */
  downloadUrl: string;
}

export interface StoreApp {
  id: string;
  /** The app's number — its page is `/store-<number>` (see {@link storeAppHref}). */
  number: number;
  name: string;
  description: string;
  platform: StorePlatform;
  isPublic: boolean;
  /** Relative to the backend, or null when there is no logo. */
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  /** Newest first. */
  releases: StoreRelease[];
}

export interface StoreAppInput {
  name: string;
  description: string;
  platform: StorePlatform;
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
 * An app's page. `/store-<number>` is what the browser shows; `middleware.ts`
 * rewrites it to the internal `app/(member)/store/[number]` route, because a
 * Next.js segment cannot be half literal, half dynamic.
 */
export function storeAppHref(number: number): string {
  return `/store-${number}`;
}

/** `/store`, `/store-<n>` and the internal `/store/<n>` — the header's "Store" is active on all three. */
export function isStorePath(pathname: string | null | undefined): boolean {
  return !!pathname && /^\/store(?:-\d+)?(?:\/|$)/.test(pathname);
}

const MAX_NAME = 80;

/**
 * What the Add app form fills in from the chosen install file when the admin
 * has not typed anything yet: the file name itself as the app's name, kept
 * exactly as uploaded (`COC-Workbench-Setup-1.2.1.exe`), and the first
 * dotted number in it as the version (`1.2.1`). Both stay editable.
 */
export function suggestFromFileName(fileName: string): { name: string; version: string | null } {
  const name = fileName.trim().slice(0, MAX_NAME);
  const match = /\d+(?:\.\d+)+/.exec(fileName);
  const version = match && VERSION_PATTERN.test(match[0]) ? match[0] : null;
  return { name, version };
}

/** The newest build in each environment — what the two download buttons offer. */
export function latestByEnvironment(app: StoreApp): Record<StoreEnvironment, StoreRelease | null> {
  return {
    production: app.releases.find((r) => r.environment === "production") ?? null,
    development: app.releases.find((r) => r.environment === "development") ?? null,
  };
}

export function tabOf(platform: StorePlatform): StoreTab {
  return TAB_PLATFORMS.mobile.includes(platform) ? "mobile" : "pc";
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
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
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
    const message = detail ? detail.charAt(0).toUpperCase() + detail.slice(1) : fallback;
    throw response.status === 404 ? new StoreNotFoundError(message) : new StoreApiError(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const ADMIN = `${BACKEND_URL}/api/v1/admin/store/apps`;

/** Public apps with at least one build — what every user sees. */
export function fetchStoreApps(): Promise<StoreApp[]> {
  return request<StoreApp[]>(`${BACKEND_URL}/api/v1/store/apps`, {}, "Couldn't load the Store.");
}

/**
 * One app, by the number in its page URL. A user gets 404 for a private app
 * or one with no builds; an admin gets every app.
 */
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

/** Every app, private ones and ones with no builds yet included. Admin only. */
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
    "Couldn't upload the logo.",
  );
}

export interface ReleaseInput {
  version: string;
  environment: StoreEnvironment;
  notes: string;
  file: File;
}

/**
 * Uploads a build. `XMLHttpRequest` rather than `fetch` only because fetch
 * cannot report upload progress, and an installer can take a while.
 */
export function uploadStoreRelease(
  appId: string,
  input: ReleaseInput,
  onProgress?: (fraction: number) => void,
): Promise<StoreApp> {
  const query = new URLSearchParams({
    version: input.version,
    environment: input.environment,
    fileName: input.file.name,
    notes: input.notes,
  });
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${ADMIN}/${encodeURIComponent(appId)}/releases?${query.toString()}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new StoreApiError("Couldn't reach the server. Check your connection and try again."));
    xhr.onload = () => {
      if (xhr.status === 401) {
        reject(new SessionExpiredError("Your session has ended. Please sign in again."));
        return;
      }
      if (xhr.status === 403) {
        reject(new StoreApiError("Only an admin can manage the Store."));
        return;
      }
      if (xhr.status === 413) {
        reject(new StoreApiError("The file is larger than the Store allows."));
        return;
      }
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Fall through to the generic message below.
      }
      if (xhr.status >= 200 && xhr.status < 300 && body) {
        resolve(body as StoreApp);
        return;
      }
      const detail = (body as { detail?: string } | null)?.detail;
      reject(new StoreApiError(detail ? detail.charAt(0).toUpperCase() + detail.slice(1) : "Couldn't upload the build."));
    };
    xhr.send(input.file);
  });
}

export function deleteStoreRelease(appId: string, releaseId: string): Promise<StoreApp> {
  return request<StoreApp>(
    `${ADMIN}/${encodeURIComponent(appId)}/releases/${encodeURIComponent(releaseId)}`,
    { method: "DELETE" },
    "Couldn't delete the build.",
  );
}
