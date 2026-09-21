"use client";

import { useEffect, useState } from "react";
import { fetchAuditTrail, type AxRenewalAuditEntry } from "@/lib/ax-renewal/api";
import { TagIcon } from "@/components/layout/icons";

/** The action's enum key (e.g. "ax_renewal.section_confirm") shaped into a short, readable label. */
function actionLabel(action: string): string {
  const key = action.startsWith("ax_renewal.") ? action.slice("ax_renewal.".length) : action;
  return key.replace(/_/g, " ");
}

/**
 * This project's real audit trail (ADR-037's Workspace group) — only ever
 * mounted for a super_admin caller (see `explorerGroups.ts`'s Workspace
 * group and `AxRenewalController`'s route floor), since every row carries
 * another account's email.
 */
export function AuditTrailPanel({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<AxRenewalAuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setError(null);
    fetchAuditTrail(projectId)
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load the audit trail.");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <TagIcon className="h-5 w-5 text-brand-purple" />
        <h3 className="text-sm font-bold text-dash-ink">Audit trail</h3>
        {entries && <span className="ml-auto text-xs text-muted">{entries.length} entries</span>}
      </div>

      {error && (
        <p role="alert" className="px-5 py-4 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {!error && entries == null && <p className="px-5 py-4 text-sm text-muted">Loading…</p>}

      {!error && entries != null && entries.length === 0 && (
        <p className="px-5 py-4 text-sm text-muted">Nothing recorded for this project yet.</p>
      )}

      {!error && entries != null && entries.length > 0 && (
        <ul className="divide-y divide-border">
          {entries.map((entry, index) => (
            <li key={`${entry.occurredAt}-${index}`} className="flex items-start gap-3 px-5 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium capitalize text-dash-ink">{actionLabel(entry.action)}</span>
                <span className="block text-xs text-muted">
                  {entry.actorEmail} · {new Date(entry.occurredAt).toLocaleString()}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
