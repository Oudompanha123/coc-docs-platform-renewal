import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireSession } from "./RequireSession";
import type { MeResponse, Role } from "@/lib/auth/api";
import { AX_RENEWAL_ROLES, SUPER_ADMIN_ROLES } from "@/lib/auth/landing";

// Partial<MeResponse> rather than any: these fixtures deliberately carry only
// the fields RequireSession reads, and `any` would let a rename of one of them
// pass silently — which is how role: "ADMIN" survived in another fixture until
// a guard finally looked at it.
type MockSession = {
  status: "loading" | "authenticated" | "anonymous";
  user: Partial<MeResponse> | null;
};

const { replace, session, pathname } = vi.hoisted(() => ({
  replace: vi.fn(),
  // A box: the mock factories below close over this reference once, so
  // each test mutates `.current` instead of re-mocking the module.
  session: {
    current: { status: "authenticated", user: { role: "admin", mustChangePassword: false } } as MockSession,
  },
  pathname: { current: "/overview" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname.current,
}));

vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => session.current,
}));

describe("RequireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname.current = "/overview";
  });

  it("renders the admin app for an admin role", () => {
    session.current = { status: "authenticated", user: { role: "admin", mustChangePassword: false } };
    render(
      <RequireSession>
        <p>admin content</p>
      </RequireSession>,
    );
    expect(screen.getByText("admin content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders the admin app for a super_admin role", () => {
    session.current = { status: "authenticated", user: { role: "super_admin", mustChangePassword: false } };
    render(
      <RequireSession>
        <p>admin content</p>
      </RequireSession>,
    );
    expect(screen.getByText("admin content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends a plain \"user\" role to the public landing page instead of rendering the admin app", () => {
    session.current = { status: "authenticated", user: { role: "user", mustChangePassword: false } };
    render(
      <RequireSession>
        <p>admin content</p>
      </RequireSession>,
    );
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/welcome");
  });

  describe("a super_admin-only page (ADR-100)", () => {
    it("sends an admin to deniedPath, not /welcome — they still belong in the app", () => {
      session.current = { status: "authenticated", user: { role: "admin", roles: ["admin"], mustChangePassword: false } };
      render(
        <RequireSession allowRoles={SUPER_ADMIN_ROLES} deniedPath="/overview">
          <p>super admin content</p>
        </RequireSession>,
      );
      expect(screen.queryByText("super admin content")).not.toBeInTheDocument();
      expect(replace).toHaveBeenCalledWith("/overview");
    });

    it("renders for a super_admin", () => {
      session.current = {
        status: "authenticated",
        user: { role: "super_admin", roles: ["super_admin"], mustChangePassword: false },
      };
      render(
        <RequireSession allowRoles={SUPER_ADMIN_ROLES} deniedPath="/overview">
          <p>super admin content</p>
        </RequireSession>,
      );
      expect(screen.getByText("super admin content")).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    });
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
      user: { role: "admin", mustChangePassword: true },
    };
    render(
      <RequireSession>
        <p>admin content</p>
      </RequireSession>,
    );
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/create-password");
  });

  describe("Developer, Reviewer and Lead (ADR-086; AX Renewal reopened by ADR-090)", () => {
    // Kept out of every admin page (ADR-086) except AX Renewal, whose layout
    // passes AX_RENEWAL_ROLES (ADR-090). Every other layout keeps the default.
    function renderAs(
      role: "developer" | "reviewer" | "lead" | "user",
      path: string,
      allowRoles?: readonly Role[],
    ) {
      pathname.current = path;
      session.current = {
        status: "authenticated",
        user: { role, mustChangePassword: false, roles: role === "user" ? ["user"] : ["user", role] },
      };
      render(
        <RequireSession allowRoles={allowRoles}>
          <p>admin content</p>
        </RequireSession>,
      );
    }

    it.each([
      ["developer", "/overview"],
      ["developer", "/settings"],
      ["reviewer", "/overview"],
      ["reviewer", "/settings"],
      ["lead", "/overview"],
      ["lead", "/settings"],
      ["developer", "/users-roles"],
      ["reviewer", "/claude-usage"],
      ["lead", "/attendance"],
    ] as const)("still refuses a %s on %s", (role, path) => {
      renderAs(role, path);
      expect(screen.queryByText("admin content")).not.toBeInTheDocument();
      expect(replace).toHaveBeenCalledWith("/welcome");
    });

    it.each(["developer", "reviewer", "lead"] as const)("admits a %s to AX Renewal", (role) => {
      renderAs(role, "/ax-renewal", AX_RENEWAL_ROLES);
      expect(screen.getByText("admin content")).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    });

    it("still refuses a plain user at AX Renewal", () => {
      renderAs("user", "/ax-renewal", AX_RENEWAL_ROLES);
      expect(screen.queryByText("admin content")).not.toBeInTheDocument();
      expect(replace).toHaveBeenCalledWith("/welcome");
    });

    it("admits an account holding developer alongside a lower role, by the roles it holds", () => {
      pathname.current = "/ax-renewal";
      session.current = {
        status: "authenticated",
        user: { role: "user", mustChangePassword: false, roles: ["user", "developer"] },
      };
      render(
        <RequireSession allowRoles={AX_RENEWAL_ROLES}>
          <p>admin content</p>
        </RequireSession>,
      );
      expect(screen.getByText("admin content")).toBeInTheDocument();
    });
  });

  describe("/claude-usage (ADR-052, further revised: admin-only again, no exception)", () => {
    // The personal view that briefly lived at this same url now lives as a
    // section on /home instead (RequireMemberSession's own gate, not this
    // one) — so /claude-usage is back to being an ordinary
    // ADMINISTRATION-floor route with no carve-out, same as /users-roles.
    it("refuses a plain user", () => {
      pathname.current = "/claude-usage";
      session.current = {
        status: "authenticated",
        user: { role: "user", mustChangePassword: false, roles: ["user"] },
      };
      render(
        <RequireSession>
          <p>admin content</p>
        </RequireSession>,
      );
      expect(screen.queryByText("admin content")).not.toBeInTheDocument();
      expect(replace).toHaveBeenCalledWith("/welcome");
    });

    it("admits an admin", () => {
      pathname.current = "/claude-usage";
      session.current = { status: "authenticated", user: { role: "admin", mustChangePassword: false } };
      render(
        <RequireSession>
          <p>admin content</p>
        </RequireSession>,
      );
      expect(screen.getByText("admin content")).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    });
  });
});
