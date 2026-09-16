import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { revokeSession } = vi.hoisted(() => ({ revokeSession: vi.fn() }));

vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, revokeSession };
});

import { NewSignInModal } from "./NewSignInModal";
import type { SessionSummary } from "@/lib/auth/api";

const SESSION: SessionSummary = {
  id: "session-unknown",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
  ipAddress: "203.0.113.4",
  issuedAt: "2026-09-16T08:00:00Z",
  expiresAt: "2026-09-17T08:00:00Z",
  device: "Firefox on Windows",
  newDevice: true,
  current: false,
};

/**
 * The dialog behind a new-device alert (ADR-027).
 *
 * <p>What is worth pinning is that it answers the question it raises. An alert
 * that says something happened and then makes the reader go and find the
 * Settings page is the kind people learn to dismiss.
 */
describe("NewSignInModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows what was signed in from, where, and when", async () => {
    render(<NewSignInModal session={SESSION} onClose={vi.fn()} onEnded={vi.fn()} />);

    // All three, because any one alone leaves the reader unable to answer
    // "was that me": the device without the time, or the time without the
    // address, is half an answer.
    expect(screen.getByText("Firefox on Windows")).toBeInTheDocument();
    expect(screen.getByText("203.0.113.4")).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("ends the session, and only then tells the caller", async () => {
    const onEnded = vi.fn();
    const onClose = vi.fn();
    revokeSession.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<NewSignInModal session={SESSION} onClose={onClose} onEnded={onEnded} />);

    await user.click(screen.getByRole("button", { name: "End this session" }));

    await waitFor(() => expect(revokeSession).toHaveBeenCalledWith("session-unknown"));
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open and says so when the server refuses", async () => {
    revokeSession.mockRejectedValue(new Error("Couldn't end that session."));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<NewSignInModal session={SESSION} onClose={onClose} onEnded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "End this session" }));

    // Closing on a failed revoke would tell somebody their account is secure
    // when the other session is still live — the one lie this dialog must not
    // tell.
    expect(await screen.findByText(/end that session/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "End this session" })).toBeInTheDocument();
  });

  it("closes without touching the session when it was you", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<NewSignInModal session={SESSION} onClose={onClose} onEnded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "This was me" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(revokeSession).not.toHaveBeenCalled();
  });
});
