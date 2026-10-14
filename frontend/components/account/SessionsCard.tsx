"use client";

import { ActiveSessions } from "@/components/settings/ActiveSessions";

/**
 * `/account/settings#security` (the Sessions part) — the same Active sessions list as the
 * Security section on `/settings`, reused as-is so the two pages can never
 * drift apart: every signed-in device, with a per-device sign-out.
 */
export function SessionsCard() {
  return (
    <section id="sessions" className="scroll-mt-24 rounded-xl border border-surface-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Sessions</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Devices signed in to your account.</p>
      <div className="mt-1">
        <ActiveSessions />
      </div>
    </section>
  );
}
