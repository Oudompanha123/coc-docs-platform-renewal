"use client";

import { useEffect, useState } from "react";
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
 * <p>Built on this product's own dialog shell — the `bg-white` /
 * `border-border` / `text-dash-ink` card every other modal here uses — rather
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
        className="w-full max-w-3xl overflow-hidden rounded-[10px] border border-border bg-white text-dash-ink shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-dash-ink">{item.summary}</p>
            <p className="mt-0.5 text-xs text-muted">
              HRMS KOSIGN{report?.reportDate ? ` · ${report.reportDate}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-page hover:text-dash-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {error ? (
            <p className="py-10 text-center text-sm text-muted">{error}</p>
          ) : !report ? (
            <p className="py-10 text-center text-sm text-muted">Reading the report…</p>
          ) : report.scopedToViewer && !report.viewerLinked ? (
            // Not the same as a parser failure, and it used to say it was.
            // A plain user sees only their own row, which needs their account
            // linked to the name HRMS uses for them; unlinked, there is
            // nothing to show and HRMS has done nothing wrong.
            <p className="py-10 text-center text-sm text-muted">
              Your account isn&apos;t linked to an attendance record yet, so there is nothing
              here for you. An administrator can link it.
            </p>
          ) : report.rows.length === 0 && report.details.length === 0 ? (
            // Told apart from "nobody was late" on purpose: an empty table
            // would read as a clean day rather than as a parser that lost.
            // Reachable for a linked user too -- they simply are not in this
            // report -- but the wording stays, because a linked caller with no
            // row is genuinely indistinguishable from a parse that found none.
            <p className="py-10 text-center text-sm text-muted">
              {report.scopedToViewer
                ? "No attendance for you in this report."
                : "This report could not be read — HRMS may have changed its layout."}
            </p>
          ) : (
            <>
              {report.department && (
                <p className="mb-3 list-item list-inside list-disc text-sm font-semibold text-emerald-700">
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
                      <dt className="text-muted">{detail.label}</dt>
                      <dd className="text-dash-ink">{detail.value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {report.rows.length > 0 && (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Yesterday Check-Out</th>
                    <th className="py-2 font-medium">Today Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, i) => (
                    // Index-keyed: the mail carries no id per person, and two
                    // people can share a name. The list never reorders, so an
                    // index is stable for as long as this dialog is open.
                    <tr key={`${row.name}-${i}`} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-3 align-top text-dash-ink">{row.name}</td>
                      <td className="py-2.5 pr-3 align-top">
                        <Check check={row.yesterdayCheckOut} />
                      </td>
                      <td className="py-2.5 align-top">
                        <Check check={row.todayCheckIn} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}

              {/* Kept because it stops being obvious once the mail is read
                  somewhere that has no Reply button to not press. */}
              {report.note && (
                <p className="mt-5 border-t border-border pt-3 text-[11px] text-muted">{report.note}</p>
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
  if (s.includes("missed")) return "text-red-600";
  if (s.includes("late")) return "text-emerald-600";
  return "text-dash-ink";
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
          <span className="text-muted">-&gt;</span>
          <span className="text-dash-ink">{check.actual}</span>
        </>
      )}
      {check.status && <span className={`ml-1 ${statusClass(check.status)}`}>{check.status}</span>}
    </span>
  );
}
