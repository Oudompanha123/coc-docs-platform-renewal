"use client";

import { useState } from "react";
import type { LegalDocumentContent } from "@/lib/legal/legal-document";
import type { LegalDocValidationIssues } from "@/lib/legal/legal-document-validate";

const SECTION_ISSUE_RE = /^sections\[(\d+)\]/;

/**
 * The pre-publish checklist (task spec §G): every validation issue listed
 * with a "Go to field" link, a non-blocking warning if the document is
 * still marked Draft, and an optional Publish note (max 200). Confirm is
 * disabled while any issue remains.
 */
export function TermsPrePublishDialog({
  content,
  issues,
  onGoToField,
  onConfirm,
  onCancel,
}: {
  content: LegalDocumentContent;
  issues: LegalDocValidationIssues;
  /** `null` for a top-level field (just switch to Edit mode); a section
   *  index to also expand and scroll to that section. */
  onGoToField: (sectionIndex: number | null) => void;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  const issueEntries = Object.entries(issues);
  const canPublish = issueEntries.length === 0;

  return (
    <div role="dialog" aria-modal="true" aria-label="Pre-publish check" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl">
        <h2 className="text-base font-bold text-foreground">Pre-publish check</h2>

        {canPublish ? (
          <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            Ready to publish — no issues found.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {issueEntries.map(([path, message]) => {
              const sectionMatch = SECTION_ISSUE_RE.exec(path);
              const sectionIndex = sectionMatch ? Number(sectionMatch[1]) : null;
              return (
                <li key={path} className="flex items-start justify-between gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                  <span>{message}</span>
                  <button
                    type="button"
                    onClick={() => onGoToField(sectionIndex)}
                    className="shrink-0 font-semibold text-foreground hover:underline"
                  >
                    Go to field
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {content.status === "draft" && (
          <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            This document is still marked as Draft. The sample badge will show.
          </p>
        )}

        <div className="mt-4">
          <span className="text-xs font-semibold text-muted-foreground">Publish note (optional)</span>
          <textarea
            rows={2}
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Updated data retention section"
            className="mt-1.5 w-full rounded-xl border border-surface-border px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30 focus:ring-[3px] focus:ring-ring/50"
          />
          <p className="mt-1 text-xs text-muted-foreground">{200 - note.length} characters left</p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-surface-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canPublish}
            onClick={() => onConfirm(note)}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
