"use client";

import { useState } from "react";
import { ConfirmationBar } from "./ConfirmationBar";
import type { AxRenewalAnalysis, AxRenewalArchitecture, AxRenewalConfirmation, AxRenewalStackLayer } from "@/lib/ax-renewal/api";

/**
 * Every Stack move layer that is actually moving — a real `newTarget`
 * entered that differs from its `oldTarget` — in whatever order Stack move
 * itself stored them. Backs "Layers after the move" below: unlike the
 * suggested summary text, this is read directly from `stackLayers` on every
 * render, never seeded once and left to go stale.
 */
export function decidedLayers(stackLayers: AxRenewalStackLayer[]): AxRenewalStackLayer[] {
  return stackLayers.filter((l) => l.newTarget && l.newTarget !== l.oldTarget);
}

/** One real thing a connected model traced in Understand → Architecture → Module coupling. */
export interface CouplingFinding {
  kind: "hub" | "cycle";
  text: string;
}

/**
 * Every hub/cycle a connected model actually traced — `[]` on the
 * keyword-stub path or a manifest-only run, same as `analysis.moduleCoupling`
 * itself. Shared by `suggestSummary` (the drafted textarea) and "What
 * analysis found that shapes this" below, so the two can never disagree
 * about what Module coupling reported.
 */
export function couplingFindings(analysis: AxRenewalAnalysis | null): CouplingFinding[] {
  const coupling = analysis?.moduleCoupling;
  const modules = coupling?.modules ?? [];
  const hubs = (coupling?.hubs ?? [])
    .map((i) => modules[i])
    .filter((name): name is string => Boolean(name))
    .map((name) => ({
      kind: "hub" as const,
      text: `${name} is a hub — imported by several modules; consider making it an injected dependency.`,
    }));
  const cycles = (coupling?.cycles ?? [])
    .map(([a, b]) => [modules[a], modules[b]] as const)
    .filter((pair): pair is [string, string] => Boolean(pair[0] && pair[1]))
    .map(([a, b]) => ({
      kind: "cycle" as const,
      text: `${a} and ${b} import each other — break this cycle before either can move independently.`,
    }));
  return [...hubs, ...cycles];
}

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

  const decided = decidedLayers(stackLayers);
  if (decided.length > 0) {
    lines.push("Planned layers (from Stack move):");
    for (const l of decided) {
      lines.push(`- ${l.layerKey}: ${l.oldTarget || "current"} → ${l.newTarget}`);
    }
  }

  const findings = couplingFindings(analysis);
  if (findings.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("What Module coupling found (Understand → Architecture):");
    lines.push(...findings.map((f) => `- ${f.text}`));
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
  /** Awaited, so a refusal (e.g. a 409 because a teammate changed the plan since this loaded, ADR-061) lands on this section's error line. */
  onConfirm: () => Promise<void>;
  onReopen: () => void;
}) {
  const [summary, setSummary] = useState(() => architecture?.summary ?? suggestSummary(analysis, stackLayers));
  const [isSuggestion] = useState(() => !architecture && summary.length > 0);
  const [saving, setSaving] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read straight from props on every render, exactly like Plan → Old → New
  // already does for its own diagram — never seeded once into local state,
  // so neither of these two cards can ever go stale the way a one-time
  // textarea seed can.
  const moving = decidedLayers(stackLayers);
  const findings = couplingFindings(analysis);

  // Recomputed fresh every render from the *current* Stack move decisions and
  // Module coupling findings — never a one-time snapshot taken only when
  // this section first mounted. A fresh visit already seeds `summary` from
  // this exact text above, so the hint below only has something to say once
  // Stack move (or Module coupling) has moved on since the last save and
  // that hasn't been pulled in here yet.
  const liveSuggestion = suggestSummary(analysis, stackLayers);
  const suggestionNotYetIncluded = liveSuggestion.length > 0 && !summary.includes(liveSuggestion);
  // Confirming records a sign-off on the *saved* summary, not on whatever is
  // currently sitting typed in this textarea — same reasoning Stack move's
  // own Confirm guard uses, and for the same failure mode: editing this
  // field, then going straight to Confirm without Save architecture first.
  const hasUnsavedChanges = summary !== (architecture?.summary ?? "");

  function useLiveSuggestion() {
    setSummary((prev) => (prev.trim() ? `${prev.trim()}\n\n${liveSuggestion}` : liveSuggestion));
  }

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
    if (hasUnsavedChanges) {
      setError(
        "Save architecture first — the text below hasn't been saved yet, so confirming now would sign off on the previous version, not this one.",
      );
      return;
    }
    setConfirmBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't confirm the architecture.");
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Following CodeRenewalPlatform.html's own vNArch() layout — "Layers
          after the move" and "What each diagram told us to change" — but
          read live from real Stack move/Module coupling data on every
          render instead of that prototype's fixed six-layer template and
          its hardcoded findings (N+1 → join, 6.1 MB → 24 rows, ...), none of
          which this tool has any honest way to know for an arbitrary
          attached project. Being read straight from props rather than
          seeded into state is also what makes these two cards immune to the
          "still shows the old Stack move" staleness the drafted textarea
          below is otherwise prone to. */}
      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">Layers after the move</h3>
        </div>
        <div className="p-5">
          {moving.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing decided yet — pick a target for at least one layer under <strong>Plan → Stack move</strong>{" "}
              and save it there first.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {moving.map((l, i) => (
                <div key={l.layerKey} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-xs font-bold text-brand-purple">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-dash-ink">{l.layerKey}</p>
                    <p className="font-mono text-xs text-muted">
                      {l.oldTarget || "current"} → {l.newTarget}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">What analysis found that shapes this</h3>
        </div>
        <div className="p-5">
          {findings.length === 0 ? (
            <p className="text-sm text-muted">
              Tracing real imports between files needs a connected local model actually reading the source — this
              project hasn&apos;t reported any hubs or cycles yet (Understand → Architecture → Module coupling).
            </p>
          ) : (
            <ul className="list-disc space-y-2 pl-4 text-sm text-dash-ink">
              {findings.map((f, i) => (
                <li key={i}>{f.text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
      <div className="border-b border-border bg-page px-5 py-3">
        <h3 className="text-sm font-bold text-dash-ink">Architecture</h3>
      </div>
      <div className="p-5">
      <p className="text-xs text-muted">
        Describe the resulting <strong>layered design</strong> once the <strong>stack move</strong> above is decided — what talks to what, and why
        it is shaped this way.
      </p>

      {isSuggestion && (
        <p className="mt-3 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-3 py-2 text-xs text-dash-ink">
          Drafted from Stack move&apos;s recorded decisions and Module coupling&apos;s real findings — nothing is
          saved yet. Edit it into your own words, then <strong>Save architecture</strong>.
        </p>
      )}

      {suggestionNotYetIncluded && (
        <div className="mt-3 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-3 py-2 text-xs text-dash-ink">
          <p>
            <strong>Stack move or Module coupling has something new</strong> since this was last saved — not
            reflected below yet:
          </p>
          <pre className="mt-1.5 whitespace-pre-wrap font-mono text-[11px] text-muted">{liveSuggestion}</pre>
          {canEdit && (
            <button
              type="button"
              onClick={useLiveSuggestion}
              className="mt-2 rounded-full border border-brand-purple/30 px-2.5 py-1 text-[11px] font-semibold text-brand-purple transition-colors hover:bg-brand-purple/10"
            >
              Add this to my summary
            </button>
          )}
        </div>
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
      </div>
    </div>
  );
}
