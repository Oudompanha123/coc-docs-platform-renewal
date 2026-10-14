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
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function TimeCell({ check }: { check: HrmsAttendanceCheck }) {
  const actual = actualTimeOrNull(check);
  return (
    <div className="flex items-center gap-2">
      <span className="rounded bg-muted-surface px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
        {check.scheduled || "--:--"}
      </span>
      <span className="text-muted-foreground" aria-hidden="true">
        →
      </span>
      {actual ? (
        <span className="font-mono text-sm font-medium text-foreground">{actual}</span>
      ) : (
        <span className="font-mono text-sm text-muted-foreground">--:--</span>
      )}
    </div>
  );
}

const LEGEND: { label: string; dot: string }[] = [
  { label: "Normal", dot: "bg-emerald-500" },
  { label: "Late", dot: "bg-amber-500" },
  { label: "Missed", dot: "bg-red-500" },
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
    <div className="overflow-hidden rounded-xl border border-surface-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">{report.department || "(no department found)"}</h3>
          <span className="rounded-full bg-muted-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSearchChange("");
                  onStatusChange({});
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <SearchInput
          containerClassName="sm:w-64"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name..."
          aria-label="Search name"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Yesterday Check-Out</TableHead>
            <TableHead>Out Status</TableHead>
            <TableHead>Today Check-In</TableHead>
            <TableHead>In Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <InitialsAvatar name={row.name} />
                  <span className="font-medium text-foreground">{row.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <TimeCell check={row.yesterdayCheckOut} />
              </TableCell>
              <TableCell>
                <StatusPill status={row.yesterdayCheckOut.status} />
              </TableCell>
              <TableCell>
                <TimeCell check={row.todayCheckIn} />
              </TableCell>
              <TableCell>
                <StatusPill status={row.todayCheckIn.status} />
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                {/* Naming the filter that emptied the table, rather than
                    always blaming the search box — with a status filter set
                    and the search empty, “No one matches ””” read as a bug. */}
                {search.trim() !== "" ? `No one matches “${search}”.` : "No one matches these statuses."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-2 border-t border-surface-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Scheduled: <b className="font-semibold text-foreground">{scheduledOut}</b> out ·{" "}
          <b className="font-semibold text-foreground">{scheduledIn}</b> in
        </p>
        <div className="flex items-center gap-4">
          {LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${item.dot}`} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
