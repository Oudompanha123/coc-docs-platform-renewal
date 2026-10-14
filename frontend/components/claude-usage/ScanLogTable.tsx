"use client";

import { memo } from "react";
import { ScanStatusBadge } from "@/components/claude-usage/ScanStatusBadge";
import type { ScanLogSummary } from "@/lib/admin/claudeUsage";
import { diagnoseScan, formatDuration, formatScanTime, personName, recordsText, scanOutcome } from "@/lib/claudeUsage/scanLogs";

/**
 * The Scan Logs table — one row per scan, newest first. Same shell as
 * UsageTable (tinted header, divide-y, row hover); paging is the caller's,
 * so a filter change can reset it. The whole row opens the detail drawer;
 * the "View details" button is the same action for keyboard and screen
 * readers.
 *
 * `showUser`: off for a member's own scans, where every row is theirs.
 *
 * The error summary is the plain-language problem, never the raw error —
 * that stays in the drawer's Technical details.
 *
 * Memoized: an auto-refresh that brings back the same rows, or typing in a
 * filter that leaves this page of rows unchanged, doesn't redraw it.
 */
export const ScanLogTable = memo(function ScanLogTable({
  logs,
  onView,
  showUser = true,
}: {
  logs: ScanLogSummary[];
  onView: (log: ScanLogSummary) => void;
  showUser?: boolean;
}) {
  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted">
            {showUser && <th className="px-4 py-3">User</th>}
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Started At</th>
            <th className="px-4 py-3">Completed At</th>
            <th className="px-4 py-3 text-right">Duration</th>
            <th className="px-4 py-3">Records</th>
            <th className="px-4 py-3">Error Summary</th>
            <th className="px-4 py-3 text-right">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map((log) => {
            const outcome = scanOutcome(log);
            const name = personName(log);
            const problem = diagnoseScan(log)?.problem;
            return (
              <tr key={log.id} onClick={() => onView(log)} className="cursor-pointer transition-colors hover:bg-page">
                {showUser && (
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-dash-ink">{name}</span>
                    {log.displayName && <span className="block text-[11px] text-muted">{log.email}</span>}
                  </td>
                )}
                <td className="px-4 py-3.5">
                  <ScanStatusBadge outcome={outcome} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-dash-ink">
                  {formatScanTime(log.startedAt)}
                  <span className="block text-[11px] text-muted">{log.trigger === "scheduled" ? "Scheduled" : "Manual"}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-dash-ink">
                  {log.finishedAt ? formatScanTime(log.finishedAt) : <span className="text-muted">Not yet</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right text-dash-ink">{formatDuration(log.durationMs)}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-dash-ink">{recordsText(log)}</td>
                <td className="px-4 py-3.5">
                  {problem ? (
                    <span className={outcome === "failed" ? "text-danger" : "text-[#b45309]"}>{problem}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation(); // the row would open it a second time
                      onView(log);
                    }}
                    aria-label={`View details of the scan ${showUser ? `by ${name} ` : ""}at ${formatScanTime(log.startedAt)}`}
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-purple transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-purple/15"
                  >
                    View details
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="m9.5 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
