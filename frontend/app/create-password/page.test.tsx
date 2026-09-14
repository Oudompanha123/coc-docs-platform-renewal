import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@/lib/auth/api";
import CreatePasswordPage from "./page";

const { me, changePassword, push, replace } = vi.hoisted(() => ({
  me: vi.fn(),
  changePassword: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, me, changePassword };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

function pendingAccount() {
  return {
    id: "1",
    email: "invited@example.com",
    displayName: "Invited Person",
    role: "USER",
    createdAt: "2026-09-01T00:00:00Z",
    lastSignInAt: null,
    avatarUrl: null,
    authenticated: true,
    mustChangePassword: true,
  };
}

describe("CreatePasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends an anonymous visitor to /login without rendering the form", async () => {
    me.mockResolvedValue({
      id: null,
      email: null,
      displayName: null,
      role: null,
      createdAt: null,
      lastSignInAt: null,
      avatarUrl: null,
      authenticated: false,
      mustChangePassword: false,
    });

    render(<CreatePasswordPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Create New Password")).not.toBeInTheDocument();
  });

  it("sends a caller who already changed their password on to /overview", async () => {
    me.mockResolvedValue({ ...pendingAccount(), mustChangePassword: false });

    render(<CreatePasswordPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/overview"));
    expect(screen.queryByText("Create New Password")).not.toBeInTheDocument();
  });

  it("renders the form for a caller still on a temporary password", async () => {
    me.mockResolvedValue(pendingAccount());

    render(<CreatePasswordPage />);

    expect(await screen.findByRole("heading", { name: "Create New Password" })).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows validation errors and never calls the API for empty fields", async () => {
    me.mockResolvedValue(pendingAccount());
    const user = userEvent.setup();
    render(<CreatePasswordPage />);
    await screen.findByRole("heading", { name: "Create New Password" });

    await user.click(screen.getByRole("button", { name: "Create Password" }));

    expect(await screen.findByText("Create a new password.")).toBeInTheDocument();
    expect(screen.getByText("Confirm your new password.")).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords without calling the API", async () => {
    me.mockResolvedValue(pendingAccount());
    const user = userEvent.setup();
    render(<CreatePasswordPage />);
    await screen.findByRole("heading", { name: "Create New Password" });

    await user.type(screen.getByLabelText("New Password"), "NewPassword456!");
    await user.type(screen.getByLabelText("Confirm Password"), "SomethingElse!");
    await user.click(screen.getByRole("button", { name: "Create Password" }));

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("creates the password, confirms, and redirects to /overview", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    me.mockResolvedValue(pendingAccount());
    changePassword.mockResolvedValue("Password created successfully. You can now access your account.");
    const user = userEvent.setup();
    render(<CreatePasswordPage />);
    await screen.findByRole("heading", { name: "Create New Password" });

    await user.type(screen.getByLabelText("New Password"), "NewPassword456!");
    await user.type(screen.getByLabelText("Confirm Password"), "NewPassword456!");
    await user.click(screen.getByRole("button", { name: "Create Password" }));

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith("NewPassword456!", "NewPassword456!"));
    expect(
      await screen.findByText("Password created successfully. You can now access your account."),
    ).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1200);
    expect(push).toHaveBeenCalledWith("/overview");

    vi.useRealTimers();
  });

  it("reports the server's refusal plainly, e.g. reusing the temporary password", async () => {
    me.mockResolvedValue(pendingAccount());
    changePassword.mockRejectedValue(
      new AuthApiError("choose a password different from your current one"),
    );
    const user = userEvent.setup();
    render(<CreatePasswordPage />);
    await screen.findByRole("heading", { name: "Create New Password" });

    await user.type(screen.getByLabelText("New Password"), "TempPassword123!");
    await user.type(screen.getByLabelText("Confirm Password"), "TempPassword123!");
    await user.click(screen.getByRole("button", { name: "Create Password" }));

    expect(await screen.findByText("choose a password different from your current one")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
