/**
 * The Keycloak ID token from this tab's sign-in, kept so that signing out can
 * actually end the Keycloak session.
 *
 * <p><b>Why it is kept at all.</b> Keycloak's end-session endpoint shows a
 * "Do you want to log out?" confirmation unless the request carries an
 * `id_token_hint` — a guard against a malicious link signing someone out.
 *
 * <p><b>Why sessionStorage and not a variable.</b> It was a module variable,
 * which meant a page reload lost it, which meant sign-out silently skipped
 * ending the Keycloak session. The session then outlived the sign-out, and the
 * next person to choose a different Google account met Keycloak's refusal:
 * "You are already authenticated as different user ... Please sign out first."
 * A hint that is usually there is not good enough for something whose absence
 * strands the next person.
 *
 * <p>sessionStorage is scoped to this tab and cleared when it closes. This is
 * not the session credential — that remains an httpOnly cookie the page cannot
 * read (ADR-011). It is a short-lived identity assertion the page already
 * handled in memory during sign-in and has already sent to the backend, and it
 * is deleted the moment it is used.
 */

const KEY = "coc_id_token";

/** Called after a sign-in attempt, successful or not — either can need a logout. */
export function rememberIdToken(token: string): void {
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    // Private mode or storage disabled. Sign-out then falls back to sending
    // the logout without a hint, which still ends the session; it just asks
    // for confirmation first.
  }
}

/** Returns the token and forgets it — good for exactly one sign-out. */
export function takeIdToken(): string | null {
  try {
    const token = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return token;
  } catch {
    return null;
  }
}
