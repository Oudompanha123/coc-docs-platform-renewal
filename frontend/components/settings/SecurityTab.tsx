"use client";

import { useEffect, useState } from "react";
import { GoogleIcon, LockIcon, ShieldIcon } from "@/components/auth/icons";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { ChevronDownIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { TotpDisableForm, TotpSetupWizard } from "@/components/settings/TotpSetupForm";
import { ActiveSessions } from "@/components/settings/ActiveSessions";
import { getMfaStatus } from "@/lib/auth/api";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * Password change is real (ADR-014, ADR-017, ADR-022) — the "Google-only, no
 * password to manage" copy this section carried predates ADR-014/ADR-020's
 * password support and is corrected here, alongside wiring the button that
 * was always dead. Shares {@code ChangePasswordForm} with {@code
 * ProfileModal}'s equivalent section.
 *
 * Two-factor authentication (ADR-031) is real too, as of the same change
 * that corrected the copy above: an "On" pill reflects {@code GET
 * /api/v1/auth/mfa/status} (styled after the Authentication row's own
 * "Connected" pill just above, same green/dot treatment), and the whole row
 * is a chevron disclosure — matching the outer Security accordion's own
 * header pattern (AccordionSection) rather than a switch, since clicking it
 * never flips the state instantly either way: turning it on opens
 * {@link TotpSetupWizard} (QR code, manual secret, confirmation code) and
 * turning it off opens {@link TotpDisableForm} (current password required) —
 * both still require a second step before anything actually changes. It used
 * to be local-state mock only, same fidelity as NotificationsCard —
 * per-session sign-out above is the one remaining place that's still real
 * from before.
 *
 * <p>The row is disabled — not hidden — for an account with no password
 * (`user.hasPassword` false): TOTP only ever gates `/login-password`
 * (ADR-031's own scope decision), so there is no password sign-in on a
 * Google-only account for it to protect yet. Disabled-with-an-explanation
 * matches this section's own existing convention for the Password row just
 * above, rather than hiding the row and leaving someone to wonder where it
 * went. The backend enforces the same rule independently
 * (`TotpService.startSetup`) — this is not solely a client-side gate.
 *
 * Sub-sections are plain divided rows, not their own nested white cards —
 * this whole component lives inside one accordion section, and several
 * cards-within-a-card would read as visual clutter, not hierarchy. Danger
 * zone moved out to its own top-level DangerZoneCard, matching the
 * reference layout's separate red card rather than an inset block here.
 */
export function SecurityTab() {
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
        // Left false. The toggle is still usable -- turning it on calls
        // startMfaSetup, which reports its own failure if the backend is
        // genuinely unreachable.
      });
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="divide-y divide-border">
        {/* Password (ADR-022) — "Set a password" instead for a Google-only
            account, which has none to change yet (ADR-030). */}
        <div className="py-4 first:pt-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <LockIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dash-ink">Password</p>
                <p className="text-xs text-muted">
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
                size="default"
                onClick={() => {
                  setChangingPassword(true);
                  setPasswordNotice(null);
                }}
                className="shrink-0 rounded-full text-dash-ink"
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

        {/* Authentication — Google is this app's real, only sign-in provider
            (ADR-008/ADR-011, GoogleIdTokenVerifier.java). Not listing
            GitHub/Flow Team here — those aren't real for this product. */}
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <GoogleIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dash-ink">Authentication</p>
              <p className="text-xs text-muted">Google</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e1f5ec] px-2.5 py-1 text-xs font-semibold text-[#1f9d6b]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
            Connected
          </span>
        </div>

        {/* Two-factor authentication (ADR-031). Requires a password: TOTP only
            ever gates /login-password (ADR-031's own scope decision), so a
            Google-only account has no password sign-in for it to protect —
            offering the toggle would turn "on" a control that does nothing
            until they also set a password (ADR-030/ADR-029). */}
        <div className="py-4">
          {/* A disclosure header spanning the whole row, with no button
              styling of its own — same shape as AccordionSection. Phase 3's
              Collapsible (ADR-104 §2.5). */}
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <ShieldIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dash-ink">Two-factor authentication</p>
                <p className="text-xs text-muted">
                  {mfaNotice ??
                    (user?.hasPassword
                      ? "Add an extra step when signing in."
                      : <>Set a <strong>password</strong> first to turn this on — it protects <strong>password sign-in</strong> only.</>)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* Same pill the Authentication row above uses for "Connected" —
                  the only remaining state indicator now that this is a
                  disclosure rather than a switch whose thumb position used
                  to carry that meaning. */}
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

        {/* Active sessions */}
        <ActiveSessions />
      </div>
    </div>
  );
}
