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
