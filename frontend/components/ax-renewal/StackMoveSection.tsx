"use client";

import { useState } from "react";
import { ConfirmationBar } from "./ConfirmationBar";
import { useUnsavedChangesGuard } from "@/lib/ax-renewal/unsavedChanges";
import type {
  AxRenewalAnalysis,
  AxRenewalConfirmation,
  AxRenewalStackLayer,
  AxRenewalStackRecommendation,
} from "@/lib/ax-renewal/api";

export type Row = { layerKey: string; oldTarget: string; newTarget: string };

/**
 * The one recommendation, if any, a connected local model made for this
 * exact layer (matched by `layerKey`, which the backend guarantees repeats
 * `runningOnToday[].label` verbatim — see `LocalClaudeAnalyzer`'s prompt,
 * ADR-061). Looked up fresh at render time from the current `analysis`,
 * independent of whether the row itself came from a brand-new suggestion or
 * an already-saved layer — a later Run analysis can surface a new hint
 * against a layer that was confirmed long ago, and it should still show up.
 */
export function findRecommendation(
  layerKey: string,
  recommendations: AxRenewalStackRecommendation[],
): AxRenewalStackRecommendation | null {
  return recommendations.find((r) => r.layerKey === layerKey) ?? null;
}

/** Every layer gets one of these — never silence — so "no recommendation" always reads as a stated fact, not a blank spot that might just be unfinished. */
export type RecommendationStatus =
  | { kind: "recommended"; recommendation: AxRenewalStackRecommendation }
  | { kind: "unavailable"; reason: string };

/**
 * What to show for one layer's "AI recommends" hint — always one of two
 * things (a real recommendation, or a plain-stated reason there isn't one),
 * per the explicit instruction that a missing recommendation must never
 * read as silence. Every branch here traces to a real fact:
 *
 * - no analysis at all → say so; nothing has run yet.
 * - analysis exists but no model is connected (the keyword stub) → say so;
 *   a keyword match has no basis to recommend anything.
 * - a connected model ran, but (despite being asked for one entry per
 *   layer, every time) never reported this layer, or reported it with
 *   `recommendedTarget: null` → use the model's own `why` for that null
 *   when it gave one, falling back to a generic, still-honest reason.
 */
export function recommendationStatus(layerKey: string, analysis: AxRenewalAnalysis | null): RecommendationStatus {
  if (!analysis) {
    return { kind: "unavailable", reason: "Run analysis to get a recommendation for this layer." };
  }
  if (!analysis.modelConnected) {
    return {
      kind: "unavailable",
      reason: "No AI model is connected on this deployment — a keyword match has no basis to recommend anything.",
    };
  }
  const entry = findRecommendation(layerKey, analysis.recommendedStackMove);
  if (!entry || !entry.recommendedTarget) {
    return {
      kind: "unavailable",
      reason:
        entry?.why.trim() ||
        "The model didn't have enough evidence to suggest a specific successor for this layer.",
    };
  }
  return { kind: "recommended", recommendation: entry };
}

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

/**
 * Whether `rows` still matches what is actually persisted (`toRows(layers,
 * analysis)`, recomputed fresh — never a snapshot taken once at mount).
 * Confirming this section records a sign-off on the *persisted* layers, not
 * on whatever is currently sitting typed/picked in this component's own
 * state — so a caller who picked a target pill (which only ever updates this
 * local state) and went straight to Confirm without pressing Save stack move
 * first would otherwise confirm the plan as it stood *before* that pick.
 */
