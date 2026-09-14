"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { LockIcon, MailIcon } from "@/components/auth/icons";
import { AuthApiError, forgotPassword } from "@/lib/auth/api";

/**
 * Forgot Password — POST /api/v1/auth/forgot-password (ADR-018).
 *
 * Always shows the same success message on a 200, whatever actually
 * happened server-side: an unknown address, an account that only ever
 * signed in via Google, and a genuinely emailed reset link are
 * indistinguishable from here on purpose (ADR-018 decision 3, the same
 * anti-enumeration principle the login form already follows). This page
 * never claims to know whether an email was actually sent.
 *
 * // req: FR-AUTH-002, ADR-014, ADR-018
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
    // A light client-side shape check only — advisory, like the rest of this
    // frontend's validation. The backend's @Email annotation is authoritative.
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
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
      icon={<LockIcon className="h-6 w-6 text-brand-purple md:h-7 md:w-7" />}
      heading="Forgot Password?"
      subheading="No worries. Enter the email you signed up with and we'll send you a link to reset your password."
    >
      <h1 className="text-3xl font-extrabold text-ink">Forgot Password</h1>
      <p className="mt-2 text-sm text-muted">We&apos;ll email you a link to reset it</p>

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
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
          icon={<MailIcon className="h-4 w-4" />}
          autoComplete="email"
          error={error}
        />

        <button
          type="submit"
          disabled={isSubmitting || feedback?.type === "success"}
          aria-busy={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-brand-purple hover:underline">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}
