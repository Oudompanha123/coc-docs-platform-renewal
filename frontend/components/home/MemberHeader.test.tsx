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

describe("MemberHeader — Claude Usage link (ADR-047, further revised: a section on /home, not a route)", () => {
  it("renders a Claude Usage link, next to Home and Products, pointing at the on-page section as a real href", () => {
    render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);

    const link = screen.getByRole("link", { name: "Claude Usage" });
    // A real, absolute href — not a bare "#my-claude-usage" — so the link
    // still resolves correctly without JavaScript, from a background-tab
    // open, or read out of context by a screen reader.
    expect(link).toHaveAttribute("href", "/home#my-claude-usage");
    // Same nav row as Home/Products, not the right-side icon cluster.
    expect(screen.getByRole("link", { name: "Home" }).parentElement).toBe(link.parentElement);
  });

  it("smooth-scrolls to the section instead of navigating, when it's present on the page", () => {
    const section = document.createElement("div");
    section.id = "my-claude-usage";
    document.body.appendChild(section);
    const scrollIntoView = vi.fn();
    section.scrollIntoView = scrollIntoView;

    render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);
    const link = screen.getByRole("link", { name: "Claude Usage" });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const prevented = !link.dispatchEvent(event);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(prevented).toBe(true);

    section.remove();
  });

  it("falls back to a normal navigation when the section isn't on the page", () => {
    render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);
    const link = screen.getByRole("link", { name: "Claude Usage" });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const prevented = !link.dispatchEvent(event);

    // Not prevented: the browser's own navigation to the href is left to run.
    expect(prevented).toBe(false);
  });

  it("does not render any admin-only navigation for a plain user", () => {
    render(<MemberHeader products={PRODUCTS} onOpenProfile={vi.fn()} />);

    expect(screen.queryByText("Open Dashboard")).not.toBeInTheDocument();
  });
});
