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
}

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

/** Removes it. Revoking must be as easy as adding — ADR-063 §4.3. */
export async function removeMailCredential(): Promise<void> {
  const response = await send("DELETE");
  if (response.status === 401) throw new SessionExpiredError("You are not signed in any more.");
  if (!response.ok) throw new MailCredentialError("Couldn't remove your mail credential.");
}
