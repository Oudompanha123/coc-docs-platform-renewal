import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsSideMenu } from "./SettingsSideMenu";

const { signOut, sessionRole } = vi.hoisted(() => ({
  signOut: vi.fn(),
  sessionRole: { current: "user" as string | undefined },
}));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ user: { role: sessionRole.current }, signOut, isSigningOut: false }),
}));

// jsdom has no real IntersectionObserver — the component only needs it not to throw.
class FakeIntersectionObserver {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionRole.current = "user";
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

describe("SettingsSideMenu", () => {
  it("renders Account, Appearance, Notifications, Claude Usage, Connected accounts, Security, Sessions, then Log out — no Profile", () => {
    render(<SettingsSideMenu />);

    const items = screen.getAllByRole("button").map((el) => el.textContent);
    // Two navs (desktop + mobile) both render the full item set.
    expect(items.filter((t) => t === "Account").length).toBeGreaterThan(0);
    expect(items.some((t) => t === "Appearance")).toBe(true);
    expect(items.some((t) => t === "Notifications")).toBe(true);
    expect(items.some((t) => t === "Claude Usage")).toBe(true);
    expect(items.some((t) => t === "Connected accounts")).toBe(true);
    expect(items.some((t) => t === "Security")).toBe(true);
    expect(items.some((t) => t === "Sessions")).toBe(true);
    expect(items.some((t) => t === "Profile")).toBe(false);
  });

  it("puts Sessions last among the scroll-spy sections, after Security", () => {
    render(<SettingsSideMenu />);
    const items = screen.getAllByRole("button").map((el) => el.textContent);
    const securityIndex = items.indexOf("Security");
    const sessionsIndex = items.indexOf("Sessions");

    expect(sessionsIndex).toBeGreaterThan(securityIndex);
  });

  it("puts Claude Usage between Notifications and Connected accounts", () => {
    render(<SettingsSideMenu />);
    const items = screen.getAllByRole("button").map((el) => el.textContent);
    const notifIndex = items.indexOf("Notifications");
    const claudeIndex = items.indexOf("Claude Usage");
    const connectedIndex = items.indexOf("Connected accounts");

    expect(claudeIndex).toBeGreaterThan(notifIndex);
    expect(claudeIndex).toBeLessThan(connectedIndex);
  });

  it.each(["user", "admin", "super_admin"])("shows Claude Usage for %s", (role) => {
    sessionRole.current = role;
    render(<SettingsSideMenu />);
    expect(screen.getAllByRole("button", { name: "Claude Usage" }).length).toBeGreaterThan(0);
  });

  it.each(["developer", "reviewer", "lead"])(
    "hides Claude Usage for %s — this role never saw /my-claude-usage either",
    (role) => {
      sessionRole.current = role;
      render(<SettingsSideMenu />);
      expect(screen.queryByRole("button", { name: "Claude Usage" })).not.toBeInTheDocument();
    },
  );

  it("places Log out only in the desktop nav, after a divider, not as a scroll-spy tab", () => {
    render(<SettingsSideMenu />);
    expect(screen.getAllByRole("button", { name: /log out/i }).length).toBe(1);
  });

  it.each(["admin", "super_admin"])("shows Open Dashboard, linking to /overview, for %s", (role) => {
    sessionRole.current = role;
    render(<SettingsSideMenu />);
    const link = screen.getByRole("link", { name: /open dashboard/i });
    expect(link).toHaveAttribute("href", "/overview");
  });

  it.each(["user", "developer", "reviewer", "lead"])("hides Open Dashboard for %s", (role) => {
    sessionRole.current = role;
    render(<SettingsSideMenu />);
    expect(screen.queryByRole("link", { name: /open dashboard/i })).not.toBeInTheDocument();
  });

  it("Open Dashboard is a real navigation, not a scroll-spy tab — it never gets the active-section highlight", () => {
    sessionRole.current = "super_admin";
    render(<SettingsSideMenu />);
    const link = screen.getByRole("link", { name: /open dashboard/i });
    expect(link).not.toHaveAttribute("aria-current");
  });

  it("scrolls to the matching section and updates the URL hash on click", async () => {
    document.body.innerHTML += '<div id="appearance"></div>';
    const scrollIntoView = vi.fn();
    document.getElementById("appearance")!.scrollIntoView = scrollIntoView;

    const user = userEvent.setup();
    render(<SettingsSideMenu />);

    await user.click(screen.getAllByRole("button", { name: "Appearance" })[0]!);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(window.location.hash).toBe("#appearance");
  });

  it("calls signOut when Log out is clicked", async () => {
    const user = userEvent.setup();
    render(<SettingsSideMenu />);

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(signOut).toHaveBeenCalled();
  });
});
