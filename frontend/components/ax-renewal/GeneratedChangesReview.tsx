"use client";

import { useEffect, useState } from "react";
import {
  approveImplementation,
  fetchGeneratedChanges,
  rejectImplementation,
  runTests,
  type AxRenewalGeneratedChange,
  type AxRenewalTestRunResult,
} from "@/lib/ax-renewal/api";

/**
 * The Review step of Generate → Review → Apply (ADR-044) — every proposed
 * file, its real before/after content, and a single whole-run Approve or
 * Reject. Nothing here writes to the destination on its own; Approve is the
 * one action that does, and only after this screen has shown what it's
 * approving.
 */
export function GeneratedChangesReview({
  projectId,
  runId,
  canConfirm,
  onChanged,
}: {
  projectId: string;
  runId: string;
  canConfirm: boolean;
  onChanged: () => Promise<void>;
}) {
  const [changes, setChanges] = useState<AxRenewalGeneratedChange[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Running tests against a disposable copy (ADR-062 Phase 2) — never the
  // live destination, so nothing here can conflict with Approve/Reject
  // above; a real result or an honest refusal, shown as-is.
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AxRenewalTestRunResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setChanges(null);
    fetchGeneratedChanges(projectId, runId)
      .then((result) => {
        if (!cancelled) setChanges(result);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Couldn't load the proposed changes.");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, runId]);

  async function handleApprove() {
    setBusy(true);
    setActionError(null);
    try {
      await approveImplementation(projectId, runId);
      await onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't apply the approved changes.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    setActionError(null);
    try {
      await rejectImplementation(projectId, runId);
      await onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't reject this run.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRunTests() {
    setTesting(true);
    setTestError(null);
    setTestResult(null);
    try {
      setTestResult(await runTests(projectId, runId));
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Couldn't run tests for this change.");
    } finally {
      setTesting(false);
    }
  }

  if (loadError) {
    return (
      <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
        {loadError}
      </p>
    );
  }
  if (changes === null) {
    return <p className="mt-3 text-sm text-muted">Loading the proposed changes…</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-dash-ink">
        <strong>{changes.length}</strong> file{changes.length === 1 ? "" : "s"} proposed — review each before
        deciding. Nothing has been written to the destination yet.
      </p>
      <div className="divide-y divide-border rounded-xl border border-border">
        {changes.map((c) => {
          const isOpen = expanded === c.path;
          return (
            <div key={c.path}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : c.path)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-page"
              >
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                    c.changeKind === "create"
                      ? "bg-secondary text-foreground"
                      : c.changeKind === "delete"
                        ? "bg-danger/10 text-danger"
                        : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {c.changeKind}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-dash-ink">{c.path}</span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-2">
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all bg-[#fdf1e3]/30 p-3 font-mono text-xs text-dash-ink">
                    {c.beforeContent ?? "(new file)"}
                  </pre>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all bg-secondary p-3 font-mono text-xs text-dash-ink">
                    {c.afterContent ?? "(deleted)"}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {actionError && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
          {actionError}
        </p>
      )}

      {canConfirm && (
        <div>
          <button
            type="button"
            onClick={() => void handleRunTests()}
            disabled={testing}
            className="rounded-[5px] border border-border px-3.5 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testing ? "Running tests…" : "Run tests"}
          </button>
          <p className="mt-1 text-xs text-muted">
            Against a disposable copy of this exact proposal — never the live destination.
          </p>
          {testError && (
            <p role="alert" className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
              {testError}
            </p>
          )}
          {testResult && !testResult.executed && (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {testResult.note}
            </p>
          )}
          {testResult && testResult.executed && (
            <div
              className={`mt-2 rounded-xl border px-3 py-2 text-xs ${
                testResult.exitCode === 0
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-danger/30 bg-danger/10 text-danger"
              }`}
            >
              <p className="font-semibold">
                {testResult.exitCode === 0 ? "Tests passed" : `Tests failed (exit code ${testResult.exitCode})`}
              </p>
              {testResult.output.length > 0 && (
                <pre className="mt-1.5 max-h-56 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">
                  {testResult.output.join("\n")}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {canConfirm && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleApprove()}
            disabled={busy}
            className="rounded-[5px] bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Working…" : "Approve and apply"}
          </button>
          <button
            type="button"
            onClick={() => void handleReject()}
            disabled={busy}
            className="rounded-[5px] border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
