import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecurityTab } from "./SecurityTab";

/**
 * The sessions list is the one screen that can end a credential, so the two
 * things worth pinning are that it reflects the server rather than itself, and
 * that it does not offer to sign you out of the session you are using.
 */

const { listSessions, revokeSession } = vi.hoisted(() => ({
  listSessions: vi.fn(),
  revokeSession: vi.fn(),
}));
vi.mock("@/lib/auth/api", () => ({ listSessions, revokeSession }));

const CURRENT = {
  id: "session-current",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  ipAddress: "192.168.1.10",
  issuedAt: "2026-09-14T08:00:00Z",
  expiresAt: "2026-09-15T08:00:00Z",
  current: true,
};

const OTHER = {
  id: "session-phone",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Safari/604.1",
  ipAddress: "10.0.0.4",
  issuedAt: "2026-09-13T19:30:00Z",
  expiresAt: "2026-09-14T19:30:00Z",
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
