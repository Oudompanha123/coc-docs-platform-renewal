import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShellProvider } from "@/lib/layout/ShellContext";
import type { AdminAccount } from "@/lib/admin/accounts";

let highlight: string | null = null;
let invite: string | null = null;
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "highlight" ? highlight : key === "invite" ? invite : null),
  }),
}));

vi.mock("@/lib/auth/api", () => ({
  me: vi.fn().mockResolvedValue({ id: "self-id", email: null, displayName: null, role: null, createdAt: null, lastSignInAt: null }),
}));

const { ACCOUNTS } = vi.hoisted(() => ({
  ACCOUNTS: [
    {
      id: "0f8b1a2c-1111-4444-8888-aaaaaaaaaaaa",
      email: "dana@example.com",
      displayName: "Dana Lee",
      role: "admin",
      active: true,
      roles: ["admin"],
      createdAt: "2026-01-01T00:00:00Z",
      lastSignInAt: null,
      mustChangePassword: false,
      avatarUrl: null,
    },
  ] satisfies AdminAccount[],
}));

vi.mock("@/lib/admin/accounts", () => ({
  listAccounts: vi.fn().mockResolvedValue(ACCOUNTS),
  listPending: vi.fn().mockResolvedValue([]),
  listRoles: vi.fn().mockResolvedValue([]),
  createAccount: vi.fn(),
  approveAccount: vi.fn(),
  rejectAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
}));

import UsersRolesPage from "./page";

function renderPage() {
  return render(
    <ShellProvider>
      <UsersRolesPage />
    </ShellProvider>,
  );
}

/**
 * The topbar's Activity panel sends a super_admin here as
 * `/users-roles?highlight=<accountId>` (NotificationFeedService.hrefFor) for
 * "Changed an account's role" and similar. This is the other half of that
 * path: what this page does with it.
 */
describe("UsersRolesPage — ?highlight deep link", () => {
  it("opens that account's detail when the id is one of the loaded accounts", async () => {
    highlight = ACCOUNTS[0]!.id;
    renderPage();

    expect(await screen.findByDisplayValue("Dana Lee")).toBeInTheDocument();
  });

  /**
   * The account the notification pointed at was deleted, or belongs to a
   * caller this session cannot see, in the time between the audit row being
   * written and this page being opened. Silence, not a crash and not an
   * error banner over an otherwise-working page — the same "not found" this
   * page already gives a stale `detailId` from any other source.
   */
  it("opens nothing, without error, when the id is not one of the loaded accounts", async () => {
    highlight = "99999999-0000-0000-0000-000000000000";
    renderPage();

    // Give the load a turn to resolve before asserting the negative.
    await screen.findByRole("tab", { name: "Users" });
    expect(screen.queryByDisplayValue("Dana Lee")).not.toBeInTheDocument();
  });

  it("renders normally with no ?highlight at all", async () => {
    highlight = null;
    renderPage();

    await screen.findByRole("tab", { name: "Users" });
    expect(screen.queryByDisplayValue("Dana Lee")).not.toBeInTheDocument();
  });
});

/**
 * The Overview dashboard's "Invite Teammate" quick action sends a
 * super_admin here as `/users-roles?invite=1` — this is the other half of
 * that path: what this page does with it.
 */
describe("UsersRolesPage — ?invite deep link", () => {
  it("opens Add User when ?invite=1 is present", async () => {
    highlight = null;
    invite = "1";
    renderPage();

    expect(await screen.findByText("Add User")).toBeInTheDocument();
  });

  it("renders normally with no ?invite at all", async () => {
    highlight = null;
    invite = null;
    renderPage();

    await screen.findByRole("tab", { name: "Users" });
    expect(screen.queryByText("Add User")).not.toBeInTheDocument();
  });
});
