import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireSession } from "./RequireSession";

type MockSession = { status: "loading" | "authenticated" | "anonymous"; user: any };

const { replace, session } = vi.hoisted(() => ({
  replace: vi.fn(),
  // A box: the mock factories below close over this reference once, so
  // each test mutates `.current` instead of re-mocking the module.
  session: {
    current: { status: "authenticated", user: { role: "admin", mustChangePassword: false } } as MockSession,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => session.current,
}));

describe("RequireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the admin app for an admin role", () => {
    session.current = { status: "authenticated", user: { role: "admin", mustChangePassword: false } as any };
    render(
      <RequireSession>
        <p>admin content</p>
      </RequireSession>,
    );
    expect(screen.getByText("admin content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders the admin app for a super_admin role", () => {
    session.current = { status: "authenticated", user: { role: "super_admin", mustChangePassword: false } as any };
    render(
      <RequireSession>
        <p>admin content</p>
      </RequireSession>,
    );
    expect(screen.getByText("admin content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends a plain \"user\" role to the public landing page instead of rendering the admin app", () => {
    session.current = { status: "authenticated", user: { role: "user", mustChangePassword: false } as any };
    render(
      <RequireSession>
        <p>admin content</p>
      </RequireSession>,
    );
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/welcome");
  });

  it("sends an anonymous visitor to /login, not the landing page", () => {
    session.current = { status: "anonymous", user: null };
    render(
      <RequireSession>
        <p>admin content</p>
      </RequireSession>,
    );
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("sends a caller still on a temporary password to /create-password, even if their role would otherwise pass", () => {
    session.current = {
      status: "authenticated",
      user: { role: "admin", mustChangePassword: true } as any,
    };
    render(
      <RequireSession>
        <p>admin content</p>
      </RequireSession>,
    );
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/create-password");
  });
});
