import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAccountSession } from "./RequireAccountSession";
import type { MeResponse, Role } from "@/lib/auth/api";

type MockSession = {
  status: "loading" | "authenticated" | "anonymous";
  user: Partial<MeResponse> | null;
};

const { replace, session } = vi.hoisted(() => ({
  replace: vi.fn(),
  session: { current: { status: "authenticated", user: { role: "user", mustChangePassword: false } } as MockSession },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession: () => session.current }));

describe("RequireAccountSession", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it.each<Role>(["user", "developer", "reviewer", "lead", "admin", "super_admin"])(
    "admits every signed-in role, including %s — this page is for any signed-in account",
    (role) => {
      session.current = { status: "authenticated", user: { role, mustChangePassword: false } };
      render(
        <RequireAccountSession>
          <p>settings content</p>
        </RequireAccountSession>,
      );
      expect(screen.getByText("settings content")).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    },
  );

  it("sends an anonymous visitor to /login", () => {
    session.current = { status: "anonymous", user: null };
    render(
      <RequireAccountSession>
        <p>settings content</p>
      </RequireAccountSession>,
    );
    expect(screen.queryByText("settings content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("sends a caller still on a temporary password to /create-password", () => {
    session.current = { status: "authenticated", user: { role: "user", mustChangePassword: true } };
    render(
      <RequireAccountSession>
        <p>settings content</p>
      </RequireAccountSession>,
    );
    expect(screen.queryByText("settings content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/create-password");
  });

  it("renders nothing while the session is still loading", () => {
    session.current = { status: "loading", user: null };
    const { container } = render(
      <RequireAccountSession>
        <p>settings content</p>
      </RequireAccountSession>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
