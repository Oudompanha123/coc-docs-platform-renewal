"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, PasswordField } from "@/components/auth/FormField";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { LockIcon, MailIcon, PersonIcon, PlusIcon, ShieldIcon } from "@/components/auth/icons";
import { Stepper } from "@/components/auth/Stepper";
import { Spinner } from "@/components/layout/Spinner";
import { Button } from "@/components/ui/button";
import {
  AuthApiError,
  EmailAlreadyRegisteredError,
  register,
  resendRegistrationCode,
  verifyRegistrationCode,
} from "@/lib/auth/api";
import { emailViolations, isEmailAcceptable } from "@/lib/auth/emailPolicy";
import { isPasswordAcceptable, passwordViolations } from "@/lib/auth/passwordPolicy";

type FormErrors = Partial<Record<"fullName" | "email" | "password" | "confirmPassword" | "agree", string>>;

type Step = "form" | "code" | "done";

/** Labels for the {@link Stepper} shown on every screen of this flow. */
const STEPS = ["Account", "Verify", "Confirm"];

/** Matches the backend's cooldown (`RegistrationOtpService.RESEND_COOLDOWN`, ADR-021) — a UI countdown, not what actually enforces it. */
const RESEND_COOLDOWN_SECONDS = 60;

/** Matches the backend's code lifetime (`RegistrationOtpService.TTL`, ADR-021) — shown as a countdown; the backend decides. */
const CODE_TTL_SECONDS = 10 * 60;

