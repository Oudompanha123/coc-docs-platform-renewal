import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

const { loginWithPassword, loginWithIdToken, requestNonce, signInWithGoogleViaKeycloak, push, searchParams } =
  vi.hoisted(() => ({
    loginWithPassword: vi.fn(),
    loginWithIdToken: vi.fn(),
    requestNonce: vi.fn(),
    signInWithGoogleViaKeycloak: vi.fn(),
    push: vi.fn(),
    // A box, not a plain URLSearchParams: the mock factory below closes over
    // this reference once, so tests mutate `.current` to change what
    // useSearchParams() returns on the next render rather than re-mocking.
    searchParams: { current: new URLSearchParams() },
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

// isGoogleSignInConfigured is read at module load from NEXT_PUBLIC_KEYCLOAK_*,
// so it is a constant by the time a test runs and cannot be changed by setting
// the variables afterwards. Mocked as a value the individual tests override,
// which is also the only way to exercise both branches of the button.
vi.mock("@/lib/auth/keycloakIdentity", () => ({
  signInWithGoogleViaKeycloak,
  isGoogleSignInConfigured: true,
  GoogleSignInCancelledError: class GoogleSignInCancelledError extends Error {},
}));

// The page redirects via next/navigation's router, not a real one — there is
// no Next.js router context in this render, so only the call is asserted.
// useSearchParams defaults to an empty query string; the "prefills the email
// from ?email=" test below overrides it per-case.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams.current,
}));

// Applies to every test in this file: without it, a later test could
// silently inherit whatever ?email= the "prefill" test below left behind.
beforeEach(() => {
  searchParams.current = new URLSearchParams();
});

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
      role: "admin",
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

  it("sends a plain \"user\" role to the public landing page, not the admin app", async () => {
    // The admin app (sidebar, Overview, per-product content management,
    // Users & Roles, Settings) is admin/super_admin only now — a "user"
    // account reads the public /docs/* pages instead, same destination
    // RequireSession sends them to if they try an admin URL directly.
    loginWithPassword.mockResolvedValue({
      id: "1",
      email: "reader@example.com",
      displayName: "Reader Example",
      role: "user",
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email, Phone or Name"), "reader@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/welcome"));
  });

  it("sends a caller still on a temporary password to /create-password instead of /overview", async () => {
    loginWithPassword.mockResolvedValue({
      id: "1",
      email: "invited@example.com",
      displayName: "Invited Person",
      role: "user",
      mustChangePassword: true,
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email, Phone or Name"), "invited@example.com");
    await user.type(screen.getByLabelText("Password"), "TempPassword123!");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/create-password"));
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
      role: "admin",
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

  it("clears the Keycloak session when this app refuses a sign-in it authenticated", async () => {
    // The case that produced "You are already authenticated as different user
    // ... Please sign out first": Keycloak authenticated the applicant, this
    // app refused them, and Keycloak was left holding their session. There is
    // no Sign out button to press — they never got in.
    signInWithGoogleViaKeycloak.mockResolvedValue("google-id-token");
    loginWithIdToken.mockRejectedValue(new Error("nope"));

    process.env.NEXT_PUBLIC_KEYCLOAK_URL = "http://localhost:8180";
    process.env.NEXT_PUBLIC_KEYCLOAK_REALM = "docs_platform";

    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000", assign },
      writable: true,
    });

    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
    const target = new URL(assign.mock.calls[0]![0] as string);
    expect(target.pathname).toBe("/realms/docs_platform/protocol/openid-connect/logout");
    expect(target.searchParams.get("id_token_hint")).toBe("google-id-token");
    // A plain path, so Keycloak matches it against its allow-list without
    // argument; the reason travels in sessionStorage instead.
    expect(target.searchParams.get("post_logout_redirect_uri")).toBe("http://localhost:3000/login");
    expect(sessionStorage.getItem("coc_signin_outcome")).toBe("refused");

    sessionStorage.clear();
    delete process.env.NEXT_PUBLIC_KEYCLOAK_URL;
    delete process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
  });
});

describe("LoginPage redirect state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * The form is replaced by a spinner the moment a sign-in succeeds. Without
   * it the caller sits on a filled-in login form during the navigation, with
   * only a banner to suggest anything happened.
   *
   * <p>The redirect itself is not delayed. An earlier version of this held the
   * caller for three seconds so the success banner could be read; the push now
   * happens immediately and the spinner covers however long the navigation
   * actually takes.
   */
  it("replaces the form with a redirect notice once sign-in succeeds", async () => {
    loginWithPassword.mockResolvedValue({
      id: "1",
      email: "person@example.com",
      displayName: "Person Example",
      role: "admin",
      mustChangePassword: false,
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email, Phone or Name"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Redirecting to your dashboard…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/overview");
  });

  it("leaves the form in place when sign-in is refused", async () => {
    loginWithPassword.mockRejectedValue(new Error("Invalid email or password."));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email, Phone or Name"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Login" }));

    // A failed attempt must leave somewhere to retry from.
    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.queryByText("Redirecting to your dashboard…")).not.toBeInTheDocument();
  });
});

describe("LoginPage email prefill from an emailed link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefills the email field from ?email= and focuses the password field", async () => {
    searchParams.current = new URLSearchParams({ email: "invited@example.com" });
    render(<LoginPage />);

    expect(await screen.findByDisplayValue("invited@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveFocus();
  });

  it("leaves the email field empty and unfocused when the link carries no email", async () => {
    render(<LoginPage />);

    expect(await screen.findByLabelText("Email, Phone or Name")).toHaveValue("");
    expect(screen.getByLabelText("Password")).not.toHaveFocus();
  });
});
