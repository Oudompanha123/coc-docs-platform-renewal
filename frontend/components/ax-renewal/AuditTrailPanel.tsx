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
    <div className="rounded-xl border border-surface-border bg-card">
      <div className="flex items-center gap-2 border-b border-surface-border p-4">
        <TagIcon className="h-5 w-5 text-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Audit trail</h3>
        {entries && <span className="ml-auto text-xs text-muted-foreground">{entries.length} entries</span>}
      </div>

      {error && (
        <p role="alert" className="p-4 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {!error && entries == null && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}

      {!error && entries != null && entries.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">Nothing recorded for this project yet.</p>
      )}

      {!error && entries != null && entries.length > 0 && (
        <ul className="divide-y divide-surface-border">
          {entries.map((entry, index) => (
            <li key={`${entry.occurredAt}-${index}`} className="flex items-start gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium capitalize text-foreground">{actionLabel(entry.action)}</span>
                <span className="block text-xs text-muted-foreground">
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
