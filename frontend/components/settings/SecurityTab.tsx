"use client";

import { useState } from "react";
import { GoogleIcon, LockIcon, ShieldIcon } from "@/components/auth/icons";
import { PulseIcon } from "@/components/layout/icons";
import type { ActiveSession } from "@/lib/mock/settings";

/**
 * Password change is a UI stub, not a real flow — Coc Docs Platform is
 * Google OIDC-only and stores no passwords (ADR-008, ADR-011, FR-AUTH-002;
 * backend/.../account/Account.java has no password field at all). Same
 * precedent as app/login/page.tsx's own password form: built to match an
 * explicit design request, not backed by a real credential path.
 *
 * 2FA toggle and per-session sign-out are local-state mock only, same
 * fidelity as NotificationsCard.
 *
 * Sub-sections are plain divided rows, not their own nested white cards —
 * this whole component lives inside one SettingsCard, and several
 * cards-within-a-card would read as visual clutter, not hierarchy. Danger
 * zone stays visually distinct (red-tinted inset block) as required.
 */
export function SecurityTab({ sessions: initialSessions }: { sessions: ActiveSession[] }) {
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessions, setSessions] = useState(initialSessions);

  function signOutSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="divide-y divide-border">
        {/* Password */}
        <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
              <LockIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dash-ink">Password</p>
              <p className="text-xs text-muted">Coc Docs Platform sign-in uses Google — there is no password to manage here.</p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
          >
            Change password
          </button>
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

        {/* Two-factor authentication */}
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
              <ShieldIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dash-ink">Two-factor authentication</p>
              <p className="text-xs text-muted">Add an extra step when signing in.</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={twoFactor}
            aria-label="Toggle two-factor authentication"
            onClick={() => setTwoFactor((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple ${
              twoFactor ? "bg-gradient-to-r from-brand-purple to-brand-blue" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${
                twoFactor ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
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
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-dash-ink">
                    {session.device}
                    {session.isCurrent && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-semibold text-brand-blue">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {session.location} · {session.lastActive}
                  </p>
                </div>
                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() => signOutSession(session.id)}
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

      {/* Danger zone */}
      <div className="rounded-xl border border-danger/40 bg-danger/5 p-4">
        <p className="text-sm font-semibold text-danger">Danger zone</p>
        <div className="mt-3 divide-y divide-danger/20">
          <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
            <div>
              <p className="text-sm font-semibold text-dash-ink">Export your data</p>
              <p className="text-xs text-muted">Download a copy of your profile and activity.</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
            >
              Export data
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
            <div>
              <p className="text-sm font-semibold text-dash-ink">Deactivate your account</p>
              <p className="text-xs text-muted">You&apos;ll lose access; your content and audit history are preserved.</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full border border-danger px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
            >
              Deactivate account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
