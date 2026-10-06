import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeResponse } from "@/lib/auth/api";
import { RequireMemberSession } from "./RequireMemberSession";

type MockSession = {
  status: "loading" | "authenticated" | "anonymous";
  user: Partial<MeResponse> | null;
};

const { replace, session } = vi.hoisted(() => ({
  replace: vi.fn(),
  session: {
    current: { status: "authenticated", user: { role: "user", mustChangePassword: false } } as MockSession,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => session.current,
}));

function renderAs(user: Partial<MeResponse> | null, status: MockSession["status"] = "authenticated") {
  session.current = { status, user };
  render(
    <RequireMemberSession>
      <p>member content</p>
    </RequireMemberSession>,
  );
}

/** The Member area (/home and its siblings): who it admits after signing in (ADR-033, ADR-090). */
describe("RequireMemberSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["user", "admin", "super_admin"] as const)("admits a %s", (role) => {
    renderAs({ role, mustChangePassword: false });

    expect(screen.getByText("member content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it.each(["developer", "reviewer", "lead"] as const)("admits a %s — they land here after signing in (ADR-090)", (role) => {
    renderAs({ role, mustChangePassword: false, roles: ["user", role] });

    expect(screen.getByText("member content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends a guest to the public page", () => {
    renderAs({ role: "guest", mustChangePassword: false });

    expect(screen.queryByText("member content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/welcome");
  });

  it("sends a Developer still on a temporary password to replace it first", () => {
    renderAs({ role: "developer", mustChangePassword: true });

    expect(screen.queryByText("member content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/create-password");
  });

  it("sends a visitor who arrives signed out to /login", () => {
    renderAs(null, "anonymous");

    expect(replace).toHaveBeenCalledWith("/login");
  });
});
