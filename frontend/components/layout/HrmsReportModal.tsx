"use client";

import { useEffect, useState } from "react";
import { XIcon } from "./icons";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  fetchHrmsReport,
  type HrmsAttendanceCheck,
  type HrmsAttendanceReport,
  type NotificationItem,
} from "@/lib/notify/activity";

/**
 * The attendance table behind an HRMS row in the activity feed.
 *
 * <p><b>Fetched on open, held in this component, gone when it closes.</b> The
 * backend reads the mail for this request and stores none of it (ADR-042), and
 * neither does this: no cache, no context, no `localStorage`. Closing the
 * dialog is what disposes of ~60 colleagues' hours, so nothing here lifts the
 * report into a parent that outlives the dialog.
 *
 * <p>Built on this product's own dialog shell — the `bg-card` /
 * `border-surface-border` / `text-foreground` card every other modal here uses — rather
 * than a palette of its own. That matters beyond consistency: `globals.css`
 * defines its dark-mode overrides per class, so a card pinned to a literal
 * `bg-[#1e2128]` would be the one dialog in the product that ignores the
 * theme. This one follows it.
 *
 * <p>What is kept from the mail is the part that carries meaning: the grey
 * scheduled-time pill, the arrow to what actually happened, and HRMS's own
 * status wording rather than something this product would have chosen. A
 * reader who has seen the email should recognise the line at a glance.
 */
export function HrmsReportModal({
  item,
  onClose,
}: {
  item: NotificationItem;
  onClose: () => void;
}) {
  const [report, setReport] = useState<HrmsAttendanceReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError(null);

    fetchHrmsReport(item.id)
      .then((loaded) => {
        if (!cancelled) setReport(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load that report.");
      });

    return () => {
      cancelled = true;
    };
  }, [item.id]);

  // Escape closes, like every other dialog in this shell.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.summary}
      // Centred both ways. The body below caps itself at 70vh, so the card
      // cannot outgrow the viewport and get its top clipped — which is the
      // usual reason a centred dialog has to be top-aligned instead.
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-xl border border-surface-border bg-card text-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-border px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{item.summary}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              HRMS KOSIGN{report?.reportDate ? ` · ${report.reportDate}` : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{error}</p>
          ) : !report ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Reading the report…</p>
          ) : report.rows.length === 0 && report.details.length === 0 ? (
            // Three different causes of "no rows", and they are not
            // interchangeable:
            //
            //   scoped   -- this report simply has no line for the caller. The
            //               match is on their email address, so there is
            //               nothing for them to configure and nothing for an
            //               administrator to link; saying otherwise sent
            //               people looking for a setting that no longer
            //               decides this.
            //   unscoped -- an admin sees the mail as sent, so an empty table
            //               means the parser lost. Told apart from "nobody was
            //               late" on purpose: a confident empty table would
            //               read as a clean day.
            <p className="py-8 text-center text-sm text-muted-foreground">
              {report.scopedToViewer
                ? "No attendance for you in this report."
                : "This report could not be read — HRMS may have changed its layout."}
            </p>
          ) : (
            <>
              {report.department && (
                <p className="mb-3 list-item list-inside list-disc text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {report.department}
                </p>
              )}

              {/* The other HRMS mails — leave and overtime requests, account
                  created, password reset — are a handful of labelled fields
                  rather than a table. Rendered as text, never as HTML: the
                  sender's markup is not injected into this page, which keeps
                  the no-raw-HTML rule this product holds everywhere else. */}
              {report.details.length > 0 && (
                <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-6 gap-y-2.5 text-sm">
                  {report.details.map((detail, i) => (
                    <div key={`${detail.label}-${i}`} className="contents">
                      <dt className="text-muted-foreground">{detail.label}</dt>
                      <dd className="text-foreground">{detail.value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {report.rows.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-surface-border bg-card">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>Yesterday Check-Out</TableHead>
                        <TableHead>Today Check-In</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.rows.map((row, i) => (
                        // Index-keyed: the mail carries no id per person, and two
                        // people can share a name. The list never reorders, so an
                        // index is stable for as long as this dialog is open.
                        <TableRow key={`${row.name}-${i}`}>
                          <TableCell className="py-2 align-top text-foreground">{row.name}</TableCell>
                          <TableCell className="py-2 align-top">
                            <Check check={row.yesterdayCheckOut} />
                          </TableCell>
                          <TableCell className="py-2 align-top">
                            <Check check={row.todayCheckIn} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Kept because it stops being obvious once the mail is read
                  somewhere that has no Reply button to not press. */}
              {report.note && (
                <p className="mt-4 border-t border-surface-border pt-3 text-[11px] text-muted-foreground">{report.note}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The colour for one of HRMS's status words.
 *
 * <p>Matched on the word, not on the mail's inline CSS. The sender's colours
 * are a styling detail of their template and would tie this table to it; the
 * words are the data. Anything unrecognised renders plain rather than being
 * forced into a colour that would assert something about a status this build
 * has never seen.
 */
function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("missed")) return "text-red-600 dark:text-red-400";
  if (s.includes("late")) return "text-emerald-600 dark:text-emerald-400";
  return "text-foreground";
}

/** One cell: the scheduled time as a pill, the arrow, what happened, and the status. */
function Check({ check }: { check: HrmsAttendanceCheck }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {check.scheduled && (
        <span className="rounded bg-gray-500 px-1.5 py-0.5 text-[11px] text-white">{check.scheduled}</span>
      )}
      {check.actual && (
        <>
          <span className="text-muted-foreground">-&gt;</span>
          <span className="text-foreground">{check.actual}</span>
        </>
      )}
      {check.status && <span className={`ml-1 ${statusClass(check.status)}`}>{check.status}</span>}
    </span>
  );
}
