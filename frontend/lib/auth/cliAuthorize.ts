/**
 * Pure helpers for the claude-team-usage CLI's browser login (ADR-060) —
 * kept out of the page so every rule that guards the redirect is unit-tested.
 *
 * // req: FR-USAGE-002, NFR-SEC-CHANNEL, ADR-060
 */

export const CLI_AUTHORIZE_PATH = "/cli/authorize";

/** Where the CLI's loopback success page sends the browser (`browser-login.js` → `RETURN_PATH`). */
export const CLI_SIGNED_IN_PATH = "/cli/signed-in";

/**
 * The dashboard a freshly authorized CLI's tab ends up on: the team view for
 * a super_admin — the only role that may open it (ADR-100) — and the
 * member's own view for everyone else, admin included. `?cli=signed-in`
 * tells that page to watch for the upload the CLI is about to make.
 */
export function cliSignedInDestination(role: string | null | undefined): string {
  const marker = "?cli=signed-in";
  return role === "super_admin" ? `/claude-usage${marker}` : `/my-claude-usage${marker}`;
}

/**
 * Where `/login` may send someone after sign-in, given its `?next=`. Only the
 * CLI authorize page — nothing else, and never another origin — so adding
 * `next` cannot turn the login page into an open redirect. Anything else
 * yields null and the caller uses its usual role-based destination.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (next !== CLI_AUTHORIZE_PATH && !next.startsWith(`${CLI_AUTHORIZE_PATH}?`)) return null;
  // Belt and braces: no scheme-relative "//", no backslash tricks, no control characters.
  if (/[\\\u0000-\u001f]/.test(next) || next.startsWith("//")) return null;
  try {
    const resolved = new URL(next, "https://placeholder.invalid");
    if (resolved.origin !== "https://placeholder.invalid" || resolved.pathname !== CLI_AUTHORIZE_PATH) return null;
  } catch {
    return null;
  }
  return next;
}

export interface CliAuthorizeRequest {
  port: number;
  state: string;
  codeChallenge: string;
  device: string;
}

const B64URL_43 = /^[A-Za-z0-9_-]{43}$/;

/**
 * Validates what the CLI put in the URL. `null` means the link is not a
 * genuine CLI request, and the page shows an error instead of a consent
 * button. The port is the only part of the eventual redirect target taken
 * from the URL at all — see {@link loopbackCallbackUrl}.
 */
export function parseCliAuthorizeRequest(params: URLSearchParams): CliAuthorizeRequest | null {
  const portRaw = params.get("port") ?? "";
  const port = Number(portRaw);
  if (!/^\d{4,5}$/.test(portRaw) || port < 1024 || port > 65535) return null;
  const state = params.get("state") ?? "";
  const codeChallenge = params.get("code_challenge") ?? "";
  if (!B64URL_43.test(state) || !B64URL_43.test(codeChallenge)) return null;
  const device = (params.get("device") ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 60) || "unnamed machine";
  return { port, state, codeChallenge, device };
}

/**
 * The redirect back to the CLI. The host is always 127.0.0.1 — fixed here,
 * never read from the URL — so a crafted link can never make this page send
 * a code anywhere but the reader's own machine. `api` tells the CLI where the
 * backend is (in development it is not this page's origin); the CLI accepts
 * it only alongside the state value it generated itself.
 */
export function loopbackCallbackUrl(
  port: number,
  result: { code: string; state: string; api: string } | { error: "access_denied"; state: string },
): string {
  const url = new URL(`http://127.0.0.1:${port}/callback`);
  if ("code" in result) {
    url.searchParams.set("code", result.code);
    url.searchParams.set("api", result.api);
  } else {
    url.searchParams.set("error", result.error);
  }
  url.searchParams.set("state", result.state);
  return url.toString();
}
