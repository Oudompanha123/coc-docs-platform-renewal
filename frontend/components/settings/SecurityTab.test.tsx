import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@/lib/auth/api";
import { SecurityTab } from "./SecurityTab";
import type { SessionSummary } from "@/lib/auth/api";

/**
 * The sessions list is the one screen that can end a credential, so the two
 * things worth pinning are that it reflects the server rather than itself, and
 * that it does not offer to sign you out of the session you are using.
 */

const { listSessions, revokeSession, changePassword, getMfaStatus, startMfaSetup, verifyMfaSetup, disableMfa } =
  vi.hoisted(() => ({
    listSessions: vi.fn(),
    revokeSession: vi.fn(),
    changePassword: vi.fn(),
    getMfaStatus: vi.fn(),
    startMfaSetup: vi.fn(),
    verifyMfaSetup: vi.fn(),
    disableMfa: vi.fn(),
  }));
vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return {
    ...actual,
    listSessions,
    revokeSession,
    changePassword,
    getMfaStatus,
    startMfaSetup,
    verifyMfaSetup,
    disableMfa,
  };
});

/**
 * A password-holding account by default — SecurityTab needs `hasPassword`
 * (ADR-030) to decide what the password section offers, which means it
 * needs a session, unlike before this existed.
 */
const { sessionUser } = vi.hoisted(() => ({
  sessionUser: { hasPassword: true },
}));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({
    status: "authenticated",
    user: sessionUser,
    signOut: vi.fn(),
    refresh: vi.fn(),
  }),
}));

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

// Applies to every test in this file, before each describe block's own
// beforeEach: without a default, an unmocked getMfaStatus() returns
// undefined, and SecurityTab's mount effect throws calling .then on it.
// The two-factor describe block below overrides this per test as needed.
beforeEach(() => {
  getMfaStatus.mockResolvedValue(false);
});

describe("SecurityTab sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionUser.hasPassword = true;
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
 * lives in ChangePasswordForm.test.tsx). Covers the common case,
 * `hasPassword: true`; the Google-only case (ADR-030) is its own block
 * below.
 */
