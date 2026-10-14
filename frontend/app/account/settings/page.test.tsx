import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountSettingsPage from "./page";

const { sessionRole } = vi.hoisted(() => ({ sessionRole: { current: "user" as string | undefined } }));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ user: { role: sessionRole.current }, signOut: vi.fn(), isSigningOut: false }),
}));

vi.mock("@/components/home/MemberHeader", () => ({ MemberHeader: () => <div data-testid="member-header" /> }));
vi.mock("@/lib/docs/useProductStats", () => ({ useProductStats: () => ({ status: "loading" as const }) }));
vi.mock("@/lib/me/attendance", () => ({
  fetchMyAttendance: vi.fn().mockResolvedValue({ viewerLinked: false, department: null, rows: [] }),
}));

// Real card content is out of scope for this page's tests — each is swapped
// for a minimal stand-in so the test only exercises tab routing/switching.
// The Account stub's text input doubles as proof that unsaved edits survive
// a tab switch (AC4) without needing to reach into ProfileCard's internals.
vi.mock("@/components/account/ProfileCard", () => ({
  ProfileCard: () => {
    const [value, setValue] = useState("");
    return <input aria-label="Display name" value={value} onChange={(e) => setValue(e.target.value)} />;
  },
}));
vi.mock("@/components/account/AppearanceCard", () => ({ AppearanceCard: () => <div>Appearance content</div> }));
vi.mock("@/components/account/NotificationsCard", () => ({ NotificationsCard: () => <div>Notifications content</div> }));
vi.mock("@/components/account/ConnectedAccountsCard", () => ({
  ConnectedAccountsCard: () => <div>Connected accounts content</div>,
}));
vi.mock("@/components/account/PasswordSecurityCard", () => ({ PasswordSecurityCard: () => <div>Password and 2FA content</div> }));
vi.mock("@/components/account/SecurityCard", () => ({ SecurityCard: () => <div>Security content</div> }));
vi.mock("@/components/account/SessionsCard", () => ({ SessionsCard: () => <div>Sessions content</div> }));
vi.mock("@/components/account/ClaudeUsageCard", () => ({ ClaudeUsageCard: () => <div>Claude Usage content</div> }));
vi.mock("@/components/account/AttendanceCard", () => ({ AttendanceCard: () => <div>Attendance content</div> }));

// `hidden`-attribute elements get an empty computed accessible name in
// jsdom even with the `hidden: true` query option (which only re-admits
// them as role candidates, not as name-computation subjects) — so a hidden
// panel is asserted on by id, not by its role+name.
function panelById(id: string): HTMLElement {
  const el = document.getElementById(`panel-${id}`);
  if (!el) throw new Error(`no panel with id "panel-${id}"`);
  return el;
}

