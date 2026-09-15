/**
 * Drives the "Continue with Google" sign-in now that Keycloak brokers Google
 * upstream (ADR-013, revision of ADR-008) instead of the backend verifying a
 * Google ID token directly.
 *
 * The button opens a small popup pointed at Keycloak's authorization
 * endpoint with `kc_idp_hint=google`, which skips Keycloak's own login form
 * and lands the popup straight on Google's consent screen — so, per ADR-013,
 * the user still sees the ordinary Google flow and nothing else changes from
 * their point of view. A popup rather than a full-page redirect, so sign-in
 * still reads as a single button click from the login page rather than a
 * full navigation away and back.
 *
 * The popup's landing page (`/auth/callback`) exchanges the authorization
 * code for tokens (PKCE, public client — no client secret in the browser)
 * and posts the resulting Keycloak-issued ID token back here via
 * `postMessage`, which is what `POST /api/auth/login` now verifies.
 */

import { codeChallengeFor, randomUrlSafeString } from "./pkce";

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

/** True when all three Keycloak env vars are present — use to hide the Google button when not configured. */
export const isGoogleSignInConfigured =
  Boolean(KEYCLOAK_URL) && Boolean(KEYCLOAK_REALM) && Boolean(KEYCLOAK_CLIENT_ID);

/** sessionStorage key holding one pending attempt's PKCE verifier, keyed by its `state`. */
const PENDING_ATTEMPT_PREFIX = "coc_kc_pending:";
const POPUP_FEATURES = "width=500,height=650,menubar=no,toolbar=no,status=no";

/** The user closed the sign-in popup themselves — not a failure, nothing to alert about. */
export class GoogleSignInCancelledError extends Error {}

export interface PendingAuthAttempt {
  codeVerifier: string;
  redirectUri: string;
}

type CallbackMessage =
  | { type: "coc-keycloak-auth-success"; state: string; idToken: string }
  | { type: "coc-keycloak-auth-error"; state: string; message: string };

function isCallbackMessage(value: unknown): value is CallbackMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "state" in value &&
    (value.type === "coc-keycloak-auth-success" || value.type === "coc-keycloak-auth-error")
  );
}

/**
 * Opens the Keycloak/Google popup for one sign-in attempt bound to `nonce`
 * (see FR-AUTH-001, TM-001 — the backend rejects any ID token whose `nonce`
 * claim doesn't match the `coc_oidc_nonce` cookie it issued). Resolves with
 * the raw Keycloak ID token to hand to `POST /api/auth/login`.
 */
export function signInWithGoogleViaKeycloak(options: { nonce: string }): Promise<string> {
  if (!KEYCLOAK_URL || !KEYCLOAK_REALM || !KEYCLOAK_CLIENT_ID) {
    return Promise.reject(new Error("Google Sign-In isn't configured for this environment."));
  }
  const keycloakUrl = KEYCLOAK_URL;
  const keycloakRealm = KEYCLOAK_REALM;
  const clientId = KEYCLOAK_CLIENT_ID;

  return (async () => {
    const state = randomUrlSafeString();
    const codeVerifier = randomUrlSafeString();
    const codeChallenge = await codeChallengeFor(codeVerifier);
    const redirectUri = `${window.location.origin}/auth/callback`;

    const pending: PendingAuthAttempt = { codeVerifier, redirectUri };
    sessionStorage.setItem(PENDING_ATTEMPT_PREFIX + state, JSON.stringify(pending));

    const authorizeUrl = new URL(`${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/auth`);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", "openid email profile");
    authorizeUrl.searchParams.set("state", state);
    // Forwarded into the Keycloak-minted ID token's own `nonce` claim
    // (standard OIDC behaviour for an OP, independent of the upstream
    // broker) — this is the value our backend's KeycloakIdTokenService
    // checks against the coc_oidc_nonce cookie.
    authorizeUrl.searchParams.set("nonce", options.nonce);
    authorizeUrl.searchParams.set("code_challenge", codeChallenge);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");
    // The point of ADR-013 is a trust-boundary change, not a second login
    // screen — this sends the popup straight to Google instead of stopping
    // at Keycloak's own login form first.
    authorizeUrl.searchParams.set("kc_idp_hint", "google");

    // Always re-authenticate, never answer from Keycloak's SSO cookie.
    //
    // Without this, signing out and clicking the button again signed the same
    // person straight back in: Keycloak had a live session of its own, so it
    // answered from that cookie and the request never reached Google — there
    // was no moment at which anyone could have chosen a different account.
    //
    // This makes account switching work regardless of what any other session
    // is doing, which is why it belongs here rather than only in the sign-out
    // path: sign-out can be skipped, interrupted, or happen in another tab.
    // Google then offers its chooser because the identity provider is
    // configured prompt=select_account.
    authorizeUrl.searchParams.set("prompt", "login");

    const openedPopup = window.open(authorizeUrl.toString(), "coc-google-signin", POPUP_FEATURES);
    if (!openedPopup) {
      sessionStorage.removeItem(PENDING_ATTEMPT_PREFIX + state);
      throw new Error("The sign-in popup was blocked. Please allow pop-ups for this site and try again.");
    }
    // Re-bound to a non-nullable const: TS doesn't carry the narrowing above
    // into the closures below, which capture `popup` well after this check.
    const popup: Window = openedPopup;

    return new Promise<string>((resolve, reject) => {
      let settled = false;

      function cleanup() {
        window.removeEventListener("message", onMessage);
        window.clearInterval(closedCheck);
        sessionStorage.removeItem(PENDING_ATTEMPT_PREFIX + state);
      }

      function onMessage(event: MessageEvent) {
        // Same-origin only: the callback page is served from this app, and
        // nothing else should ever be trusted to report a sign-in result.
        if (event.origin !== window.location.origin || !isCallbackMessage(event.data)) return;
        const data = event.data;
        if (data.state !== state) return;

        settled = true;
        cleanup();
        popup.close();
        if (data.type === "coc-keycloak-auth-success") {
          resolve(data.idToken);
        } else {
          reject(new Error(data.message));
        }
      }

      window.addEventListener("message", onMessage);

      // There's no message for "the user just closed the popup" — poll for it.
      const closedCheck = window.setInterval(() => {
        if (popup.closed && !settled) {
          settled = true;
          cleanup();
          reject(new GoogleSignInCancelledError());
        }
      }, 500);
    });
  })();
}
