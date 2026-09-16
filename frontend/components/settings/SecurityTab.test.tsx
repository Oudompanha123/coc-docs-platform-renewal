import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecurityTab } from "./SecurityTab";
import type { SessionSummary } from "@/lib/auth/api";

/**
 * The sessions list is the one screen that can end a credential, so the two
 * things worth pinning are that it reflects the server rather than itself, and
 * that it does not offer to sign you out of the session you are using.
 */

const { listSessions, revokeSession, changePassword } = vi.hoisted(() => ({
  listSessions: vi.fn(),
  revokeSession: vi.fn(),
  changePassword: vi.fn(),
}));
vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, listSessions, revokeSession, changePassword };
});


// `device` is what the server sends and what the row renders; the user agent
// it was derived from is kept because the response still carries it, and a
// fixture that quietly drops a field stops being a fixture for the real thing.
// The rules that turn one into the other live in DeviceDescriptionTest.java.
const CURRENT: SessionSummary = {
  id: "session-current",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  ipAddress: "192.168.1.10",
  issuedAt: "2026-09-14T08:00:00Z",
  expiresAt: "2026-09-15T08:00:00Z",
  device: "Chrome on Windows",
  newDevice: false,
  current: true,
};

const OTHER: SessionSummary = {
  id: "session-phone",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Safari/604.1",
  ipAddress: "10.0.0.4",
  issuedAt: "2026-09-13T19:30:00Z",
  expiresAt: "2026-09-14T19:30:00Z",
  device: "Safari on iOS",
  newDevice: false,
  current: false,
};

describe("SecurityTab sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("names each device from its user agent", async () => {
    listSessions.mockResolvedValue([CURRENT, OTHER]);

    render(<SecurityTab />);

    expect(await screen.findByText(/Chrome on Windows/)).toBeInTheDocument();
    expect(screen.getByText(/Safari on iOS/)).toBeInTheDocument();
  });

  it("marks the session making the request and offers no way to end it", async () => {
    listSessions.mockResolvedValue([CURRENT, OTHER]);

    render(<SecurityTab />);

    expect(await screen.findByText("This device")).toBeInTheDocument();
    // One button, for the other device. Ending the current session from here
    // would look like a bug to someone who meant to sign out a lost phone.
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Sign out" })).toHaveLength(1),
    );
  });

  it("removes a session only after the server confirms it", async () => {
    listSessions.mockResolvedValue([CURRENT, OTHER]);
    revokeSession.mockResolvedValue(undefined);

    render(<SecurityTab />);
    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(revokeSession).toHaveBeenCalledWith("session-phone"));
    await waitFor(() => expect(screen.queryByText(/Safari on iOS/)).not.toBeInTheDocument());
  });

  it("keeps the row and explains when revoking fails", async () => {
    listSessions.mockResolvedValue([CURRENT, OTHER]);
    revokeSession.mockRejectedValue(new Error("Couldn't end that session."));

    render(<SecurityTab />);
    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    // Still there: the server did not revoke it, so showing it gone would be
    // a lie the person only discovers on that device.
    expect(await screen.findByText("Couldn't end that session.")).toBeInTheDocument();
    expect(screen.getByText(/Safari on iOS/)).toBeInTheDocument();
  });

  it("says so when the list cannot be loaded", async () => {
    listSessions.mockRejectedValue(new Error("Couldn't load your sessions."));

    render(<SecurityTab />);

    expect(await screen.findByText("Couldn't load your sessions.")).toBeInTheDocument();
  });
});

/**
 * The "Change password" button here was dead until ADR-022 — these pin that
 * it now does something, sharing coverage style with the sessions tests
 * above rather than re-testing ChangePasswordForm's own validation (that
 * lives in ChangePasswordForm.test.tsx).
 */
describe("SecurityTab password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSessions.mockResolvedValue([]);
  });

  it("reveals the change-password form on click, and hides the button meanwhile", async () => {
    const user = userEvent.setup();
    render(<SecurityTab />);

    await user.click(await screen.findByRole("button", { name: "Change password" }));

    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change password" })).not.toBeInTheDocument();
  });

  it("shows the server's confirmation and collapses the form back on success", async () => {
    changePassword.mockResolvedValue("Your password has been changed.");
    const user = userEvent.setup();
    render(<SecurityTab />);

    await user.click(await screen.findByRole("button", { name: "Change password" }));
    await user.type(screen.getByLabelText("Current Password"), "OldPassword123!");
    await user.type(screen.getByLabelText("New Password"), "NewPassword456!");
    await user.type(screen.getByLabelText("Confirm New Password"), "NewPassword456!");
    await user.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByText("Your password has been changed.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Current Password")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password" })).toBeInTheDocument();
  });

  it("cancel hides the form without submitting", async () => {
    const user = userEvent.setup();
    render(<SecurityTab />);

    await user.click(await screen.findByRole("button", { name: "Change password" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByLabelText("Current Password")).not.toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });
});
