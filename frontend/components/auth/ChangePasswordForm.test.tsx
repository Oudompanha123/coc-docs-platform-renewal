import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@/lib/auth/api";
import { ChangePasswordForm } from "./ChangePasswordForm";

const { changePassword } = vi.hoisted(() => ({ changePassword: vi.fn() }));

vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, changePassword };
});

/**
 * The voluntary change-password form (ADR-022), shared by ProfileModal and
 * SecurityTab — tested once here rather than duplicated in both call sites.
 */
describe("ChangePasswordForm", () => {
  const onSuccess = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, overrides?: Partial<Record<"current" | "new" | "confirm", string>>) {
    await user.type(screen.getByLabelText("Current Password"), overrides?.current ?? "OldPassword123!");
    await user.type(screen.getByLabelText("New Password"), overrides?.new ?? "NewPassword456!");
    await user.type(screen.getByLabelText("Confirm New Password"), overrides?.confirm ?? "NewPassword456!");
    await user.click(screen.getByRole("button", { name: "Save password" }));
  }

  it("requires all three fields and never calls the API for an empty form", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm onSuccess={onSuccess} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByText("Enter your current password.")).toBeInTheDocument();
    expect(screen.getByText("Create a new password.")).toBeInTheDocument();
    expect(screen.getByText("Confirm your new password.")).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("rejects a new password under 8 characters without calling the API", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm onSuccess={onSuccess} onCancel={onCancel} />);

    await fillAndSubmit(user, { new: "short", confirm: "short" });

    expect(await screen.findByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("rejects a mismatched confirmation without calling the API", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm onSuccess={onSuccess} onCancel={onCancel} />);

    await fillAndSubmit(user, { confirm: "SomethingElse456!" });

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("submits current, new, and confirm to the API and reports success", async () => {
    changePassword.mockResolvedValue("Your password has been changed.");
    const user = userEvent.setup();
    render(<ChangePasswordForm onSuccess={onSuccess} onCancel={onCancel} />);

    await fillAndSubmit(user);

    expect(changePassword).toHaveBeenCalledWith("NewPassword456!", "NewPassword456!", "OldPassword123!");
    expect(onSuccess).toHaveBeenCalledWith("Your password has been changed.");
  });

  it("shows the backend's own message plainly on rejection, e.g. an incorrect current password", async () => {
    changePassword.mockRejectedValue(new AuthApiError("your current password is incorrect"));
    const user = userEvent.setup();
    render(<ChangePasswordForm onSuccess={onSuccess} onCancel={onCancel} />);

    await fillAndSubmit(user);

    expect(await screen.findByText("your current password is incorrect")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("cancel calls onCancel without touching the API", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm onSuccess={onSuccess} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
    expect(changePassword).not.toHaveBeenCalled();
  });
});
