"use client";

import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { StatusPill } from "@/components/attendance/StatusPill";
import { addDays, formatShortDate } from "@/lib/attendance/dates";
import { actualTimeOrNull, minutesLate, statusKind } from "@/lib/attendance/stats";
import type { HrmsAttendanceCheck, HrmsAttendanceReport } from "@/lib/notify/activity";

const LEGEND: { label: string; dot: string }[] = [
  { label: "Normal", dot: "#10b981" },
  { label: "Late", dot: "#f59e0b" },
  { label: "Missed", dot: "#ef4444" },
];

/**
 * The sub-line under a check's time ("5 min late", "No check-out log
 * found") — derived client-side from the same fields {@link StatusPill}
 * already reads, not a separate field the backend sends, since HRMS's own
 * status text plus the scheduled/actual times already say everything this
 * needs to.
 */
function describeCheck(check: HrmsAttendanceCheck, missingLabel: string): string {
  const actual = actualTimeOrNull(check);
  if (actual === null) return missingLabel;
  const kind = statusKind(check.status);
  if (kind === "late") {
    const late = minutesLate(check.scheduled, actual);
    return late !== null && late > 0 ? `${late} min late` : check.status;
  }
  if (kind === "normal") return "On time";
  return check.status;
}

function CheckCard({
  title,
  dateLabel,
  check,
  missingLabel,
}: {
  title: string;
  dateLabel: string;
  check: HrmsAttendanceCheck;
  missingLabel: string;
}) {
  const actual = actualTimeOrNull(check);
  return (
    <div className="rounded-[10px] border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-dash-ink">{title}</h3>
        <span className="text-xs text-muted">{dateLabel}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className={`font-mono text-3xl font-bold ${actual ? "text-dash-ink" : "text-muted"}`}>{actual ?? "--:--"}</span>
        <span className="rounded bg-page px-2 py-1 text-xs font-semibold text-muted">Scheduled {check.scheduled || "--:--"}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <p className="text-sm text-muted">{describeCheck(check, missingLabel)}</p>
        <StatusPill status={check.status} />
      </div>
    </div>
  );
}

/**
 * The signed-in caller's own attendance for one date — `/account/settings#attendance`'s
 * body. `report` is always {@link HrmsAttendanceReport.scopedToViewer}, so
 * `report.rows` holds at most the caller's own single row (TM-025); this
 * component never widens that, it only decides how to show what arrived.
 *
 * Three shapes, not one:
 * - `viewerLinked` false — the account carries no HRMS link at all.
 * - linked but `rows` empty — nothing recorded for the caller on this date.
 * - linked with a row — the populated profile header + two check cards.
 */
export function MyAttendanceRecord({
  report,
  date,
  name,
  email,
  avatarUrl,
  initials,
}: {
  report: HrmsAttendanceReport;
  date: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  initials: string;
}) {
  const row = report.rows[0] ?? null;

  if (!report.viewerLinked) {
    return (
      <div className="overflow-hidden rounded-[10px] border border-border bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-dash-ink">Your account isn&apos;t linked to an HRMS employee record.</p>
        <p className="mt-1 text-sm text-muted">Please contact an admin to have your account linked.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <UserAvatar
            avatarUrl={avatarUrl}
            initials={initials}
            name={row?.name ?? name}
            className={`h-11 w-11 ${AVATAR_GRADIENTS.purple}`}
          />
          <div>
            <p className="text-sm font-bold text-dash-ink">{row?.name ?? name}</p>
            {email && <p className="text-xs text-muted">{email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
          <span className="text-sm font-medium text-dash-ink">{report.department || "(no department found)"}</span>
        </div>
      </div>

      {row ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CheckCard
              title="Yesterday Check-Out"
              dateLabel={formatShortDate(addDays(date, -1))}
              check={row.yesterdayCheckOut}
              missingLabel="No check-out log found"
            />
            <CheckCard
              title="Today Check-In"
              dateLabel={formatShortDate(date)}
              check={row.todayCheckIn}
              missingLabel="No check-in log found"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-[10px] border border-border bg-white px-6 py-4 text-sm text-muted shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              Scheduled: <b className="font-semibold text-dash-ink">{row.yesterdayCheckOut.scheduled || "--:--"}</b> out ·{" "}
              <b className="font-semibold text-dash-ink">{row.todayCheckIn.scheduled || "--:--"}</b> in
            </p>
            <div className="flex items-center gap-4">
              {LEGEND.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.dot }} aria-hidden="true" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-border bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-muted">No attendance record for this date.</p>
        </div>
      )}

      <p className="rounded-[10px] bg-brand-purple/5 px-4 py-3 text-xs text-muted">
        You can only see your own record. Wrong data? Please contact an admin.
      </p>
    </div>
  );
}
