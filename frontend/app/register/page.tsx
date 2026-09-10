"use client";

import { useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, PasswordField } from "@/components/auth/FormField";
import { MailIcon, PersonIcon, PhoneIcon, PlusIcon, LockIcon } from "@/components/auth/icons";
import { AuthApiError, EmailAlreadyRegisteredError, register } from "@/lib/auth/api";

type Errors = Partial<Record<"fullName" | "email" | "phone" | "password" | "confirmPassword" | "agree", string>>;

/**
 * Register — wired to the real backend (ADR-014, revision of ADR-008):
 * POST /api/v1/auth/register creates an account with a bcrypt-hashed password,
 * status PENDING. It cannot sign in — by any path — until a super_admin
 * approves it, so submitting here never signs the caller in; it shows a
 * "your account is awaiting approval" message instead.
 *
 * The phone number is collected (matching the approved mockup) but not sent
 * to the backend — no `phone` column exists on `account` (out of scope for
 * ADR-014, which added only `password`/`status`).
 *
 * // req: FR-AUTH-002, FR-AUTH-003, ADR-014
 */
export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function validate() {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (!email.trim()) next.email = "Enter your email.";
    if (!phone.trim()) next.phone = "Enter your phone number.";
    if (!password) next.password = "Create a password.";
    if (!confirmPassword) next.confirmPassword = "Confirm your password.";
    else if (password && confirmPassword && password !== confirmPassword) {
      next.confirmPassword = "Passwords don't match.";
    }
    if (!agree) next.agree = "You must agree to the Terms of Service and Privacy Policy.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const result = await register({ email, displayName: fullName, password });
      setFeedback({ type: "success", message: result.message });
    } catch (err) {
      if (err instanceof EmailAlreadyRegisteredError) {
        setErrors((prev) => ({ ...prev, email: err.message }));
      } else {
        const message = err instanceof AuthApiError ? err.message : "Registration failed. Please try again.";
        setFeedback({ type: "error", message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLegalLinkClick(e: MouseEvent) {
    e.preventDefault();
    // TODO: no /terms or /privacy page exists yet — out of scope for this task.
    console.info("[stub] Legal link clicked");
  }

  return (
    <AuthShell
      icon={<PersonIcon className="h-6 w-6 text-brand-purple md:h-7 md:w-7" />}
      badge={<PlusIcon className="h-3.5 w-3.5" />}
      heading="Create Account"
      subheading="Join Coc Docs Platform today and start writing, organizing, and sharing documentation with your team."
      formPanelPaddingY="md:py-10"
    >
      <h1 className="text-3xl font-extrabold text-ink">Register</h1>
      <p className="mt-2 text-sm text-muted">Create your account</p>

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
          label="Full Name"
          value={fullName}
          onChange={setFullName}
          placeholder="Enter your full name"
          icon={<PersonIcon className="h-4 w-4" />}
          autoComplete="name"
          error={errors.fullName}
        />

        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
          icon={<MailIcon className="h-4 w-4" />}
          autoComplete="email"
          error={errors.email}
        />

        <FormField
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="Enter your phone number"
          icon={<PhoneIcon className="h-4 w-4" />}
          autoComplete="tel"
          error={errors.phone}
        />

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Create a password"
          icon={<LockIcon className="h-4 w-4" />}
          autoComplete="new-password"
          error={errors.password}
        />

        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm your password"
          icon={<LockIcon className="h-4 w-4" />}
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        <div>
          <div className="flex items-start gap-2">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              aria-describedby={errors.agree ? "agree-terms-error" : undefined}
              className="mt-0.5 h-4 w-4 rounded border-border text-brand-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            />
            <label htmlFor="agree-terms" className="text-sm text-muted">
              I agree to the{" "}
              <a href="/terms" onClick={handleLegalLinkClick} className="font-semibold text-brand-purple hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" onClick={handleLegalLinkClick} className="font-semibold text-brand-purple hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.agree && (
            <p id="agree-terms-error" role="alert" className="mt-1.5 text-xs text-red-600">
              {errors.agree}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || feedback?.type === "success"}
          aria-busy={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting…" : "Register"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-purple hover:underline">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}
