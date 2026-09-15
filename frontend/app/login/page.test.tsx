import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

const { loginWithPassword, loginWithIdToken, requestNonce, routerPush } = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
  loginWithIdToken: vi.fn(),
  requestNonce: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("@/lib/auth/api", () => ({ loginWithPassword, loginWithIdToken, requestNonce }));

// The page redirects to /overview 3s after a successful sign-in — mocked so
// useRouter() doesn't throw outside a real Next.js app router context.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPush }) }));

// Not exercised by these tests (they cover the password form), but imported
// by the page — mocked so nothing here tries to open a real popup.
vi.mock("@/lib/auth/keycloakIdentity", () => ({
  signInWithGoogleViaKeycloak: vi.fn(),
  GoogleSignInCancelledError: class GoogleSignInCancelledError extends Error {},
}));

describe("LoginPage password form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Guards against a test that used fake timers (below) leaking that
    // config into a later test if it fails before reaching its own reset.
    vi.useRealTimers();
  });

  it("shows validation errors and never calls the API when fields are empty", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Enter your email, phone, or name.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(loginWithPassword).not.toHaveBeenCalled();
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
  });

  it(
    "redirects to /overview 3s after a successful sign-in",
    async () => {
      // Real timers, not fake ones: testing-library's findBy* polling relies
      // on its own timers, which don't advance under vi.useFakeTimers()
      // without extra wiring — simplest to just let the real 3s elapse.
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

      expect(await screen.findByText("Redirecting to your dashboard…")).toBeInTheDocument();
      expect(routerPush).not.toHaveBeenCalled();

      await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/overview"), { timeout: 4000 });
    },
    6000,
  );

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
  });
});