/** "9:41" for 581 seconds. */
function minutesSeconds(total: number): string {
  const s = Math.max(0, total);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

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
  const [doneMessage, setDoneMessage] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);
  // A ref as well as state: auto-submit on the sixth digit and a Verify click
  // can land in the same moment, before the state update disables anything.
  const verifyInFlight = useRef(false);
  // When the current code was sent — the expiry countdown runs from here, and
  // a resend restarts it.
  const [codeSentAt, setCodeSentAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  // Both countdowns are worked out from when the code was sent, on one
  // clock — not by counting ticks, which drift (a background tab slows its
  // timers) and fell behind each other here. Clamped, so a clock that has not
  // caught up yet never shows more than the full time.
  const secondsSinceSent = Math.max(0, Math.floor((now - codeSentAt) / 1000));
  const expiresIn = CODE_TTL_SECONDS - secondsSinceSent;
  const resendCooldown = Math.max(0, RESEND_COOLDOWN_SECONDS - secondsSinceSent);

  // The clock both countdowns read (resend cooldown, code expiry), and the
  // cursor in the boxes on arrival. The cooldown is a UI convenience only —
  // the backend is what actually refuses an early resend (429); this just
  // keeps the button looking disabled until that would succeed.
  useEffect(() => {
    if (step !== "code") return;
    codeInputRef.current?.focus();
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Ready for the next try after a rejected code: focused on the now-empty
  // field (verify clears it). Waits for the field to be re-enabled —
  // focusing it while still disabled (mid-request) is silently ignored by the
  // browser.
  useEffect(() => {
    if (codeError && !isVerifying) {
      codeInputRef.current?.focus();
    }
  }, [codeError, isVerifying]);

  function validate() {
    const next: FormErrors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (!email.trim()) next.email = "Enter your email.";
    // Advisory only (CONST-TECH-07) -- the backend applies the same rules and is
    // what refuses. This exists so a typo is caught before a round trip.
    else if (!isEmailAcceptable(email)) next.email = emailViolations(email).join(" ");
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
      setCodeSentAt(Date.now());
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
    await verify(code);
  }

  async function verify(value: string) {
    if (verifyInFlight.current) return;
    if (value.length !== 6) {
      setCodeError("Enter the 6-digit code.");
      return;
    }

    verifyInFlight.current = true;
    setIsVerifying(true);
    setCodeError(undefined);
    try {
      const result = await verifyRegistrationCode(email, value);
      setDoneMessage(result.message);
      setStep("done");
    } catch (err) {
      // Expired, incorrect, or too many attempts are distinct, backend-authored
      // messages safe to show as-is (RegistrationOtpService.verify, ADR-021).
      setCodeError(err instanceof AuthApiError ? err.message : "Couldn't verify that code. Please try again.");
      // Cleared so the next code goes straight into empty boxes; the effect
      // above refocuses the field. Cleared directly, not through the input's
      // onChange, so the error stays on screen until the person types.
      setCode("");
    } finally {
      verifyInFlight.current = false;
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setCodeError(undefined);
    try {
      await resendRegistrationCode(email);
      setCode("");
      setCodeSentAt(Date.now());
      setNow(Date.now());
      codeInputRef.current?.focus();
    } catch (err) {
      setCodeError(err instanceof AuthApiError ? err.message : "Couldn't resend the code. Please try again.");
    } finally {
      setIsResending(false);
    }
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
          We&apos;ve sent a 6-digit code to <span className="font-semibold text-ink">{email}</span>. Enter it below to
          finish creating your account.
        </p>

        <div className="mt-6">
          <Stepper steps={STEPS} currentIndex={1} />
        </div>

        <form className="mt-7 space-y-6" onSubmit={handleVerify} noValidate>
          <div>
            <OtpCodeInput
              ref={codeInputRef}
              id="register-code"
              label="Verification Code"
              value={code}
              onChange={(value) => {
                setCode(value);
                if (codeError) setCodeError(undefined);
              }}
              // Submits on its own once the sixth digit is in — no extra click.
              onComplete={(value) => void verify(value)}
              invalid={codeError !== undefined}
              disabled={isVerifying}
              describedBy={codeError ? "register-code-error" : "register-code-hint"}
            />

            {codeError ? (
              <p
                id="register-code-error"
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
              >
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7.5v5.5M12 16.5h.01" strokeLinecap="round" />
                </svg>
                <span>{codeError}</span>
              </p>
            ) : (
              <p id="register-code-hint" className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {expiresIn > 0 ? (
                    <>
                      Code expires in{" "}
                      <span className="font-semibold tabular-nums text-ink">{minutesSeconds(expiresIn)}</span>
                    </>
                  ) : (
                    <span className="font-semibold text-red-600">Code expired — send a new one below</span>
                  )}
                </span>
                <span className="whitespace-nowrap">Submits automatically</span>
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isVerifying}
            aria-busy={isVerifying}
            className="flex w-full shadow-sm"
          >
            {isVerifying && <Spinner />}
            {isVerifying ? "Verifying…" : "Verify Email"}
          </Button>
        </form>

        <div className="mt-5 rounded-xl border border-border bg-page px-4 py-3 text-center text-sm text-muted">
          Didn&apos;t get a code? Check your spam folder, or{" "}
          <Button
            type="button"
            variant="link"
            size="inline"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="focus-visible:ring-offset-0"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : isResending ? "Resending…" : "Resend code"}
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setStep("form")}
          disabled={isVerifying}
          className="mt-4 flex w-full"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Wrong email? Go back
        </Button>
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
            {/* Same reason as /login's "Remember me": no checkbox primitive
                yet, and Radix's would change both the pixels and the element
                getByLabelText resolves to. ADR-104 §4.3. */}
            {/* eslint-disable-next-line react/forbid-elements */}
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
              {/* Links, not buttons: <button> is a labelable element, so nesting
                  one in this <label> would make getByLabelText match three
                  controls instead of the checkbox. Both routes exist now
                  (app/terms, app/privacy) — a static segment, so neither is
                  swallowed by app/(shell)/[productKey]. */}
              <Link href="/terms" className="font-semibold text-brand-purple hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-brand-purple hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.agree && (
            <p id="agree-terms-error" role="alert" className="mt-1.5 text-xs text-red-600">
              {errors.agree}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="flex w-full">
          {isSubmitting ? "Submitting…" : "Continue"}
        </Button>
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
