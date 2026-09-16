"use client";

import { useEffect } from "react";

/**
 * Landing page for the popup that `signInWithGoogleViaKeycloak` opens
 * (ADR-013): Keycloak redirects the popup here after brokering the Google
 * sign-in. This page exchanges the authorization code for tokens (PKCE,
 * public client — no client secret ever reaches the browser) and reports the
 * resulting Keycloak-issued ID token back to the window that opened it via
 * `postMessage`, then closes itself.
 *
 * Never navigated to directly outside that popup flow, and reads everything
 * it needs straight off `window.location` rather than `useSearchParams()` —
 * this page is popup-only and has no server-rendered path worth supporting.
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    void exchangeCodeAndReportResult();
  }, []);

  return <main className="flex min-h-screen items-center justify-center text-sm text-muted">Finishing sign-in…</main>;
}

interface PendingAuthAttempt {
  codeVerifier: string;
  redirectUri: string;
}

/**
 * Marks the second visit to this page: the one Keycloak sends us back to after
 * it has ended its own session. Nothing left to do but close.
 */
const SIGNED_OUT_PARAM = "kc_signed_out";

/**
 * Ends the Keycloak session this sign-in just created, then closes the popup.
 *
 * <p><b>Why sign out immediately after signing in.</b> Keycloak keeps a browser
 * session of its own, and this product does not want one: `prompt=login` means
 * every sign-in goes to Google afresh, so the session is never read — it is
 * only ever in the way. When it holds one account and somebody authenticates
 * as another, Keycloak refuses the flow outright:
 *
 * <pre>
 *   You are already authenticated as different user 'someone@example.com'
 *   in this session. Please sign out first.
 * </pre>
 *
 * <p>`prompt=login` does not prevent that. It forces re-authentication; it does
 * not end the session the new user is being compared against.
 *
 * <p>Sign-out and a refused sign-in already end the session, but both are
 * missable — a closed tab, an unclicked confirmation page, a person who never
 * signs in again — and the error lands on whoever comes next, inside Keycloak,
 * where this application cannot say anything about it. Ending it here means
 * there is never one to collide with.
 *
 * <p><b>Why in the popup.</b> This window is about to navigate to Keycloak's
 * own origin as a top-level page, so its cookie is first-party and actually
 * gets cleared. An iframe on the opener would be a third-party context and is
 * exactly what browsers are in the middle of blocking.
 *
 * <p>The ID token stays valid: the backend verifies it against the realm's
 * public keys (`JwtDecoder`), not by asking Keycloak whether the session still
 * exists. Signing out here cannot invalidate the token the opener is already
 * sending.
 */
function endKeycloakSession(idToken: string): void {
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
  if (!keycloakUrl || !keycloakRealm) {
    window.close();
    return;
  }

  const returnTo = new URL(window.location.origin + window.location.pathname);
  returnTo.searchParams.set(SIGNED_OUT_PARAM, "1");

  const logout = new URL(`${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/logout`);
  // With the hint Keycloak logs out silently. Without it there is a "Do you
  // want to log out?" page, which in a popup nobody is looking at would mean a
  // session that never ends — so the hint is the whole reason this happens
  // here, where the token is in hand, rather than later.
  logout.searchParams.set("id_token_hint", idToken);
  logout.searchParams.set("post_logout_redirect_uri", returnTo.toString());

  // If Keycloak is unreachable or refuses the redirect, the popup would sit on
  // an error page nobody asked for. The opener already has what it needs.
  window.setTimeout(() => window.close(), 5000);
  window.location.replace(logout.toString());
}

async function exchangeCodeAndReportResult() {
  const params = new URLSearchParams(window.location.search);

  // Second visit: Keycloak has cleared its cookie and sent the popup back.
  if (params.get(SIGNED_OUT_PARAM)) {
    window.close();
    return;
  }

  const state = params.get("state");
  const code = params.get("code");
  const errorParam = params.get("error");

  // No `state` means nothing to match this attempt against on the opener's
  // side — there's no useful message to send back, so just close.
  if (!state) {
    window.close();
    return;
  }

  function report(message: { type: "coc-keycloak-auth-success" | "coc-keycloak-auth-error"; idToken?: string; errorMessage?: string }) {
    window.opener?.postMessage(
      message.type === "coc-keycloak-auth-success"
        ? { type: message.type, state, idToken: message.idToken }
        : { type: message.type, state, message: message.errorMessage },
      window.location.origin,
    );
    // The opener is told first and carries on independently. A success then
    // takes one more hop through Keycloak to end its session; an error has no
    // session to end, because no token was ever issued.
    if (message.type === "coc-keycloak-auth-success" && message.idToken) {
      endKeycloakSession(message.idToken);
      return;
    }
    window.close();
  }

  if (errorParam) {
    report({ type: "coc-keycloak-auth-error", errorMessage: `Google sign-in failed (${errorParam}).` });
    return;
  }

  const storageKey = `coc_kc_pending:${state}`;
  const pendingRaw = sessionStorage.getItem(storageKey);
  sessionStorage.removeItem(storageKey);

  if (!code || !pendingRaw) {
    report({ type: "coc-keycloak-auth-error", errorMessage: "Sign-in could not be completed. Please try again." });
    return;
  }

  const { codeVerifier, redirectUri } = JSON.parse(pendingRaw) as PendingAuthAttempt;

  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
  if (!keycloakUrl || !keycloakRealm || !clientId) {
    report({ type: "coc-keycloak-auth-error", errorMessage: "Google sign-in isn't configured for this environment." });
    return;
  }

  try {
    const response = await fetch(`${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
      }),
    });
    if (!response.ok) {
      report({ type: "coc-keycloak-auth-error", errorMessage: "Google sign-in failed. Please try again." });
      return;
    }
    const body = (await response.json()) as { id_token?: string };
    if (!body.id_token) {
      report({ type: "coc-keycloak-auth-error", errorMessage: "Keycloak did not return an ID token." });
      return;
    }
    report({ type: "coc-keycloak-auth-success", idToken: body.id_token });
  } catch {
    report({ type: "coc-keycloak-auth-error", errorMessage: "Couldn't reach the sign-in server. Please try again." });
  }
}
