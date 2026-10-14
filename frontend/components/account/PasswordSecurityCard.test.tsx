import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@/lib/auth/api";
import { PasswordSecurityCard } from "./PasswordSecurityCard";

/**
 * Password and two-factor authentication on /account/settings#account —
 * the same controls, and the same tests, as the admin /settings SecurityTab.
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
 * A password-holding account by default — the card needs `hasPassword`
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

// Applies to every test in this file, before each describe block's own
// beforeEach: without a default, an unmocked getMfaStatus() returns
// undefined, and the card's mount effect throws calling .then on it.
// The two-factor describe block below overrides this per test as needed.
beforeEach(() => {
  getMfaStatus.mockResolvedValue(false);
});

/**
 * The "Change password" button here was dead until ADR-022 — these pin that
 * it now does something, rather than re-testing ChangePasswordForm's own validation (that
 * lives in ChangePasswordForm.test.tsx). Covers the common case,
 * `hasPassword: true`; the Google-only case (ADR-030) is its own block
 * below.
 */
describe("PasswordSecurityCard password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSessions.mockResolvedValue([]);
    sessionUser.hasPassword = true;
  });

  it("reveals the change-password form on click, and hides the button meanwhile", async () => {
    const user = userEvent.setup();
    render(<PasswordSecurityCard />);

    await user.click(await screen.findByRole("button", { name: "Change password" }));

    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change password" })).not.toBeInTheDocument();
  });

  it("shows the server's confirmation and collapses the form back on success", async () => {
    changePassword.mockResolvedValue("Your password has been changed.");
    const user = userEvent.setup();
    render(<PasswordSecurityCard />);

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
    render(<PasswordSecurityCard />);

    await user.click(await screen.findByRole("button", { name: "Change password" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByLabelText("Current Password")).not.toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });
});

/** ADR-030: a Google-only account (no password_hash) sets one for the first time here. */
describe("PasswordSecurityCard password — Google-only account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSessions.mockResolvedValue([]);
    sessionUser.hasPassword = false;
  });

  it("offers 'Set password' rather than 'Change password'", async () => {
    render(<PasswordSecurityCard />);

    expect(await screen.findByRole("button", { name: "Set password" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change password" })).not.toBeInTheDocument();
  });

  it("submits with no currentPassword and shows the 'set' confirmation", async () => {
    changePassword.mockResolvedValue(
      "Your password has been set. You can now also sign in with your email and password.",
    );
    const user = userEvent.setup();
    render(<PasswordSecurityCard />);

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
describe("PasswordSecurityCard two-factor authentication", () => {
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

    render(<PasswordSecurityCard />);

    expect(await screen.findByText("On")).toBeInTheDocument();
    expect(disclosure()).toHaveAttribute("aria-expanded", "false");
  });

  it("is disabled with an explanation for a Google-only account (revision of ADR-031)", async () => {
    sessionUser.hasPassword = false;
    getMfaStatus.mockResolvedValue(false);

    render(<PasswordSecurityCard />);

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
    render(<PasswordSecurityCard />);

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
    render(<PasswordSecurityCard />);

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
    render(<PasswordSecurityCard />);
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
    render(<PasswordSecurityCard />);
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
    render(<PasswordSecurityCard />);

    await user.click(await screen.findByRole("button", { name: "Two-factor authentication" }));

    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(disableMfa).not.toHaveBeenCalled();
  });

  it("a wrong password leaves it enabled", async () => {
    getMfaStatus.mockResolvedValue(true);
    disableMfa.mockRejectedValue(new AuthApiError("your current password is incorrect"));
    const user = userEvent.setup();
    render(<PasswordSecurityCard />);
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
    render(<PasswordSecurityCard />);
    await user.click(await screen.findByRole("button", { name: "Two-factor authentication" }));

    await user.type(screen.getByLabelText("Current Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Turn off" }));

    expect(await screen.findByText("Two-factor authentication has been turned off.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("On")).not.toBeInTheDocument());
    expect(disableMfa).toHaveBeenCalledWith("Password123!");
  });
});
