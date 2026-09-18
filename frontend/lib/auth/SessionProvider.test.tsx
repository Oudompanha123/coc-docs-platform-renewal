import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireSession } from "@/components/layout/RequireSession";
import { RequireMemberSession } from "@/components/home/RequireMemberSession";
import { rememberIdToken } from "./idTokenMemory";
import { SessionProvider, useSession } from "./SessionProvider";

/**
 * The session is what every admin page depends on, and until now nothing
 * tested it because nothing used it: the sign-out button closed a menu and
 * the shell had no guard. These cover the two behaviours that were missing.
 */

const { me, signOut } = vi.hoisted(() => ({ me: vi.fn(), signOut: vi.fn() }));
vi.mock("./api", () => ({ me, signOut }));

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const SIGNED_IN = {
  id: "1",
  email: "jane@example.com",
  displayName: "Jane Admin",
  role: "admin",
  authenticated: true,
};

const SIGNED_IN_USER = {
  id: "2",
  email: "sam@example.com",
  displayName: "Sam Viewer",
  role: "user",
  authenticated: true,
};

const ANONYMOUS = {
  id: null,
  email: null,
  displayName: null,
  role: null,
  authenticated: false,
};

function SignOutButton() {
  const { signOut: doSignOut } = useSession();
  return (
    <button type="button" onClick={() => void doSignOut()}>
      Sign out
    </button>
  );
}

