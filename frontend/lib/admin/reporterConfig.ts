import { BACKEND_URL } from "@/lib/auth/api";

/**
 * Builds and downloads a **personalized `push-usage.mjs`** — the caller's own
 * copy of `frontend/public/downloads/push-usage.mjs` with its `EMBEDDED_CONFIG`
 * marker filled in, so the one file downloaded here is the only file the
 * reporter needs (ADR-050, revising ADR-047's separate `claude-usage.config.json`
 * download). Every value comes from either the signed-in caller's own session
 * or a token they just minted themselves (`createUsageToken`) — nothing is
 * typed in, and there is no companion config file to place next to it.
 *
 * Mirrors `lib/settings/export-my-data.ts`'s own split: a pure, testable
 * builder here, DOM-touching download as a thin wrapper around it.
 */

/** Fixed — this is the file the reporter setup guide tells people to run. */
export function personalizedScriptFileName(): string {
  return "push-usage.mjs";
}

/**
 * The exact `push-usage.mjs` source line this function replaces. Kept as its
 * own constant so a template that no longer contains it fails loudly instead
 * of silently downloading a script with nothing embedded.
 */
const EMBEDDED_CONFIG_MARKER = "const EMBEDDED_CONFIG = null;";

/**
 * `template` is the unmodified text of `/downloads/push-usage.mjs` (fetched
 * by the caller — this function does no I/O, so it stays trivially testable).
 * `token` is the raw bearer value `createUsageToken` returns once, at
 * creation; this function never reads or stores it beyond building this one
 * string.
 *
 * `JSON.stringify` is what makes this safe against a display name containing
 * quotes, backslashes, or other characters that would otherwise break out of
 * the generated object literal — the same reasoning any JSON-embedding-in-JS
 * step relies on.
 */
export function buildPersonalizedScript(template: string, email: string, displayName: string, token: string): string {
  if (!template.includes(EMBEDDED_CONFIG_MARKER)) {
    throw new Error("push-usage.mjs template has changed shape — could not embed your config into it.");
  }

  const embedded = {
    USER_EMAIL: email,
    USER_NAME: displayName,
    INGEST_URL: `${BACKEND_URL}/api/ingest`,
    INGEST_SECRET: token,
  };

  return template.replace(EMBEDDED_CONFIG_MARKER, `const EMBEDDED_CONFIG = ${JSON.stringify(embedded)};`);
}

/**
 * Hands the personalized script to the browser as a download, same
 * object-URL/anchor pattern as `lib/settings/export-my-data.ts#downloadMyData`
 * — the object URL is revoked on the next event-loop turn rather than
 * immediately, since revoking it synchronously has cancelled the download
 * outright in Safari.
 */
export function downloadPersonalizedScript(scriptText: string): void {
  const blob = new Blob([scriptText], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = personalizedScriptFileName();
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
