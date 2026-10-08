import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeResponse } from "@/lib/auth/api";
import CliSignedInPage from "./page";

// req: FR-USAGE-002, ADR-060

type MockSession = { status: "loading" | "authenticated" | "anonymous"; user: Partial<MeResponse> | null };

const { replace, session } = vi.hoisted(() => ({
  replace: vi.fn(),
  session: { current: { status: "loading", user: null } as MockSession },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/auth/SessionProvider", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => session.current,
}));

describe("/cli/signed-in — after Authorize in claude-team-usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends an admin to /my-claude-usage — the team dashboard is super_admin only (ADR-099)", () => {
    session.current = { status: "authenticated", user: { role: "admin" } };
    render(<CliSignedInPage />);
    expect(replace).toHaveBeenCalledWith("/my-claude-usage?cli=signed-in");
  });

  it("sends a super_admin to /claude-usage", () => {
    session.current = { status: "authenticated", user: { role: "super_admin" } };
    render(<CliSignedInPage />);
    expect(replace).toHaveBeenCalledWith("/claude-usage?cli=signed-in");
  });

  it("sends a user to /my-claude-usage", () => {
    session.current = { status: "authenticated", user: { role: "user" } };
    render(<CliSignedInPage />);
    expect(replace).toHaveBeenCalledWith("/my-claude-usage?cli=signed-in");
  });

  it("waits for the session instead of guessing, showing a short message", () => {
    session.current = { status: "loading", user: null };
    render(<CliSignedInPage />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("Returning to Claude Usage…")).toBeInTheDocument();
  });

  it("sends someone whose session has ended to sign in", () => {
    session.current = { status: "anonymous", user: null };
    render(<CliSignedInPage />);
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
