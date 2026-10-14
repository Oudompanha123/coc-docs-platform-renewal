import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsSideMenu } from "./SettingsSideMenu";
import type { SettingsSectionId } from "@/lib/account/settingsSections";

const { signOut, sessionRole } = vi.hoisted(() => ({
  signOut: vi.fn(),
  sessionRole: { current: "user" as string | undefined },
}));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ user: { role: sessionRole.current }, signOut, isSigningOut: false }),
}));

function renderMenu(active: SettingsSectionId = "account") {
  const onActivate = vi.fn();
  render(<SettingsSideMenu active={active} onActivate={onActivate} />);
  return { onActivate };
}

// jsdom has no `matchMedia` at all — the mobile row's active-tab
// auto-scroll reads `prefers-reduced-motion` from it on every `active`
// change, so it must exist before the component ever mounts.
function stubMatchMedia(matches = false) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionRole.current = "user";
  stubMatchMedia();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("SettingsSideMenu", () => {
  it("renders Account, Appearance, Notifications, Claude Usage, Attendance, Connected accounts, Security, Sessions, then Log out — no Profile", () => {
    renderMenu();

    const items = screen.getAllByRole("tab").map((el) => el.textContent);
    expect(items.filter((t) => t === "Account").length).toBeGreaterThan(0);
    expect(items.some((t) => t === "Appearance")).toBe(true);
    expect(items.some((t) => t === "Notifications")).toBe(true);
    expect(items.some((t) => t === "Claude Usage")).toBe(true);
    expect(items.some((t) => t === "Attendance")).toBe(true);
    expect(items.some((t) => t === "Connected accounts")).toBe(true);
    expect(items.some((t) => t === "Security")).toBe(true);
    expect(items.some((t) => t === "Sessions")).toBe(true);
    expect(screen.queryByRole("tab", { name: "Profile" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /log out/i }).length).toBe(1);
  });

  it("puts Password & 2FA directly below Security and above Sessions, with its own icon", () => {
    renderMenu();
    const items = screen.getAllByRole("tab").map((el) => el.textContent);
    const desktop = items.slice(0, items.length / 2);
    const index = desktop.indexOf("Password & 2FA");

    expect(desktop[index - 1]).toBe("Security");
    expect(desktop[index + 1]).toBe("Sessions");
    expect(screen.getAllByRole("tab", { name: "Password & 2FA" })[0]!.querySelector("svg")).not.toBeNull();
  });

  it("puts Sessions last among the tabs, after Security", () => {
    renderMenu();
    const items = screen.getAllByRole("tab").map((el) => el.textContent);
    const securityIndex = items.indexOf("Security");
    const sessionsIndex = items.indexOf("Sessions");

    expect(sessionsIndex).toBeGreaterThan(securityIndex);
  });

  it("puts Claude Usage between Notifications and Connected accounts", () => {
    renderMenu();
    const items = screen.getAllByRole("tab").map((el) => el.textContent);
    const notifIndex = items.indexOf("Notifications");
    const claudeIndex = items.indexOf("Claude Usage");
    const connectedIndex = items.indexOf("Connected accounts");

    expect(claudeIndex).toBeGreaterThan(notifIndex);
    expect(claudeIndex).toBeLessThan(connectedIndex);
  });

  it("puts Attendance right under Claude Usage", () => {
    renderMenu();
    const items = screen.getAllByRole("tab").map((el) => el.textContent);

    expect(items.indexOf("Attendance")).toBe(items.indexOf("Claude Usage") + 1);
  });

  it.each(["developer", "reviewer", "lead"])("still shows Attendance for %s, who has no Claude Usage tab", (role) => {
    sessionRole.current = role;
    renderMenu();
    const items = screen.getAllByRole("tab").map((el) => el.textContent);

    expect(items).toContain("Attendance");
    expect(items.indexOf("Attendance")).toBe(items.indexOf("Notifications") + 1);
  });

  it.each(["user", "admin", "super_admin"])("shows Claude Usage for %s", (role) => {
    sessionRole.current = role;
    renderMenu();
    expect(screen.getAllByRole("tab", { name: "Claude Usage" }).length).toBeGreaterThan(0);
  });

  it.each(["developer", "reviewer", "lead"])(
    "hides Claude Usage for %s — this role never saw /my-claude-usage either",
    (role) => {
      sessionRole.current = role;
      renderMenu();
      expect(screen.queryByRole("tab", { name: "Claude Usage" })).not.toBeInTheDocument();
    },
  );

  it("places Log out only in the desktop nav, after a divider, not as a tab", () => {
    renderMenu();
    expect(screen.getAllByRole("button", { name: /log out/i }).length).toBe(1);
    expect(screen.queryByRole("tab", { name: /log out/i })).not.toBeInTheDocument();
  });

  it.each(["admin", "super_admin"])("shows Open Dashboard, linking to /overview, for %s", (role) => {
    sessionRole.current = role;
    renderMenu();
    const link = screen.getByRole("link", { name: /open dashboard/i });
    expect(link).toHaveAttribute("href", "/overview");
  });

  it.each(["user", "developer", "reviewer", "lead"])("hides Open Dashboard for %s", (role) => {
    sessionRole.current = role;
    renderMenu();
    expect(screen.queryByRole("link", { name: /open dashboard/i })).not.toBeInTheDocument();
  });

  it("Open Dashboard is a real navigation, not a tab — it's not part of the tablist", () => {
    sessionRole.current = "super_admin";
    renderMenu();
    const link = screen.getByRole("link", { name: /open dashboard/i });
    expect(link).not.toHaveAttribute("role", "tab");
  });

  it("calls signOut when Log out is clicked", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(signOut).toHaveBeenCalled();
  });

  describe("tab behavior", () => {
    it("marks the active section's tab aria-selected, others not", () => {
      renderMenu("appearance");
      const appearanceTabs = screen.getAllByRole("tab", { name: "Appearance" });
      const accountTabs = screen.getAllByRole("tab", { name: "Account" });

      for (const tab of appearanceTabs) expect(tab).toHaveAttribute("aria-selected", "true");
      for (const tab of accountTabs) expect(tab).toHaveAttribute("aria-selected", "false");
    });

    it("calls onActivate with the clicked section's id — no scrolling, just selection", async () => {
      const user = userEvent.setup();
      const { onActivate } = renderMenu();

      await user.click(screen.getAllByRole("tab", { name: "Appearance" })[0]!);

      expect(onActivate).toHaveBeenCalledWith("appearance");
    });

    it("every tab points aria-controls at its matching panel id", () => {
      renderMenu();
      const securityTab = screen.getAllByRole("tab", { name: "Security" })[0]!;
      expect(securityTab).toHaveAttribute("aria-controls", "panel-security");
    });

    it("each tablist has aria-orientation set (vertical desktop, horizontal mobile)", () => {
      renderMenu();
      const tablists = screen.getAllByRole("tablist");
      expect(tablists.some((t) => t.getAttribute("aria-orientation") === "vertical")).toBe(true);
      expect(tablists.some((t) => t.getAttribute("aria-orientation") === "horizontal")).toBe(true);
    });
  });

  describe("keyboard navigation", () => {
    it("ArrowDown moves focus to the next tab without activating it", async () => {
      const user = userEvent.setup();
      const { onActivate } = renderMenu();

      const accountTab = screen.getAllByRole("tab", { name: "Account" })[0]!;
      accountTab.focus();
      await user.keyboard("{ArrowDown}");

      expect(screen.getAllByRole("tab", { name: "Appearance" })[0]).toHaveFocus();
      expect(onActivate).not.toHaveBeenCalled();
    });

    it("ArrowUp from the first tab wraps to the last", async () => {
      const user = userEvent.setup();
      renderMenu();

      const accountTab = screen.getAllByRole("tab", { name: "Account" })[0]!;
      accountTab.focus();
      await user.keyboard("{ArrowUp}");

      expect(screen.getAllByRole("tab", { name: "Sessions" })[0]).toHaveFocus();
    });

    it("End moves focus to the last tab, Home back to the first", async () => {
      const user = userEvent.setup();
      renderMenu();

      const accountTab = screen.getAllByRole("tab", { name: "Account" })[0]!;
      accountTab.focus();
      await user.keyboard("{End}");
      expect(screen.getAllByRole("tab", { name: "Sessions" })[0]).toHaveFocus();

      await user.keyboard("{Home}");
      expect(screen.getAllByRole("tab", { name: "Account" })[0]).toHaveFocus();
    });

    it("Enter activates the focused tab", async () => {
      const user = userEvent.setup();
      const { onActivate } = renderMenu();

      const accountTab = screen.getAllByRole("tab", { name: "Account" })[0]!;
      accountTab.focus();
      await user.keyboard("{ArrowDown}{Enter}");

      expect(onActivate).toHaveBeenCalledWith("appearance");
    });

    it("only the active tab is tab-reachable (roving tabindex) until focus moves", () => {
      renderMenu("security");
      const securityTab = screen.getAllByRole("tab", { name: "Security" })[0]!;
      const accountTab = screen.getAllByRole("tab", { name: "Account" })[0]!;

      expect(securityTab).toHaveAttribute("tabindex", "0");
      expect(accountTab).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("mobile tab row", () => {
    it("scrolls the active tab into view (smoothly, by default) whenever it changes", () => {
      const { rerender } = render(<SettingsSideMenu active="account" onActivate={vi.fn()} />);
      vi.clearAllMocks();

      rerender(<SettingsSideMenu active="security" onActivate={vi.fn()} />);

      const [, mobileSecurityTab] = screen.getAllByRole("tab", { name: "Security" });
      expect(mobileSecurityTab).toHaveProperty("scrollIntoView");
      expect(mobileSecurityTab!.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: "smooth" }),
      );
    });

    it("scrolls instantly (no smooth behavior) under prefers-reduced-motion", () => {
      stubMatchMedia(true);
      const { rerender } = render(<SettingsSideMenu active="account" onActivate={vi.fn()} />);
      vi.clearAllMocks();

      rerender(<SettingsSideMenu active="security" onActivate={vi.fn()} />);

      const [, mobileSecurityTab] = screen.getAllByRole("tab", { name: "Security" });
      expect(mobileSecurityTab!.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: "auto" }));
    });
  });
});
