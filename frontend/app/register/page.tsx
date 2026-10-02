"use client";

import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { CodeField, FormField, PasswordField } from "@/components/auth/FormField";
import { LockIcon, MailIcon, PersonIcon, PlusIcon, ShieldIcon } from "@/components/auth/icons";
import { Stepper } from "@/components/auth/Stepper";
import {
  AuthApiError,
  EmailAlreadyRegisteredError,
  register,
  resendRegistrationCode,
  verifyRegistrationCode,
} from "@/lib/auth/api";
import {
  isPasswordAcceptable,
  passwordViolations,
} from "@/lib/auth/passwordPolicy";

type FormErrors = Partial<Record<"fullName" | "email" | "password" | "confirmPassword" | "agree", string>>;

type Step = "form" | "code" | "done";

/** Labels for the {@link Stepper} shown on every screen of this flow. */
const STEPS = ["Account", "Verify", "Confirm"];

/** Matches the backend's cooldown (`RegistrationOtpService.RESEND_COOLDOWN`, ADR-021) — a UI countdown, not what actually enforces it. */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Register — three steps (ADR-021, revision of ADR-014/017): submit
 * details, confirm the emailed 6-digit code, done.
 *
 * `POST /api/v1/auth/register` no longer creates an account by itself — it
 * mints and emails that code. `POST /api/v1/auth/register/verify` is the
 * call that actually creates one, still `pending` a super_admin's approval
 * (ADR-017) exactly as the old single-step register always ended in.
 *
 * The phone number field this page used to collect — matching an old
 * mockup, never sent to the backend (there was never a `phone` column) — is
 * gone. ADR-021 removes it outright rather than continuing to carry dead UI.
 *
 * // req: FR-AUTH-002, FR-AUTH-003, ADR-014, ADR-017, ADR-021
 */
export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [doneMessage, setDoneMessage] = useState("");

  // Counts the resend cooldown down to zero once a second while step "code"
  // is showing. A UI convenience only — the backend is what actually refuses
  // an early resend (429), this just keeps the button looking disabled until
  // that would succeed.
  useEffect(() => {
    if (step !== "code" || resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  function validate() {
    const next: FormErrors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (!email.trim()) next.email = "Enter your email.";
    if (!password) next.password = "Create a password.";
    // Advisory only (CONST-TECH-07) — the backend applies the same rules and
    // is what actually refuses. This exists so somebody is not told after a
    // round trip what they could have been told as they typed.
    else if (!isPasswordAcceptable(password)) next.password = passwordViolations(password).join(" ");
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
      await register({ email, displayName: fullName, password });
      setCode("");
      setCodeError(undefined);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("code");
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

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setCodeError("Enter the 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setCodeError(undefined);
    try {
      const result = await verifyRegistrationCode(email, code);
      setDoneMessage(result.message);
      setStep("done");
    } catch (err) {
      // Expired, incorrect, or too many attempts are distinct, backend-authored
      // messages safe to show as-is (RegistrationOtpService.verify, ADR-021).
      setCodeError(err instanceof AuthApiError ? err.message : "Couldn't verify that code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setCodeError(undefined);
    try {
      await resendRegistrationCode(email);
      setCode("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setCodeError(err instanceof AuthApiError ? err.message : "Couldn't resend the code. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  function handleLegalLinkClick(e: MouseEvent) {
    e.preventDefault();
    // TODO: no /terms or /privacy page exists yet — out of scope for this task.
    console.info("[stub] Legal link clicked");
  }

  if (step === "code") {
    return (
      <AuthShell
        icon={<ShieldIcon className="h-6 w-6 text-brand-purple md:h-7 md:w-7" />}
        heading="Verify Your Email"
        subheading="Enter the 6-digit code we emailed you to finish creating your account."
      >
        <h1 className="text-3xl font-extrabold text-ink">Verify Your Email</h1>
        <p className="mt-2 text-sm text-muted">
          We&apos;ve sent a 6-digit code to <span className="font-semibold text-ink">{email}</span>. It expires in 10
          minutes.
        </p>

        <div className="mt-6">
          <Stepper steps={STEPS} currentIndex={1} />
        </div>

        {codeError && (
          <div role="alert" className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {codeError}
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleVerify} noValidate>
          <CodeField label="Verification Code" value={code} onChange={setCode} />

          <button
            type="submit"
            disabled={isVerifying}
            aria-busy={isVerifying}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifying ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-muted">
          <p>
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="font-semibold text-brand-purple hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : isResending ? "Resending…" : "Resend code"}
            </button>
          </p>
          <button type="button" onClick={() => setStep("form")} className="font-semibold text-brand-purple hover:underline">
            Wrong email? Go back
          </button>
        </div>
      </AuthShell>
    );
  }

  if (step === "done") {
    return (
      <AuthShell
        icon={<ShieldIcon className="h-6 w-6 text-brand-purple md:h-7 md:w-7" />}
        heading="Registration Received"
        subheading="An administrator will review your application before you can sign in."
      >
        <h1 className="text-3xl font-extrabold text-ink">Registration Received</h1>

        <div className="mt-6">
          <Stepper steps={STEPS} currentIndex={2} />
        </div>

        <div className="mt-6 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="alert">
          {doneMessage}
        </div>
        <Link
          href="/login"
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90"
        >
          Go to Login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={<PersonIcon className="h-6 w-6 text-brand-purple md:h-7 md:w-7" />}
      badge={<PlusIcon className="h-3.5 w-3.5" />}
      heading="Create Account"
      subheading="Join Coc Docs Platform today and start writing, organizing, and sharing documentation with your team."
      formPanelPaddingY="md:py-10"
      formPanelPaddingX="px-0"
    >
      <h1 className="px-8 text-3xl font-extrabold text-ink md:px-14">Register</h1>
      <p className="mt-2 px-8 text-sm text-muted md:px-14">Create your account</p>

      <div className="mt-6 px-8 md:px-14">
        <Stepper steps={STEPS} currentIndex={0} />
      </div>

      {feedback && (
        <div
          role="alert"
          className={`mx-8 mt-4 rounded-[10px] border px-4 py-3 text-sm md:mx-14 ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form
        className="no-scrollbar-arrows mt-6 max-h-[760px] space-y-5 overflow-y-auto px-8 md:px-14"
        onSubmit={handleSubmit}
        noValidate
      >
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
              {/* Anchors, not buttons or Links. These navigate nowhere yet —
                  handleLegalLinkClick calls preventDefault and no /terms or
                  /privacy page exists. next/link is what the rule wants, but it
                  only started firing because app/[productKey] now matches any
                  single-segment path, so the pages merely look real. A button
                  is worse: <button> is a labelable element, so nesting one in
                  this <label> makes getByLabelText match three controls instead
                  of the checkbox. These become <Link> when the pages exist. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/terms" onClick={handleLegalLinkClick} className="font-semibold text-brand-purple hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
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
          aria-busy={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting…" : "Continue"}
        </button>
      </form>

      <p className="mt-6 px-8 text-center text-sm text-muted md:px-14">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-purple hover:underline">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}
