"use client";

import { useId, type ReactNode } from "react";
import type { ScanLogSummary } from "@/lib/admin/claudeUsage";
import { ScanStatusBadge } from "@/components/claude-usage/ScanStatusBadge";
import {
  formatDuration,
  formatTimestamp,
  personName,
  scanStages,
  statusMessage,
  type StageState,
} from "@/lib/claudeUsage/scanLogs";

const STAGE_MARK: Record<StageState, { glyph: string; ring: string; label: string }> = {
  done: { glyph: "✓", ring: "bg-[#e1f5ec] text-[#1f9d6b]", label: "Done" },
  failed: { glyph: "✕", ring: "bg-danger/10 text-danger", label: "Failed" },
  skipped: { glyph: "–", ring: "bg-page text-muted", label: "Not reached" },
  waiting: { glyph: "…", ring: "bg-brand-blue/10 text-brand-blue", label: "Waiting" },
  unknown: { glyph: "?", ring: "bg-page text-muted", label: "Unknown" },
};

/**
 * Scan → Upload → Scan record, each with its own mark and word (ADR-107): a
 * scan that read the usage but couldn't upload it never reads as one success.
 */
export function ScanStageList({ log }: { log: ScanLogSummary }) {
  return (
    <ol aria-label="Scan stages" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {scanStages(log).map((stage) => {
        const mark = STAGE_MARK[stage.state];
        return (
          <li key={stage.key} className="flex items-start gap-2.5 rounded-lg border border-border bg-white px-3 py-2.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${mark.ring}`}
              aria-hidden="true"
            >
              {mark.glyph}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dash-ink">
                {stage.label}: <span className="font-medium">{mark.label}</span>
              </p>
              <p className="break-words text-xs text-muted">{stage.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The newest scan in view, at a glance (ADR-107): its status with a short
 * message, when it started and finished, how long it took, and when this page
 * last heard from the server. With no scan it says so — "No Recent Scan" —
 * rather than showing an empty card.
 *
 * `refreshFailed`: the latest automatic refresh didn't reach the server, so
 * what is shown may be out of date; the page keeps trying.
 */
export function ScanStatusPanel({
  log,
  lastUpdated,
  refreshFailed,
  showPerson,
  runningCount,
}: {
  log: ScanLogSummary | null;
  lastUpdated: Date | null;
  refreshFailed: boolean;
  showPerson: boolean;
  /** Scans in progress across everything in view — only worth saying when more than the newest one. */
  runningCount: number;
}) {
  const headingId = useId();
  const status = statusMessage(log);
  const tone =
    status.indicator === "failed"
      ? "border-danger/30"
      : status.indicator === "partial"
        ? "border-[#f5d896]"
        : status.indicator === "success" || status.indicator === "no-usage"
          ? "border-[#1f9d6b]/25"
          : "border-border";

  return (
    <section aria-labelledby={headingId} className={`mt-4 rounded-[10px] border bg-white p-5 shadow-sm ${tone}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id={headingId} className="text-xs font-semibold uppercase tracking-wide text-muted">
            Latest scan{log && showPerson ? ` · ${personName(log)}` : ""}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <ScanStatusBadge outcome={status.indicator} size="md" />
            <p className="text-base font-bold text-dash-ink">{status.title}</p>
          </div>
          {status.message && <p className="mt-1.5 max-w-2xl text-sm text-dash-ink">{status.message}</p>}
          {runningCount > 1 && (
            <p className="mt-1.5 text-sm text-muted">{runningCount} scans are in progress right now.</p>
          )}
        </div>
        <p className="shrink-0 text-xs text-muted sm:text-right">
          Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "—"}
          {refreshFailed && (
            <span className="mt-0.5 flex items-center gap-1 font-semibold text-[#b45309] sm:justify-end">
              <span aria-hidden="true">!</span> Couldn&apos;t refresh — retrying
            </span>
          )}
        </p>
      </div>

      {log && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <PanelField label="Started at">{formatTimestamp(log.startedAt)}</PanelField>
            <PanelField label="Completed at">{log.finishedAt ? formatTimestamp(log.finishedAt) : "Not yet"}</PanelField>
            <PanelField label="Duration">{formatDuration(log.durationMs)}</PanelField>
            <PanelField label="Started by">{log.trigger === "scheduled" ? "Daily schedule" : "Manual run"}</PanelField>
          </dl>
          <div className="mt-4">
            <ScanStageList log={log} />
          </div>
        </>
      )}
    </section>
  );
}

function PanelField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-dash-ink">{children}</dd>
    </div>
  );
}
