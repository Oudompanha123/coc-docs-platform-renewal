"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, PasswordField } from "@/components/auth/FormField";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { DocumentIcon, GoogleIcon, LockIcon, PersonIcon, ShieldIcon } from "@/components/auth/icons";
import { LoadingDim } from "@/components/layout/LoadingDim";
import { Spinner } from "@/components/layout/Spinner";
import { Button } from "@/components/ui/button";
import { useMinimumDisplay } from "@/lib/layout/useMinimumDisplay";
import { landingPathFor } from "@/lib/auth/landing";
import {
  loginWithIdToken,
  loginWithPassword,
  MfaRequiredError,
  requestNonce,
  RegistrationPendingError,
  type AuthenticatedAccount,
  verifyMfaLogin,
} from "@/lib/auth/api";
import { GoogleSignInCancelledError, isGoogleSignInConfigured, signInWithGoogleViaKeycloak } from "@/lib/auth/keycloakIdentity";
import { rememberIdToken, takeIdToken } from "@/lib/auth/idTokenMemory";
import { keycloakLogoutUrl } from "@/lib/auth/keycloakLogout";
import { rememberSignInOutcome, takeSignInOutcome } from "@/lib/auth/signInOutcome";
import { safeNextPath } from "@/lib/auth/cliAuthorize";
import { offerToSaveCredential, readFilledCredentials } from "@/lib/auth/browserCredentials";

/** Where a signed-in account lands — `landingPathFor`, shared with the bare
 *  domain's redirect (`app/page.tsx`) so the two can never disagree. A
 *  temporary password buys entry to exactly one place regardless of role;
 *  Admin and Super Admin land on the Overview dashboard; a plain "user"
 *  (ADR-033) and Developer, Reviewer and Lead (ADR-090) get the Member
 *  home. A
 *  signed-out or `guest` caller never reaches this function at all (there
 *  is no successful login to return an account from). */
