import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
// The mocked class below (vi.mock("@/lib/auth/api", ...)) -- imported so
// these tests can construct real instances of what handleSubmit's catch
// block actually checks with `instanceof` (ADR-031).
import { MfaRequiredError } from "@/lib/auth/api";
import LoginPage from "./page";

const {
  loginWithPassword,
  loginWithIdToken,
  requestNonce,
  verifyMfaLogin,
  signInWithGoogleViaKeycloak,
  push,
  searchParams,
} = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
  loginWithIdToken: vi.fn(),
  requestNonce: vi.fn(),
  verifyMfaLogin: vi.fn(),
  signInWithGoogleViaKeycloak: vi.fn(),
  push: vi.fn(),
  // A box, not a plain URLSearchParams: the mock factory below closes over
  // this reference once, so tests mutate `.current` to change what
  // useSearchParams() returns on the next render rather than re-mocking.
  searchParams: { current: new URLSearchParams() },
}));

// RegistrationPendingError and MfaRequiredError (ADR-031) are part of this
// module's contract now: the page tests `err instanceof X`, so a mock
// without either makes the catch block throw rather than the assertion fail.
vi.mock("@/lib/auth/api", () => ({
  loginWithPassword,
  loginWithIdToken,
  requestNonce,
  verifyMfaLogin,
  RegistrationPendingError: class RegistrationPendingError extends Error {},
  MfaRequiredError: class MfaRequiredError extends Error {},
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

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(loginWithPassword).toHaveBeenCalledWith("person@example.com", "hunter2222"));
    expect(await screen.findByText("Login successful. Welcome, Person Example!")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/overview");
  });

  it("sends a plain \"user\" role to its own Member landing page, not the admin app", async () => {
    // The admin app (sidebar, Overview, per-product content management,
    // Users & Roles, Settings) is admin/super_admin only — a "user" account
    // gets its own real landing page (ADR-033) instead, same destination
    // RequireMemberSession expects for a plain user.
    loginWithPassword.mockResolvedValue({
      id: "1",
      email: "reader@example.com",
      displayName: "Reader Example",
      role: "user",
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "reader@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/home"));
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

    await user.type(screen.getByLabelText("Email"), "invited@example.com");
    await user.type(screen.getByLabelText("Password"), "TempPassword123!");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/create-password"));
  });

  it("shows the failure message when the API call is refused", async () => {
    loginWithPassword.mockRejectedValue(
      new Error("Invalid Login email, or password."),
    );
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "pending@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Invalid Login email, or password."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("LoginPage pending approval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tells someone whose registration is not approved yet that it is pending, as a notice — not an error", async () => {
    const { RegistrationPendingError } = await import("@/lib/auth/api");
    loginWithPassword.mockRejectedValue(new RegistrationPendingError("Your account is pending admin approval."));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "applicant@example.com");
    await user.type(screen.getByLabelText("Password"), "right-password");
    await user.click(screen.getByRole("button", { name: "Login" }));

    const notice = await screen.findByRole("alert");
    expect(notice).toHaveTextContent("Your account is pending admin approval.");
    // The amber "pending" notice, not the red error.
    expect(notice).toHaveClass("bg-amber-50");
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

    await user.type(screen.getByLabelText("Email"), "person@example.com");
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

    await user.type(screen.getByLabelText("Email"), "person@example.com");
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

    expect(await screen.findByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password")).not.toHaveFocus();
  });
});

/**
 * ADR-031. A correct password for an account with confirmed TOTP throws
 * {@link MfaRequiredError} rather than resolving — not a refusal, so it must
 * not show the red error banner {@link loginWithPassword}'s other rejections
 * do; it switches to the OTP step instead.
 */
describe("LoginPage TOTP second factor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function submitPassword(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));
  }

  it("switches to the OTP step instead of showing an error banner", async () => {
    loginWithPassword.mockRejectedValue(new MfaRequiredError("Enter the 6-digit code from your authenticator app."));
    const user = userEvent.setup();
    render(<LoginPage />);

    await submitPassword(user);

    expect(await screen.findByLabelText("Authentication Code")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("verifies the code on its own once six digits are in, and redirects", async () => {
    loginWithPassword.mockRejectedValue(new MfaRequiredError("Enter the 6-digit code from your authenticator app."));
    verifyMfaLogin.mockResolvedValue({
      id: "1",
      email: "person@example.com",
      displayName: "Person Example",
      role: "admin",
      mustChangePassword: false,
    });
    const user = userEvent.setup();
    render(<LoginPage />);
    await submitPassword(user);

    // No click: the sixth digit submits it.
    await user.type(await screen.findByLabelText("Authentication Code"), "123456");

    await waitFor(() => expect(verifyMfaLogin).toHaveBeenCalledWith("123456"));
    expect(verifyMfaLogin).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Login successful. Welcome, Person Example!")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/overview");
  });

  it("does not submit until the sixth digit, and Verify asks for all six", async () => {
    loginWithPassword.mockRejectedValue(new MfaRequiredError("Enter the 6-digit code from your authenticator app."));
    const user = userEvent.setup();
    render(<LoginPage />);
    await submitPassword(user);

    await user.type(await screen.findByLabelText("Authentication Code"), "12345");
    expect(verifyMfaLogin).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter the 6-digit code.");
    expect(verifyMfaLogin).not.toHaveBeenCalled();
  });

  it("accepts a pasted code, ignoring anything that is not a digit", async () => {
    loginWithPassword.mockRejectedValue(new MfaRequiredError("Enter the 6-digit code from your authenticator app."));
    verifyMfaLogin.mockResolvedValue({ id: "1", email: "person@example.com", displayName: "Person Example", role: "user", mustChangePassword: false });
    const user = userEvent.setup();
    render(<LoginPage />);
    await submitPassword(user);

    (await screen.findByLabelText("Authentication Code")).focus();
    await user.paste("123 456");

    await waitFor(() => expect(verifyMfaLogin).toHaveBeenCalledWith("123456"));
  });

  it("says which account the code is for, and when the next one comes", async () => {
    loginWithPassword.mockRejectedValue(new MfaRequiredError("Enter the 6-digit code from your authenticator app."));
    const user = userEvent.setup();
    render(<LoginPage />);
    await submitPassword(user);

    expect(await screen.findByText("person@example.com")).toBeInTheDocument();
    expect(screen.getByText(/New code in/)).toHaveTextContent(/New code in \d{1,2}s/);
  });

  it("shows an error and stays on the OTP step when the code is wrong", async () => {
    loginWithPassword.mockRejectedValue(new MfaRequiredError("Enter the 6-digit code from your authenticator app."));
    verifyMfaLogin.mockRejectedValue(new Error("That code is incorrect. Please check the time on your device and try again."));
    const user = userEvent.setup();
    render(<LoginPage />);
    await submitPassword(user);

    await user.type(await screen.findByLabelText("Authentication Code"), "000000");

    expect(
      await screen.findByText("That code is incorrect. Please check the time on your device and try again."),
    ).toBeInTheDocument();
    const field = screen.getByLabelText("Authentication Code");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(push).not.toHaveBeenCalled();

    // Verify retries the same code...
    await user.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(verifyMfaLogin).toHaveBeenCalledTimes(2));

    // ...and typing again clears the error.
    await user.type(field, "1");
    expect(screen.queryByText(/That code is incorrect/)).not.toBeInTheDocument();
    expect(field).not.toHaveAttribute("aria-invalid");
  });

  it("returns to the credentials step via Back to login", async () => {
    loginWithPassword.mockRejectedValue(new MfaRequiredError("Enter the 6-digit code from your authenticator app."));
    const user = userEvent.setup();
    render(<LoginPage />);
    await submitPassword(user);

    await user.click(await screen.findByRole("button", { name: "Back to login" }));

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(verifyMfaLogin).not.toHaveBeenCalled();
  });
});

