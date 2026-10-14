"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SkeletonGroup, SkeletonList } from "@/components/ui/skeleton";
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
      className="scroll-mt-24 rounded-xl border border-surface-border bg-card p-5"
    >
      <h2 className="text-base font-semibold text-foreground">Connected accounts</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Accounts linked to your profile.</p>

      <div className="mt-4">
        {state.kind === "loading" && <SkeletonGroup label="Loading connected accounts"><SkeletonList rows={2} /></SkeletonGroup>}
        {state.kind === "error" && <p className="text-sm text-danger">{state.message}</p>}

        {state.kind === "linked" && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-surface-border px-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                <LinkIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">HRMS KOSIGN</p>
                {state.employeeName && <p className="text-xs text-muted-foreground">{state.employeeName}</p>}
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#e1f5ec] px-2.5 py-0.5 text-xs font-medium text-[#1f9d6b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
              Linked
            </span>
          </div>
        )}

        {state.kind === "not-linked" && (
          <Alert
            variant="warning"
            action={
              <span className="inline-flex shrink-0 items-center rounded-full bg-[#f5d896]/60 px-2.5 py-0.5 text-xs font-medium text-[#b45309]">
                Not linked
              </span>
            }
          >
            <AlertTitle className="font-semibold">HRMS KOSIGN — not linked</AlertTitle>
            <AlertDescription className="text-xs">
              Your attendance can&apos;t be shown until an admin links your account.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </section>
  );
}
