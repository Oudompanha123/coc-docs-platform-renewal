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
 * Where the generic, unpersonalized template lives — the one path every
 * "download push-usage.mjs" trigger in the app fetches and embeds into,
 * whether that's `DownloadConfigPanel` (Claude Usage / Home) or the docs
 * setup guide's own download link (`ContentRenderer`). Kept here, not
 * re-hardcoded at each call site, so the two can't silently drift apart.
 */
export const GENERIC_TEMPLATE_URL = "/downloads/push-usage.mjs";

/**
 * A machine never has to be named to mint a token for it — the label is only
 * ever a display convenience for telling entries apart in "Your tokens"
 * (`DownloadConfigPanel`), and is renameable in effect by revoking and
 * re-downloading. Dated rather than numbered so two tokens minted the same
 * day are still told apart from their "Last used" timestamps, not a
 * meaningless counter.
 */
export function autoLabel(): string {
  return `Machine — ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
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
 * string. `ingestUrl` comes from that same mint response — the backend states
 * where it is publicly reachable, so a production download can never carry a
 * `localhost` URL baked into this bundle at build time.
 *
 * `JSON.stringify` is what makes this safe against a display name containing
 * quotes, backslashes, or other characters that would otherwise break out of
 * the generated object literal — the same reasoning any JSON-embedding-in-JS
 * step relies on.
 */
export function buildPersonalizedScript(
  template: string,
  email: string,
  displayName: string,
  token: string,
  ingestUrl: string,
): string {
  if (!template.includes(EMBEDDED_CONFIG_MARKER)) {
    throw new Error("push-usage.mjs template has changed shape — could not embed your config into it.");
  }
  if (!email || !token) {
    // A caller reaching this point with a blank email/token is itself a bug
    // upstream (a session that hasn't loaded yet, a mint response missing its
    // token) — failing loudly here beats silently downloading a script that
    // is indistinguishable from the untouched generic template.
    throw new Error("Missing your account email or a minted token — could not personalize the script. Please try again.");
  }
  if (!/^https?:\/\/[^/]+(\/.*)?\/api\/ingest$/.test(ingestUrl ?? "")) {
    // An older backend that doesn't send `ingestUrl`, or a garbled one: refuse
    // rather than ship a script whose every run fails (or posts somewhere else).
    throw new Error("The server didn't provide a usable ingest URL — could not personalize the script.");
  }

  const embedded = {
    USER_EMAIL: email,
    USER_NAME: displayName,
    INGEST_URL: ingestUrl,
    INGEST_SECRET: token,
  };

  const script = template.replace(EMBEDDED_CONFIG_MARKER, `const EMBEDDED_CONFIG = ${JSON.stringify(embedded)};`);

  // Defense in depth, not redundant with the checks above: proves the
  // replace actually took and round-trips to the exact email given, rather
  // than trusting a string `.replace()` call blindly. Catches a future
  // template edit that duplicates or subtly renames the marker, or any other
  // drift between this function and the file it edits, as a loud error
  // instead of a download nobody notices is still the generic script.
  if (script.includes(EMBEDDED_CONFIG_MARKER) || !script.includes(JSON.stringify(email))) {
    throw new Error("Couldn't verify your email was embedded in the script. Please try again.");
  }

  return script;
}

/**
 * True when `ingestUrl` points at the reader's own machine (localhost /
 * loopback) while the page itself was served from somewhere else — the exact
 * production misconfiguration this download must never hand out, since the
 * script would post to whichever PC runs it. Local development (page and
 * backend both on localhost) is not flagged.
 */
export function pointsAtLoopbackFromRemotePage(ingestUrl: string, pageHostname: string): boolean {
  const isLoopback = (host: string) =>
    host === "localhost" || host.endsWith(".localhost") || host === "[::1]" || host === "::1" || /^127\./.test(host);
  let ingestHost: string;
  try {
    ingestHost = new URL(ingestUrl).hostname;
  } catch {
    return false;
  }
  return isLoopback(ingestHost) && !isLoopback(pageHostname);
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
