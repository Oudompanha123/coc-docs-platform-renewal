"use client";

import { useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, PasswordField } from "@/components/auth/FormField";
import { MailIcon, PersonIcon, PhoneIcon, PlusIcon, LockIcon } from "@/components/auth/icons";

type Errors = Partial<Record<"fullName" | "email" | "phone" | "password" | "confirmPassword" | "agree", string>>;

/**
 * Register — UI/validation-only implementation of the approved mockup.
 *
 * Self-registration contradicts FR-AUTH-003/UC-004 (a super admin creates
 * accounts) and ADR-008/ADR-011 (Google OIDC only, no passwords). Built
 * anyway per explicit product direction to match the approved mockup
 * pixel-for-pixel; the submit handler is a stub, not a real account-creation
 * call. See app/login/page.tsx for the same caveat.
 *
 * // req: FR-AUTH-002, FR-AUTH-003, ADR-008, ADR-011 §2.5
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // TODO: no backend endpoint exists for self-registration (accounts are
    // admin-provisioned per FR-AUTH-003/UC-004, and ADR-008 forbids
    // passwords entirely). Once/if this flow is adopted for real, POST
    // { fullName, email, phone, password } to the backend's account
    // endpoint instead.
    console.info("[stub] Register submit", { fullName, email, phone });
    setIsSubmitting(false);
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
    >
      <h1 className="text-3xl font-extrabold text-ink">Register</h1>
      <p className="mt-2 text-sm text-muted">Create your account</p>

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
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Register
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
