"use client";

import { SkeletonGroup, SkeletonList } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  fetchGeneratedChanges,
  listImplementationRuns,
  type AxRenewalGeneratedChange,
  type AxRenewalRunSummary,
} from "@/lib/ax-renewal/api";

const KIND_LABEL: Record<AxRenewalRunSummary["runKind"], string> = {
  plan: "Plan build",
  error_fix: "Error fix",
  ui_change: "UI change",
};

/** Ended well, ended badly, or still going — the three colours a status can be. */
function statusTone(status: string): string {
  if (status === "applied" || status === "completed") return "bg-emerald-50 text-emerald-700";
  if (status === "failed") return "bg-danger/10 text-danger";
  if (status === "generating" || status === "applying" || status === "running" || status === "awaiting_review") {
    return "bg-secondary text-foreground";
  }
  // cancelled, rejected, reverted: a deliberate stop, not a fault.
  return "bg-muted-surface text-muted-foreground";
}

/** "45s", "12 min", "1h 5m" — or null while the run has not finished. */
export function formatDuration(startedAt: string, completedAt: string | null): string | null {
  if (!completedAt) return null;
  const secs = Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  if (Number.isNaN(secs)) return null;
  if (secs < 60) return `${secs}s`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/**
 * Every implementation run this project has had, newest first (ADR-078) —
 * plan builds, error fixes, UI changes, and how each ended. Read-only on
 * purpose: approving, rejecting and reverting stay on the current run above,
 * where the backend's own "latest run only" rules apply.
 *
 * <p>Re-read whenever `refreshKey` changes — the panel passes the latest run's
 * id and status, so a run that starts, finishes or is reverted shows up here
 * without a reload.
 */
export function RunHistory({ projectId, refreshKey }: { projectId: string; refreshKey: string }) {
  const [runs, setRuns] = useState<AxRenewalRunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listImplementationRuns(projectId)
      .then((list) => {
        if (!cancelled) setRuns(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load the run history.");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, refreshKey]);

  return (
    <section aria-label="Run history" className="mt-6 border-t border-surface-border pt-5">
      <h4 className="text-sm font-semibold text-foreground">History</h4>
      <p className="mt-1 text-xs text-muted-foreground">Every build, error fix and UI change on this project, newest first.</p>

      {error && <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      {!error && runs === null && <SkeletonGroup label="Loading runs" className="mt-3"><SkeletonList rows={3} avatar={false} /></SkeletonGroup>}
      {!error && runs !== null && runs.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">No runs yet — the first build will appear here.</p>
      )}

      {runs !== null && runs.length > 0 && (
        <ul className="mt-3 divide-y divide-surface-border rounded-lg border border-surface-border">
          {runs.map((run) => (
            <RunRow
              key={run.id}
              projectId={projectId}
              run={run}
              open={expanded === run.id}
              onToggle={() => setExpanded((current) => (current === run.id ? null : run.id))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function RunRow({
  projectId,
  run,
  open,
  onToggle,
}: {
  projectId: string;
  run: AxRenewalRunSummary;
  open: boolean;
  onToggle: () => void;
}) {
  const [files, setFiles] = useState<AxRenewalGeneratedChange[] | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const duration = formatDuration(run.startedAt, run.completedAt);

  // Fetched on first open, not with the list: most rows are never opened, and
  // a run's file contents are the heavy part.
  useEffect(() => {
    if (!open || files !== null || run.changedFiles === 0) return;
    let cancelled = false;
    fetchGeneratedChanges(projectId, run.id)
      .then((list) => {
        if (!cancelled) setFiles(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setFilesError(err instanceof Error ? err.message : "Couldn't load this run's files.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, files, projectId, run.id, run.changedFiles]);

  return (
    <li className="px-3 py-2.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{KIND_LABEL[run.runKind] ?? run.runKind}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusTone(run.status)}`}>
              {run.status.replace(/_/g, " ")}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {run.startedByName ? `Started by ${run.startedByName} · ` : ""}
            {new Date(run.startedAt).toLocaleString()}
            {duration ? ` · took ${duration}` : run.completedAt ? "" : " · in progress"}
            {` · ${run.changedFiles === 1 ? "1 file" : `${run.changedFiles} files`}`}
          </span>
          {run.instruction && (
            <span className={`mt-1 block whitespace-pre-wrap break-words text-xs text-muted-foreground ${open ? "" : "line-clamp-2"}`}>
              {run.runKind === "error_fix" ? "Fixing: " : "Requested: "}
              {run.instruction}
            </span>
          )}
          {run.failureReason && <span className="mt-1 block text-xs text-danger">{run.failureReason}</span>}
        </span>
        <span aria-hidden="true" className="shrink-0 text-xs text-muted-foreground">
          {open ? "Hide" : "Details"}
        </span>
      </button>

      {open && (
        <div className="mt-2 pl-1">
          {run.changedFiles === 0 ? (
            <p className="text-xs text-muted-foreground">This run proposed no file changes.</p>
          ) : filesError ? (
            <p role="alert" className="text-xs font-medium text-danger">{filesError}</p>
          ) : files === null ? (
            <p className="text-xs text-muted-foreground">Loading files…</p>
          ) : (
            <ul aria-label="Changed files" className="space-y-0.5">
              {files.map((f) => (
                <li key={f.path} className="flex items-center gap-2 font-mono text-xs text-foreground">
                  <span className="w-14 shrink-0 font-sans text-[11px] font-semibold uppercase text-muted-foreground">{f.changeKind}</span>
                  <span className="truncate">{f.path}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
