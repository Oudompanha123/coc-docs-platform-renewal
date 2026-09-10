"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, PasswordField } from "@/components/auth/FormField";
import { DocumentIcon, GoogleIcon, LockIcon, PersonIcon, ShieldIcon } from "@/components/auth/icons";
import { loginWithIdToken, loginWithPassword, requestNonce } from "@/lib/auth/api";
import { GoogleSignInCancelledError, signInWithGoogleViaKeycloak } from "@/lib/auth/keycloakIdentity";

/**
 * Login — both sign-in methods are wired to the real backend.
 *
 * "Continue with Google" (FR-AUTH-001, FR-AUTH-007, TM-001; contract:
 * docs/api/openapi.yaml): Keycloak brokers Google upstream (ADR-013) — the
 * button opens a popup that goes through Keycloak rather than calling Google
 * Identity Services directly, but the click-to-sign-in experience is
 * otherwise unchanged.
 *
 * The password form (ADR-014, revision of ADR-008/FR-AUTH-002/FR-AUTH-003):
 * POST /api/v1/auth/login-password. Only succeeds for a self-registered account
 * a super_admin has approved — see app/register/page.tsx. The field is
 * labelled "Email, Phone or Name" to match the approved mockup, but only an
 * email actually authenticates; the backend has no phone/name lookup.
 *
 * Both paths end at the same session cookie and share one feedback banner
 * below, since only one of them is ever the most recent attempt.
 *
 * // req: FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, ADR-008, ADR-011 §2.5, ADR-013, ADR-014
 */
export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      // rememberMe has nothing to bind to server-side: session TTL is one
      // fixed, system-wide value by design (AMB-006/ADR-011 — deliberately
      // no per-role or "remember me" variant), so it isn't sent.
      const account = await loginWithPassword(identifier, password);
      setFeedback({ type: "success", message: `Login successful. Welcome, ${account.displayName}!` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleForgotPassword() {
    // TODO: no /forgot-password page exists yet — out of scope for this task.
    console.info("[stub] Forgot password clicked");
  }

  async function handleGoogleSignIn() {
    if (googleSignInInFlight.current) return;
    googleSignInInFlight.current = true;
    setIsGoogleSubmitting(true);
    setFeedback(null);

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

      setFeedback({ type: "success", message: `Login successful. Welcome, ${account.displayName}!` });
    } catch (err) {
      if (err instanceof GoogleSignInCancelledError) {
        // The user closed Google's prompt themselves — not a failure.
        return;
      }
      const message = err instanceof Error ? err.message : "Google sign-in failed. Please try again.";
      setFeedback({ type: "error", message });
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

      {feedback && (
        <div
          role="alert"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
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
          aria-busy={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Login"}
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
