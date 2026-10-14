"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * What the workspace shows while Run analysis is in flight.
 *
 * <h2>Why this is not the prototype's version of this screen</h2>
 *
 * <p>CodeRenewalPlatform.html shows seven stages ticking over on a 500 ms
 * timer, each with a subtitle like "342 files indexed" and "47 dependencies,
 * 23 outdated". Those numbers are constants in the file
 * (`ANALYSIS[]`, line 782) — they describe nobody's project, and the stages
 * advance whether or not anything is happening. With no model connected the
 * whole screen is theatre, which its own header admits in small type:
 * "sample data — no model connected".
 *
 * <p>This shows the same shape and only things that are true. The analysis
 * happens in one backend call, so there is no per-stage progress to report
 * and none is invented: what is real is which phase the request is in, how
 * long it has been running, and that stopping actually stops it. A progress
 * bar that cannot know its own percentage is the one thing worth leaving
 * out — elapsed time carries the same reassurance without claiming to
 * predict an ending.
 *
 * <p>// req: ADR-037, ADR-043
 */
export interface AnalysisPhase {
  /** What is happening now. */
  label: string;
  /** The honest detail line under it, or null when there is nothing true to add. */
  detail: string | null;
}

export function AnalysisProgress({
  engineLabel,
  onStop,
}: {
  /** What is doing the work — shown top-right, where the prototype admits to sample data. */
  engineLabel: string;
  /** Aborts the in-flight request. Absent when there is nothing abortable. */
  onStop?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Real phases of one HTTP request, not stages of the analysis itself. The
  // second is where effectively all the time goes when a model is reading,
  // and saying so beats a bar creeping towards a number nobody can predict.
  const phase: AnalysisPhase =
    elapsed < 2
      ? { label: "Sending the project to the analyser", detail: null }
      : { label: "Waiting for the analyser", detail: "A model reading real source takes a minute or two." };

  return (
    <div className="rounded-xl border border-surface-border bg-card">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Analysing</h3>
        <span className="text-xs text-muted-foreground">{engineLabel}</span>
      </div>

      <div className="p-4">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm font-semibold text-foreground">{phase.label}</p>
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{formatElapsed(elapsed)} elapsed</span>
        </div>
        {phase.detail && <p className="mt-1 text-xs text-muted-foreground">{phase.detail}</p>}

        {/* Indeterminate on purpose. One backend call reports nothing until it
            returns, so a percentage would be a guess dressed as a measurement. */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted-surface">
          <div className="ax-analysing-bar h-full w-1/3 rounded-full bg-primary" />
        </div>

        {onStop && (
          <Button
            type="button"
            variant="destructiveOutline"
            size="sm"
            onClick={onStop}
            className="mt-4"
          >
            Stop
          </Button>
        )}
      </div>
    </div>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
