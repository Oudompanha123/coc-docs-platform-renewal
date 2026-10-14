import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ShellProvider } from "@/lib/layout/ShellContext";
import SettingsPage from "./page";

// The cards fetch their own data and are tested on their own; this file
// covers only what the page adds — the section menu and its layout.
vi.mock("@/components/settings/ProfileCard", () => ({ ProfileCard: () => <p>profile card</p> }));
vi.mock("@/components/settings/AppearanceCard", () => ({ AppearanceCard: () => <p>appearance card</p> }));
vi.mock("@/components/settings/NotificationsCard", () => ({ NotificationsCard: () => <p>notifications card</p> }));
vi.mock("@/components/settings/PushNotificationsCard", () => ({ PushNotificationsCard: () => null }));
vi.mock("@/components/settings/MailCredentialCard", () => ({ MailCredentialCard: () => null }));
vi.mock("@/components/settings/SecurityTab", () => ({ SecurityTab: () => <p>security tab</p> }));
vi.mock("@/components/settings/DangerZoneCard", () => ({ DangerZoneCard: () => <p>danger zone card</p> }));

beforeAll(() => {
  // jsdom implements neither.
  Element.prototype.scrollIntoView = vi.fn();
});

function renderPage() {
  return render(
    <ShellProvider>
      <SettingsPage />
    </ShellProvider>,
  );
}

describe("Settings page (admin)", () => {
  it("lists every section in a menu, Profile current first", () => {
    renderPage();

    const nav = screen.getByRole("navigation", { name: "Settings sections" });
    const links = Array.from(nav.querySelectorAll("a")).map((a) => a.textContent);
    expect(links).toEqual(["Profile", "Appearance", "Notifications", "Security", "Danger zone"]);
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("aria-current", "true");
  });

  it("gives every menu entry a section to land on", () => {
    const { container } = renderPage();

    for (const id of ["profile", "appearance", "notifications", "security", "danger-zone"]) {
      expect(container.querySelector(`section#${id}`)).not.toBeNull();
    }
  });

  it("scrolls to a section and marks it current, without unmounting the others", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("link", { name: "Appearance" }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Appearance" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Profile" })).not.toHaveAttribute("aria-current");
    // Every section stays rendered — an unsaved edit elsewhere survives.
    expect(screen.getByText("profile card")).toBeInTheDocument();
    expect(screen.getByText("danger zone card")).toBeInTheDocument();
  });

  it("re-opens a collapsed Security section when you jump to it", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /security/i }));
    expect(screen.queryByText("security tab")).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Security" }));
    expect(screen.getByText("security tab")).toBeInTheDocument();
  });
});
