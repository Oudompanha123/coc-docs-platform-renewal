"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, PasswordField } from "@/components/auth/FormField";
import { DocumentIcon, GoogleIcon, LockIcon, PersonIcon, ShieldIcon } from "@/components/auth/icons";

/**
 * Login — UI/validation-only implementation of the approved mockup.
 *
 * ADR-008 and ADR-011 make Google OIDC the sole human-facing auth mechanism
 * ("no password stored anywhere") and FR-AUTH-003/UC-004 make accounts
 * admin-provisioned, not self-registered — so this password form has no
 * backend to call. Built anyway per explicit product direction to match the
 * approved mockup pixel-for-pixel; every submit path below is a stub with a
 * TODO, not a real credential check. If this becomes the real flow, ADR-008
 * needs a follow-up revision to match.
 *
 * // req: FR-AUTH-001, FR-AUTH-002, ADR-008, ADR-011 §2.5
 */
export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function handleGoogleSignIn() {
    // TODO(ADR-012 Decision 1 / ADR-011 §2): the backend owns the OIDC
    // authorization-code flow and session issuance. Navigate the browser to
    // its sign-in endpoint once it exists, e.g.
    // `window.location.href = \`${BACKEND_ORIGIN}/oauth2/authorization/google\`;`
    console.info("[stub] Continue with Google clicked");
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
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border px-4 py-3 font-semibold text-ink transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
        >
          <GoogleIcon className="h-5 w-5" aria-hidden="true" />
          Continue with Google
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
