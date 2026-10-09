import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NavProduct } from "@/lib/docs/nav-api";
import { MemberHeader } from "./MemberHeader";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/home" } }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({ name: "Dana Lee", role: "User", initials: "DL", avatarUrl: null }),
}));

const { sessionRole } = vi.hoisted(() => ({ sessionRole: { current: "user" as string } }));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({
    user: {
      role: sessionRole.current,
      displayName: "Dana Lee",
      email: "dana@example.com",
      avatarUrl: null,
      lastSignInAt: null,
    },
    signOut: vi.fn(),
    isSigningOut: false,
  }),
}));

vi.mock("@/lib/me/attendance", () => ({
  fetchMyAttendance: vi.fn().mockResolvedValue({ viewerLinked: false, department: null, rows: [] }),
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

vi.mock("@/lib/notify/useActivityFeed", () => ({
  useActivityFeed: () => ({ items: [], count: 0, markRead: vi.fn(), markAllRead: vi.fn(), refresh: vi.fn() }),
}));

const PRODUCTS: NavProduct[] = [{ key: "jex3-0", label: "Jex3.0", icon: "layers", minRole: "user", items: [] }];

beforeEach(() => {
  pathname.current = "/home";
  sessionRole.current = "user";
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  // jsdom doesn't implement scrollTo — ProfilePopup's scroll-lock cleanup
  // calls it to restore the page's position when it unmounts.
  window.scrollTo = vi.fn();
});

describe("MemberHeader — Claude Usage nav link retired (moved into /account/settings)", () => {
  it("renders no Claude Usage link anywhere in the top nav", () => {
    render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);
    expect(screen.queryByRole("link", { name: "Claude Usage" })).not.toBeInTheDocument();
  });

  it("still shows no admin-only navigation for a plain user", () => {
    render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);
    expect(screen.queryByText("Open Dashboard")).not.toBeInTheDocument();
  });

  it("renders no Claude Usage link for admin/super_admin either — unaffected by role", () => {
    for (const role of ["admin", "super_admin"]) {
      sessionRole.current = role;
      const { unmount } = render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);
      expect(screen.queryByRole("link", { name: "Claude Usage" })).not.toBeInTheDocument();
      unmount();
    }
  });
});

describe("MemberHeader — user menu (Profile / Settings / Log out)", () => {
  async function openUserMenu() {
    const user = userEvent.setup();
    render(<MemberHeader products={PRODUCTS} />);
    await user.click(screen.getByRole("button", { name: /dana lee/i }));
  }

  it("Profile opens the read-only profile popup — not a navigation, not the old editable modal", async () => {
    const user = userEvent.setup();
    await openUserMenu();
    const profileItem = screen.getByRole("menuitem", { name: "Profile" });
    expect(profileItem.tagName).toBe("BUTTON");
    expect(profileItem).not.toHaveAttribute("href");

    await user.click(profileItem);

    expect(screen.getByRole("dialog", { name: "Dana Lee" })).toBeInTheDocument();
  });

  it("closing the profile popup returns focus to the user chip", async () => {
    const user = userEvent.setup();
    await openUserMenu();
    await user.click(screen.getByRole("menuitem", { name: "Profile" }));

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dana lee/i })).toHaveFocus();
  });

  it("Settings sits between Profile and Log out, pointing at /account/settings", async () => {
    await openUserMenu();
    const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
    const profileIndex = items.findIndex((t) => t === "Profile");
    const settingsIndex = items.findIndex((t) => t === "Settings");
    const logoutIndex = items.findIndex((t) => t?.includes("Log out"));

    expect(settingsIndex).toBeGreaterThan(profileIndex);
    expect(settingsIndex).toBeLessThan(logoutIndex);
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute("href", "/account/settings");
  });

  it("highlights Settings when already on /account/settings", async () => {
    pathname.current = "/account/settings";
    await openUserMenu();
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveClass("text-brand-purple");
  });

  it("does not highlight Settings elsewhere", async () => {
    await openUserMenu();
    expect(screen.getByRole("menuitem", { name: "Settings" })).not.toHaveClass("text-brand-purple");
  });

  it.each(["admin", "super_admin"])(
    "has no Open Dashboard item for %s either — moved to the Settings side menu",
    async (role) => {
      sessionRole.current = role;
      await openUserMenu();
      const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
      expect(items).toEqual(["Profile", "Settings", "Log out"]);
    },
  );
});

describe("MemberHeader — theme toggle", () => {
  it("starts in light mode (not pressed) when nothing is stored", () => {
    render(<MemberHeader products={PRODUCTS} />);
    expect(screen.getByRole("button", { name: "Toggle dark mode" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reflects a previously-stored dark preference on load", () => {
    localStorage.setItem("coc-docs-theme", "dark");
    render(<MemberHeader products={PRODUCTS} />);
    expect(screen.getByRole("button", { name: "Toggle dark mode" })).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to dark, persists it, and sets data-theme on <html>", async () => {
    const user = userEvent.setup();
    render(<MemberHeader products={PRODUCTS} />);

    await user.click(screen.getByRole("button", { name: "Toggle dark mode" }));

    expect(screen.getByRole("button", { name: "Toggle dark mode" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("coc-docs-theme")).toBe("dark");
  });

  it("switches back to light on a second click", async () => {
    const user = userEvent.setup();
    render(<MemberHeader products={PRODUCTS} />);
    const toggle = screen.getByRole("button", { name: "Toggle dark mode" });

    await user.click(toggle);
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("coc-docs-theme")).toBe("light");
  });
});
