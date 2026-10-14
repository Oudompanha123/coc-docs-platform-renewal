"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/FormField";
import { LockIcon } from "@/components/auth/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AuthApiError, resetPassword } from "@/lib/auth/api";
import { isPasswordAcceptable, passwordViolations } from "@/lib/auth/passwordPolicy";

type Errors = Partial<Record<"password" | "confirmPassword", string>>;

/**
 * Reset Password — POST /api/v1/auth/reset-password (ADR-018, revised by
 * ADR-029).
 *
 * Reads `token` from the URL the emailed link pointed at
 * (/reset-password?token=<...>) and never asks the visitor to type it in.
 * Unlike Forgot Password, a rejected token here is shown plainly — the
 * visitor already holds a value that came from their own email, so telling
 * them it's invalid or expired discloses nothing about anyone else's account
 * (ADR-018 decision 3).
 *
 * Doubles as "set your first password" for a Google-only account, since
 * ADR-029 — the backend decides which of the two this is and returns a
 * message worded accordingly ("...has been set..." vs "...has been
 * reset..."); this page just shows whatever `resetPassword()` resolves
 * with rather than assuming either wording itself.
 *
 * A successful reset does not sign the caller in — the backend never sets a
 * session cookie here, matching Register's "this never signs you in either"
 * convention — so this page sends them to /login to do that.
 *
 * // req: FR-AUTH-002, FR-AUTH-007, ADR-018, ADR-029
 */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function validate() {
    const next: Errors = {};
    if (!password) next.password = "Create a new password.";
    else if (!isPasswordAcceptable(password)) next.password = passwordViolations(password).join(" ");
    if (!confirmPassword) next.confirmPassword = "Confirm your new password.";
    else if (password && confirmPassword && password !== confirmPassword) {
      next.confirmPassword = "Passwords don't match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const message = await resetPassword(token, password);
      setFeedback({ type: "success", message });
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : "Something went wrong. Please try again.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      icon={<LockIcon className="size-5" />}
      heading="Reset Password"
      subheading="Create a new password for your account. Make it something you'll remember."
    >
      {!token && (
        <Alert variant="destructive" className="mb-6">
          This reset link is missing its token. Request a new one from{" "}
          <Link href="/forgot-password" className="font-medium underline underline-offset-4">
            Forgot Password
          </Link>
          .
        </Alert>
      )}

      {feedback && (
        <Alert
          role="alert"
          variant={feedback.type === "success" ? "success" : "destructive"}
          className="mb-4"
        >
          {feedback.message}
        </Alert>
      )}

      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <PasswordField
          label="New Password"
          value={password}
          onChange={setPassword}
          placeholder="Create a new password"
          autoComplete="new-password"
          error={errors.password}
        />

        <PasswordField
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm your new password"
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        <Button shape="pill"
          type="submit"
          disabled={isSubmitting || !token || feedback?.type === "success"}
          aria-busy={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Resetting…" : "Reset Password"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Remember your password?{" "}
        <Link href="/login" className="text-foreground font-medium underline underline-offset-4">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams() requires a Suspense boundary in the App Router so the
  // page can still be prerendered; the fallback is never visible in
  // practice for a client-side navigation, only briefly on a hard load.
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
