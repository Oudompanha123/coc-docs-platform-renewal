import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * The Google button when Keycloak is not configured for this deployment.
 *
 * <p>Its own file because {@code isGoogleSignInConfigured} is computed once at
 * module load from the NEXT_PUBLIC_KEYCLOAK_* variables. By the time a test
 * body runs it is already a constant, so setting the variables in a
 * {@code beforeEach} changes nothing — the only way to exercise the other
 * branch is a module mock, and a mock is per-file.
 */

const { signInWithGoogleViaKeycloak } = vi.hoisted(() => ({
  signInWithGoogleViaKeycloak: vi.fn(),
}));

vi.mock("@/lib/auth/keycloakIdentity", () => ({
  signInWithGoogleViaKeycloak,
  isGoogleSignInConfigured: false,
  GoogleSignInCancelledError: class GoogleSignInCancelledError extends Error {},
}));

vi.mock("@/lib/auth/api", () => ({
  loginWithPassword: vi.fn(),
  loginWithIdToken: vi.fn(),
  requestNonce: vi.fn(),
  RegistrationPendingError: class RegistrationPendingError extends Error {},
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import LoginPage from "./page";

describe("LoginPage with Google sign-in unconfigured", () => {
  it("hides the Google button rather than offering one that cannot work", () => {
    render(<LoginPage />);

    // Offering it would send the caller into a popup that fails on a missing
    // Keycloak URL — a dead end with no explanation.
    expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();
  });

  it("hides the 'or' divider with it, so nothing separates one option from nothing", () => {
    render(<LoginPage />);

    expect(screen.queryByText("or")).not.toBeInTheDocument();
  });

  it("still offers the password form, which does not need Keycloak", () => {
    render(<LoginPage />);

    // The point of hiding one path is that the other still works.
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email, Phone or Name")).toBeInTheDocument();
  });
});
