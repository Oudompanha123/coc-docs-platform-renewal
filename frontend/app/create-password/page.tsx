"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/FormField";
import { LockIcon } from "@/components/auth/icons";
import { AuthApiError, changePassword } from "@/lib/auth/api";
import { SessionProvider, useSession } from "@/lib/auth/SessionProvider";

type Errors = Partial<Record<"temporaryPassword" | "password" | "confirmPassword", string>>;

/**
 * Create New Password — POST /api/v1/auth/change-password (revision of
 * ADR-017; temporary-password field added by ADR-024). The first-login
 * completion step for an account a super_admin invited with a temporary
 * password: the caller already holds a session (issued on that temporary
 * password by /login-password or /google), and this is how
 * `mustChangePassword` turns false.
 *
 * Reachable only while signed in and still under the gate — an anonymous
 * visitor is sent to /login, and someone who has already completed this step
 * (or never needed to) is sent to /overview. `RequireSession` performs the
 * same check the other direction: it sends a `mustChangePassword` caller
 * here from every other admin page, so this is the one page allowed to
 * render without going through it.
 *
 * Unlike Reset Password, a successful change does not sign the caller out —
 * the backend keeps this exact session alive and only revokes the others —
 * so this page sends them on to /overview rather than back to /login.
 *
 * The temporary password field re-proves the credential /login-password
 * already verified moments earlier on this same session — ADR-022 originally
 * exempted this page from sending any `currentPassword` at all; ADR-024
 * reverses that on direct PM request, so this now behaves like the voluntary
 * `ChangePasswordForm`'s "Current Password" field, just labeled for what a
 * just-invited user actually holds.
 *
 * // req: FR-AUTH-002, FR-AUTH-007, ADR-017, ADR-022, ADR-024
 */
function CreatePasswordForm() {
  const router = useRouter();
  const { status, user } = useSession();

  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    } else if (status === "authenticated" && user && !user.mustChangePassword) {
      // Already done — either just now, or this account never needed it.
      router.replace("/overview");
    }
  }, [status, user, router]);

  function validate() {
    const next: Errors = {};
    if (!temporaryPassword) next.temporaryPassword = "Enter your temporary password.";
    if (!password) next.password = "Create a new password.";
    else if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (!confirmPassword) next.confirmPassword = "Confirm your new password.";
    else if (password && confirmPassword && password !== confirmPassword) {
      next.confirmPassword = "Passwords don't match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const message = await changePassword(password, confirmPassword, temporaryPassword);
      setFeedback({ type: "success", message });
      // A brief pause so the confirmation is actually readable, then on to
      // the workspace — the session from signing in with the temporary
      // password is still the one in effect; nothing else to sign in with.
      setTimeout(() => router.push("/overview"), 1200);
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : "Something went wrong. Please try again.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Nothing to show while the redirects above are still deciding, or once
  // they have — showing the form first would flash a page this visitor is
  // about to be sent away from.
  if (status !== "authenticated" || !user?.mustChangePassword) {
    return null;
  }

  return (
    <AuthShell
      icon={<LockIcon className="h-6 w-6 text-brand-purple md:h-7 md:w-7" />}
      heading="Create New Password"
      subheading="For security, you must set a new password before continuing. Your temporary password can only be used once."
    >
      <h1 className="text-3xl font-extrabold text-ink">Create New Password</h1>
      <p className="mt-2 text-sm text-muted">This replaces the temporary password you were emailed.</p>

      {feedback && (
        <div
          role="alert"
          className={`mt-4 rounded-[10px] border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <PasswordField
          label="Temporary Password"
          value={temporaryPassword}
          onChange={setTemporaryPassword}
          placeholder="Enter the temporary password you were emailed"
          icon={<LockIcon className="h-4 w-4" />}
          autoComplete="current-password"
          error={errors.temporaryPassword}
        />

        <PasswordField
          label="New Password"
          value={password}
          onChange={setPassword}
          placeholder="Create a new password"
          icon={<LockIcon className="h-4 w-4" />}
          autoComplete="new-password"
          error={errors.password}
        />

        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm your new password"
          icon={<LockIcon className="h-4 w-4" />}
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          disabled={isSubmitting || feedback?.type === "success"}
          aria-busy={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating…" : "Create Password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function CreatePasswordPage() {
  return (
    <SessionProvider>
      <CreatePasswordForm />
    </SessionProvider>
  );
}
