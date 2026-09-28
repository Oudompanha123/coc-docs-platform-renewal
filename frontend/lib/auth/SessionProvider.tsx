"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { me, signOut as signOutRequest, type MeResponse } from "./api";
import { takeIdToken } from "./idTokenMemory";
import { unregisterThisDevice } from "@/lib/notify/push";
import { isKeycloakReachable, keycloakLogoutUrl } from "./keycloakLogout";

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
  /** Ends the server-side session, then sends the caller to /login (admin,
   *  super_admin) or /welcome (everyone else), by the role they had. */
  signOut: () => Promise<void>;
  /** True from the moment `signOut` is called until its redirect fires —
   *  the awaited work (revoking the device token, ending the session, an
   *  optional Keycloak reachability check) is otherwise invisible, so a
   *  caller (the Sign out button) can show the app's one spinner instead. */
  isSigningOut: boolean;
  /** Re-asks the server. For after a sign-in, or a role change taking effect. */
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    setIsSigningOut(true);

    // Read before the session clears below — once `user` is null, the role
    // is gone too, and a null role must never silently fall into either
    // branch by accident. Admin and super_admin land back on Login; anyone
    // else (a regular User/Viewer) lands on /welcome.
    const role = user?.role;
    const destination = role === "admin" || role === "super_admin" ? "/login" : "/welcome";

    // Before the session goes, while the cookie still authenticates the call.
    //
    // The token only, never the preference. A device token belongs to an
    // account, so leaving it would deliver the previous person's notifications
    // to whoever signs in next on a shared browser. Whether somebody wants
    // banners in this browser is not a property of a session, and clearing it
    // here turned the Settings toggle off on every sign-out.
    await unregisterThisDevice();
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
    const logoutUrl = keycloakLogoutUrl(takeIdToken(), `${window.location.origin}${destination}`);
    if (logoutUrl && (await isKeycloakReachable(new URL(logoutUrl).origin))) {
      window.location.assign(logoutUrl);
      return;
    }

    // Reached when Keycloak is not configured at all, or is configured but
    // didn't answer (not running locally, network down, ...). Either way,
    // this app's own session is already gone — send the caller to their
    // role's destination rather than a hard-navigating them into a
    // connection-refused page for a host they never meant to visit directly
    // and have no way back from.
    router.replace(destination);
  }, [router, user]);

  // Memoized for the same reason ShellContext's own `value` is (see its
  // comment): an un-memoized object here is a *new* reference on every
  // render of this provider, which forces every useSession() consumer to
  // re-render too — including ones that, as a side effect of re-rendering,
  // change state that re-renders this provider's own parent, which
  // re-renders this provider, producing yet another new object. That loop
  // is exactly what "Maximum update depth exceeded" was: `(shell)/layout.tsx`
  // renders this provider *inside* `ShellContent`, a `useShell()` consumer,
  // so a page that both calls `useSession()` and (via `AppShell`) calls the
  // shell's `setHeader` closed the circle the moment anything here handed
  // out a fresh object for no real reason.
  const value = useMemo(
    () => ({ status, user, signOut: doSignOut, isSigningOut, refresh: load }),
    [status, user, doSignOut, isSigningOut, load],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return value;
}