describe("SecurityTab password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSessions.mockResolvedValue([]);
    sessionUser.hasPassword = true;
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

/** ADR-030: a Google-only account (no password_hash) sets one for the first time here. */
describe("SecurityTab password — Google-only account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSessions.mockResolvedValue([]);
    sessionUser.hasPassword = false;
  });

  it("offers 'Set password' rather than 'Change password'", async () => {
    render(<SecurityTab />);

    expect(await screen.findByRole("button", { name: "Set password" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change password" })).not.toBeInTheDocument();
  });

  it("submits with no currentPassword and shows the 'set' confirmation", async () => {
    changePassword.mockResolvedValue(
      "Your password has been set. You can now also sign in with your email and password.",
    );
    const user = userEvent.setup();
    render(<SecurityTab />);

    await user.click(await screen.findByRole("button", { name: "Set password" }));
    expect(screen.queryByLabelText("Current Password")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("New Password"), "NewPassword456!");
    await user.type(screen.getByLabelText("Confirm New Password"), "NewPassword456!");
    await user.click(screen.getByRole("button", { name: "Save password" }));

    expect(changePassword).toHaveBeenCalledWith("NewPassword456!", "NewPassword456!", undefined);
    expect(await screen.findByText(
      "Your password has been set. You can now also sign in with your email and password.",
    )).toBeInTheDocument();
  });
});

/**
 * ADR-031, revised: the toggle used to be local-state mock only, then a real
 * switch; it's a chevron disclosure now (matching the outer Security
 * accordion's own header), so "on/off" and "expanded/collapsed" are two
 * separate signals — the "On" pill (styled after the Authentication row's
 * "Connected" pill) is what these pin for server state, `aria-expanded` for
 * whether the setup/disable form is showing.
 */
describe("SecurityTab two-factor authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSessions.mockResolvedValue([]);
    sessionUser.hasPassword = true;
  });

  function disclosure() {
    return screen.getByRole("button", { name: "Two-factor authentication" });
  }

  it("reflects the server's enabled state on load", async () => {
    getMfaStatus.mockResolvedValue(true);

    render(<SecurityTab />);

    expect(await screen.findByText("On")).toBeInTheDocument();
    expect(disclosure()).toHaveAttribute("aria-expanded", "false");
  });

  it("is disabled with an explanation for a Google-only account (revision of ADR-031)", async () => {
    sessionUser.hasPassword = false;
    getMfaStatus.mockResolvedValue(false);

    render(<SecurityTab />);

    // A function matcher, not a plain regex: the copy bolds "password" and
    // "password sign-in", so the sentence is split across several elements and
    // no single text node holds it. This asserts on what the reader sees.
    expect(
      await screen.findByText(
        (_content, element) =>
          element?.tagName === "P" &&
          (element.textContent ?? "").includes("Set a password first to turn this on"),
      ),
    ).toBeInTheDocument();
    expect(disclosure()).toBeDisabled();
    await userEvent.click(disclosure());
    expect(startMfaSetup).not.toHaveBeenCalled();
  });

  it("starts the setup wizard on click, showing the QR code and manual secret", async () => {
    getMfaStatus.mockResolvedValue(false);
    startMfaSetup.mockResolvedValue({
      secret: "JBSWY3DPEHPK3PXP",
      qrCodeDataUri: "data:image/png;base64,zzzz",
      issuer: "Coc Docs Platform",
      accountLabel: "person@example.com",
    });
    const user = userEvent.setup();
    render(<SecurityTab />);

    await user.click(await screen.findByRole("button", { name: "Two-factor authentication" }));

    expect(await screen.findByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();
    expect(screen.getByAltText("Scan this QR code with your authenticator app")).toHaveAttribute(
      "src",
      "data:image/png;base64,zzzz",
    );
    expect(startMfaSetup).toHaveBeenCalledTimes(1);
    expect(disclosure()).toHaveAttribute("aria-expanded", "true");
  });

  it("clicking again while open collapses it without submitting anything", async () => {
    getMfaStatus.mockResolvedValue(false);
    startMfaSetup.mockResolvedValue({
      secret: "JBSWY3DPEHPK3PXP",
      qrCodeDataUri: "data:image/png;base64,zzzz",
      issuer: "Coc Docs Platform",
      accountLabel: "person@example.com",
    });
    const user = userEvent.setup();
    render(<SecurityTab />);

    await user.click(await screen.findByRole("button", { name: "Two-factor authentication" }));
    expect(await screen.findByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();

    await user.click(disclosure());

    expect(screen.queryByText("JBSWY3DPEHPK3PXP")).not.toBeInTheDocument();
    expect(disclosure()).toHaveAttribute("aria-expanded", "false");
    expect(verifyMfaSetup).not.toHaveBeenCalled();
  });

  it("a wrong code shows an error and leaves it off", async () => {
    getMfaStatus.mockResolvedValue(false);
    startMfaSetup.mockResolvedValue({
      secret: "JBSWY3DPEHPK3PXP",
      qrCodeDataUri: "data:image/png;base64,zzzz",
      issuer: "Coc Docs Platform",
      accountLabel: "person@example.com",
    });
    verifyMfaSetup.mockRejectedValue(new AuthApiError("That code is incorrect. Please try again."));
    const user = userEvent.setup();
    render(<SecurityTab />);
    await user.click(await screen.findByRole("button", { name: "Two-factor authentication" }));

    await user.type(await screen.findByLabelText("Verification Code"), "000000");
    await user.click(screen.getByRole("button", { name: "Verify & turn on" }));

    expect(await screen.findByText("That code is incorrect. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText("On")).not.toBeInTheDocument();
  });

  it("a correct code shows success and flips it on", async () => {
    getMfaStatus.mockResolvedValue(false);
    startMfaSetup.mockResolvedValue({
      secret: "JBSWY3DPEHPK3PXP",
      qrCodeDataUri: "data:image/png;base64,zzzz",
      issuer: "Coc Docs Platform",
      accountLabel: "person@example.com",
    });
    verifyMfaSetup.mockResolvedValue("Two-factor authentication is now on for your account.");
    const user = userEvent.setup();
    render(<SecurityTab />);
    await user.click(await screen.findByRole("button", { name: "Two-factor authentication" }));

    await user.type(await screen.findByLabelText("Verification Code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify & turn on" }));

    expect(await screen.findByText("Two-factor authentication is now on for your account.")).toBeInTheDocument();
    expect(await screen.findByText("On")).toBeInTheDocument();
    expect(screen.queryByLabelText("Verification Code")).not.toBeInTheDocument();
    // Success collapses the row back, the same as Cancel would.
    expect(disclosure()).toHaveAttribute("aria-expanded", "false");
  });

  it("toggling off an enabled account asks for the current password first", async () => {
    getMfaStatus.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<SecurityTab />);

    await user.click(await screen.findByRole("button", { name: "Two-factor authentication" }));

    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(disableMfa).not.toHaveBeenCalled();
  });

  it("a wrong password leaves it enabled", async () => {
    getMfaStatus.mockResolvedValue(true);
    disableMfa.mockRejectedValue(new AuthApiError("your current password is incorrect"));
    const user = userEvent.setup();
    render(<SecurityTab />);
    await user.click(await screen.findByRole("button", { name: "Two-factor authentication" }));

    await user.type(screen.getByLabelText("Current Password"), "WrongPassword!");
    await user.click(screen.getByRole("button", { name: "Turn off" }));

    expect(await screen.findByText("your current password is incorrect")).toBeInTheDocument();
    expect(screen.getByText("On")).toBeInTheDocument();
  });

  it("the correct password turns it off", async () => {
    getMfaStatus.mockResolvedValue(true);
    disableMfa.mockResolvedValue("Two-factor authentication has been turned off.");
    const user = userEvent.setup();
    render(<SecurityTab />);
    await user.click(await screen.findByRole("button", { name: "Two-factor authentication" }));

    await user.type(screen.getByLabelText("Current Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Turn off" }));

    expect(await screen.findByText("Two-factor authentication has been turned off.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("On")).not.toBeInTheDocument());
    expect(disableMfa).toHaveBeenCalledWith("Password123!");
  });
});
