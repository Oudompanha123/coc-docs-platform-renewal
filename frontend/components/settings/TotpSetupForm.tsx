"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CodeField, PasswordField } from "@/components/auth/FormField";
import { LockIcon } from "@/components/auth/icons";
import { Button } from "@/components/ui/button";
import { AuthApiError, disableMfa, startMfaSetup, verifyMfaSetup, type MfaSetupMaterial } from "@/lib/auth/api";

const CODE_FIELD_ID = "totp-setup-code";

/**
 * The guided TOTP setup wizard (ADR-031): QR code, manual-entry secret, and
 * the confirmation code — everything "Setup OTP" means once a session
 * already exists, which is the only place it can mean anything (a login
 * page has no account to enroll yet; see {@code app/login/page.tsx}'s
 * disclosure instead of a form).
 *
 * The secret is fetched once, on mount, and never re-fetched by this
 * component — {@code startMfaSetup} mints a fresh one each call, so
 * re-running it would invalidate whatever the person already scanned.
 *
 * // req: FR-AUTH-009, ADR-031
 */
export function TotpSetupWizard({
  onEnabled,
  onCancel,
}: {
  onEnabled: (message: string) => void;
  onCancel: () => void;
}) {
  const [material, setMaterial] = useState<MfaSetupMaterial | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    startMfaSetup()
      .then((result) => {
        if (!cancelled) setMaterial(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof AuthApiError ? err.message : "Couldn't start two-factor setup. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setCodeError("Enter the 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setCodeError(undefined);
    try {
      const message = await verifyMfaSetup(code);
      onEnabled(message);
    } catch (err) {
      // A wrong code is almost always a mistyped digit or clock drift, not
      // an expired one -- unlike an emailed code, there is nothing here to
      // separately call "expired" (ADR-031).
      setCodeError(err instanceof AuthApiError ? err.message : "Couldn't verify that code. Please try again.");
      // Cleared and refocused so the next code can be typed straight away,
      // the same as the sign-in and registration code steps.
      setCode("");
      document.getElementById(CODE_FIELD_ID)?.focus();
    } finally {
      setIsVerifying(false);
    }
  }

  if (loadError) {
    return (
      <div className="mt-4 max-w-sm space-y-3">
        <p role="alert" className="rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {loadError}
        </p>
        <Button type="button" variant="outline" size="xs" onClick={onCancel} className="text-dash-ink">
          Cancel
        </Button>
      </div>
    );
  }

  if (!material) {
    return <p className="mt-4 text-xs text-muted">Preparing your setup…</p>;
  }

  return (
    <div className="mt-4 max-w-sm space-y-4">
      <div className="rounded-[10px] border border-border p-4">
        <p className="text-xs font-semibold text-dash-ink">1. Scan this QR code with Google Authenticator</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- a data: URI, not a remote image next/image can optimize */}
        <img
          src={material.qrCodeDataUri}
          alt="Scan this QR code with your authenticator app"
          className="mx-auto mt-3 h-40 w-40"
        />
        <p className="mt-3 text-xs text-muted">
          Open Google Authenticator, tap &ldquo;+&rdquo;, then &ldquo;Scan a QR code&rdquo;. Can&apos;t scan it? Enter
          this key manually instead:
        </p>
        <code className="mt-2 block break-all rounded-lg bg-page px-2 py-1.5 text-xs text-dash-ink">
          {material.secret}
        </code>
      </div>

      <form onSubmit={handleVerify} className="space-y-3" noValidate>
        <p className="text-xs font-semibold text-dash-ink">2. Enter the 6-digit code it shows</p>
        <CodeField id={CODE_FIELD_ID} label="Verification Code" value={code} onChange={setCode} error={codeError} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="xs" onClick={onCancel} className="text-dash-ink">
            Cancel
          </Button>
          <Button type="submit" size="xs" disabled={isVerifying} aria-busy={isVerifying}>
            {isVerifying ? "Verifying…" : "Verify & turn on"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Turns TOTP off (ADR-031). Requires the current password — verified
 * server-side ({@code TotpService.disable}) — the same reasoning {@link
 * ChangePasswordForm}'s current-password check already follows for a
 * security-lowering self-service action.
 */
export function TotpDisableForm({
  onDisabled,
  onCancel,
}: {
  onDisabled: (message: string) => void;
  onCancel: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);
    try {
      const message = await disableMfa(currentPassword);
      onDisabled(message);
    } catch (err) {
      setError(
        err instanceof AuthApiError ? err.message : "Couldn't turn off two-factor authentication. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-3" noValidate>
      <PasswordField
        label="Current Password"
        value={currentPassword}
        onChange={setCurrentPassword}
        placeholder="Enter your current password"
        icon={<LockIcon className="h-4 w-4" />}
        autoComplete="current-password"
        error={error}
      />
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="xs" onClick={onCancel} className="text-dash-ink">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="destructiveOutline"
          size="xs"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="rounded-full"
        >
          {isSubmitting ? "Turning off…" : "Turn off"}
        </Button>
      </div>
    </form>
  );
}
