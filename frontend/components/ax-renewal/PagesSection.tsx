"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/layout/icons";
import { ConfirmationBar } from "./ConfirmationBar";
import type { AxRenewalConfirmation, AxRenewalPageMapping } from "@/lib/ax-renewal/api";

type Row = { oldPath: string; newPath: string; notes: string };

function toRows(pages: AxRenewalPageMapping[]): Row[] {
  return pages.map((p) => ({ oldPath: p.oldPath ?? "", newPath: p.newPath ?? "", notes: p.notes ?? "" }));
}

export function PagesSection({
  pages,
  confirmation,
  canEdit,
  canConfirm,
  onSave,
  onConfirm,
  onReopen,
}: {
  pages: AxRenewalPageMapping[];
  confirmation: AxRenewalConfirmation | undefined;
  canEdit: boolean;
  canConfirm: boolean;
  onSave: (rows: { oldPath: string | null; newPath: string | null; notes: string | null }[]) => Promise<void>;
  onConfirm: () => void;
  onReopen: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(pages));
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

  async function handleSave() {
    const cleaned = rows
      .map((r) => ({
        oldPath: r.oldPath.trim() || null,
        newPath: r.newPath.trim() || null,
        notes: r.notes.trim() || null,
      }))
      .filter((r) => r.oldPath != null || r.newPath != null);
    setSaving(true);
    setError(null);
    try {
      await onSave(cleaned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the pages.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    setConfirmBusy(true);
    try {
      onConfirm();
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-dash-ink">Pages</h3>
      <p className="mt-1 text-xs text-muted">
        Map each old page to its new route. Leave the old side blank for a page that never existed before; leave
        the new side blank for one being retired.
      </p>

      <div className="mt-4 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
            <input
              value={row.oldPath}
              disabled={!canEdit}
              onChange={(e) => updateRow(i, "oldPath", e.target.value)}
              placeholder="Old route (e.g. /products)"
              className="rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
            />
            <input
              value={row.newPath}
              disabled={!canEdit}
              onChange={(e) => updateRow(i, "newPath", e.target.value)}
              placeholder="New route"
              className="rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
            />
            <input
              value={row.notes}
              disabled={!canEdit}
              onChange={(e) => updateRow(i, "notes", e.target.value)}
              placeholder="Notes"
              className="rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
            />
            {canEdit && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label="Remove page"
                className="flex items-center justify-center rounded-lg border border-border p-2 text-muted transition-colors hover:bg-page hover:text-danger"
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
          className="mt-3 flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-brand-purple hover:text-brand-purple"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add page
        </button>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}

      {canEdit && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}
