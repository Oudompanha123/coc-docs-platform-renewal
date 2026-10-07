"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { XIcon } from "@/components/layout/icons";
import { ScanStatusBadge } from "@/components/claude-usage/ScanStatusBadge";
import {
  fetchScanLogDetail,
  type ScanLogDetail,
  type ScanLogStep,
  type ScanLogSummary,
  type ScanStepStatus,
  type ScanUploadStatus,
} from "@/lib/admin/claudeUsage";
import {
  formatCount,
  formatDuration,
  formatTimestamp,
  personName,
  resultMessage,
  STEP_LABELS,
} from "@/lib/claudeUsage/scanLogs";

const UPLOAD_LABELS: Record<ScanUploadStatus, string> = {
  uploaded: "Uploaded",
  "not-needed": "Not needed — no new usage",
  failed: "Failed",
  "not-attempted": "Not attempted",
};

/** A record that reached the server this long after the scan ended waited in the PC's queue. */
const QUEUED_AFTER_MS = 2 * 60 * 1000;

/**
 * One scan in full (ADR-096): what it was, what it counted, and the step
 * timeline that shows where it stopped. Opened from a View Logs row; the
 * row's summary shows at once while the steps load.
 */
export function ScanLogDetailModal({ log, onClose }: { log: ScanLogSummary; onClose: () => void }) {
  const [detail, setDetail] = useState<ScanLogDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError(null);
    fetchScanLogDetail(log.id)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load this scan's steps.");
      });
    return () => {
      cancelled = true;
    };
  }, [log.id]);

  const requestClose = useCallback(() => setClosing(true), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  const summary = detail?.summary ?? log;
  const queuedFor = Date.parse(summary.receivedAt) - Date.parse(summary.finishedAt);

  return (
    <Modal
      onClose={requestClose}
      animated
      closing={closing}
      onExited={onClose}
      className="w-full max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-border bg-white shadow-xl"
    >
      <div role="dialog" aria-modal="true" aria-labelledby="scan-log-title" className="p-5 sm:p-7">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-start justify-between gap-4 bg-white px-5 pb-3 pt-5 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="scan-log-title" className="text-lg font-bold text-dash-ink">
                Scan details
              </h2>
              <ScanStatusBadge status={summary.status} />
            </div>
            <p className="mt-1 break-all font-mono text-xs text-muted">{summary.scanRef}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={requestClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-dash-ink"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <ResultBanner log={summary} />

        {summary.status === "failed" && (
          <section className="mt-4 rounded-[10px] border border-danger/30 bg-danger/5 p-4 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-danger">Error</h3>
            <dl className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-[140px_1fr]">
              <dt className="text-muted">Failed step</dt>
              <dd className="font-semibold text-dash-ink">{summary.errorStep ? STEP_LABELS[summary.errorStep] : "—"}</dd>
              <dt className="text-muted">Message</dt>
              <dd className="break-words text-dash-ink">{summary.errorMessage ?? "No message was recorded."}</dd>
              <dt className="text-muted">When</dt>
              <dd className="text-dash-ink">{formatTimestamp(summary.finishedAt)}</dd>
              <dt className="text-muted">Retry</dt>
              <dd className="text-dash-ink">
                The reporter retries a failed request once on its own; the next scheduled scan (11:00 or 16:00) tries again.
              </dd>
            </dl>
          </section>
        )}

        <section className="mt-5">
          <h3 className="text-sm font-bold text-dash-ink">Scan information</h3>
          <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <Field label="User">
              <span className="font-semibold">{personName(summary)}</span>
              {summary.displayName && <span className="block text-xs text-muted">{summary.email}</span>}
            </Field>
            <Field label="Started by">{summary.trigger === "scheduled" ? "Daily schedule" : "Manual run"}</Field>
            <Field label="Start time">{formatTimestamp(summary.startedAt)}</Field>
            <Field label="End time">{formatTimestamp(summary.finishedAt)}</Field>
            <Field label="Duration">{formatDuration(summary.durationMs)}</Field>
            <Field label="CLI version">{summary.cliVersion ?? "—"}</Field>
            <Field label="Transcript files">{formatCount(summary.transcriptFiles)}</Field>
            <Field label="Responses processed">{formatCount(summary.responses)}</Field>
            <Field label="Duplicates removed">{formatCount(summary.duplicates)}</Field>
            <Field label="New tokens">{formatCount(summary.newTokens)}</Field>
            <Field label="Upload status">{UPLOAD_LABELS[summary.uploadStatus]}</Field>
            <Field label="Received by server">
              {formatTimestamp(summary.receivedAt)}
              {queuedFor > QUEUED_AFTER_MS && (
                <span className="block text-xs text-muted">Sent later from the PC&apos;s queue — the server was unreachable at the time.</span>
              )}
            </Field>
          </dl>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-bold text-dash-ink">Process timeline</h3>
          {error ? (
            <p role="alert" className="mt-3 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : !detail ? (
            <p role="status" className="mt-3 rounded-[10px] border border-border bg-page px-4 py-6 text-center text-sm text-muted">
              Loading scan steps…
            </p>
          ) : (
            <ol className="mt-3">
              {detail.steps.map((step, i) => (
                <TimelineStep key={step.key} step={step} last={i === detail.steps.length - 1} />
              ))}
            </ol>
          )}
        </section>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-dash-ink">{children}</dd>
    </div>
  );
}

function ResultBanner({ log }: { log: ScanLogSummary }) {
  const tone =
    log.status === "failed"
      ? "border-danger/30 bg-danger/10 text-danger"
      : log.status === "warning"
        ? "border-[#f5d896] bg-[#fffbeb] text-[#b45309]"
        : "border-border bg-[#e1f5ec] text-[#1f9d6b]";
  return (
    <p role="status" className={`mt-2 rounded-[10px] border px-4 py-3 text-sm font-semibold ${tone}`}>
      {log.status === "failed" ? `Scan failed${log.errorStep ? ` at "${STEP_LABELS[log.errorStep]}"` : ""}.` : resultMessage(log)}
    </p>
  );
}

const STEP_MARK: Record<ScanStepStatus, { glyph: string; ring: string; label: string }> = {
  success: { glyph: "✓", ring: "bg-[#e1f5ec] text-[#1f9d6b]", label: "Success" },
  warning: { glyph: "!", ring: "bg-[#fffbeb] text-[#b45309]", label: "Warning" },
  failed: { glyph: "✕", ring: "bg-danger/10 text-danger", label: "Failed" },
  skipped: { glyph: "–", ring: "bg-page text-muted", label: "Not run" },
};

function TimelineStep({ step, last }: { step: ScanLogStep; last: boolean }) {
  const mark = STEP_MARK[step.status];
  const time = step.at
    ? new Date(step.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })
    : null;
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last && <span className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px bg-border" aria-hidden="true" />}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${mark.ring}`}
        aria-label={mark.label}
        role="img"
      >
        {mark.glyph}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className={`text-sm font-semibold ${step.status === "skipped" ? "text-muted" : "text-dash-ink"}`}>
            {STEP_LABELS[step.key]}
          </p>
          {time && <span className="text-xs text-muted">{time}</span>}
        </div>
        <p
          className={`mt-0.5 break-words text-xs ${
            step.status === "failed" ? "text-danger" : step.status === "warning" ? "text-[#b45309]" : "text-muted"
          }`}
        >
          {step.status === "skipped" ? "Not run." : step.detail || mark.label}
        </p>
      </div>
    </li>
  );
}