// These tests are about routing/switching, not the animation itself (that
// gets its own tests in SettingsTabPanels.test.tsx) — reduced motion makes
// a tab switch synchronous, so assertions right after a click don't need
// to wait out the real 120ms/200ms transition.
function stubMatchMedia(matches = true) {
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
  window.location.hash = "";
  stubMatchMedia();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("AccountSettingsPage — tab behavior", () => {
  it("shows only the Account panel by default (AC1)", () => {
    render(<AccountSettingsPage />);

    expect(screen.getByRole("tabpanel", { name: "Account" })).toBeVisible();
    expect(screen.getByRole("tabpanel", { name: "Account" })).not.toHaveTextContent("Password and 2FA content");
    expect(panelById("security")).not.toBeVisible();
  });

  it("switching tabs shows only the clicked section and updates the hash (AC3)", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsPage />);

    await user.click(screen.getAllByRole("tab", { name: "Security" })[0]!);

    expect(screen.getByRole("tabpanel", { name: "Security" })).toBeVisible();
    expect(panelById("account")).not.toBeVisible();
    expect(window.location.hash).toBe("#security");
  });

  it("opens the Attendance section from #attendance (the /reports/attendance redirect)", () => {
    window.location.hash = "#attendance";
    render(<AccountSettingsPage />);

    expect(screen.getByRole("tabpanel", { name: "Attendance" })).toBeVisible();
    expect(screen.getByText("Attendance content")).toBeVisible();
  });

  it("opens directly to the section named in the URL hash (AC3)", () => {
    window.location.hash = "#security";
    render(<AccountSettingsPage />);

    expect(screen.getByRole("tabpanel", { name: "Security" })).toBeVisible();
  });

  it("the Security tab holds the sign-in method, then Password & 2FA, then Sessions", async () => {
    render(<AccountSettingsPage />);
    await userEvent.click(screen.getAllByRole("tab", { name: "Security" })[0]!);

    const panel = screen.getByRole("tabpanel", { name: "Security" });
    expect(panel).toBeVisible();
    const text = panel.textContent ?? "";
    expect(text.indexOf("Security content")).toBeLessThan(text.indexOf("Password and 2FA content"));
    expect(text.indexOf("Password and 2FA content")).toBeLessThan(text.indexOf("Sessions content"));
    expect(screen.queryByRole("tab", { name: "Password & 2FA" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Sessions" })).not.toBeInTheDocument();
  });

  it.each(["#password-2fa", "#sessions"])("an old %s link opens the Security tab, and the URL says so", (hash) => {
    window.location.hash = hash;
    render(<AccountSettingsPage />);

    expect(screen.getByRole("tabpanel", { name: "Security" })).toBeVisible();
    expect(window.location.hash).toBe("#security");
  });

  it("rewrites the legacy #profile hash to Account (AC3)", () => {
    window.location.hash = "#profile";
    render(<AccountSettingsPage />);

    expect(screen.getByRole("tabpanel", { name: "Account" })).toBeVisible();
    expect(window.location.hash).toBe("#account");
  });

  it("falls back to Account for an unknown hash (AC3)", () => {
    window.location.hash = "#not-a-real-section";
    render(<AccountSettingsPage />);

    expect(screen.getByRole("tabpanel", { name: "Account" })).toBeVisible();
    expect(window.location.hash).toBe("#account");
  });

  it("falls back to Account when the hash names a tab hidden from this role (AC3)", () => {
    sessionRole.current = "developer";
    window.location.hash = "#claude-usage";
    render(<AccountSettingsPage />);

    expect(screen.getByRole("tabpanel", { name: "Account" })).toBeVisible();
    expect(window.location.hash).toBe("#account");
  });

  it("keeps an unsaved Account edit when switching away and back (AC4)", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsPage />);

    const input = screen.getByLabelText("Display name");
    await user.type(input, "Neo Chanthy");

    await user.click(screen.getAllByRole("tab", { name: "Security" })[0]!);
    await user.click(screen.getAllByRole("tab", { name: "Account" })[0]!);

    expect(screen.getByLabelText("Display name")).toHaveValue("Neo Chanthy");
  });

  it("hides the Claude Usage tab and panel for a role that never had it", () => {
    sessionRole.current = "developer";
    render(<AccountSettingsPage />);

    expect(screen.queryByRole("tab", { name: "Claude Usage" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tabpanel", { name: "Claude Usage" })).not.toBeInTheDocument();
  });

  describe("scroll position after a switch", () => {
    // `scrollIntoView` is stubbed on `Element.prototype` in `beforeEach` —
    // shared by every element, including the mobile tab row's own
    // auto-scroll-into-view. Shadowing it with an own-property spy on just
    // the content area isolates these assertions to that element.
    it("leaves the scroll position alone when the content area is still visible", async () => {
      const user = userEvent.setup();
      render(<AccountSettingsPage />);
      const content = screen.getByTestId("settings-content");
      content.getBoundingClientRect = vi.fn(() => ({ top: 100 }) as DOMRect);
      content.scrollIntoView = vi.fn();

      await user.click(screen.getAllByRole("tab", { name: "Security" })[0]!);

      expect(content.scrollIntoView).not.toHaveBeenCalled();
    });

    it("scrolls the content top into view, instantly, once switching leaves it off-screen", async () => {
      const user = userEvent.setup();
      render(<AccountSettingsPage />);
      const content = screen.getByTestId("settings-content");
      content.getBoundingClientRect = vi.fn(() => ({ top: 5000 }) as DOMRect);
      content.scrollIntoView = vi.fn();

      await user.click(screen.getAllByRole("tab", { name: "Security" })[0]!);

      expect(content.scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "auto" });
    });
  });
});
