import { BACKEND_URL } from "@/lib/auth/api";

/**
 * Builds and downloads `claude-usage.config.json` — the file `push-usage.mjs`
 * (see `frontend/public/downloads/push-usage.mjs`) reads from the same
 * folder it sits in. Removes the manual "fill in three values by hand,
 * asking around for the shared secret" step: every field here comes from
 * either the signed-in caller's own session or a token they just minted
 * themselves (`createUsageToken`, ADR-047) — nothing is typed in.
 *
 * Mirrors `lib/settings/export-my-data.ts`'s own split: a pure, testable
 * builder here, DOM-touching download as a thin wrapper around it.
 */

export interface ReporterConfig {
  USER_EMAIL: string;
  USER_NAME: string;
  INGEST_URL: string;
  INGEST_SECRET: string;
}

/** Fixed — `push-usage.mjs` looks for exactly this name next to itself. */
export function reporterConfigFileName(): string {
  return "claude-usage.config.json";
}

/**
 * `INGEST_URL` is derived from the same `NEXT_PUBLIC_BACKEND_URL` every other
 * admin API call in this app already uses ({@link BACKEND_URL}) — never
 * typed in, so it can't drift from the backend this dashboard itself talks
 * to. `token` is the raw bearer value `createUsageToken` returns once, at
 * creation; this function never reads or stores it beyond building this one
 * object.
 */
export function buildReporterConfig(email: string, displayName: string, token: string): ReporterConfig {
  return {
    USER_EMAIL: email,
    USER_NAME: displayName,
    INGEST_URL: `${BACKEND_URL}/api/ingest`,
    INGEST_SECRET: token,
  };
}

/**
 * Hands the config to the browser as a download, same object-URL/anchor
 * pattern as `lib/settings/export-my-data.ts#downloadMyData` — the object
 * URL is revoked on the next event-loop turn rather than immediately, since
 * revoking it synchronously has cancelled the download outright in Safari.
 */
export function downloadReporterConfig(config: ReporterConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = reporterConfigFileName();
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
