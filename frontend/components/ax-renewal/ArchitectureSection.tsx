"use client";

import { useState } from "react";
import { ConfirmationBar } from "./ConfirmationBar";
import type { AxRenewalAnalysis, AxRenewalArchitecture, AxRenewalConfirmation, AxRenewalStackLayer } from "@/lib/ax-renewal/api";

/**
 * A starting draft built only from facts already on record — real hubs/
 * cycles a connected model actually traced (Understand → Architecture →
 * Module coupling) and real decisions already entered one step earlier
 * (Plan → Stack move) — never an invented architecture claim. Returns ""
 * when neither exists, which leaves the textarea's own placeholder example
 * showing, the same honest-empty state as before.
 */
export function suggestSummary(analysis: AxRenewalAnalysis | null, stackLayers: AxRenewalStackLayer[]): string {
  const lines: string[] = [];

  const decided = stackLayers.filter((l) => l.newTarget && l.newTarget !== l.oldTarget);
  if (decided.length > 0) {
    lines.push("Planned layers (from Stack move):");
    for (const l of decided) {
      lines.push(`- ${l.layerKey}: ${l.oldTarget || "current"} → ${l.newTarget}`);
    }
  }

  const coupling = analysis?.moduleCoupling;
  const modules = coupling?.modules ?? [];
  const hubLines = (coupling?.hubs ?? [])
    .map((i) => modules[i])
    .filter((name): name is string => Boolean(name))
    .map((name) => `- ${name} is a hub — imported by several modules; consider making it an injected dependency.`);
  const cycleLines = (coupling?.cycles ?? [])
    .map(([a, b]) => [modules[a], modules[b]] as const)
    .filter((pair): pair is [string, string] => Boolean(pair[0] && pair[1]))
    .map(([a, b]) => `- ${a} and ${b} import each other — break this cycle before either can move independently.`);

  if (hubLines.length > 0 || cycleLines.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("What Module coupling found (Understand → Architecture):");
    lines.push(...hubLines, ...cycleLines);
  }

  return lines.join("\n");
}

export function ArchitectureSection({
  architecture,
  analysis,
  stackLayers,
  confirmation,
  canEdit,
  canConfirm,
  onSave,
  onConfirm,
  onReopen,
}: {
  architecture: AxRenewalArchitecture | null;
  analysis: AxRenewalAnalysis | null;
  stackLayers: AxRenewalStackLayer[];
  confirmation: AxRenewalConfirmation | undefined;
  canEdit: boolean;
  canConfirm: boolean;
  onSave: (summary: string) => Promise<void>;
  onConfirm: () => void;
  onReopen: () => void;
}) {
  const [summary, setSummary] = useState(() => architecture?.summary ?? suggestSummary(analysis, stackLayers));
  const [isSuggestion] = useState(() => !architecture && summary.length > 0);
  const [saving, setSaving] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the architecture.");
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
    <div className="rounded-[5px] border border-border bg-white p-5">
      <h3 className="text-sm font-bold text-dash-ink">Architecture</h3>
      <p className="mt-1 text-xs text-muted">
        Describe the resulting <strong>layered design</strong> once the <strong>stack move</strong> above is decided — what talks to what, and why
        it is shaped this way.
      </p>

      {isSuggestion && (
        <p className="mt-3 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-3 py-2 text-xs text-dash-ink">
          Drafted from Stack move&apos;s recorded decisions and Module coupling&apos;s real findings — nothing is
          saved yet. Edit it into your own words, then <strong>Save architecture</strong>.
        </p>
      )}

      <textarea
        value={summary}
        disabled={!canEdit}
        onChange={(e) => setSummary(e.target.value)}
        rows={8}
        placeholder="e.g. Browser → API layer (controllers only) → Service layer (business rules) → Data access, against the existing schema…"
        className="mt-4 w-full resize-y rounded-xl border border-border px-3 py-2 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
      />

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}

      {canEdit && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-[5px] border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save architecture"}
          </button>
        </div>
      )}

      <ConfirmationBar
        section="architecture"
        confirmation={confirmation}
        canConfirm={canConfirm}
        busy={confirmBusy}
        onConfirm={() => void handleConfirm()}
        onReopen={onReopen}
      />
    </div>
  );
}
