import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireSession } from "@/components/layout/RequireSession";
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

  it("ends the server-side session and then leaves for /login", async () => {
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

  it("ends the Keycloak session silently, so the next sign-in can choose an account", async () => {
    me.mockResolvedValue(SIGNED_IN);
    signOut.mockResolvedValue(undefined);
    rememberIdToken("the-id-token");

    process.env.NEXT_PUBLIC_KEYCLOAK_URL = "http://localhost:8180";
    process.env.NEXT_PUBLIC_KEYCLOAK_REALM = "docs_platform";
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = "cocdocs-frontend";

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
});
