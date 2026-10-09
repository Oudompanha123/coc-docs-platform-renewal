"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireSession } from "@/components/layout/RequireSession";
import { CalendarCheckIcon, ClockIcon, DownloadIcon, PersonIcon, UsersIcon, WarningIcon } from "@/components/layout/icons";
import { AttendanceDateNav } from "@/components/attendance/AttendanceDateNav";
import { AttendanceDepartmentSelect } from "@/components/attendance/AttendanceDepartmentSelect";
import { AttendanceRangeToggle, type AttendanceRange } from "@/components/attendance/AttendanceRangeToggle";
import { AttendanceStatCard } from "@/components/attendance/AttendanceStatCard";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { fetchAttendanceReports, type HrmsAttendanceReport } from "@/lib/admin/attendance";
import { downloadAttendanceXlsx } from "@/lib/attendance/export-attendance";
import {
  computeAttendanceStats,
  filterAttendanceRows,
  type AttendanceStatusFilter,
} from "@/lib/attendance/stats";
import { todayIso } from "@/lib/attendance/dates";
import { SUPER_ADMIN_ROLES } from "@/lib/auth/landing";

/**
 * Super admin only (ADR-100): the whole team's clock-ins, not an admin's
 * editorial work. An admin who reaches this url is sent back to the Overview;
 * the API refuses them either way.
 */
export default function AttendancePage() {
  return (
    <RequireSession allowRoles={SUPER_ADMIN_ROLES} deniedPath="/overview">
      <AttendancePageInner />
    </RequireSession>
  );
}

function AttendancePageInner() {
  const [date, setDate] = useState(todayIso);
  const [reports, setReports] = useState<HrmsAttendanceReport[] | null>(null);
  // Every department seen across any successfully loaded date this session,
  // first-seen order, never removed just because a later date doesn't have
  // it — this is what keeps the dropdown populated on a no-data date rather
  // than disappearing (it used to be derived from the current date's own
  // `reports`, which is empty on exactly the date this was built to survive).
  const [knownDepartments, setKnownDepartments] = useState<string[]>([]);
  const [department, setDepartment] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Here rather than inside AttendanceTable because Export reads it too --
  // the file and the table have to agree about what is on screen.
  const [status, setStatus] = useState<AttendanceStatusFilter>({});
  // Decorative for now — does not change which date, department, or rows are
  // fetched or shown. Wiring an actual week/month/year range is a separate,
  // later task.
  const [range, setRange] = useState<AttendanceRange>("day");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await fetchAttendanceReports(date);
      setReports(fetched);
      setLoadError(null);
      setKnownDepartments((prev) => {
        const next = [...prev];
        for (const r of fetched) {
          if (!next.includes(r.department)) next.push(r.department);
        }
        return next;
      });
      // Sticky: a date change never moves the selection on its own, even to
      // a date that doesn't have it — only the very first successful load
      // (department still null) picks a default.
      setDepartment((prev) => prev ?? fetched[0]?.department ?? null);
    } catch (err) {
      setReports(null);
      setLoadError(err instanceof Error ? err.message : "Couldn't load attendance for that date.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSearch("");
  }, [date, department]);

  const selectedReport = useMemo(() => reports?.find((r) => r.department === department) ?? null, [reports, department]);

  const stats = useMemo(() => computeAttendanceStats(selectedReport?.rows ?? []), [selectedReport]);

  // What Export writes: the rows the table beside it currently shows, not
  // the whole department — a file that ignored an in-progress search would
  // be a surprise the moment anyone searched first (same reasoning as the
  // Users & Roles page's own `exportable`).
  const exportableRows = useMemo(
    () => (selectedReport ? filterAttendanceRows(selectedReport.rows, search, status) : []),
    [selectedReport, search, status],
  );

  return (
    <AppShell
      pageTitle="Attendance"
      pageSubtitle="HRMS KOSIGN · Daily record summary"
      titleIcon={<CalendarCheckIcon className="hidden h-8 w-8 shrink-0 text-foreground sm:block" />}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Administration / <b className="font-semibold text-dash-ink">Attendance</b>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <AttendanceRangeToggle value={range} onChange={setRange} />
            <AttendanceDateNav date={date} onChange={setDate} range={range} />
            <AttendanceDepartmentSelect departments={knownDepartments} value={department} onChange={setDepartment} />
            <button
              type="button"
              onClick={() => selectedReport && downloadAttendanceXlsx(selectedReport.department, date, exportableRows)}
              disabled={exportableRows.length === 0}
              title={
                exportableRows.length === 0
                  ? "Nothing to export — no one matches the current search"
                  : `Download ${exportableRows.length} record${exportableRows.length === 1 ? "" : "s"} as an Excel file`
              }
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
            >
              <DownloadIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {loading && <LoadingSkeleton />}

        {!loading && loadError && (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-8 text-center">
            <WarningIcon className="h-6 w-6 text-danger" />
            <p className="text-sm font-medium text-danger">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-[10px] border border-danger/40 px-4 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !loadError && reports && reports.length === 0 && (
          <div className="overflow-hidden rounded-[10px] border border-border bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-muted">No attendance records for this date.</p>
          </div>
        )}

        {!loading && !loadError && reports && reports.length > 0 && !selectedReport && (
          <div className="overflow-hidden rounded-[10px] border border-border bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-muted">No records for {department || "(no department found)"} on this date.</p>
          </div>
        )}

        {!loading && !loadError && selectedReport && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AttendanceStatCard
                icon={UsersIcon}
                label="Total Scheduled"
                value={String(stats.totalScheduled)}
                tone="purple"
                note="Members scheduled"
              />
              <AttendanceStatCard
                icon={PersonIcon}
                label="On Time"
                value={String(stats.onTime)}
                tone="emerald"
                note={`${stats.onTimePct}% of team`}
              />
              <AttendanceStatCard
                icon={ClockIcon}
                label="Late Check-In"
                value={String(stats.lateCheckIn)}
                tone="amber"
                note={`${stats.lateCheckInPct}% of team`}
              />
              <AttendanceStatCard
                icon={WarningIcon}
                label="Missed Logs"
                value={String(stats.missedLogs)}
                tone="red"
                note={`${stats.missedCheckOut} check-out · ${stats.missedCheckIn} check-in`}
              />
            </div>

            <AttendanceTable
              report={selectedReport}
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-5" role="status" aria-label="Loading attendance">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[124px] rounded-[10px] border border-border bg-white p-5">
            <div className="h-10 w-10 rounded-xl bg-page" />
            <div className="mt-4 h-7 w-16 rounded bg-page" />
          </div>
        ))}
      </div>
      <div className="h-[420px] rounded-[10px] border border-border bg-white" />
    </div>
  );
}