describe("RequireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page for a signed-in caller", async () => {
    me.mockResolvedValue(SIGNED_IN);

    render(
      <SessionProvider>
        <RequireSession>
          <p>admin content</p>
        </RequireSession>
      </SessionProvider>,
    );

    expect(await screen.findByText("admin content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends a visitor with no session to /login", async () => {
    me.mockResolvedValue(ANONYMOUS);

    render(
      <SessionProvider>
        <RequireSession>
          <p>admin content</p>
        </RequireSession>
      </SessionProvider>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
  });

  it("shows nothing while the answer is still unknown", () => {
    // Never resolves: the state between page load and the server answering.
    me.mockReturnValue(new Promise(() => {}));

    render(
      <SessionProvider>
        <RequireSession>
          <p>admin content</p>
        </RequireSession>
      </SessionProvider>,
    );

    // Rendering the page first and redirecting after would flash an interface
    // the visitor may not be entitled to.
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("treats an unreachable backend as no session, not as a permanent spinner", async () => {
    me.mockRejectedValue(new Error("network down"));

    render(
      <SessionProvider>
        <RequireSession>
          <p>admin content</p>
        </RequireSession>
      </SessionProvider>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});

describe("signing out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ends the server-side session and then leaves for /login, for an admin", async () => {
    me.mockResolvedValue(SIGNED_IN);
    signOut.mockResolvedValue(undefined);

    render(
      <SessionProvider>
        <SignOutButton />
      </SessionProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    // Both, and in this order. Clearing the cookie without calling the server
    // would leave the app_session row live until its TTL, so anyone holding a
    // copy of the cookie would still be signed in (FR-AUTH-007).
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("ends the server-side session and then leaves for /welcome, for a regular user", async () => {
    me.mockResolvedValue(SIGNED_IN_USER);
    signOut.mockResolvedValue(undefined);

    render(
      <SessionProvider>
        <SignOutButton />
      </SessionProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/welcome"));
  });

  it("ends the Keycloak session silently, so the next sign-in can choose an account", async () => {
    me.mockResolvedValue(SIGNED_IN);
    signOut.mockResolvedValue(undefined);
    rememberIdToken("the-id-token");

    process.env.NEXT_PUBLIC_KEYCLOAK_URL = "http://localhost:8180";
    process.env.NEXT_PUBLIC_KEYCLOAK_REALM = "docs_platform";
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = "cocdocs-frontend";

    // Keycloak answers the reachability probe — the case these two tests
    // (silent and confirmation-page) exist for.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(undefined));

    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000", assign },
      writable: true,
    });

    render(
      <SessionProvider>
        <SignOutButton />
      </SessionProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    // Without this the app's own cookie is cleared but Keycloak's SSO session
    // survives, so "Continue with Google" signs the same person straight back
    // in — Keycloak answers from its cookie and never reaches Google.
    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
    const target = new URL(assign.mock.calls[0]![0] as string);
    expect(target.pathname).toBe("/realms/docs_platform/protocol/openid-connect/logout");
    // The hint is what keeps it silent: without it Keycloak answers with a
    // "Do you want to log out?" page.
    expect(target.searchParams.get("id_token_hint")).toBe("the-id-token");
    // SIGNED_IN is an admin — the return-to destination Keycloak is told to
    // send this caller back to must be /login, not /welcome.
    expect(target.searchParams.get("post_logout_redirect_uri")).toBe("http://localhost:3000/login");

    delete process.env.NEXT_PUBLIC_KEYCLOAK_URL;
    delete process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
    delete process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
  });

  it("still ends the Keycloak session when it has no hint, accepting the confirmation page", async () => {
    me.mockResolvedValue(SIGNED_IN);
    signOut.mockResolvedValue(undefined);
    // No rememberIdToken: the tab was reloaded since signing in.

    process.env.NEXT_PUBLIC_KEYCLOAK_URL = "http://localhost:8180";
    process.env.NEXT_PUBLIC_KEYCLOAK_REALM = "docs_platform";
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = "cocdocs-frontend";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(undefined));

    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000", assign },
      writable: true,
    });

    render(
      <SessionProvider>
        <SignOutButton />
      </SessionProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    // Without a hint Keycloak asks "Do you want to log out?" first. That is a
    // click; skipping the logout would leave the session live, and the next
    // person choosing a different Google account would be told they are
    // "already authenticated as different user" with no way to act on it.
    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
    const target = new URL(assign.mock.calls[0]![0] as string);
    expect(target.searchParams.get("id_token_hint")).toBeNull();
    expect(target.searchParams.get("client_id")).toBe("cocdocs-frontend");

    delete process.env.NEXT_PUBLIC_KEYCLOAK_URL;
    delete process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
    delete process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
  });

  it("falls back to /login, without a hard navigation, when Keycloak is configured but unreachable", async () => {
    me.mockResolvedValue(SIGNED_IN);
    signOut.mockResolvedValue(undefined);
    rememberIdToken("the-id-token");

    process.env.NEXT_PUBLIC_KEYCLOAK_URL = "http://localhost:8180";
    process.env.NEXT_PUBLIC_KEYCLOAK_REALM = "docs_platform";
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = "cocdocs-frontend";
    // Keycloak isn't running — same as the connection-refused a developer's
    // own browser hits when they sign out without having started it locally.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000", assign },
      writable: true,
    });

    render(
      <SessionProvider>
        <SignOutButton />
      </SessionProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    // Never a hard navigation to a host that didn't answer — this app's own
    // session is already ended, so the caller lands on their role's
    // destination (admin → /login) instead of a browser connection-refused
    // page they can't get back from.
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(assign).not.toHaveBeenCalled();

    delete process.env.NEXT_PUBLIC_KEYCLOAK_URL;
    delete process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
    delete process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
  });
});

describe("signing out from a route guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * RequireMemberSession (and RequireSession, and /create-password) redirect
   * unconditionally to /login the instant they see status "anonymous". Before
   * the "signing-out" intermediate status existed, that fired the moment
   * `doSignOut` cleared the session — racing ahead of, and overriding, the
   * role-aware /welcome destination for a regular user signing out from
   * /home. This renders the real guard, not a mock, so the race is actually
   * exercised.
   */
  it("never bounces a regular user's sign-out through /login on its way to /welcome", async () => {
    me.mockResolvedValue(SIGNED_IN_USER);
    signOut.mockResolvedValue(undefined);

    function SignOutFromHome() {
      const { signOut: doSignOut } = useSession();
      return (
        <RequireMemberSession>
          <button type="button" onClick={() => void doSignOut()}>
            Sign out
          </button>
        </RequireMemberSession>
      );
    }

    render(
      <SessionProvider>
        <SignOutFromHome />
      </SessionProvider>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/welcome"));
    expect(replace).not.toHaveBeenCalledWith("/login");
  });
});
