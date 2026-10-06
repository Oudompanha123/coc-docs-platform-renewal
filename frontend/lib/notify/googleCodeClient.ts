/**
 * Google's consent popup for Gmail scopes, as a promise (ADR-085).
 *
 * <p><b>Why this is a second conversation with Google.</b> Signing in uses
 * Google Identity Services' <em>credential</em> flow, which returns an ID
 * token: an assertion of who somebody is, granting nothing. A refresh token
 * comes only from the <em>code</em> flow, which is what this runs. No amount
 * of reading the sign-in token produces one — ADR-085 §1.
 *
 * <p>The code returned here is useless on its own: exchanging it needs the
 * client secret, which lives on the server and never reaches this bundle.
 *
 * // req: NFR-SEC-CHANNEL, ADR-085
 */

import { GMAIL_SCOPES } from "@/lib/notify/mailCredential";

const GSI_SRC = "https://accounts.google.com/gsi/client";

interface CodeResponse {
  code?: string;
  error?: string;
}

interface CodeClient {
  requestCode: () => void;
}

interface GoogleOAuth2 {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode: "popup";
    callback: (response: CodeResponse) => void;
    error_callback?: (error: { type?: string }) => void;
  }) => CodeClient;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

/** Loads Google's script once; resolves immediately if a sign-in button already did. */
async function loadGsi(): Promise<GoogleOAuth2> {
  if (window.google?.accounts?.oauth2) return window.google.accounts.oauth2;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("load failed")), { once: true });
      // Already loaded and fired before we attached: the check below catches it.
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("load failed"));
    document.head.appendChild(script);
  });

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("Google's sign-in script loaded but exposed nothing.");
  return oauth2;
}

/** Thrown when the person closed the popup or declined. Not a fault. */
export class ConsentDismissedError extends Error {}

/**
 * Opens the consent popup and resolves with an authorization code.
 *
 * <p>Must be called from a click. A popup opened from anything else is blocked
 * by the browser, and the failure is silent — nothing appears and nothing says
 * why.
 *
 * @param clientId the same Google client id sign-in uses
 */
export async function requestGmailAuthorizationCode(clientId: string): Promise<string> {
  const oauth2 = await loadGsi();

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initCodeClient({
      client_id: clientId,
      scope: GMAIL_SCOPES,
      ux_mode: "popup",
      callback: (response) => {
        if (response.code) {
          resolve(response.code);
          return;
        }
        reject(
          response.error === "access_denied"
            ? new ConsentDismissedError("You declined the Gmail permissions.")
            : new Error(response.error ?? "Google returned no authorization code."),
        );
      },
      error_callback: (error) =>
        reject(
          error.type === "popup_closed"
            ? new ConsentDismissedError("The Google window was closed before finishing.")
            : new Error("Google couldn't open its permission window."),
        ),
    });
    client.requestCode();
  });
}
