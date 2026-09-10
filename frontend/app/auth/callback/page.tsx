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

async function exchangeCodeAndReportResult() {
  const params = new URLSearchParams(window.location.search);
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