describe("LoginPage browser autofill", () => {
  const store = vi.fn();
  class FakePasswordCredential {
    constructor(public data: { id: string; password: string; name?: string }) {}
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.mockResolvedValue(undefined);
    Object.defineProperty(window, "PasswordCredential", { value: FakePasswordCredential, configurable: true, writable: true });
    Object.defineProperty(navigator, "credentials", { value: { store }, configurable: true });
  });

  function account() {
    return { id: "1", email: "person@example.com", displayName: "Person Example", role: "user", mustChangePassword: false };
  }

  it("marks the fields the way password managers look for them", () => {
    render(<LoginPage />);

    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");
    expect(email).toHaveAttribute("name", "username");
    expect(email).toHaveAttribute("autocomplete", "username");
    expect(email).toHaveAttribute("id", "login-identifier");
    expect(password).toHaveAttribute("name", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(password).toHaveAttribute("type", "password");
    expect(email.closest("form")).toBe(password.closest("form"));
  });

  it("signs in with what the browser autofilled, even before it fired any input event", async () => {
    loginWithPassword.mockResolvedValue(account());
    const user = userEvent.setup();
    render(<LoginPage />);

    // Set straight on the DOM, the way an autofill can land before React
    // hears about it: no input or change event.
    (screen.getByLabelText("Email") as HTMLInputElement).value = "person@example.com";
    (screen.getByLabelText("Password") as HTMLInputElement).value = "hunter2222";
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(loginWithPassword).toHaveBeenCalledWith("person@example.com", "hunter2222"));
    expect(screen.queryByText("Enter your email, phone, or name.")).not.toBeInTheDocument();
  });

  it("offers the browser the credentials once the sign-in is accepted", async () => {
    loginWithPassword.mockResolvedValue(account());
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(store).toHaveBeenCalledTimes(1));
    const saved = store.mock.calls[0]?.[0] as FakePasswordCredential;
    expect(saved).toBeInstanceOf(FakePasswordCredential);
    expect(saved.data).toEqual({ id: "person@example.com", password: "hunter2222", name: "Person Example" });
  });

  it("offers nothing when the sign-in is refused", async () => {
    loginWithPassword.mockRejectedValue(new Error("Invalid email or password."));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(store).not.toHaveBeenCalled();
  });

  it("offers the credentials only after the second factor too", async () => {
    loginWithPassword.mockRejectedValue(new MfaRequiredError("Enter the 6-digit code from your authenticator app."));
    verifyMfaLogin.mockResolvedValue(account());
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));
    await user.type(await screen.findByLabelText("Authentication Code"), "12345");
    expect(store).not.toHaveBeenCalled();

    // The sixth digit submits the code; only an accepted one offers to save.
    await user.type(screen.getByLabelText("Authentication Code"), "6");

    await waitFor(() => expect(store).toHaveBeenCalledTimes(1));
    expect((store.mock.calls[0]?.[0] as FakePasswordCredential).data.password).toBe("hunter2222");
  });

  it("still signs in where the browser has no credential support", async () => {
    Object.defineProperty(window, "PasswordCredential", { value: undefined, configurable: true, writable: true });
    loginWithPassword.mockResolvedValue(account());
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2222");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Login successful. Welcome, Person Example!")).toBeInTheDocument();
    expect(store).not.toHaveBeenCalled();
  });
});
