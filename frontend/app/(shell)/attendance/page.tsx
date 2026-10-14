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
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
      titleIcon={<CalendarCheckIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Administration / <b className="font-medium text-foreground">Attendance</b>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <AttendanceRangeToggle value={range} onChange={setRange} />
            <AttendanceDateNav date={date} onChange={setDate} range={range} />
            <AttendanceDepartmentSelect departments={knownDepartments} value={department} onChange={setDepartment} />
            <Button
              type="button"
              onClick={() => selectedReport && downloadAttendanceXlsx(selectedReport.department, date, exportableRows)}
              disabled={exportableRows.length === 0}
              title={
                exportableRows.length === 0
                  ? "Nothing to export — no one matches the current search"
                  : `Download ${exportableRows.length} record${exportableRows.length === 1 ? "" : "s"} as an Excel file`
              }
              // Keep hover while disabled, so the title can say why.
              className="disabled:pointer-events-auto disabled:cursor-not-allowed"
            >
              <DownloadIcon className="size-4" />
              Export
            </Button>
          </div>
        </div>

        {loading && <LoadingSkeleton />}

        {!loading && loadError && (
          <Alert
            variant="destructive"
            className="font-medium"
            action={
              <Button type="button" variant="destructiveOutline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            }
          >
            {loadError}
          </Alert>
        )}

        {!loading && !loadError && reports && reports.length === 0 && (
          <div className="overflow-hidden rounded-xl border border-surface-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No attendance records for this date.</p>
          </div>
        )}

        {!loading && !loadError && reports && reports.length > 0 && !selectedReport && (
          <div className="overflow-hidden rounded-xl border border-surface-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No records for {department || "(no department found)"} on this date.</p>
          </div>
        )}

        {!loading && !loadError && selectedReport && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading attendance">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[106px] rounded-xl border border-surface-border bg-card p-4">
            <div className="size-8 rounded-lg bg-muted-surface" />
            <div className="mt-3 h-7 w-16 rounded bg-muted-surface" />
          </div>
        ))}
      </div>
      <div className="h-[420px] rounded-xl border border-surface-border bg-card" />
    </div>
  );
}
