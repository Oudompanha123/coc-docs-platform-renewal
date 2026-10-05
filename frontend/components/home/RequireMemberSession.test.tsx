import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireMemberSession } from "./RequireMemberSession";
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

describe("RequireMemberSession", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it.each<Role>(["user", "developer", "admin", "super_admin"])(
    "admits %s — developer joined the other three since ADR-092",
    (role) => {
      session.current = { status: "authenticated", user: { role, mustChangePassword: false } };
      render(
        <RequireMemberSession>
          <p>home content</p>
        </RequireMemberSession>,
      );
      expect(screen.getByText("home content")).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    },
  );

  it.each<Role>(["reviewer", "lead", "guest"])("sends %s to /welcome — unaffected by ADR-092", (role) => {
    session.current = { status: "authenticated", user: { role, mustChangePassword: false } };
    render(
      <RequireMemberSession>
        <p>home content</p>
      </RequireMemberSession>,
    );
    expect(screen.queryByText("home content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/welcome");
  });

  it("sends an anonymous visitor to /login", () => {
    session.current = { status: "anonymous", user: null };
    render(
      <RequireMemberSession>
        <p>home content</p>
      </RequireMemberSession>,
    );
    expect(screen.queryByText("home content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("sends a caller still on a temporary password to /create-password", () => {
    session.current = { status: "authenticated", user: { role: "user", mustChangePassword: true } };
    render(
      <RequireMemberSession>
        <p>home content</p>
      </RequireMemberSession>,
    );
    expect(screen.queryByText("home content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/create-password");
  });

  it("renders nothing while the session is still loading", () => {
    session.current = { status: "loading", user: null };
    const { container } = render(
      <RequireMemberSession>
        <p>home content</p>
      </RequireMemberSession>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
