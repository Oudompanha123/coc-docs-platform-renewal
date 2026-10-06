"use client";

import type { HrmsAttendanceCheck, HrmsAttendanceReport } from "@/lib/notify/activity";
import {
  actualTimeOrNull,
  filterAttendanceRows,
  statusKindsPresent,
  type AttendanceStatusFilter,
} from "@/lib/attendance/stats";
import { AttendanceStatusSelect } from "./AttendanceStatusSelect";
import { InitialsAvatar } from "./InitialsAvatar";
import { StatusPill } from "./StatusPill";

function TimeCell({ check }: { check: HrmsAttendanceCheck }) {
  const actual = actualTimeOrNull(check);
  return (
    <div className="flex items-center gap-2">
      <span className="rounded bg-page px-2 py-0.5 font-mono text-xs text-muted">{check.scheduled || "--:--"}</span>
      <span className="text-muted" aria-hidden="true">
        →
      </span>
      {actual ? (
        <span className="font-mono text-sm font-semibold text-dash-ink">{actual}</span>
      ) : (
        <span className="font-mono text-sm text-muted">--:--</span>
      )}
    </div>
  );
}

const LEGEND: { label: string; dot: string }[] = [
  { label: "Normal", dot: "#10b981" },
  { label: "Late", dot: "#f59e0b" },
  { label: "Missed", dot: "#ef4444" },
];

export function AttendanceTable({
  report,
  search,
  onSearchChange,
  status,
  onStatusChange,
}: {
  report: HrmsAttendanceReport;
  search: string;
  onSearchChange: (value: string) => void;
  status: AttendanceStatusFilter;
  onStatusChange: (next: AttendanceStatusFilter) => void;
}) {
  const rows = filterAttendanceRows(report.rows, search, status);

  // Computed from the whole report, not from `rows`: options derived from the
  // filtered set would remove the option that is currently selected, and the
  // only way back would be reloading the page.
  const outOptions = statusKindsPresent(report.rows, "out");
  const inOptions = statusKindsPresent(report.rows, "in");
  const filtered = search.trim() !== "" || status.out != null || status.in != null;

  // A department's schedule is uniform across its rows in every report seen
  // so far — the footer takes the first row's scheduled times as
  // representative rather than repeating them per row.
  const scheduledOut = report.rows[0]?.yesterdayCheckOut.scheduled || "--:--";
  const scheduledIn = report.rows[0]?.todayCheckIn.scheduled || "--:--";

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
          <h3 className="text-sm font-bold text-dash-ink">{report.department || "(no department found)"}</h3>
          <span className="rounded-full bg-page px-2.5 py-0.5 text-xs font-semibold text-muted">
            {report.rows.length} members
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <AttendanceStatusSelect
              label="Out status"
              options={outOptions}
              value={status.out ?? null}
              onChange={(out) => onStatusChange({ ...status, out })}
            />
            <AttendanceStatusSelect
              label="In status"
              options={inOptions}
              value={status.in ?? null}
              onChange={(next) => onStatusChange({ ...status, in: next })}
            />
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  onStatusChange({});
                }}
                className="rounded-xl border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full sm:w-[260px]">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name..."
            className="w-full rounded-xl border border-border py-2 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-[#f8fafc] text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Yesterday Check-Out</th>
              <th className="px-4 py-3">Out Status</th>
              <th className="px-4 py-3">Today Check-In</th>
              <th className="px-4 py-3">In Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.name} className="transition-colors hover:bg-[#f8fafc]">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={row.name} />
                    <span className="font-semibold text-dash-ink">{row.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <TimeCell check={row.yesterdayCheckOut} />
                </td>
                <td className="px-4 py-4">
                  <StatusPill status={row.yesterdayCheckOut.status} />
                </td>
                <td className="px-4 py-4">
                  <TimeCell check={row.todayCheckIn} />
                </td>
                <td className="px-4 py-4">
                  <StatusPill status={row.todayCheckIn.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                  {/* Naming the filter that emptied the table, rather than
                      always blaming the search box — with a status filter set
                      and the search empty, “No one matches ””” read as a bug. */}
                  {search.trim() !== ""
                    ? `No one matches “${search}”.`
                    : "No one matches these statuses."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-6 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Scheduled: <b className="font-semibold text-dash-ink">{scheduledOut}</b> out ·{" "}
          <b className="font-semibold text-dash-ink">{scheduledIn}</b> in
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
    </div>
  );
}