function postLoginDestination(account: AuthenticatedAccount): string {
  return landingPathFor(account);
}

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
 * a super_admin has approved — see app/register/page.tsx.
 *
 * Both paths end at the same session cookie and share one feedback banner
 * below, since only one of them is ever the most recent attempt. Both also
 * redirect to /overview on success — the session cookie is already set by
 * the time either await resolves, so the workspace it lands on can rely on
 * it being there.
 *
 * // req: FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, ADR-008, ADR-011 §2.5, ADR-013, ADR-014
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?next= is honoured for one destination only — the claude-team-usage CLI's
  // authorize page (ADR-060) — and never ahead of a forced password change.
  // safeNextPath rejects everything else, so this is not an open redirect.
  const nextPath = safeNextPath(searchParams.get("next"));
  const destinationFor = (account: AuthenticatedAccount) =>
    !account.mustChangePassword && nextPath ? nextPath : postLoginDestination(account);
  // The account-invite and reset-password emails link back here with
  // ?email=<address> so the person only has to type their (temporary)
  // password, not the address the email was already sent to.
  const emailFromLink = searchParams.get("email") ?? "";
  const [identifier, setIdentifier] = useState(emailFromLink);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ADR-031: a correct password for an account with confirmed TOTP switches
  // here instead of signing in — the account exists behind the scenes as
  // the coc_mfa_pending cookie loginWithPassword's rejection already left
  // behind, not as anything this component holds itself.
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  // A ref as well as state: auto-submit on the sixth digit and a Verify click
  // can land in the same moment, before the state update disables anything.
  const otpInFlight = useRef(false);
  const otpSecondsLeft = useTotpSecondsLeft(step === "otp");

  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  // Set once either sign-in path has succeeded and the redirect is under way.
  // Without it the caller is left sitting on a filled-in login form with only
  // a feedback banner, which reads as "nothing happened" during the navigation.
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "pending";
    message: string;
  } | null>(null);
  // The outcome of a refused sign-in, carried across the Keycloak logout
  // redirect. Without it the notice is lost on the round trip and the person
  // lands on a blank login form with no idea what happened.
  //
  // sessionStorage rather than a query parameter: it survives one same-tab
  // navigation, needs no Suspense boundary on a statically rendered page, and
  // keeps the post-logout redirect URI a plain path that Keycloak matches
  // without argument. Read once and cleared, so a later reload is clean.
  useEffect(() => {
    const outcome = takeSignInOutcome();
    if (outcome === "pending") {
      setFeedback({
        type: "pending",
        message:
          "Your registration is waiting for an administrator to approve it. " +
          "You will be able to sign in once they do.",
      });
    } else if (outcome === "refused") {
      setFeedback({
        type: "error",
        message: "Login failed. Your Google account may not have access yet.",
      });
    }
  }, []);

  // The email is already filled in from the link; send focus straight to
  // the password field so there's nothing left to click before typing.
  useEffect(() => {
    if (emailFromLink) document.getElementById("login-password")?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Landing on the OTP step means the credentials just passed; the next
  // thing to type is the code, so send focus there straight away.
  useEffect(() => {
    if (step === "otp") document.getElementById("login-otp-code")?.focus();
  }, [step]);

  // Ready for the next try after a rejected code: focused on the now-empty
  // field (verifyOtp clears it). Waits for the field to be re-enabled —
  // focusing it while still disabled (mid-request) is silently ignored by the
  // browser.
  useEffect(() => {
    if (otpError && !isVerifyingOtp) {
      otpInputRef.current?.focus();
    }
  }, [otpError, isVerifyingOtp]);

  // A ref, not state: guards against a second click landing between the
  // first click and the state update that disables the button (React state
  // updates are async; this check is synchronous).
  const googleSignInInFlight = useRef(false);

  function validate(id: string, pw: string) {
    const next: typeof errors = {};
    if (!id.trim()) next.identifier = "Enter your email, phone, or name.";
    if (!pw) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // What the browser autofilled, if it has not told React yet — the fields
    // can show saved credentials before any input event has fired.
    const filled = readFilledCredentials(e.currentTarget);
    const id = identifier || filled.username;
    const pw = password || filled.password;
    if (id !== identifier) setIdentifier(id);
    if (pw !== password) setPassword(pw);
    if (!validate(id, pw)) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      // rememberMe has nothing to bind to server-side: session TTL is one
      // fixed, system-wide value by design (AMB-006/ADR-011 — deliberately
      // no per-role or "remember me" variant), so it isn't sent.
      const account = await loginWithPassword(id, pw);
      setFeedback({ type: "success", message: `Login successful. Welcome, ${account.displayName}!` });
      // Accepted: let the browser offer to save these for next time.
      void offerToSaveCredential(id, pw, account.displayName);
      // A temporary password (revision of ADR-017) buys entry to exactly one
      // place: Create New Password. Everything else refuses this session
      // until that happens, so sending it anywhere else would just bounce.
      setIsRedirecting(true);
      router.push(destinationFor(account));
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        // Not a refusal: the password was correct. Switch to the OTP step
        // rather than showing an error banner.
        setOtpCode("");
        setOtpError(undefined);
        setStep("otp");
        return;
      }
      if (err instanceof RegistrationPendingError) {
        // Not a wrong password: the account exists and is waiting for an
        // administrator (ADR-095) — the amber notice, not the red error.
        setFeedback({ type: "pending", message: err.message });
        return;
      }
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    await verifyOtp(otpCode);
  }

  async function verifyOtp(code: string) {
    if (otpInFlight.current) return;
    if (code.length !== 6) {
      setOtpError("Enter the 6-digit code.");
      return;
    }

    otpInFlight.current = true;
    setIsVerifyingOtp(true);
    setOtpError(undefined);
    try {
      const account = await verifyMfaLogin(code);
      setFeedback({ type: "success", message: `Login successful. Welcome, ${account.displayName}!` });
      // The password was right a step ago; only now is the sign-in complete.
      void offerToSaveCredential(identifier, password, account.displayName);
      setIsRedirecting(true);
      router.push(destinationFor(account));
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Couldn't verify that code. Please try again.");
      // Cleared so the next code goes straight into empty boxes; the effect
      // above refocuses the field. Cleared directly, not through the input's
      // onChange, so the error stays on screen until the person types.
      setOtpCode("");
    } finally {
      otpInFlight.current = false;
      setIsVerifyingOtp(false);
    }
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
      // Kept in memory only, so signing out can pass it as id_token_hint and
      // skip Keycloak's "Do you want to log out?" page.
      rememberIdToken(idToken);
      // 3. Hand it to the backend: signature/issuer/audience/nonce verified
      //    there, never trusted client-side. On success it sets the session
      //    cookie (FR-AUTH-001, FR-AUTH-007, NFR-SEC-SESSION).
      const account = await loginWithIdToken(idToken);

      setFeedback({ type: "success", message: `Login successful. Welcome, ${account.displayName}!` });
      // Same gate as the password path above: an account a super_admin
      // invited by email can also arrive here later via Google, and the
      // temporary password still has to be replaced first either way.
      setIsRedirecting(true);
      router.push(destinationFor(account));
    } catch (err) {
      if (err instanceof GoogleSignInCancelledError) {
        // The user closed Google's prompt themselves — not a failure.
        return;
      }
      // Keycloak authenticated them; this application refused them. Keycloak
      // is now holding a session for somebody who never got in, and the next
      // person to try a different Google account here meets:
      //
      //   You are already authenticated as different user '...' in this
      //   session. Please sign out first.
      //
      // So the refusal ends that session. There is no Sign out button to press
      // — they are not signed in — which is exactly why it has to happen here.
      //
      // A full-page redirect through Keycloak, returning to /login with the
      // outcome in the URL, because the notice has to survive the trip.
      const outcome = err instanceof RegistrationPendingError ? "pending" : "refused";
      const logoutUrl = keycloakLogoutUrl(takeIdToken(), `${window.location.origin}/login`);
      if (logoutUrl) rememberSignInOutcome(outcome);

      if (logoutUrl) {
        window.location.assign(logoutUrl);
        return;
      }

      // Only reached without Keycloak configured: no second session exists, so
      // the message can be shown in place.
      if (err instanceof RegistrationPendingError) {
        setFeedback({ type: "pending", message: err.message });
        return;
      }
      const message = err instanceof Error ? err.message : "Google sign-in failed. Please try again.";
      setFeedback({ type: "error", message });
    } finally {
      googleSignInInFlight.current = false;
      setIsGoogleSubmitting(false);
    }
  }

  // Any of the four in-flight requests, or the redirect that follows a
  // successful one — one continuous overlay across "submitting" and
  // "leaving this page now" rather than two different visual states back
  // to back. 400ms floor so a near-instant local validation failure still
  // reads as "something happened" rather than a flicker.
  const dimVisible = useMinimumDisplay(
    isSubmitting || isVerifyingOtp || isGoogleSubmitting || isRedirecting,
    400,
  );

  if (step === "otp") {
    return (
      <>
      {dimVisible && <LoadingDim label="Signing in…" />}
      <AuthShell
        icon={<ShieldIcon className="h-6 w-6 text-brand-purple md:h-7 md:w-7" />}
        heading="Two-Factor Authentication"
        subheading="Enter the 6-digit code from your authenticator app to finish signing in."
      >
        <h1 className="text-3xl font-extrabold text-ink">Enter Your Code</h1>
        <p className="mt-2 text-sm text-muted">
          Open your authenticator app and enter the 6-digit code for{" "}
          <span className="font-semibold text-ink">{identifier.trim() || "your account"}</span>.
        </p>

        {feedback && (
          <div
            role="alert"
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : feedback.type === "pending"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            {feedback.message}
          </div>
        )}

        {isRedirecting ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-6 text-sm text-muted">
            <p>Redirecting to your dashboard…</p>
          </div>
        ) : (
          <form className="mt-7 space-y-6" onSubmit={handleVerifyOtp} noValidate>
            <div>
              <OtpCodeInput
                ref={otpInputRef}
                id="login-otp-code"
                label="Authentication Code"
                value={otpCode}
                onChange={(code) => {
                  setOtpCode(code);
                  if (otpError) setOtpError(undefined);
                }}
                // Submits on its own once the sixth digit is in — no extra click.
                onComplete={(code) => void verifyOtp(code)}
                invalid={otpError !== undefined}
                disabled={isVerifyingOtp}
                describedBy={otpError ? "login-otp-error" : "login-otp-hint"}
              />

              {otpError ? (
                <p
                  id="login-otp-error"
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                >
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.5v5.5M12 16.5h.01" strokeLinecap="round" />
                  </svg>
                  <span>{otpError}</span>
                </p>
              ) : (
                <p id="login-otp-hint" className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="relative h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-brand-purple/10"
                    >
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue transition-[width] duration-1000 ease-linear"
                        style={{ width: `${(otpSecondsLeft / 30) * 100}%` }}
                      />
                    </span>
                    <span className="whitespace-nowrap">
                      New code in <span className="font-semibold tabular-nums text-ink">{otpSecondsLeft}s</span>
                    </span>
                  </span>
                  <span className="whitespace-nowrap">Submits automatically</span>
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isVerifyingOtp}
              aria-busy={isVerifyingOtp}
              className="flex w-full shadow-sm"
            >
              {isVerifyingOtp && <Spinner />}
              {isVerifyingOtp ? "Verifying…" : "Verify"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep("credentials")}
              disabled={isVerifyingOtp}
              className="flex w-full"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to login
            </Button>
          </form>
        )}
      </AuthShell>
      </>
    );
  }

  return (
    <>
    {dimVisible && <LoadingDim label="Signing in…" />}
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
          className={`mt-4 rounded-[10px] border px-4 py-3 text-sm ${feedback.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : feedback.type === "pending"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
          {feedback.message}
        </div>
      )}

      {isRedirecting ? (
        <div className="mt-8 flex flex-col items-center gap-3 py-6 text-sm text-muted">
          <p>Redirecting to your dashboard…</p>
        </div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <FormField
            id="login-identifier"
            name="username"
            label="Email"
            value={identifier}
            onChange={setIdentifier}
            placeholder="name@company.com"
            icon={<PersonIcon className="h-4 w-4" />}
            autoComplete="username"
            error={errors.identifier}
          />

          <PasswordField
            id="login-password"
            name="password"
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
              {/* A checkbox primitive does not exist yet. Radix's renders a
                  <button role="checkbox"> rather than an <input>, which moves
                  pixels and changes what getByLabelText matches — neither
                  belongs in a phase whose contract is that nothing visibly
                  changes. Scheduled with the rest of the form controls; see
                  ADR-104 §4.3. */}
              {/* eslint-disable-next-line react/forbid-elements */}
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-brand-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-brand-purple hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple rounded"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="flex w-full">
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Signing in…" : "Login"}
          </Button>

          {isGoogleSignInConfigured && (
            <>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              {/* Its hover was `bg-gray-50`, where the other outline button on
                  this page used `bg-page`. Two buttons meant to look alike that
                  did not, which is the kind of thing a shared variant exists to
                  stop; both are now the product's `bg-page`. The only
                  intentional pixel change in the ADR-104 phase 1 migration. */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting}
                aria-busy={isGoogleSubmitting}
                className="flex w-full gap-3"
              >
                {isGoogleSubmitting ? <Spinner /> : <GoogleIcon className="h-5 w-5" aria-hidden="true" />}
                {isGoogleSubmitting ? "Signing in…" : "Continue with Google"}
              </Button>
            </>
          )}
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-purple hover:underline">
          Register
        </Link>
      </p>
    </AuthShell>
    </>
  );
}

/**
 * Seconds until the authenticator app shows its next code — TOTP steps are
 * fixed 30-second windows of Unix time (RFC 6238), so this needs nothing from
 * the server. Ticks only while `active`.
 */
function useTotpSecondsLeft(active: boolean): number {
  const compute = () => 30 - (Math.floor(Date.now() / 1000) % 30);
  const [left, setLeft] = useState(compute);
  useEffect(() => {
    if (!active) return;
    setLeft(compute());
    const id = setInterval(() => setLeft(compute()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return left;
}

export default function LoginPage() {
  // useSearchParams() requires a Suspense boundary in the App Router so the
  // page can still be prerendered; the fallback is never visible in
  // practice for a client-side navigation, only briefly on a hard load.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
