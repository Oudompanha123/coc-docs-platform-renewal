"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, PasswordField } from "@/components/auth/FormField";
import { DocumentIcon, GoogleIcon, LockIcon, PersonIcon, ShieldIcon } from "@/components/auth/icons";
import { loginWithIdToken, requestNonce } from "@/lib/auth/api";
import { GoogleSignInCancelledError, signInWithGoogleViaKeycloak } from "@/lib/auth/keycloakIdentity";

/**
 * Login — UI/validation-only implementation of the approved mockup, except
 * for "Continue with Google", which is wired to the real backend
 * (FR-AUTH-001, FR-AUTH-002, FR-AUTH-007, TM-001; contract: docs/api/openapi.yaml).
 * Keycloak brokers Google upstream (ADR-013) — the button opens a popup that
 * goes through Keycloak rather than calling Google Identity Services
 * directly, but the click-to-sign-in experience is otherwise unchanged.
 *
 * ADR-008 and ADR-011 make Google OIDC the sole human-facing auth mechanism
 * ("no password stored anywhere") and FR-AUTH-003/UC-004 make accounts
 * admin-provisioned, not self-registered — so the password form still has no
 * backend to call and remains a stub, per explicit product direction to
 * match the approved mockup pixel-for-pixel. If password login becomes the
 * real flow, ADR-008 needs a follow-up revision to match.
 *
 * // req: FR-AUTH-001, FR-AUTH-002, ADR-008, ADR-011 §2.5, ADR-013
 */
export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [googleFeedback, setGoogleFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  // A ref, not state: guards against a second click landing between the
  // first click and the state update that disables the button (React state
  // updates are async; this check is synchronous).
  const googleSignInInFlight = useRef(false);

  function validate() {
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = "Enter your email, phone, or name.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // TODO: no backend endpoint exists for password login (ADR-008 forbids
    // one). Once/if this flow is adopted for real, POST { identifier,
    // password, rememberMe } to the backend's session endpoint instead.
    console.info("[stub] Login submit", { identifier, rememberMe });
    setIsSubmitting(false);
  }

  function handleForgotPassword() {
    // TODO: no /forgot-password page exists yet — out of scope for this task.
    console.info("[stub] Forgot password clicked");
  }

  async function handleGoogleSignIn() {
    if (googleSignInInFlight.current) return;
    googleSignInInFlight.current = true;
    setIsGoogleSubmitting(true);
    setGoogleFeedback(null);

    try {
      // 1. Ask the backend for a one-time nonce (also sets the coc_oidc_nonce
      //    cookie it will read back below) — TM-001's anti-replay control.
      const nonce = await requestNonce();
      // 2. Open the Keycloak/Google popup for this specific nonce and get
      //    back a Keycloak-issued ID token (ADR-013 — Keycloak brokers
      //    Google upstream).
      const idToken = await signInWithGoogleViaKeycloak({ nonce });
      // 3. Hand it to the backend: signature/issuer/audience/nonce verified
      //    there, never trusted client-side. On success it sets the session
      //    cookie (FR-AUTH-001, FR-AUTH-007, NFR-SEC-SESSION).
      const account = await loginWithIdToken(idToken);

      setGoogleFeedback({ type: "success", message: `Login successful. Welcome, ${account.displayName}!` });
    } catch (err) {
      if (err instanceof GoogleSignInCancelledError) {
        // The user closed Google's prompt themselves — not a failure.
        return;
      }
      const message = err instanceof Error ? err.message : "Google sign-in failed. Please try again.";
      setGoogleFeedback({ type: "error", message });
    } finally {
      googleSignInInFlight.current = false;
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <AuthShell
      icon={<DocumentIcon className="h-6 w-6 text-brand-purple md:h-7 md:w-7" />}
      heading={
        <>
          Welcome to
          <br />
          Coc Docs Platform
        </>
      }
      subheading="Sign in to continue to your workspace and pick up right where you left off."
      footer={
        <p className="hidden items-center gap-2 text-xs text-muted md:flex">
          <ShieldIcon className="h-4 w-4 text-brand-purple" />
          Your data is safe with us
        </p>
      }
    >
      <h1 className="text-3xl font-extrabold text-ink">Login</h1>
      <p className="mt-2 text-sm text-muted">Please sign in to your account</p>

      {googleFeedback && (
        <div
          role="alert"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            googleFeedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {googleFeedback.message}
        </div>
      )}

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email, Phone or Name"
          value={identifier}
          onChange={setIdentifier}
          placeholder="Email, phone or full name"
          icon={<PersonIcon className="h-4 w-4" />}
          autoComplete="username"
          error={errors.identifier}
        />

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          icon={<LockIcon className="h-4 w-4" />}
          autoComplete="current-password"
          error={errors.password}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm font-semibold text-brand-purple hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple rounded"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Login
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleSubmitting}
          aria-busy={isGoogleSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border px-4 py-3 font-semibold text-ink transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon className="h-5 w-5" aria-hidden="true" />
          {isGoogleSubmitting ? "Signing in…" : "Continue with Google"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-purple hover:underline">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
