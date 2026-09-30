import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RootPage from "./page";
import type { MeResponse } from "@/lib/auth/api";

// Partial<MeResponse>, not any — same reasoning RequireSession.test.tsx
// gives: `any` would let a renamed field pass silently here, and this file
// asserts on exactly two of them.
type MockSession = {
  status: "loading" | "authenticated" | "anonymous";
  user: Partial<MeResponse> | null;
};

const { replace, session } = vi.hoisted(() => ({
  replace: vi.fn(),
  session: {
    current: { status: "loading", user: null } as MockSession,
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

// The provider is stubbed out to a pass-through: this test is about where
// the bare origin sends people, not about how the session is fetched.
vi.mock("@/lib/auth/SessionProvider", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => session.current,
}));

describe("the bare origin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a signed-out visitor to the public page, never to /login", () => {
    // The regression this file exists for. `/` used to redirect to /overview
    // unconditionally, which sits behind RequireSession — so the front door
    // of a product with a public landing page asked for credentials before
    // showing anything at all.
    session.current = { status: "anonymous", user: null };

    render(<RootPage />);

    expect(replace).toHaveBeenCalledWith("/welcome");
    expect(replace).not.toHaveBeenCalledWith("/login");
  });

  it("sends an admin to the dashboard", () => {
    session.current = { status: "authenticated", user: { role: "admin", mustChangePassword: false } };

    render(<RootPage />);

    expect(replace).toHaveBeenCalledWith("/overview");
  });

  it("sends a super_admin to the dashboard", () => {
    session.current = { status: "authenticated", user: { role: "super_admin", mustChangePassword: false } };

    render(<RootPage />);

    expect(replace).toHaveBeenCalledWith("/overview");
  });

  it("sends a plain user to the Member home", () => {
    session.current = { status: "authenticated", user: { role: "user", mustChangePassword: false } };

    render(<RootPage />);

    expect(replace).toHaveBeenCalledWith("/home");
  });

  // ADR-065: these three used to match no branch and fall through to the
  // public page — signed in, with nowhere of their own to go.
  it.each(["developer", "reviewer", "lead"] as const)("sends a %s to the Overview dashboard", (role) => {
    session.current = { status: "authenticated", user: { role, mustChangePassword: false } };

    render(<RootPage />);

    expect(replace).toHaveBeenCalledWith("/overview");
  });

  it("sends a guest account to the public page", () => {
    session.current = { status: "authenticated", user: { role: "guest", mustChangePassword: false } };

    render(<RootPage />);

    expect(replace).toHaveBeenCalledWith("/welcome");
  });

  it("sends a caller on a temporary password to /create-password, whatever their role", () => {
    // The floor that outranks role: a temporary password buys entry to
    // exactly one place (revision of ADR-017).
    session.current = { status: "authenticated", user: { role: "super_admin", mustChangePassword: true } };

    render(<RootPage />);

    expect(replace).toHaveBeenCalledWith("/create-password");
    expect(replace).not.toHaveBeenCalledWith("/overview");
  });

  it("waits rather than guessing while the session is still loading", () => {
    session.current = { status: "loading", user: null };

    render(<RootPage />);

    expect(replace).not.toHaveBeenCalled();
  });

  it("renders nothing itself — every branch ends somewhere else", () => {
    session.current = { status: "anonymous", user: null };

    const { container } = render(<RootPage />);

    expect(container).toBeEmptyDOMElement();
  });
});
