"use client";

import { useCallback, useEffect, useState } from "react";
import { DownloadIcon, WarningIcon } from "@/components/layout/icons";
import { AttendanceDateNav } from "@/components/attendance/AttendanceDateNav";
import { MyAttendanceRecord } from "@/components/reports/MyAttendanceRecord";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useSession } from "@/lib/auth/SessionProvider";
import { todayIso } from "@/lib/attendance/dates";
import { downloadAttendanceXlsx } from "@/lib/attendance/export-attendance";
import { fetchMyAttendance, type HrmsAttendanceReport } from "@/lib/me/attendance";

/**
 * The signed-in caller's own attendance for one date: date navigation, Excel
 * export, and the record itself. Moved here unchanged from the former
 * `/reports/attendance` page, which now redirects to
 * `/account/settings#attendance` (see `next.config.ts`).
 *
 * Every row here is the caller's own — `fetchMyAttendance` hits
 * `GET /api/v1/me/attendance`, which the backend scopes from the session
 * (ADR-086) with no parameter here that could widen it. Export writes
 * exactly the rows this view is already showing, same as the admin page's
 * own Export button.
 */
export function MyAttendanceView() {
  const user = useCurrentUser();
  const { user: sessionUser } = useSession();

  const [date, setDate] = useState(todayIso);
  const [report, setReport] = useState<HrmsAttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await fetchMyAttendance(date));
      setLoadError(null);
    } catch (err) {
      setReport(null);
      setLoadError(err instanceof Error ? err.message : "Couldn't load attendance for that date.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportableRows = report?.viewerLinked ? report.rows : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AttendanceDateNav date={date} onChange={setDate} />
        <Button
          type="button"
          onClick={() => downloadAttendanceXlsx(report?.department ?? "", date, exportableRows)}
          disabled={exportableRows.length === 0}
          title={
            exportableRows.length === 0
              ? "Nothing to export for this date"
              : `Download ${exportableRows.length} record${exportableRows.length === 1 ? "" : "s"} as an Excel file`
          }
          // Keep hover while disabled, so the title can say why.
          className="disabled:pointer-events-auto disabled:cursor-not-allowed"
        >
          <DownloadIcon className="size-4" />
          Export
        </Button>
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && loadError && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-6 text-center"
        >
          <WarningIcon className="size-5 text-danger" />
          <p className="text-sm font-medium text-danger">{loadError}</p>
          <Button type="button" variant="destructiveOutline" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !loadError && report && (
        <MyAttendanceRecord
          report={report}
          date={date}
          name={user?.name ?? "You"}
          email={sessionUser?.email ?? null}
          avatarUrl={user?.avatarUrl ?? null}
          initials={user?.initials ?? "?"}
        />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading attendance">
      <div className="h-[66px] rounded-xl border border-surface-border bg-card" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-[124px] rounded-xl border border-surface-border bg-card" />
        <div className="h-[124px] rounded-xl border border-surface-border bg-card" />
      </div>
      <div className="h-[46px] rounded-xl border border-surface-border bg-card" />
    </div>
  );
}
