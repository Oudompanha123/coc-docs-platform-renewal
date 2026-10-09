"use client";

import { memo } from "react";
import { ScanStatusBadge } from "@/components/claude-usage/ScanStatusBadge";
import type { ScanLogSummary } from "@/lib/admin/claudeUsage";
import { formatCount, formatDuration, formatScanTime, personName, resultText, scanOutcome } from "@/lib/claudeUsage/scanLogs";

/**
 * The Scan Logs table — one row per scan, newest first. Same shell as
 * UsageTable (tinted header, divide-y, row hover); paging is the caller's,
 * so a filter change can reset it. The whole row opens the detail drawer;
 * the chevron button is the same action for keyboard and screen readers.
 *
 * Memoized: an auto-refresh that brings back the same rows, or typing in a
 * filter that leaves this page of rows unchanged, doesn't redraw it.
 */
export const ScanLogTable = memo(function ScanLogTable({
  logs,
  onView,
}: {
  logs: ScanLogSummary[];
  onView: (log: ScanLogSummary) => void;
}) {
  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Scan Time</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Result</th>
            <th className="px-4 py-3 text-right">Duration</th>
            <th className="w-12 px-4 py-3">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map((log) => {
            const outcome = scanOutcome(log);
            const name = personName(log);
            return (
              <tr key={log.id} onClick={() => onView(log)} className="cursor-pointer transition-colors hover:bg-page">
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-dash-ink">{name}</span>
                  {log.displayName && <span className="block text-[11px] text-muted">{log.email}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-dash-ink">
                  {formatScanTime(log.startedAt)}
                  <span className="block text-[11px] text-muted">{log.trigger === "scheduled" ? "Scheduled" : "Manual"}</span>
                </td>
                <td className="px-4 py-3.5">
                  <ScanStatusBadge outcome={outcome} />
                </td>
                <td className="px-4 py-3.5">
                  <span className={outcome === "failed" ? "text-danger" : outcome === "partial" ? "text-[#b45309]" : "text-dash-ink"}>
                    {resultText(log)}
                  </span>
                  {outcome === "success" && (
                    <span className="block text-[11px] text-muted">{formatCount(log.newTokens)} tokens</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right text-dash-ink">{formatDuration(log.durationMs)}</td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation(); // the row would open it a second time
                      onView(log);
                    }}
                    aria-label={`View details of the scan by ${name} at ${formatScanTime(log.startedAt)}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white hover:text-dash-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
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
