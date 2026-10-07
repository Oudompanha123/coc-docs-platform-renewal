"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { XIcon } from "@/components/layout/icons";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
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
  diagnoseScan,
  errorCode,
  formatCount,
  formatDuration,
  formatTimestamp,
  personName,
  scanOutcome,
  STEP_LABELS,
  type ScanDiagnosis,
  type ScanOutcome,
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
 * One scan, in a side drawer over the Scan Logs table (ADR-096): what
 * happened, in plain words, and how to fix it — the admin's question. The raw
 * error, counts and step timeline sit in Technical details, collapsed, and
 * the timeline is only fetched the first time that is opened.
 *
 * Mount with `key={log.id}` so opening another scan starts fresh.
 */
export function ScanLogDrawer({ log, onClose }: { log: ScanLogSummary; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const requestClose = useCallback(() => setClosing(true), []);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    closeButton.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  const outcome = scanOutcome(log);
  const diagnosis = diagnoseScan(log);

  return (
    <Modal
      onClose={requestClose}
      animated
      closing={closing}
      onExited={onClose}
      placement="right"
      className="flex h-full w-full max-w-xl flex-col border-l border-border bg-white shadow-xl"
      bodyClassName="flex min-h-0 flex-1 flex-col"
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id={titleId} className="text-lg font-bold text-dash-ink">
                Scan details
              </h2>
              <ScanStatusBadge outcome={outcome} />
            </div>
            <p className="mt-1 break-all font-mono text-xs text-muted">{log.scanRef}</p>
          </div>
          <button
            ref={closeButton}
            type="button"
            aria-label="Close"
            onClick={requestClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-dash-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-purple/15"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Field label="User" wide>
              <span className="font-semibold">{personName(log)}</span>
              {log.displayName && <span className="block text-xs text-muted">{log.email}</span>}
            </Field>
            <Field label="Scan time">{formatTimestamp(log.startedAt)}</Field>
            <Field label="Duration">{formatDuration(log.durationMs)}</Field>
            <Field label="Status">
              <ScanStatusBadge outcome={outcome} />
            </Field>
            <Field label="Started by">{log.trigger === "scheduled" ? "Daily schedule" : "Manual run"}</Field>
          </dl>

          {diagnosis ? <Problem diagnosis={diagnosis} outcome={outcome} person={personName(log)} /> : <Result log={log} />}

          <TechnicalDetails log={log} diagnosis={diagnosis} />
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words text-dash-ink">{children}</dd>
    </div>
  );
}

/** A scan that worked: what it sent, or that there was nothing to send. */
function Result({ log }: { log: ScanLogSummary }) {
  const uploaded = log.uploadStatus === "uploaded";
  return (
    <section
      className={`mt-6 rounded-[10px] border px-4 py-3.5 text-sm ${
        uploaded ? "border-[#1f9d6b]/25 bg-[#e1f5ec] text-[#1f9d6b]" : "border-border bg-page text-dash-ink"
      }`}
    >
      <h3 className="font-bold">{uploaded ? "Usage uploaded successfully" : "No usage found"}</h3>
      <p className={`mt-1 ${uploaded ? "" : "text-muted"}`}>
        {uploaded
          ? `${formatCount(log.newTokens)} new tokens across ${formatCount(log.daysUploaded)} day(s).`
          : "Nothing new since this PC last reported. The check-in was recorded, so nothing needs fixing."}
      </p>
    </section>
  );
}

function Problem({ diagnosis, outcome, person }: { diagnosis: ScanDiagnosis; outcome: ScanOutcome; person: string }) {
  const tone = outcome === "failed" ? "border-danger/30 bg-danger/5" : "border-[#f5d896] bg-[#fffbeb]";
  const heading = outcome === "failed" ? "text-danger" : "text-[#b45309]";
  return (
    <>
      <section className={`mt-6 rounded-[10px] border px-4 py-3.5 text-sm ${tone}`}>
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${heading}`}>Problem</h3>
        <p className="mt-1 text-base font-bold text-dash-ink">{diagnosis.problem}</p>
        <p className="mt-1 text-dash-ink">{diagnosis.description}</p>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-bold text-dash-ink">How to fix</h3>
        {diagnosis.fix.some((step) => step.command) && (
          <p className="mt-1 text-xs text-muted">Commands run in a terminal on {person}&apos;s PC.</p>
        )}
        <ol className="mt-3 space-y-4">
          {diagnosis.fix.map((step, i) => (
            <li key={step.text} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-xs font-bold text-brand-purple">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-dash-ink">{step.text}</p>
                {step.command && (
                  <div className="mt-2">
                    <DocsCodeBlock code={step.command} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function TechnicalDetails({ log, diagnosis }: { log: ScanLogSummary; diagnosis: ScanDiagnosis | null }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const queuedFor = Date.parse(log.receivedAt) - Date.parse(log.finishedAt);

  return (
    <section className="mt-8 border-t border-border pt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg py-1 text-left text-sm font-semibold text-muted transition-colors hover:text-dash-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-purple/15"
      >
        Technical details
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div id={panelId} className="animate-tab-content mt-3 space-y-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Field label="Error code">{diagnosis ? errorCode(log, diagnosis) : "—"}</Field>
            <Field label="Failed step">{log.errorStep ? STEP_LABELS[log.errorStep] : "—"}</Field>
            <Field label="Error message" wide>
              {log.errorMessage ? (
                <span className="block whitespace-pre-wrap break-words rounded-lg bg-page px-3 py-2 font-mono text-xs">{log.errorMessage}</span>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Timestamp">{formatTimestamp(log.finishedAt)}</Field>
            <Field label="Received by server">
              {formatTimestamp(log.receivedAt)}
              {queuedFor > QUEUED_AFTER_MS && (
                <span className="block text-xs text-muted">Sent later from the PC&apos;s queue — the server was unreachable at the time.</span>
              )}
            </Field>
            <Field label="CLI version">{log.cliVersion ?? "—"}</Field>
            <Field label="Upload status">{UPLOAD_LABELS[log.uploadStatus]}</Field>
            <Field label="Transcript files">{formatCount(log.transcriptFiles)}</Field>
            <Field label="Responses processed">{formatCount(log.responses)}</Field>
            <Field label="Duplicates removed">{formatCount(log.duplicates)}</Field>
            <Field label="New tokens">{formatCount(log.newTokens)}</Field>
          </dl>
          <Timeline scanId={log.id} />
        </div>
      )}
    </section>
  );
}

/** The step timeline — the one part of the drawer that needs its own request. */
function Timeline({ scanId }: { scanId: string }) {
  const [detail, setDetail] = useState<ScanLogDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchScanLogDetail(scanId)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load this scan's steps.");
      });
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Process timeline</h4>
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
    </div>
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
