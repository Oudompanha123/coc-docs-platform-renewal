/**
 * Ending the Keycloak session, from the two places that need to.
 *
 * <p>Signing in is two separate acts: Keycloak authenticates you, and then
 * this application decides whether to let you in. They can disagree — an
 * applicant waiting for approval authenticates perfectly well and is still
 * refused — and when they do, Keycloak is left holding a session for somebody
 * this app never admitted.
 *
 * <p>That stale session is what produced:
 *
 * <pre>
 *   You are already authenticated as different user 'someone@example.com'
 *   in this session. Please sign out first.
 * </pre>
 *
 * <p>Keycloak was right: it had a live session for the rejected applicant, and
 * the next sign-in was a different person. So both paths — signing out, and a
 * sign-in this app refuses — end the Keycloak session rather than leaving one
 * behind.
 */

/**
 * The end-session URL, or null when there is nothing to end.
 *
 * <p>Null when Keycloak is not configured, or when no {@code idTokenHint} is
 * available. The hint is what keeps this silent: without it Keycloak answers
 * with a "Do you want to log out?" confirmation, which is worse than skipping
 * the round trip — `prompt=login` on the next sign-in re-authenticates
 * whatever session survives anyway.
 */
export function keycloakLogoutUrl(idTokenHint: string | null, returnTo: string): string | null {
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;

  if (!keycloakUrl || !realm || !idTokenHint) {
    return null;
  }

  const logout = new URL(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout`);
  logout.searchParams.set("id_token_hint", idTokenHint);
  logout.searchParams.set("post_logout_redirect_uri", returnTo);
  return logout.toString();
}