export function sameRows(a: Row[], b: Row[]): boolean {
  return (
    a.length === b.length &&
    a.every((r, i) => r.layerKey === b[i]?.layerKey && r.oldTarget === b[i]?.oldTarget && r.newTarget === b[i]?.newTarget)
  );
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
  /** Awaited, so a refusal (e.g. a 409 because a teammate changed the plan since this loaded, ADR-067) lands on this section's error line. */
  onConfirm: () => Promise<void>;
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

  // Recomputed fresh every render, never taken as a one-time snapshot — see
  // sameRows's own doc comment for why this matters for Confirm below.
  const hasUnsavedChanges = !sameRows(rows, toRows(layers, analysis));
  // Warn before leaving only for the person's own edits (ADR-075): what was
  // first shown may be an unsaved suggestion from analysis — unsaved, but not
  // typed by anyone, and not something leaving would lose that matters.
  const [shownRows] = useState(rows);
  useUnsavedChangesGuard(hasUnsavedChanges && !sameRows(rows, shownRows), "Stack move");

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
    // Confirming records a sign-off on what is actually persisted, not on
    // whatever is currently picked/typed here — refuse rather than silently
    // confirming a plan that no longer matches what is on screen.
    if (hasUnsavedChanges) {
      setError(
        "Save stack move first — the choices below haven't been saved yet, so confirming now would sign off on the previous plan, not this one.",
      );
      return;
    }
    setConfirmBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't confirm the stack move.");
    } finally {
      setConfirmBusy(false);
    }
  }

  // A layer is "moving" once a real target is entered that differs from its
  // current one -- blank, or a target that just repeats oldTarget, both mean
  // "stay put" (existing convention, unchanged). All three counts below are
  // real, computed from what is actually in `rows`/`analysis` right now --
  // never the reference prototype's own fixed files/pages/effort numbers,
  // which this project has no honest way to reproduce for an arbitrary
  // attached codebase.
  const movingCount = rows.filter((r) => r.newTarget.trim() && r.newTarget.trim() !== r.oldTarget.trim()).length;
  const recommendedCount = rows.filter((r) => recommendationStatus(r.layerKey, analysis).kind === "recommended").length;
  const undecidedCount = rows.filter((r) => !r.newTarget.trim()).length;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">Stack Move</h3>
        </div>
        <div className="p-5">
        <p className="text-xs text-muted">
          For each <strong>architectural layer</strong>, record what it runs on today and what it should move to.
          Pick one of the buttons below, type your own, or leave it on &ldquo;stay on current&rdquo;. Where a
          connected local model has a confident recommendation for a layer, it appears as one of those buttons —
          reviewing and changing it (or ignoring it and typing your own) is always your call; nothing here is chosen
          for you.
        </p>

        {isSuggestion && (
          <p className="mt-3 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-3 py-2 text-xs text-dash-ink">
            Rows below are a starting point built from what <strong>Run analysis</strong> found on the
            Codebase/Findings tabs — nothing is saved yet. Edit or remove any of them, then{" "}
            <strong>Save stack move</strong>.
          </p>
        )}

        {rows.length === 0 && (
          <p className="mt-4 text-sm text-muted">
            Nothing detected yet to suggest a starting point — run analysis first, or add a layer by hand once you
            can.
          </p>
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
      </div>

      {rows.length > 0 && (
        <>
          <div className="overflow-hidden rounded-[5px] border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border bg-page px-5 py-3">
              <h3 className="text-sm font-bold text-dash-ink">The move</h3>
              <span className="text-xs text-muted">{movingCount} of {rows.length} layers change</span>
            </div>
            <div className="p-5">
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border">
              {[
                { label: "layers moving", value: movingCount },
                { label: "AI recommendations", value: recommendedCount },
                { label: "still undecided", value: undecidedCount },
              ].map((cell) => (
                <div key={cell.label} className="bg-white p-3">
                  <b className="block text-xl font-bold tracking-tight text-dash-ink">{cell.value}</b>
                  <span className="text-xs text-muted">{cell.label}</span>
                </div>
              ))}
            </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[5px] border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border bg-page px-5 py-3">
              <h3 className="text-sm font-bold text-dash-ink">Old → new</h3>
              <span className="text-xs text-muted">pick a target; everything downstream follows</span>
            </div>

            <div className="p-5">
            <div className="divide-y divide-border">
              {rows.map((row, i) => {
                const status = recommendationStatus(row.layerKey, analysis);
                const aiOptions =
                  status.kind === "recommended"
                    ? [status.recommendation.recommendedTarget!, ...status.recommendation.alternativeTargets]
                    : [];
                const isStaying = !row.newTarget.trim() || row.newTarget.trim() === row.oldTarget.trim();
                const stayLabel = `stay on ${row.oldTarget.trim() || "current"}`;

                return (
                  <div key={row.layerKey} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row">
                    <div className="w-full shrink-0 pt-1.5 text-sm font-semibold text-dash-ink sm:w-32">
                      {row.layerKey}
                    </div>

                    <div className="flex items-start gap-3 sm:flex-1">
                      <div className="w-36 shrink-0 sm:w-40">
                        <input
                          value={row.oldTarget}
                          disabled={!canEdit}
                          onChange={(e) => updateRow(i, "oldTarget", e.target.value)}
                          placeholder="e.g. Node 12"
                          className="w-full rounded-md border border-amber-300 bg-amber-50 px-2 py-1 font-mono text-xs text-amber-900 placeholder:text-amber-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:opacity-70"
                        />
                      </div>

                      <span className="shrink-0 pt-1 text-muted" aria-hidden="true">
                        →
                      </span>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {aiOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              disabled={!canEdit}
                              onClick={() => updateRow(i, "newTarget", opt)}
                              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                                row.newTarget.trim() === opt
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-border text-dash-ink hover:bg-page"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => updateRow(i, "newTarget", "")}
                            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                              isStaying
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-border text-dash-ink hover:bg-page"
                            }`}
                          >
                            {stayLabel}
                          </button>
                        </div>

                        <input
                          value={row.newTarget}
                          disabled={!canEdit}
                          onChange={(e) => updateRow(i, "newTarget", e.target.value)}
                          placeholder="or type your own target"
                          className="w-full max-w-xs rounded-lg border border-border px-2 py-1.5 text-xs text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
                        />

                        {status.kind === "recommended" ? (
                          status.recommendation.why && (
                            <p className="text-xs text-muted">{status.recommendation.why}</p>
                          )
                        ) : (
                          <p className="text-xs text-muted">
                            <span className="font-semibold text-dash-ink">No AI recommendation.</span>{" "}
                            {status.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
