import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@/lib/auth/api";
import ResetPasswordPage from "./page";

const { resetPassword, push } = vi.hoisted(() => ({
  resetPassword: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, resetPassword };
});

// tokenFromUrl is set per test before rendering, so each test controls what
// the page reads back from the URL without a real router in play.
let tokenFromUrl: string | null = "good-token";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(tokenFromUrl ? `token=${tokenFromUrl}` : ""),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenFromUrl = "good-token";
  });

  it("shows a missing-token notice and disables the form when the URL carries no token", async () => {
    tokenFromUrl = null;
    render(<ResetPasswordPage />);

    expect(await screen.findByText(/This reset link is missing its token/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Password" })).toBeDisabled();
  });

  it("shows validation errors and never calls the API for empty fields", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(await screen.findByText("Create a new password.")).toBeInTheDocument();
    expect(screen.getByText("Confirm your new password.")).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords without calling the API", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText("New Password"), "NewPassword456!");
    await user.type(screen.getByLabelText("Confirm New Password"), "SomethingElse!");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("resets the password with the token from the URL and redirects to /login", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    resetPassword.mockResolvedValue("Your password has been reset. You can now log in.");
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText("New Password"), "NewPassword456!");
    await user.type(screen.getByLabelText("Confirm New Password"), "NewPassword456!");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith("good-token", "NewPassword456!"));
    expect(await screen.findByText("Your password has been reset. You can now log in.")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1500);
    expect(push).toHaveBeenCalledWith("/login");

    vi.useRealTimers();
  });

  it("reports an invalid or expired token plainly, without redirecting", async () => {
    resetPassword.mockRejectedValue(new AuthApiError("This reset link is invalid or has expired. Request a new one."));
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText("New Password"), "NewPassword456!");
    await user.type(screen.getByLabelText("Confirm New Password"), "NewPassword456!");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(
      await screen.findByText("This reset link is invalid or has expired. Request a new one."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
