"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { Alert } from "@/components/ui/alert";
import { ChevronDownIcon, XIcon } from "@/components/layout/icons";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { ScanLogPerson } from "@/components/claude-usage/ScanLogPerson";
import { ScanStatusBadge } from "@/components/claude-usage/ScanStatusBadge";
import { ScanStageList } from "@/components/claude-usage/ScanStatusPanel";
import {
  fetchScanLogDetail,
  type ScanLogDetail,
  type ScanLogScope,
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
  startedLate,
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
 * One scan, in a side drawer over the Scan Logs table (ADR-099): what
 * happened, in plain words, and how to fix it — the admin's question. The raw
 * error, counts and step timeline sit in Technical details, collapsed, and
 * the timeline is only fetched the first time that is opened.
 *
 * `log` is the live row: the page passes the latest copy on every refresh, so
 * a scan that finishes while its drawer is open shows its result in place
 * (ADR-107). `scope` is whose scans the page reads — the timeline comes from
 * the same place.
 *
 * Mount with `key={log.id}` so opening another scan starts fresh.
 */
export function ScanLogDrawer({
  log,
  onClose,
  scope = "team",
}: {
  log: ScanLogSummary;
  onClose: () => void;
  scope?: ScanLogScope;
}) {
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
      className="flex h-full w-full max-w-xl flex-col border-l border-surface-border bg-card shadow-xl"
      bodyClassName="flex min-h-0 flex-1 flex-col"
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-surface-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id={titleId} className="text-lg font-semibold text-foreground">
                Scan details
              </h2>
              <ScanStatusBadge outcome={outcome} />
            </div>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{log.scanRef}</p>
          </div>
          <button
            ref={closeButton}
            type="button"
            aria-label="Close"
            onClick={requestClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Field label="User" wide>
              <ScanLogPerson log={log} size="size-9" />
            </Field>
            <Field label="Started at">{formatTimestamp(log.startedAt)}</Field>
            <Field label="Completed at">{log.finishedAt ? formatTimestamp(log.finishedAt) : "Not yet"}</Field>
            <Field label="Duration">{formatDuration(log.durationMs)}</Field>
            <Field label="Started by">
              {log.trigger !== "scheduled"
                ? "Manual run"
                : startedLate(log)
                  ? "Daily schedule · started late (expected 11:00 AM or 4:00 PM)"
                  : "Daily schedule"}
            </Field>
          </dl>

          <div className="mt-6">
            <ScanStageList log={log} />
          </div>

          {outcome === "in-progress" ? (
            <InProgress />
          ) : diagnosis ? (
            <Problem diagnosis={diagnosis} outcome={outcome} pc={scope === "mine" ? "your PC" : `${personName(log)}'s PC`} />
          ) : (
            <Result log={log} />
          )}

          <TechnicalDetails log={log} diagnosis={diagnosis} scope={scope} />
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-foreground">{children}</dd>
    </div>
  );
}

/** Started, no result yet: say only that — never a guess at how it will end. */
function InProgress() {
  return (
    <section className="mt-6 rounded-[10px] border border-border bg-brand-blue/10 px-4 py-3.5 text-sm">
      <h3 className="font-bold text-dash-ink">Scan in progress</h3>
      <p className="mt-1 text-dash-ink">
        The reporter said this scan started and hasn&apos;t sent its result yet. This updates on its own when the result arrives.
      </p>
    </section>
  );
}

/** A scan that worked: what it sent, or that there was nothing to send. */
function Result({ log }: { log: ScanLogSummary }) {
  const uploaded = log.uploadStatus === "uploaded";
  return (
    <section
      className={`mt-6 rounded-[10px] border px-4 py-3.5 text-sm ${
        uploaded ? "border-[#1f9d6b]/25 bg-[#e1f5ec] text-[#1f9d6b]" : "border-surface-border bg-muted-surface text-foreground"
      }`}
    >
      <h3 className="font-bold">{uploaded ? "Usage uploaded successfully" : "No usage found"}</h3>
      <p className={`mt-1 ${uploaded ? "" : "text-muted-foreground"}`}>
        {uploaded
          ? `${formatCount(log.newTokens)} new tokens across ${formatCount(log.daysUploaded)} day(s).`
          : "Nothing new since this PC last reported. The check-in was recorded, so nothing needs fixing."}
      </p>
    </section>
  );
}

function Problem({ diagnosis, outcome, pc }: { diagnosis: ScanDiagnosis; outcome: ScanOutcome; pc: string }) {
  // A scan with no result is unknown, not failed: neutral, never the danger tone.
  const tone =
    outcome === "failed"
      ? "border-danger/30 bg-danger/5"
      : outcome === "no-result"
        ? "border-surface-border bg-muted-surface"
        : "border-[#f5d896] bg-[#fffbeb]";
  const heading = outcome === "failed" ? "text-danger" : outcome === "no-result" ? "text-muted-foreground" : "text-[#b45309]";
  return (
    <>
      <section className={`mt-6 rounded-xl border px-4 py-3.5 text-sm ${tone}`}>
        <h3 className={`text-xs font-medium ${heading}`}>Problem</h3>
        <p className="mt-1 text-base font-bold text-foreground">{diagnosis.problem}</p>
        <p className="mt-1 text-foreground">{diagnosis.description}</p>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-bold text-foreground">How to fix</h3>
        {diagnosis.fix.some((step) => step.command) && (
          <p className="mt-1 text-xs text-muted-foreground">Commands run in a terminal on {pc}.</p>
        )}
        <ol className="mt-3 space-y-4">
          {diagnosis.fix.map((step, i) => (
            <li key={step.text} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-foreground">{step.text}</p>
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

function TechnicalDetails({
  log,
  diagnosis,
  scope,
}: {
  log: ScanLogSummary;
  diagnosis: ScanDiagnosis | null;
  scope: ScanLogScope;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const queuedFor = log.finishedAt ? Date.parse(log.receivedAt) - Date.parse(log.finishedAt) : 0;

  return (
    <section className="mt-8 border-t border-surface-border pt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg py-1 text-left text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
      >
        Technical details
        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div id={panelId} className="animate-tab-content mt-3 space-y-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Field label="Error code">{diagnosis ? errorCode(log, diagnosis) : "—"}</Field>
            <Field label="Failed step">{log.errorStep ? STEP_LABELS[log.errorStep] : "—"}</Field>
            <Field label="Error message" wide>
              {log.errorMessage ? (
                <span className="block whitespace-pre-wrap break-words rounded-lg bg-muted-surface px-3 py-2 font-mono text-xs">{log.errorMessage}</span>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Completed at">{formatTimestamp(log.finishedAt)}</Field>
            <Field label="Received by server">
              {formatTimestamp(log.receivedAt)}
              {queuedFor > QUEUED_AFTER_MS && (
                <span className="block text-xs text-muted-foreground">Sent later from the PC&apos;s queue — the server was unreachable at the time.</span>
              )}
            </Field>
            <Field label="CLI version">{log.cliVersion ?? "—"}</Field>
            <Field label="Upload status">{UPLOAD_LABELS[log.uploadStatus]}</Field>
            <Field label="Transcript files">{formatCount(log.transcriptFiles)}</Field>
            <Field label="Responses processed">{formatCount(log.responses)}</Field>
            <Field label="Duplicates removed">{formatCount(log.duplicates)}</Field>
            <Field label="New tokens">{formatCount(log.newTokens)}</Field>
          </dl>
          <Timeline scanId={log.id} status={log.status} scope={scope} />
        </div>
      )}
    </section>
  );
}

/**
 * The step timeline — the one part of the drawer that needs its own request.
 * Fetched again when the scan's status changes, so a scan that finishes
 * while open shows its real steps rather than the empty ones it started with.
 */
function Timeline({ scanId, status, scope }: { scanId: string; status: ScanLogSummary["status"]; scope: ScanLogScope }) {
  const [detail, setDetail] = useState<ScanLogDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchScanLogDetail(scanId, scope)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load this scan's steps.");
      });
    return () => {
      cancelled = true;
    };
  }, [scanId, status, scope]);

  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground">Process timeline</h4>
      {error ? (
        <Alert variant="destructive" className="mt-3">
          {error}
        </Alert>
      ) : !detail ? (
        <p role="status" className="mt-3 rounded-xl border border-surface-border bg-muted-surface px-4 py-6 text-center text-sm text-muted-foreground">
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
  skipped: { glyph: "–", ring: "bg-muted-surface text-muted-foreground", label: "Not run" },
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
          <p className={`text-sm font-semibold ${step.status === "skipped" ? "text-muted-foreground" : "text-foreground"}`}>
            {STEP_LABELS[step.key]}
          </p>
          {time && <span className="text-xs text-muted-foreground">{time}</span>}
        </div>
        <p
          className={`mt-0.5 break-words text-xs ${
            step.status === "failed" ? "text-danger" : step.status === "warning" ? "text-[#b45309]" : "text-muted-foreground"
          }`}
        >
          {step.status === "skipped" ? "Not run." : step.detail || mark.label}
        </p>
      </div>
    </li>
  );
}
