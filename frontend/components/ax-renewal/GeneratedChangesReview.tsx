"use client";

import { SkeletonGroup, SkeletonTable } from "@/components/ui/skeleton";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
      <Alert variant="destructive" className="mt-3">
        {loadError}
      </Alert>
    );
  }
  if (changes === null) {
    return <SkeletonGroup label="Loading the proposed changes" className="mt-3"><SkeletonTable rows={4} columns={3} /></SkeletonGroup>;
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-foreground">
        <strong>{changes.length}</strong> file{changes.length === 1 ? "" : "s"} proposed — review each before
        deciding. Nothing has been written to the destination yet.
      </p>
      <div className="divide-y divide-surface-border rounded-xl border border-surface-border">
        {changes.map((c) => {
          const isOpen = expanded === c.path;
          return (
            <div key={c.path}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : c.path)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent"
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
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{c.path}</span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-1 gap-px border-t border-surface-border bg-surface-border sm:grid-cols-2">
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all bg-[#fdf1e3]/30 p-3 font-mono text-xs text-foreground">
                    {c.beforeContent ?? "(new file)"}
                  </pre>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all bg-secondary p-3 font-mono text-xs text-foreground">
                    {c.afterContent ?? "(deleted)"}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {actionError && (
        <Alert variant="destructive">{actionError}</Alert>
      )}

      {canConfirm && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleRunTests()}
            disabled={testing}
          >
            {testing ? "Running tests…" : "Run tests"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Against a disposable copy of this exact proposal — never the live destination.
          </p>
          {testError && (
            <Alert variant="destructive" className="mt-2">
              {testError}
            </Alert>
          )}
          {testResult && !testResult.executed && (
            <Alert variant="warning" className="mt-2">
              {testResult.note}
            </Alert>
          )}
          {testResult && testResult.executed && (
            <Alert variant={testResult.exitCode === 0 ? "success" : "destructive"} className="mt-2">
              <AlertTitle>
                {testResult.exitCode === 0 ? "Tests passed" : `Tests failed (exit code ${testResult.exitCode})`}
              </AlertTitle>
              {testResult.output.length > 0 && (
                <pre className="mt-1.5 max-h-56 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">
                  {testResult.output.join("\n")}
                </pre>
              )}
            </Alert>
          )}
        </div>
      )}

      {canConfirm && (
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => void handleApprove()}
            disabled={busy}
          >
            {busy ? "Working…" : "Approve and apply"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleReject()}
            disabled={busy}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
