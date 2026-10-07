"use client";

import { ScanStatusBadge } from "@/components/claude-usage/ScanStatusBadge";
import type { ScanLogSummary } from "@/lib/admin/claudeUsage";
import { formatCount, formatDuration, formatScanTime, personName, STEP_LABELS } from "@/lib/claudeUsage/scanLogs";

/** Tokens column: "—" when the scan never got as far as counting them. */
function tokensCell(log: ScanLogSummary): string {
  if (log.newTokens == null) return "—";
  return formatCount(log.newTokens);
}

/**
 * The View Logs table — one row per scan, newest first. Same shell as
 * UsageTable (rounded card, tinted header, divide-y, row hover); paging is the
 * caller's, so a filter change can reset it.
 */
export function ScanLogTable({ logs, onView }: { logs: ScanLogSummary[]; onView: (log: ScanLogSummary) => void }) {
  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">New Tokens</th>
            <th className="px-4 py-3 text-right">Responses</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map((log) => (
            <tr key={log.id} className="transition-colors hover:bg-page">
              <td className="whitespace-nowrap px-4 py-3.5 text-dash-ink">
                {formatScanTime(log.startedAt)}
                <span className="block text-[11px] text-muted">{log.trigger === "scheduled" ? "Scheduled" : "Manual"}</span>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-semibold text-dash-ink">{personName(log)}</span>
                {log.displayName && <span className="block text-[11px] text-muted">{log.email}</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-dash-ink">{formatDuration(log.durationMs)}</td>
              <td className="px-4 py-3.5">
                <ScanStatusBadge status={log.status} />
                {log.status === "failed" && log.errorStep && (
                  <span className="mt-1 block text-[11px] text-danger">at {STEP_LABELS[log.errorStep]}</span>
                )}
                {log.status === "success" && log.uploadStatus === "not-needed" && (
                  <span className="mt-1 block text-[11px] text-muted">No new usage</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-dash-ink">{tokensCell(log)}</td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right text-dash-ink">{formatCount(log.responses)}</td>
              <td className="px-4 py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => onView(log)}
                  aria-label={`View details of the scan by ${personName(log)} at ${formatScanTime(log.startedAt)}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-purple/15"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
