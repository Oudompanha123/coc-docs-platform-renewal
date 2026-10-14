import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShellProvider } from "@/lib/layout/ShellContext";
import type { ActivityItem } from "@/lib/notify/useActivityFeed";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({ name: "Sam Admin", role: "Super Admin", initials: "SA", avatarUrl: null }),
}));

vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ signOut: vi.fn(), isSigningOut: false }),
}));

vi.mock("@/lib/notify/useNotifications", () => ({
  useNotifications: () => ({
    items: [],
    unreadCount: 0,
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    open: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const { markRead } = vi.hoisted(() => ({ markRead: vi.fn() }));
let activityItems: ActivityItem[] = [];
vi.mock("@/lib/notify/useActivityFeed", () => ({
  useActivityFeed: () => ({
    items: activityItems,
    count: activityItems.filter((i) => !i.read).length,
    markRead,
    markAllRead: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { Topbar } from "./Topbar";

function activityItem(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id: "1",
    actorEmail: "admin@example.com",
    actorAvatarUrl: null,
    summary: "Changed an account's role",
    occurredAt: new Date().toISOString(),
    actionType: "account.role_change",
    targetType: "account",
    targetId: "0f8b1a2c-1111-4444-8888-aaaaaaaaaaaa",
    href: "/users-roles?highlight=0f8b1a2c-1111-4444-8888-aaaaaaaaaaaa",
    read: false,
    ...overrides,
  };
}

function renderTopbar() {
  return render(
    <ShellProvider>
      <Topbar onMenuClick={vi.fn()} />
    </ShellProvider>,
  );
}

describe("Topbar Activity panel", () => {
  beforeEach(() => {
    push.mockClear();
    markRead.mockClear();
  });

  it("marks an item read and navigates when it has a target", async () => {
    activityItems = [activityItem()];
    const user = userEvent.setup();
    renderTopbar();

    await user.click(screen.getByRole("button", { name: /^Activity,/ }));
    await user.click(screen.getByText("Changed an account's role"));

    expect(markRead).toHaveBeenCalledWith("1");
    expect(push).toHaveBeenCalledWith("/users-roles?highlight=0f8b1a2c-1111-4444-8888-aaaaaaaaaaaa");
    // The panel closes once it navigates — same as the bell's own items.
    expect(screen.queryByText("Changed an account's role")).not.toBeInTheDocument();
  });

  it("marks an item read without navigating when it has no target, and leaves the panel open", async () => {
    activityItems = [
      activityItem({
        id: "2",
        summary: "Saved a documentation section",
        actionType: "docs_content.save",
        targetType: null,
        targetId: null,
        href: null,
      }),
    ];
    const user = userEvent.setup();
    renderTopbar();

    await user.click(screen.getByRole("button", { name: /^Activity,/ }));
    await user.click(screen.getByText("Saved a documentation section"));

    expect(markRead).toHaveBeenCalledWith("2");
    expect(push).not.toHaveBeenCalled();
    // Still open, same as before this item ever had a possible destination.
    expect(screen.getByText("Saved a documentation section")).toBeInTheDocument();
  });

  it("shows the actor's picture when one is present", async () => {
    activityItems = [activityItem({ actorAvatarUrl: "https://cdn.example.com/dana.png" })];
    const user = userEvent.setup();
    const { container } = renderTopbar();

    await user.click(screen.getByRole("button", { name: /^Activity,/ }));

    expect(container.querySelector('img[src="https://cdn.example.com/dana.png"]')).toBeInTheDocument();
  });

  it("falls back to coloured initials when the actor has no picture", async () => {
    activityItems = [activityItem({ actorAvatarUrl: null, actorEmail: "dana.lee@example.com" })];
    const user = userEvent.setup();
    const { container } = renderTopbar();

    await user.click(screen.getByRole("button", { name: /^Activity,/ }));

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("DL")).toBeInTheDocument();
  });
});

describe("Topbar sidebar toggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("has no toggle while the sidebar is expanded — that one sits in the sidebar's header", () => {
    renderTopbar();
    expect(screen.queryByRole("button", { name: "Expand sidebar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Collapse sidebar" })).not.toBeInTheDocument();
  });

  it("shows Expand while folded, and clicking it unfolds and remembers", async () => {
    window.localStorage.setItem("coc-docs-sidebar-collapsed", "1");
    const user = userEvent.setup();
    renderTopbar();

    const toggle = await screen.findByRole("button", { name: "Expand sidebar" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "admin-sidebar");

    await user.click(toggle);
    expect(screen.queryByRole("button", { name: "Expand sidebar" })).not.toBeInTheDocument();
    expect(window.localStorage.getItem("coc-docs-sidebar-collapsed")).toBe("0");
  });
});
