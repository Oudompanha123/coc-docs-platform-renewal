"use client";

import { useState, type FormEvent } from "react";
import { PasswordField } from "./FormField";
import { Button } from "@/components/ui/button";
import { AuthApiError, changePassword } from "@/lib/auth/api";
import { isPasswordAcceptable, passwordViolations } from "@/lib/auth/passwordPolicy";

type Errors = Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;

/**
 * Current / new / confirm — the voluntary "My Profile" and Settings →
 * Security change-password form (ADR-022). Shared by {@code ProfileModal}
 * and {@code SecurityTab}, whose "Change password" buttons were both dead
 * until this existed.
 *
 * Never used for the forced first-login completion (that one is
 * `/create-password`, which collects the temporary password itself and
 * calls {@link changePassword} with that as {@code currentPassword} — see
 * ADR-024). Within this voluntary form there are still two callers,
 * distinguished by {@code hasPassword}:
 *
 * - An account with a password already (the common case): the "Current
 *   Password" field is rendered and required, and sent as
 *   {@code currentPassword}.
 * - A Google-only account (ADR-030): the field is omitted entirely — not
 *   merely left optional — since there is no current password to prove,
 *   and {@code changePassword} is called with no {@code currentPassword} at
 *   all.
 *
 * Either way the backend is the one that actually verifies (or skips
 * verifying) the value against the stored hash — see
 * {@code SessionService.changeOwnPassword}.
 *
 * // req: FR-AUTH-002, FR-AUTH-007, ADR-017, ADR-020, ADR-022, ADR-024, ADR-030
 */
export function ChangePasswordForm({
  hasPassword,
  onSuccess,
  onCancel,
}: {
  /** False for a Google-only account (ADR-030) — see the class javadoc above. */
  hasPassword: boolean;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function validate() {
    const next: Errors = {};
    if (hasPassword && !currentPassword) next.currentPassword = "Enter your current password.";
    if (!newPassword) next.newPassword = "Create a new password.";
    else if (!isPasswordAcceptable(newPassword)) next.newPassword = passwordViolations(newPassword).join(" ");
    if (!confirmPassword) next.confirmPassword = "Confirm your new password.";
    else if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      next.confirmPassword = "Passwords don't match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const message = await changePassword(
        newPassword,
        confirmPassword,
        hasPassword ? currentPassword : undefined,
      );
      onSuccess(message);
    } catch (err) {
      setFormError(err instanceof AuthApiError ? err.message : "Couldn't change your password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {hasPassword && (
        <PasswordField
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Enter your current password"
          autoComplete="current-password"
          error={errors.currentPassword}
        />
      )}
      <PasswordField
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
        placeholder="Create a new password"
        autoComplete="new-password"
        error={errors.newPassword}
      />
      <PasswordField
        label="Confirm New Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Confirm your new password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      {formError && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-dash-ink">
          Cancel
        </Button>
        {/* Gains a visible focus ring and a hover state, neither of which it
            had: this pair was written without the `focus-visible:` classes
            every other button in the area carries, so it was unreachable to
            see by keyboard. Both come from the shared variant now (ADR-104). */}
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} size="sm">
          {isSubmitting ? "Saving…" : "Save password"}
        </Button>
      </div>
    </form>
  );
}
