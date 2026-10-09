"use client";

import { LinkIcon } from "@/components/layout/icons";

export type HrmsLinkState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "linked"; employeeName: string | null }
  | { kind: "not-linked" };

/**
 * One row: HRMS KOSIGN, linked or not. Sourced from `GET /api/v1/me/attendance`
 * (`viewerLinked` — see that endpoint's own doc comment) rather than a
 * dedicated "my HRMS link" endpoint, since no such endpoint exists and this
 * one already answers the question. `employeeName` is the matched row's own
 * name for today's report when one exists — null (linked, name omitted) on
 * a day with nothing recorded (a weekend, a holiday), which is an honest gap
 * rather than something to fetch a second way.
 */
export function ConnectedAccountsCard({ state }: { state: HrmsLinkState }) {
  return (
    <section
      id="connected-accounts"
      className="scroll-mt-24 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="text-base font-bold text-dash-ink">Connected accounts</h2>
      <p className="mt-0.5 text-sm text-muted">Accounts linked to your profile.</p>

      <div className="mt-5">
        {state.kind === "loading" && <p className="text-sm text-muted">Loading…</p>}
        {state.kind === "error" && <p className="text-sm text-danger">{state.message}</p>}

        {state.kind === "linked" && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                <LinkIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dash-ink">HRMS KOSIGN</p>
                {state.employeeName && <p className="text-xs text-muted">{state.employeeName}</p>}
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#e1f5ec] px-2.5 py-1 text-xs font-semibold text-[#1f9d6b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
              Linked
            </span>
          </div>
        )}

        {state.kind === "not-linked" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f5d896] bg-[#fffbeb] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#b45309]">HRMS KOSIGN — not linked</p>
              <p className="mt-0.5 text-xs text-[#b45309]">
                Your attendance can&apos;t be shown until an admin links your account.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full bg-[#f5d896]/60 px-2.5 py-1 text-xs font-semibold text-[#b45309]">
              Not linked
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
