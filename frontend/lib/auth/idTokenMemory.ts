/**
 * The Keycloak ID token from this browser tab's sign-in, kept only to make
 * sign-out silent.
 *
 * <p><b>Why keep it at all.</b> Keycloak shows a "Do you want to log out?"
 * confirmation whenever an end-session request arrives without an
 * `id_token_hint` — a guard against a malicious link signing someone out. Ours
 * is not such a link, and the extra page made signing out a two-step
 * operation. Passing the hint skips it.
 *
 * <p><b>In memory, and nowhere else.</b> Not localStorage, not sessionStorage,
 * not a cookie: a module variable dies with the tab and cannot be read back by
 * anything that runs later. This token is already handled in memory during
 * sign-in — the callback receives it and posts it to the backend — so this
 * extends an existing exposure rather than creating one. It is not the
 * session credential; that stays an httpOnly cookie the page cannot read
 * (ADR-011).
 *
 * <p>A refresh loses it, which is expected and handled: sign-out then skips
 * the Keycloak round trip entirely rather than showing the confirmation page.
 * Nothing depends on the hint being present, because `prompt=login` on the
 * next sign-in re-authenticates regardless of any session left behind.
 */

let idToken: string | null = null;

/** Called after a successful sign-in, with the token the backend has just accepted. */
export function rememberIdToken(token: string): void {
  idToken = token;
}

/** Returns the token and forgets it — it is good for exactly one sign-out. */
export function takeIdToken(): string | null {
  const token = idToken;
  idToken = null;
  return token;
}
