"use client";

import { useState } from "react";
import { ConfirmationBar } from "./ConfirmationBar";
import type { AxRenewalAnalysis, AxRenewalConfirmation, AxRenewalStackLayer } from "@/lib/ax-renewal/api";

type Row = { layerKey: string; oldTarget: string; newTarget: string };

/**
 * A starting point built from what analysis actually found, never a fixed
 * catalogue of layer names — a project attach a static site, say, has no
 * "Data access" layer to invent. Every field here traces to a real value:
 * `runningOnToday` (a connected model's own read of what's running today) is
 * preferred since each entry already names one real aspect of the stack;
 * `stackDetected` (present even from the keyword-stub path) is the fallback.
 * Genuinely empty when analysis found nothing at all — a person adds rows
 * by hand from there, same as before.
 */
export function suggestRows(analysis: AxRenewalAnalysis | null): Row[] {
  if (!analysis) return [];
  if (analysis.runningOnToday.length > 0) {
    return analysis.runningOnToday.map((tag) => ({
      layerKey: tag.label,
      oldTarget: tag.note ?? tag.label,
      newTarget: "",
    }));
  }
  return Object.entries(analysis.stackDetected).map(([key, value]) => ({
    layerKey: key,
    oldTarget: value,
    newTarget: "",
  }));
}

function toRows(layers: AxRenewalStackLayer[], analysis: AxRenewalAnalysis | null): Row[] {
  if (layers.length > 0) {
    return layers.map((l) => ({ layerKey: l.layerKey, oldTarget: l.oldTarget ?? "", newTarget: l.newTarget ?? "" }));
  }
  return suggestRows(analysis);
}

export function StackMoveSection({
  layers,
  analysis,
  confirmation,
  canEdit,
  canConfirm,
  onSave,
  onConfirm,
  onReopen,
}: {
  layers: AxRenewalStackLayer[];
  analysis: AxRenewalAnalysis | null;
  confirmation: AxRenewalConfirmation | undefined;
  canEdit: boolean;
  canConfirm: boolean;
  onSave: (rows: { layerKey: string; oldTarget: string | null; newTarget: string | null }[]) => Promise<void>;
  onConfirm: () => void;
  onReopen: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(layers, analysis));
  // Nothing has been saved yet and these rows came from analysis, not a blank
  // slate — worth saying so, since otherwise a suggestion reads as if it were
  // already the recorded plan.
  const [isSuggestion] = useState(() => layers.length === 0 && rows.length > 0);
  const [saving, setSaving] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(index: number, field: "oldTarget" | "newTarget", value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(
        rows.map((r) => ({
          layerKey: r.layerKey,
          oldTarget: r.oldTarget.trim() || null,
          newTarget: r.newTarget.trim() || null,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the stack move.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    setConfirmBusy(true);
    setError(null);
    try {
      onConfirm();
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="rounded-[5px] border border-border bg-white p-5">
      <h3 className="text-sm font-bold text-dash-ink">Stack Move</h3>
      <p className="mt-1 text-xs text-muted">
        For each <strong>architectural layer</strong>, record what it runs on today and what it should move to. Leave the target
        blank to stay on the current technology.
      </p>

      {isSuggestion && (
        <p className="mt-3 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-3 py-2 text-xs text-dash-ink">
          Rows below are a starting point built from what <strong>Run analysis</strong> found on the Codebase/Findings
          tabs — nothing is saved yet. Edit or remove any of them, then <strong>Save stack move</strong>.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Nothing detected yet to suggest a starting point — run analysis first, or add a layer by hand once you can.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-3 py-2 text-left">Layer</th>
                <th className="px-3 py-2 text-left">Current</th>
                <th className="px-3 py-2 text-left">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => (
                <tr key={row.layerKey}>
                  <td className="px-3 py-2 font-medium text-dash-ink">{row.layerKey}</td>
                  <td className="px-3 py-2">
                    <input
                      value={row.oldTarget}
                      disabled={!canEdit}
                      onChange={(e) => updateRow(i, "oldTarget", e.target.value)}
                      placeholder="e.g. Node 12"
                      className="w-full rounded-lg border border-border px-2 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.newTarget}
                      disabled={!canEdit}
                      onChange={(e) => updateRow(i, "newTarget", e.target.value)}
                      placeholder="stay on current"
                      className="w-full rounded-lg border border-border px-2 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}

      {canEdit && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-[5px] border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save stack move"}
          </button>
        </div>
      )}

      <ConfirmationBar
        section="stack_move"
        confirmation={confirmation}
        canConfirm={canConfirm}
        busy={confirmBusy}
        onConfirm={() => void handleConfirm()}
        onReopen={onReopen}
      />
    </div>
  );
}
