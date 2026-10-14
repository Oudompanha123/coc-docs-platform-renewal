"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { LockIcon } from "@/components/auth/icons";
import { Button } from "@/components/ui/button";
import { AuthApiError, forgotPassword } from "@/lib/auth/api";
import { emailViolations, isEmailAcceptable } from "@/lib/auth/emailPolicy";

/**
 * Forgot Password — POST /api/v1/auth/forgot-password (ADR-018, revised by
 * ADR-019 and ADR-029).
 *
 * Shows the same success message on a 200 for every case except one: an
 * account that only ever signed in via Google and a genuinely emailed reset
 * link are still indistinguishable from here on purpose (ADR-018 decision
 * 3, the same anti-enumeration principle the login form follows) — and,
 * since ADR-029, both cases really do get emailed a link now (a Google-only
 * account uses it to set its first password rather than reset an existing
 * one; the backend decides which and this page shows whatever message it
 * sends back either way). An address with no account at all is no longer
 * folded into that — the backend now answers with a 404, `forgotPassword()`
 * throws its exact message ("No account found with this email address."),
 * and the existing catch block below shows it as an error, same as any
 * other rejection (ADR-019 — a deliberate, explicit product decision to
 * accept the enumeration risk on this one endpoint; see the ADR for what
 * that costs).
 *
 * // req: FR-AUTH-002, ADR-014, ADR-018, ADR-019, ADR-029
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function validate() {
    if (!email.trim()) {
      setError("Enter your email.");
      return false;
    }
    // Advisory, like the rest of this frontend's validation — the backend's
    // @ValidEmail is authoritative (ADR-088). The hand-rolled \S+@\S+\.\S+
    // this replaces was one of three different shapes across the forms, which
    // is how "valid" came to mean something different on each screen.
    if (!isEmailAcceptable(email)) {
      setError(emailViolations(email).join(" "));
      return false;
    }
    setError(undefined);
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const message = await forgotPassword(email.trim());
      setFeedback({ type: "success", message });
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
      heading="Forgot Password?"
      subheading="No worries. Enter the email you signed up with and we'll send you a link to reset your password."
    >
      {feedback && (
        <div
          role="alert"
          className={`mb-4 rounded-md border px-3 py-2 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
          autoComplete="email"
          error={error}
        />

        <Button shape="pill"
          type="submit"
          disabled={isSubmitting || feedback?.type === "success"}
          aria-busy={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Sending…" : "Send Reset Link"}
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
