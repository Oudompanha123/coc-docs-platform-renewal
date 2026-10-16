import { absoluteUrl, type StoreBuild } from "@/lib/store/store-api";

/**
 * Where one build download stands. `total` is null when the size isn't known,
 * which the ring shows as an indeterminate spinner instead of a percentage.
 */
export type DownloadState =
  | { buildId: string; status: "downloading"; loaded: number; total: number | null }
  | { buildId: string; status: "done" }
  | { buildId: string; status: "error"; message: string };

/** 0–100, or null when the total is unknown. Never above 100, whatever the server sent. */
export function percentOf(loaded: number, total: number | null): number | null {
  if (!total || total <= 0) return null;
  return Math.min(100, Math.floor((loaded / total) * 100));
}

/**
 * Downloads a build with `fetch` so progress can be reported, then hands the
 * bytes to the browser as an ordinary file save. A plain link can't report
 * progress. The session cookie goes with the request, as it did for the link.
 *
 * The file is held in memory until it completes, so a very large build costs
 * that much memory for the duration. Throws on a failed request or an
 * aborted signal; a thrown error has a message fit to show the user.
 *
 * // req: ADR-108, ADR-111
 */
export async function downloadBuild(
  build: Pick<StoreBuild, "downloadUrl" | "fileName" | "sizeBytes">,
  onProgress: (loaded: number, total: number | null) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!build.downloadUrl) throw new Error("This build was removed and can't be downloaded.");

  const source = await fetchDownloadLink(build.downloadUrl, signal);

  let response: Response;
  try {
    // A presigned URL carries its own authorisation and is another origin (S3): no cookies.
    response = source.presigned
      ? await fetch(source.url, { signal })
      : await fetch(absoluteUrl(source.url), { credentials: "include", signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "This build is no longer available."
        : source.presigned && response.status === 403
          ? "The download link expired. Try again."
          : response.status === 401 || response.status === 403
            ? "You don't have access to this build."
            : `The download failed (${response.status}). Try again.`,
    );
  }

  const header = Number(response.headers.get("content-length"));
  // The server's length wins; the size recorded at upload is the fallback.
  const total = Number.isFinite(header) && header > 0 ? header : build.sizeBytes > 0 ? build.sizeBytes : null;
  const type = response.headers.get("content-type") ?? "application/octet-stream";

  let blob: Blob;
  if (!response.body) {
    blob = await response.blob();
    onProgress(blob.size, total);
  } else {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
        onProgress(loaded, total);
      }
    } catch (err) {
      if (signal?.aborted) throw err;
      throw new Error("The download was interrupted. Try again.");
    }
    blob = new Blob(chunks as BlobPart[], { type });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = build.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the save before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Where a build is fetched from: a presigned S3 URL, or this API's own download route. */
interface DownloadLink {
  url: string;
  presigned: boolean;
}

/**
 * Asks the backend where to download from. The backend decides access here
 * (public app, admin, not removed) and, with S3 storage, mints a short-lived
 * presigned URL — so the file itself comes straight from S3, not through the
 * backend. `downloadUrl` is the build's `/download` route; its `-link` sibling
 * answers with JSON.
 */
async function fetchDownloadLink(downloadUrl: string, signal?: AbortSignal): Promise<DownloadLink> {
  let response: Response;
  try {
    response = await fetch(absoluteUrl(`${downloadUrl}-link`), { credentials: "include", signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "This build is no longer available."
        : response.status === 401 || response.status === 403
          ? "You don't have access to this build."
          : `The download failed (${response.status}). Try again.`,
    );
  }
  return (await response.json()) as DownloadLink;
}
