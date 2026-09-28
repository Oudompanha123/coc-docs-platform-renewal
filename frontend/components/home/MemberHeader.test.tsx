import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NavProduct } from "@/lib/docs/nav-api";
import { MemberHeader } from "./MemberHeader";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/home" } }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({ name: "Dana Lee", role: "User", initials: "DL", avatarUrl: null }),
}));

vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ user: { role: "user" }, signOut: vi.fn(), isSigningOut: false }),
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
});

describe("MemberHeader — Claude Usage link (ADR-052 v1.6: its own page again, not a section on /home)", () => {
  it("renders a Claude Usage link, next to Home and Products, pointing at its own route", () => {
    render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);

    const link = screen.getByRole("link", { name: "Claude Usage" });
    expect(link).toHaveAttribute("href", "/my-claude-usage");
    // Same nav row as Home/Products, not the right-side icon cluster.
    expect(screen.getByRole("link", { name: "Home" }).parentElement).toBe(link.parentElement);
  });

  it("is a real navigation — no click-time scroll interception left over from the on-page-section design", () => {
    render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);
    const link = screen.getByRole("link", { name: "Claude Usage" });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const prevented = !link.dispatchEvent(event);

    // Not prevented: the browser's own navigation to the href runs.
    expect(prevented).toBe(false);
  });

  it("is marked active when already on /my-claude-usage", () => {
    pathname.current = "/my-claude-usage";
    render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Claude Usage" })).toHaveClass("border-brand-purple", "text-ink");
  });

  it("does not render any admin-only navigation for a plain user", () => {
    render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);

    expect(screen.queryByText("Open Dashboard")).not.toBeInTheDocument();
  });
});
