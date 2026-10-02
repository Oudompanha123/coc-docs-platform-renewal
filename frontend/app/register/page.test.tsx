import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, EmailAlreadyRegisteredError } from "@/lib/auth/api";
import RegisterPage from "./page";

const { register, resendRegistrationCode, verifyRegistrationCode } = vi.hoisted(() => ({
  register: vi.fn(),
  resendRegistrationCode: vi.fn(),
  verifyRegistrationCode: vi.fn(),
}));

vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, register, resendRegistrationCode, verifyRegistrationCode };
});

/**
 * ADR-021: registration is now three steps (submit, confirm the emailed
 * code, done) and no longer collects a phone number at all.
 */
describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function fillAndSubmitForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("Full Name"), "New Person");
    await user.type(screen.getByLabelText("Email"), "new.person@example.com");
    await user.type(screen.getByLabelText("Password"), "Hunter2222!x");
    await user.type(screen.getByLabelText("Confirm Password"), "Hunter2222!x");
    await user.click(screen.getByLabelText(/I agree to the/));
    await user.click(screen.getByRole("button", { name: "Continue" }));
  }

  it("never asks for a phone number", () => {
    render(<RegisterPage />);
    expect(screen.queryByLabelText("Phone Number")).not.toBeInTheDocument();
  });

  it("shows the step indicator with step 1 current on the form screen", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Account")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Verify")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Confirm")).not.toHaveAttribute("aria-current");
  });

  it("shows validation errors and never calls the API for empty fields", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Enter your full name.")).toBeInTheDocument();
    expect(screen.getByText("Enter your email.")).toBeInTheDocument();
    expect(screen.getByText("Create a password.")).toBeInTheDocument();
    expect(screen.getByText("You must agree to the Terms of Service and Privacy Policy.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords without calling the API", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Full Name"), "New Person");
    await user.type(screen.getByLabelText("Email"), "new.person@example.com");
    await user.type(screen.getByLabelText("Password"), "Hunter2222!x");
    await user.type(screen.getByLabelText("Confirm Password"), "SomethingElse1!");
    await user.click(screen.getByLabelText(/I agree to the/));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("starts a challenge and moves to the code step, not straight to an account", async () => {
    register.mockResolvedValue({
      message: "We've sent a 6-digit verification code to new.person@example.com. It expires in 10 minutes.",
      expiresInSeconds: 600,
    });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillAndSubmitForm(user);

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        email: "new.person@example.com",
        displayName: "New Person",
        password: "Hunter2222!x",
      }),
    );
    expect(await screen.findByRole("heading", { name: "Verify Your Email" })).toBeInTheDocument();
    expect(screen.getByText("new.person@example.com")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toHaveAttribute("aria-current", "step");
  });

  it("points at the email field for an already-registered address, and stays on the form", async () => {
    register.mockRejectedValue(new EmailAlreadyRegisteredError("This email is already registered."));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillAndSubmitForm(user);

    expect(await screen.findByText("This email is already registered.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Verify Your Email" })).not.toBeInTheDocument();
  });

  it("shows a generic failure banner and stays on the form for any other error", async () => {
    register.mockRejectedValue(new AuthApiError("Couldn't reach the server. Check your connection and try again."));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillAndSubmitForm(user);

    expect(await screen.findByText("Couldn't reach the server. Check your connection and try again.")).toBeInTheDocument();
  });

  describe("the code step", () => {
    async function reachCodeStep(user: ReturnType<typeof userEvent.setup>) {
      register.mockResolvedValue({ message: "sent", expiresInSeconds: 600 });
      render(<RegisterPage />);
      await fillAndSubmitForm(user);
      await screen.findByRole("heading", { name: "Verify Your Email" });
    }

    it("confirms the code and shows the pending-approval message", async () => {
      const user = userEvent.setup();
      await reachCodeStep(user);
      verifyRegistrationCode.mockResolvedValue({
        status: "PENDING",
        message:
          "Your email is verified and your registration has been received. An administrator has to approve it before you can sign in.",
      });

      await user.type(screen.getByLabelText("Verification Code"), "123456");
      await user.click(screen.getByRole("button", { name: "Verify Email" }));

      await waitFor(() =>
        expect(verifyRegistrationCode).toHaveBeenCalledWith("new.person@example.com", "123456"),
      );
      expect(await screen.findByRole("heading", { name: "Registration Received" })).toBeInTheDocument();
      expect(
        screen.getByText(
          "Your email is verified and your registration has been received. An administrator has to approve it before you can sign in.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Confirm")).toHaveAttribute("aria-current", "step");
    });

    it("reports an incorrect code plainly and stays on the code step", async () => {
      const user = userEvent.setup();
      await reachCodeStep(user);
      verifyRegistrationCode.mockRejectedValue(new AuthApiError("That code is incorrect. Please try again."));

      await user.type(screen.getByLabelText("Verification Code"), "000000");
      await user.click(screen.getByRole("button", { name: "Verify Email" }));

      expect(await screen.findByText("That code is incorrect. Please try again.")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Verify Your Email" })).toBeInTheDocument();
    });

    it("disables resend during the cooldown, then allows it once elapsed", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup();
      await reachCodeStep(user);

      expect(screen.getByRole("button", { name: "Resend in 60s" })).toBeDisabled();

      resendRegistrationCode.mockResolvedValue({ message: "sent again", expiresInSeconds: 600 });
      await vi.advanceTimersByTimeAsync(60_000);

      const resendButton = await screen.findByRole("button", { name: "Resend code" });
      expect(resendButton).toBeEnabled();
      await user.click(resendButton);

      await waitFor(() => expect(resendRegistrationCode).toHaveBeenCalledWith("new.person@example.com"));
      vi.useRealTimers();
    });

    it("goes back to the form on 'Wrong email?', keeping what was typed", async () => {
      const user = userEvent.setup();
      await reachCodeStep(user);

      await user.click(screen.getByRole("button", { name: /Wrong email\? Go back/ }));

      expect(await screen.findByRole("heading", { name: "Register" })).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toHaveValue("new.person@example.com");
    });
  });
});
