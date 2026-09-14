"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { me, signOut as signOutRequest, type MeResponse } from "./api";
import { takeIdToken } from "./idTokenMemory";
import { keycloakLogoutUrl } from "./keycloakLogout";

/**
 * Who is signed in, asked once per page rather than once per component.
 *
 * <p>Before this, the sidebar and the topbar each called `/api/v1/auth/me`
 * independently and each swallowed a failure into "no user". That produced two
 * requests for one answer, and — more importantly — meant nothing in the app
 * could act on the answer. A visitor with no session saw the full admin shell
 * with the user's name missing, rather than being sent to sign in.
 *
 * The session itself lives in an httpOnly cookie the browser sends on its own.
 * Nothing here holds a credential; this only caches the *answer* to "who am I",
 * which the server decides on every request regardless.
 */

export type SessionStatus = "loading" | "authenticated" | "anonymous";

type SessionValue = {
  status: SessionStatus;
  user: MeResponse | null;
  /** Ends the server-side session, then sends the caller to /login. */
  signOut: () => Promise<void>;
  /** Re-asks the server. For after a sign-in, or a role change taking effect. */
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<MeResponse | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await me();
      if (response.authenticated) {
        setUser(response);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("anonymous");
      }
    } catch {
      // A backend that cannot be reached is not a signed-in user. Treated as
      // anonymous rather than left on "loading" forever, so the guard sends
      // them somewhere rather than showing a spinner that never resolves.
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const doSignOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
    setStatus("anonymous");

    // Three sessions exist, and clearing ours ends only the first:
    //
    //   1. this app's   — the coc_session cookie, revoked by the call above
    //   2. Keycloak's   — its own SSO cookie, which is why clicking "Continue
    //                     with Google" again used to sign the same person
    //                     straight back in without asking. Keycloak answered
    //                     from its cookie and never went near Google.
    //   3. Google's     — handled by prompt=select_account on the Keycloak
    //                     identity provider, so Google offers the chooser
    //                     rather than silently reusing one account.
    //
    // This ends the second. A full-page redirect rather than a hidden iframe:
    // Keycloak's cookies are third-party from this origin, and an iframe's
    // access to them depends on SameSite rules that differ between browsers
    // and break silently — leaving someone signed in while being told they
    // are not.
    const logoutUrl = keycloakLogoutUrl(takeIdToken(), `${window.location.origin}/login`);
    if (logoutUrl) {
      window.location.assign(logoutUrl);
      return;
    }

    // No hint — the tab was reloaded since signing in, or Keycloak is not
    // configured. Skipped rather than sent without one: that request would
    // land on the confirmation page, and being asked "do you want to log
    // out?" after clicking Sign out reads as the product not having heard.
    //
    // Nothing is lost by skipping it. `prompt=login` on the next sign-in
    // re-authenticates whatever Keycloak session survives, so the next person
    // still chooses their account.
    router.replace("/login");
  }, [router]);

  return (
    <SessionContext.Provider value={{ status, user, signOut: doSignOut, refresh: load }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return value;
}
