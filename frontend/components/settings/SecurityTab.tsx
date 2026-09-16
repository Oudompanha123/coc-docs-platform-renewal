"use client";

import { useEffect, useState } from "react";
import { GoogleIcon, LockIcon, ShieldIcon } from "@/components/auth/icons";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { PulseIcon } from "@/components/layout/icons";
import { TotpDisableForm, TotpSetupWizard } from "@/components/settings/TotpSetupForm";
import { getMfaStatus, listSessions, revokeSession, type SessionSummary } from "@/lib/auth/api";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * Password change is real (ADR-014, ADR-017, ADR-022) — the "Google-only, no
 * password to manage" copy this section carried predates ADR-014/ADR-020's
 * password support and is corrected here, alongside wiring the button that
 * was always dead. Shares {@code ChangePasswordForm} with {@code
 * ProfileModal}'s equivalent section.
 *
 * Two-factor authentication (ADR-031) is real too, as of the same change
 * that corrected the copy above: the toggle reflects {@code GET
 * /api/v1/auth/mfa/status}, turning it on opens {@link TotpSetupWizard}
 * (QR code, manual secret, confirmation code), and turning it off opens
 * {@link TotpDisableForm} (current password required). It used to be
 * local-state mock only, same fidelity as NotificationsCard — per-session
 * sign-out above is the one remaining place that's still real from before.
 *
 * <p>The toggle is disabled — not hidden — for an account with no password
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
/* The user agent used to be parsed here, into "Chrome on Windows". The server
   sends that string now (SessionResponse.device), because it composes the push
   notification about the same device and the two descriptions have to match —
   a banner saying Chrome beside a list row saying Safari makes a person
   distrust both. The rules live in DeviceDescription.java. */
function formatWhen(iso: string): string {
  const when = new Date(iso);
  return Number.isNaN(when.getTime()) ? "recently" : when.toLocaleString();
}

export function SecurityTab() {
  const { user } = useSession();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  // ADR-031: reflects GET /api/v1/auth/mfa/status. Defaults to false while
  // that call is in flight, same as sessions defaulting to [] above.
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMode, setMfaMode] = useState<"idle" | "enabling" | "disabling">("idle");
  const [mfaNotice, setMfaNotice] = useState<string | null>(null);

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load your sessions."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getMfaStatus()
      .then(setMfaEnabled)
      .catch(() => {
        // Left false. The toggle is still usable -- turning it on calls
        // startMfaSetup, which reports its own failure if the backend is
        // genuinely unreachable.
      });
  }, []);

  async function signOutSession(id: string) {
    // Removed from the list only once the server has revoked it. Dropping it
    // optimistically would show a device as signed out while its session row
    // was still live.
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not end that session.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="divide-y divide-border">
        {/* Password (ADR-022) — "Set a password" instead for a Google-only
            account, which has none to change yet (ADR-030). */}
        <div className="py-4 first:pt-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                <LockIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dash-ink">Password</p>
                <p className="text-xs text-muted">
                  {passwordNotice ??
                    (user?.hasPassword
                      ? "Keep your account secure with a strong password."
                      : "You signed in with Google. Add a password to also sign in with your email.")}
                </p>
              </div>
            </div>
            {!changingPassword && (
              <button
                type="button"
                onClick={() => {
                  setChangingPassword(true);
                  setPasswordNotice(null);
                }}
                className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
              >
                {user?.hasPassword ? "Change password" : "Set password"}
              </button>
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                <ShieldIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dash-ink">Two-factor authentication</p>
                <p className="text-xs text-muted">
                  {mfaNotice ??
                    (user?.hasPassword
                      ? "Add an extra step when signing in."
                      : "Set a password first to turn this on — it protects password sign-in only.")}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={mfaEnabled}
              aria-label="Toggle two-factor authentication"
              disabled={mfaMode !== "idle" || !user?.hasPassword}
              onClick={() => {
                setMfaNotice(null);
                setMfaMode(mfaEnabled ? "disabling" : "enabling");
              }}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple disabled:cursor-not-allowed disabled:opacity-60 ${
                mfaEnabled ? "bg-gradient-to-r from-brand-purple to-brand-blue" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${
                  mfaEnabled ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

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
        <div className="py-4 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
              <PulseIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-dash-ink">Active sessions</p>
          </div>
          <div className="mt-3 divide-y divide-border">
            {loading && <p className="py-3 text-xs text-muted">Loading your sessions…</p>}
            {error && <p className="py-3 text-xs text-danger">{error}</p>}
            {!loading && !error && sessions.length === 0 && (
              <p className="py-3 text-xs text-muted">No other sessions.</p>
            )}
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-dash-ink">
                    {session.device}
                    {session.current && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-semibold text-brand-blue">
                        This device
                      </span>
                    )}
                    {session.newDevice && !session.current && (
                      // The same fact the alert was about, left on the row it
                      // belongs to. Somebody who dismissed the notification, or
                      // never had notifications on, can still see which of
                      // these appeared out of nowhere.
                      <span className="ml-2 inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                        New device
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {session.ipAddress ?? "Unknown address"} · signed in {formatWhen(session.issuedAt)}
                  </p>
                </div>
                {!session.current && (
                  <button
                    type="button"
                    onClick={() => void signOutSession(session.id)}
                    className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page"
                  >
                    Sign out
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
