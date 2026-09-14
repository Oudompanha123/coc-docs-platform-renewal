import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@/lib/auth/api";
import ForgotPasswordPage from "./page";

const { forgotPassword } = vi.hoisted(() => ({
  forgotPassword: vi.fn(),
}));

vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, forgotPassword };
});

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a validation error and never calls the API for a blank email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(await screen.findByText("Enter your email.")).toBeInTheDocument();
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("shows a validation error for a malformed email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("shows the backend's generic message on success, whatever the address", async () => {
    forgotPassword.mockResolvedValue("If that email is registered, we've sent password reset instructions.");
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Email"), "anyone@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => expect(forgotPassword).toHaveBeenCalledWith("anyone@example.com"));
    expect(
      await screen.findByText("If that email is registered, we've sent password reset instructions."),
    ).toBeInTheDocument();
  });

  it("shows the failure message when the request itself fails", async () => {
    forgotPassword.mockRejectedValue(
      new AuthApiError("Couldn't reach the server. Check your connection and try again."),
    );
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Email"), "anyone@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(
      await screen.findByText("Couldn't reach the server. Check your connection and try again."),
    ).toBeInTheDocument();
  });

  it("shows 'No account found' for an unregistered address, and lets the caller retry (ADR-019)", async () => {
    forgotPassword.mockRejectedValue(new AuthApiError("No account found with this email address."));
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Email"), "nobody@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(await screen.findByText("No account found with this email address.")).toBeInTheDocument();
    // Unlike a real success, this must not lock the form — the caller
    // presumably mistyped the address and should be able to fix it.
    expect(screen.getByRole("button", { name: "Send Reset Link" })).toBeEnabled();
  });
});
