/**
 * Why a sign-in was refused, carried across one redirect.
 *
 * <p>When this application refuses somebody Keycloak has just authenticated,
 * the browser is sent through Keycloak's end-session endpoint to clear the
 * session it is holding for them. That is a full-page navigation, so anything
 * held in React state is gone by the time they land back on /login — and they
 * would arrive at a blank login form with no idea what happened.
 *
 * <p>`sessionStorage` rather than a query parameter: it survives one same-tab
 * navigation, needs no Suspense boundary on a statically rendered page, and
 * keeps the post-logout redirect URI a plain path that Keycloak matches
 * against its allow-list without argument.
 *
 * <p>Nothing sensitive is stored — one of two fixed words, naming an outcome
 * the person is about to be shown on screen anyway.
 */

const KEY = "coc_signin_outcome";

export type SignInOutcome = "pending" | "refused";

export function rememberSignInOutcome(outcome: SignInOutcome): void {
  try {
    sessionStorage.setItem(KEY, outcome);
  } catch {
    // Private mode, or storage disabled. The redirect still clears the stale
    // Keycloak session, which is the part that matters; the person just gets
    // a login form without the explanation.
  }
}

/** Reads the outcome and clears it, so a later reload is a clean login page. */
export function takeSignInOutcome(): SignInOutcome | null {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value === "pending" || value === "refused" ? value : null;
  } catch {
    return null;
  }
}
