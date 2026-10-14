"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { LockIcon, ShieldIcon } from "@/components/auth/icons";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { ChevronDownIcon } from "@/components/layout/icons";
import { TotpDisableForm, TotpSetupWizard } from "@/components/settings/TotpSetupForm";
import { getMfaStatus } from "@/lib/auth/api";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * Password and two-factor authentication — on the Security tab of
 * `/account/settings`, between the sign-in history and Sessions. The
 * same controls as the admin `/settings` Security accordion (`SecurityTab`),
 * which keeps its own copy: this one reaches every signed-in role, including
 * those the admin shell doesn't admit.
 *
 * Password change is real (ADR-014, ADR-017, ADR-022): "Set password" instead
 * for a Google-only account, which has none to change yet (ADR-030). Shares
 * {@code ChangePasswordForm} with {@code ProfileModal}'s equivalent section.
 *
 * Two-factor authentication (ADR-031): the "On" pill reflects {@code GET
 * /api/v1/auth/mfa/status}, and the row is a chevron disclosure rather than a
 * switch, since neither direction changes anything in one click — turning it
 * on opens {@link TotpSetupWizard} (QR code, manual secret, confirmation
 * code), turning it off opens {@link TotpDisableForm} (current password
 * required).
 *
 * The 2FA row is disabled — not hidden — for an account with no password
 * (`user.hasPassword` false): TOTP only ever gates `/login-password`
 * (ADR-031's scope decision), so a Google-only account has no password
 * sign-in for it to protect yet. The backend enforces the same rule
 * independently (`TotpService.startSetup`).
 */
export function PasswordSecurityCard() {
  const { user } = useSession();

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  // ADR-031: reflects GET /api/v1/auth/mfa/status. Defaults to false while
  // that call is in flight.
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMode, setMfaMode] = useState<"idle" | "enabling" | "disabling">("idle");
  const [mfaNotice, setMfaNotice] = useState<string | null>(null);

  useEffect(() => {
    getMfaStatus()
      .then(setMfaEnabled)
      .catch(() => {
        // Left false. The row is still usable -- turning it on calls
        // startMfaSetup, which reports its own failure if the backend is
        // genuinely unreachable.
      });
  }, []);

  return (
    <section id="password-2fa" className="scroll-mt-24 rounded-xl border border-surface-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Password &amp; two-factor authentication</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Manage how you sign in with your email and password.</p>

      <div className="mt-5 divide-y divide-surface-border">
        <div className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted-surface text-foreground">
                <LockIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Password</p>
                <p className="text-xs text-muted-foreground">
                  {passwordNotice ??
                    (user?.hasPassword
                      ? <>Keep your account secure with a <strong>strong password</strong>.</>
                      : <>You signed in with <strong>Google</strong>. Add a <strong>password</strong> to also sign in with your email.</>)}
                </p>
              </div>
            </div>
            {!changingPassword && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setChangingPassword(true);
                  setPasswordNotice(null);
                }}
                className="shrink-0"
              >
                {user?.hasPassword ? "Change password" : "Set password"}
              </Button>
            )}
          </div>
          {changingPassword && (
            <div className="mt-4 max-w-sm">
              <ChangePasswordForm
                hasPassword={user?.hasPassword ?? false}
                onSuccess={(message) => {
                  setChangingPassword(false);
                  setPasswordNotice(message);
                }}
                onCancel={() => setChangingPassword(false)}
              />
            </div>
          )}
        </div>

        <div className="pt-4">
          {/* A disclosure row, not an action: the whole row toggles the panel under it. */}
          {/* eslint-disable-next-line react/forbid-elements */}
          <button
            type="button"
            aria-expanded={mfaMode !== "idle"}
            aria-label="Two-factor authentication"
            disabled={!user?.hasPassword}
            onClick={() => {
              setMfaNotice(null);
              setMfaMode((current) => (current === "idle" ? (mfaEnabled ? "disabling" : "enabling") : "idle"));
            }}
            className="flex w-full items-center justify-between gap-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted-surface text-foreground">
                <ShieldIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">
                  {mfaNotice ??
                    (user?.hasPassword
                      ? "Add an extra step when signing in."
                      : <>Set a <strong>password</strong> first to turn this on — it protects <strong>password sign-in</strong> only.</>)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {mfaEnabled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e1f5ec] px-2.5 py-1 text-xs font-semibold text-[#1f9d6b]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
                  On
                </span>
              )}
              <ChevronDownIcon
                className={`h-5 w-5 text-muted transition-transform ${mfaMode !== "idle" ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {mfaMode === "enabling" && (
            <TotpSetupWizard
              onEnabled={(message) => {
                setMfaEnabled(true);
                setMfaMode("idle");
                setMfaNotice(message);
              }}
              onCancel={() => setMfaMode("idle")}
            />
          )}
          {mfaMode === "disabling" && (
            <TotpDisableForm
              onDisabled={(message) => {
                setMfaEnabled(false);
                setMfaMode("idle");
                setMfaNotice(message);
              }}
              onCancel={() => setMfaMode("idle")}
            />
          )}
        </div>
      </div>
    </section>
  );
}
