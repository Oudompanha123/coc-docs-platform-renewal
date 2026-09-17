/**
 * Ending the Keycloak session, from the two places that need to.
 *
 * <p>Signing in is two separate acts: Keycloak authenticates you, and then
 * this application decides whether to let you in. They can disagree — an
 * applicant waiting for approval authenticates perfectly well and is still
 * refused — and when they do, Keycloak is left holding a session for somebody
 * this app never admitted.
 *
 * <p>A session left behind is not a cosmetic problem. The next person to
 * choose a different Google account meets Keycloak's own refusal:
 *
 * <pre>
 *   You are already authenticated as different user 'someone@example.com'
 *   in this session. Please sign out first.
 * </pre>
 *
 * <p>And they have no way to act on it: Sign out lives inside the application
 * they were never let into. So both paths — signing out, and a sign-in this
 * app refuses — end the Keycloak session.
 *
 * <p><b>The logout is always sent</b>, hint or no hint. An earlier version
 * skipped it when the hint was missing, on the reasoning that `prompt=login`
 * would re-authenticate on the next attempt anyway. That was wrong:
 * re-authenticating as a different person against a live session is precisely
 * what produces the error above. A confirmation page is a click; a stranded
 * session is a dead end.
 */

/**
 * The end-session URL, or null when Keycloak is not configured.
 *
 * <p>With {@code idTokenHint} the logout is silent. Without it Keycloak asks
 * for confirmation first — worth one click, because the alternative is leaving
 * the session in place.
 */
export function keycloakLogoutUrl(idTokenHint: string | null, returnTo: string): string | null {
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

  if (!keycloakUrl || !realm) {
    return null;
  }

  const logout = new URL(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout`);
  logout.searchParams.set("post_logout_redirect_uri", returnTo);

  if (idTokenHint) {
    logout.searchParams.set("id_token_hint", idTokenHint);
  } else if (clientId) {
    // Keycloak requires one or the other to validate the redirect target.
    // With client_id alone it confirms first, which is the cost of not having
    // the hint.
    logout.searchParams.set("client_id", clientId);
  }

  return logout.toString();
}

/**
 * Whether {@code origin} answers at all, before committing to a full-page
 * navigation there.
 *
 * <p>{@link keycloakLogoutUrl}'s caller has to redirect the whole page — a
 * fetch or an iframe can't reach Keycloak's own cookies, only a top-level
 * navigation can (see the class doc). That means an unreachable Keycloak
 * (not running locally, a network blip, a misconfigured URL) strands the
 * caller on the browser's own connection-refused page for a host they never
 * meant to visit directly, with no way back into this app except retyping
 * the address bar. A cheap reachability probe first avoids that: this app's
 * own sign-out already always succeeds by the time this runs, so the worst
 * case of skipping the Keycloak round-trip is a stale SSO session left
 * behind — the same tradeoff the "no hint" path above already accepts,
 * just caught one step earlier instead of as a blank browser error page.
 *
 * <p>{@code mode: "no-cors"} deliberately: this only needs to know whether
 * *something* answered, not read the response (which a cross-origin
 * Keycloak wouldn't allow anyway). A network-level failure — connection
 * refused, DNS failure, timeout — still rejects the fetch even in no-cors
 * mode; only a same-origin-policy block turns into an opaque response, and
 * that means a real server is there to have blocked it.
 */
export async function isKeycloakReachable(origin: string, timeoutMs = 1500): Promise<boolean> {
  try {
    await fetch(origin, { mode: "no-cors", signal: AbortSignal.timeout(timeoutMs) });
    return true;
  } catch {
    return false;
  }
}
