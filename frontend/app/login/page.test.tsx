import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

const { loginWithPassword, loginWithIdToken, requestNonce, signInWithGoogleViaKeycloak, push } = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
  loginWithIdToken: vi.fn(),
  requestNonce: vi.fn(),
  signInWithGoogleViaKeycloak: vi.fn(),
  push: vi.fn(),
}));

// RegistrationPendingError is part of this module's contract now: the page
// tests `err instanceof RegistrationPendingError`, so a mock without it makes
// the catch block throw rather than the assertion fail.
vi.mock("@/lib/auth/api", () => ({
  loginWithPassword,
  loginWithIdToken,
  requestNonce,
  RegistrationPendingError: class RegistrationPendingError extends Error {},
}));

vi.mock("@/lib/auth/keycloakIdentity", () => ({
  signInWithGoogleViaKeycloak,
  GoogleSignInCancelledError: class GoogleSignInCancelledError extends Error {},
}));

// The page redirects via next/navigation's router, not a real one — there is
// no Next.js router context in this render, so only the call is asserted.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("LoginPage password form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation errors and never calls the API when fields are empty", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Enter your email, phone, or name.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(loginWithPassword).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("signs in with the entered email and password, and shows a welcome message", async () => {
    loginWithPassword.mockResolvedValue({
      id: "1",
      email: "person@example.com",
      displayName: "Person Example",
      role: "USER",
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email, Phone or Name"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(loginWithPassword).toHaveBeenCalledWith("person@example.com", "hunter2222"));
    expect(await screen.findByText("Login successful. Welcome, Person Example!")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/overview");
  });

  it("shows the failure message when the API call is refused", async () => {
    loginWithPassword.mockRejectedValue(
      new Error("Login failed. Check your email and password, or your account may not be approved yet."),
    );
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email, Phone or Name"), "pending@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Login failed. Check your email and password, or your account may not be approved yet."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("LoginPage Google sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestNonce.mockResolvedValue("test-nonce");
  });

  it("redirects to /overview after a successful Google sign-in", async () => {
    signInWithGoogleViaKeycloak.mockResolvedValue("google-id-token");
    loginWithIdToken.mockResolvedValue({
      id: "1",
      email: "person@example.com",
      displayName: "Person Example",
      role: "USER",
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(await screen.findByText("Login successful. Welcome, Person Example!")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/overview");
  });

  it("does not redirect when Google sign-in is refused", async () => {
    signInWithGoogleViaKeycloak.mockResolvedValue("google-id-token");
    loginWithIdToken.mockRejectedValue(new Error("Login failed. Your Google account may not have access yet."));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(
      await screen.findByText("Login failed. Your Google account may not have access yet."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
