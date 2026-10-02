/**
 * The caller's own Gmail credential, used to send their attendance report from
 * their own address and to read their own HRMS mail (ADR-063, ADR-077,
 * ADR-084).
 *
 * <p><b>There is no read path, by design.</b> The backend will report whether a
 * credential exists and which address it authenticates as, and will never
 * return the App Password — not to its owner, not to an administrator. So this
 * client has no `get the password` function to offer: the only way to change
 * one is to replace it. That is a property of the API's shape rather than of
 * this file remembering not to ask (see ADR-063 §2).
 *
 * <p>Every call is owner-scoped on the server. The route carries no account id
 * and resolves the caller from the session, so there is nothing here that could
 * address somebody else's mailbox even if it tried.
 *
 * // req: FR-OPS-001, NFR-SEC-PII, NFR-SEC-CHANNEL, ADR-063, ADR-084
 */

import { BACKEND_URL, SessionExpiredError } from "@/lib/auth/api";

const ROUTE = `${BACKEND_URL}/api/v1/me/mail-credential`;

/** A user-facing failure. `message` is always safe to show as-is. */
export class MailCredentialError extends Error {}

/**
 * All the server will say about a stored credential.
 *
 * @param configured whether one exists
 * @param smtpUsername the address it authenticates as, or null when there is
 *   none. Safe to show: it is the person's own address, and they typed it.
 */
export interface MailCredentialStatus {
  configured: boolean;
  smtpUsername: string | null;
  /** "oauth", "app_password", or null when nothing is stored. */
  kind?: "oauth" | "app_password" | null;
  /** Whether this deployment can offer the OAuth route at all (ADR-085). */
  oauthAvailable?: boolean;
}

/** Scopes requested at consent. Must match what the backend expects Google to grant. */
export const GMAIL_SCOPES =
  "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly";

async function send(method: "GET" | "PUT" | "DELETE", body?: unknown): Promise<Response> {
  try {
    return await fetch(ROUTE, {
      method,
      credentials: "include",
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
  } catch {
    throw new MailCredentialError("Couldn't reach the server. Check your connection and try again.");
  }
}

/** Whether a credential is stored, and which address it uses. */
export async function loadMailCredential(): Promise<MailCredentialStatus> {
  const response = await send("GET");
  if (response.status === 401) throw new SessionExpiredError("You are not signed in any more.");
  if (!response.ok) throw new MailCredentialError("Couldn't load your mail credential.");
  return (await response.json()) as MailCredentialStatus;
}

/**
 * Stores or replaces the credential.
 *
 * <p>Spaces are stripped from the App Password because Google prints it in
 * groups of four and people paste it either way. Rejecting a valid credential
 * over a space is a worse failure than letting the relay reject a wrong one —
 * the backend takes the same view, and this keeps the two in step.
 */
export async function saveMailCredential(
  smtpUsername: string,
  appPassword: string,
): Promise<MailCredentialStatus> {
  const response = await send("PUT", {
    smtpUsername: smtpUsername.trim(),
    appPassword: appPassword.replace(/\s/g, ""),
  });
  if (response.status === 401) throw new SessionExpiredError("You are not signed in any more.");
  if (response.status === 400) {
    throw new MailCredentialError(
      "That doesn't look right. Use your full Gmail address and the 16-character App Password.",
    );
  }
  if (!response.ok) throw new MailCredentialError("Couldn't save your mail credential.");
  return (await response.json()) as MailCredentialStatus;
}

/**
 * Hands Google's authorization code to the backend, which exchanges it for a
 * refresh token (ADR-085).
 *
 * <p>The code is short-lived and single-use, which is the only reason it may
 * travel in a request body: by the time it could be read anywhere it is spent.
 * What it becomes never leaves the server.
 */
export async function connectGoogleMail(authorizationCode: string): Promise<MailCredentialStatus> {
  let response: Response;
  try {
    response = await fetch(`${ROUTE}/google`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorizationCode }),
    });
  } catch {
    throw new MailCredentialError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401) throw new SessionExpiredError("You are not signed in any more.");
  if (response.status === 503) {
    throw new MailCredentialError(
      "Google sign-in isn't fully configured on the server, so this can't be connected yet.",
    );
  }
  if (response.status === 422) {
    // A closed popup, an expired code, or a consent that granted nothing
    // storable. All of them are "try again", not "something is broken".
    throw new MailCredentialError("Google didn't complete the connection. Try again and accept both permissions.");
  }
  if (!response.ok) throw new MailCredentialError("Couldn't connect your Gmail.");
  return (await response.json()) as MailCredentialStatus;
}

/** Removes it. Revoking must be as easy as adding — ADR-063 §4.3. */
export async function removeMailCredential(): Promise<void> {
  const response = await send("DELETE");
  if (response.status === 401) throw new SessionExpiredError("You are not signed in any more.");
  if (!response.ok) throw new MailCredentialError("Couldn't remove your mail credential.");
}
