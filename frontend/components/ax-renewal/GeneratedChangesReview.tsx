"use client";

import { useEffect, useState } from "react";
import {
  approveImplementation,
  fetchGeneratedChanges,
  rejectImplementation,
  type AxRenewalGeneratedChange,
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
                      ? "bg-brand-purple/10 text-brand-purple"
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
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all bg-brand-purple/5 p-3 font-mono text-xs text-dash-ink">
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
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleApprove()}
            disabled={busy}
            className="rounded-[5px] bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
