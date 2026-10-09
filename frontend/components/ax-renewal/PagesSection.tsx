"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/layout/icons";
import { ConfirmationBar } from "./ConfirmationBar";
import { useUnsavedChangesGuard } from "@/lib/ax-renewal/unsavedChanges";
import type { AxRenewalAnalysis, AxRenewalConfirmation, AxRenewalPageMapping } from "@/lib/ax-renewal/api";
import { inputBaseClass } from "@/components/ui/input";

type Row = { oldPath: string; newPath: string; notes: string };

/**
 * When nothing has been mapped yet, a starting point built from the real
 * routes/screens analysis actually found (`pagesDetected`) — never a
 * fabricated page. `newPath` stays blank; where each old page ends up is a
 * decision, not something analysis can answer. Genuinely empty when
 * analysis found no pages at all — same "add one by hand" state as before.
 */
export function toRows(pages: AxRenewalPageMapping[], analysis: AxRenewalAnalysis | null): Row[] {
  if (pages.length > 0) {
    return pages.map((p) => ({ oldPath: p.oldPath ?? "", newPath: p.newPath ?? "", notes: p.notes ?? "" }));
  }
  return (analysis?.pagesDetected ?? []).map((p) => ({ oldPath: p.path, newPath: "", notes: p.purpose }));
}

type CleanedRow = { oldPath: string | null; newPath: string | null; notes: string | null };

/** What `rows` would actually persist if Save were pressed right now — a blank row (oldPath and newPath both empty) is dropped, same as `handleSave` already does. */
function cleanRows(rows: Row[]): CleanedRow[] {
  return rows
    .map((r) => ({
      oldPath: r.oldPath.trim() || null,
      newPath: r.newPath.trim() || null,
      notes: r.notes.trim() || null,
    }))
    .filter((r) => r.oldPath != null || r.newPath != null);
}

/**
 * Whether what Save would persist right now already matches what is actually
 * on the server. Confirming this section records a sign-off on the
 * *persisted* pages, not on whatever is currently typed in these rows — so
 * this is what Confirm checks before letting a caller who edited a row (or
 * added/removed one) and went straight to Confirm, without pressing Save
 * pages first, sign off on the mapping as it stood before that edit.
 */
export function sameCleanedRows(a: CleanedRow[], b: CleanedRow[]): boolean {
  return (
    a.length === b.length &&
    a.every((r, i) => r.oldPath === b[i]?.oldPath && r.newPath === b[i]?.newPath && r.notes === b[i]?.notes)
  );
}

export function PagesSection({
  pages,
  analysis,
  confirmation,
  canEdit,
  canConfirm,
  onSave,
  onConfirm,
  onReopen,
}: {
  pages: AxRenewalPageMapping[];
  analysis: AxRenewalAnalysis | null;
  confirmation: AxRenewalConfirmation | undefined;
  canEdit: boolean;
  canConfirm: boolean;
  onSave: (rows: { oldPath: string | null; newPath: string | null; notes: string | null }[]) => Promise<void>;
  /** Awaited, so a refusal (e.g. a 409 because a teammate changed the plan since this loaded, ADR-067) lands on this section's error line. */
  onConfirm: () => Promise<void>;
  onReopen: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(pages, analysis));
  const [isSuggestion] = useState(() => pages.length === 0 && rows.length > 0);
  const [saving, setSaving] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { oldPath: "", newPath: "", notes: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const cleanedRows = cleanRows(rows);
  const persistedCleaned: CleanedRow[] = pages.map((p) => ({
    oldPath: p.oldPath,
    newPath: p.newPath,
    notes: p.notes,
  }));
  const hasUnsavedChanges = !sameCleanedRows(cleanedRows, persistedCleaned);
  // Warn before leaving only for the person's own edits (ADR-076): what was
  // first shown may be an unsaved suggestion from analysis — unsaved, but not
  // typed by anyone, and not something leaving would lose that matters.
  const [shownCleaned] = useState(cleanedRows);
  useUnsavedChangesGuard(hasUnsavedChanges && !sameCleanedRows(cleanedRows, shownCleaned), "Pages");

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(cleanedRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the pages.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    if (hasUnsavedChanges) {
      setError(
        "Save pages first — the mapping below hasn't been saved yet, so confirming now would sign off on the previous mapping, not this one.",
      );
      return;
    }
    setConfirmBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't confirm the pages.");
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[5px] border border-border bg-white">
      <div className="border-b border-border bg-page px-5 py-3">
        <h3 className="text-sm font-bold text-dash-ink">Pages</h3>
      </div>
      <div className="p-5">
      <p className="text-xs text-muted">
        Map each old page to its new route. Leave the old side blank for a page that never existed before; leave
        the new side blank for one being retired.
      </p>

      {isSuggestion && (
        <p className="mt-3 rounded-xl border border-surface-border bg-secondary px-3 py-2 text-xs text-dash-ink">
          Old routes and notes below are pages <strong>Run analysis</strong> actually detected — nothing is saved
          yet. Fill in a new route for each, remove any that don&apos;t belong, then <strong>Save pages</strong>.
        </p>
      )}

      <div className="mt-4 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
            <input
              value={row.oldPath}
              disabled={!canEdit}
              onChange={(e) => updateRow(i, "oldPath", e.target.value)}
              placeholder="Old route (e.g. /products)"
              className={inputBaseClass}
            />
            <input
              value={row.newPath}
              disabled={!canEdit}
              onChange={(e) => updateRow(i, "newPath", e.target.value)}
              placeholder="New route"
              className={inputBaseClass}
            />
            <input
              value={row.notes}
              disabled={!canEdit}
              onChange={(e) => updateRow(i, "notes", e.target.value)}
              placeholder="Notes"
              className={inputBaseClass}
            />
            {canEdit && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label="Remove page"
                className="flex items-center justify-center rounded-[5px] border border-border p-2 text-muted transition-colors hover:bg-page hover:text-danger"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={addRow}
          className="mt-3 flex items-center gap-1.5 rounded-[5px] border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-primary hover:text-foreground"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add page
        </button>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}

      {canEdit && (
        <div className="mt-3 flex items-center justify-between gap-3">
          {hasUnsavedChanges ? (
            <p className="text-xs font-medium text-amber-700">Unsaved changes — save before confirming.</p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-[5px] border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save pages"}
          </button>
        </div>
      )}

      <ConfirmationBar
        section="pages"
        confirmation={confirmation}
        canConfirm={canConfirm}
        busy={confirmBusy}
        onConfirm={() => void handleConfirm()}
        onReopen={onReopen}
      />
      </div>
    </div>
  );
}
