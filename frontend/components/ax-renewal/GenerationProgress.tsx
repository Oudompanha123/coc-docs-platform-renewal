"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchImplementationProgress,
  type AxRenewalGenerationActivity,
  type AxRenewalGenerationProgress,
  type AxRenewalGenerationStep,
} from "@/lib/ax-renewal/api";

/** How often the live view re-reads while a run generates. */
export const PROGRESS_POLL_MS = 1500;

const STEPS: { key: AxRenewalGenerationStep | "review"; label: string; detail: string }[] = [
  { key: "preparing", label: "Preparing a copy of the source", detail: "Nothing is changed in your project itself." },
  { key: "working", label: "The AI is working", detail: "Reading the code and making the planned changes in the copy." },
  { key: "comparing", label: "Comparing the result", detail: "Working out exactly which files changed." },
  { key: "review", label: "Ready for review", detail: "You approve or reject before anything is written." },
];

const KIND_LABEL: Record<string, string> = {
  read: "Read",
  edit: "Edit",
  write: "Write",
  search: "Search",
  list: "List",
  plan: "Plan",
  note: "Note",
  tool: "Tool",
  error: "Error",
  done: "Done",
};

/** "45s", "3m 05s" — for how long the current step has run. */
export function formatStepDuration(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

function kindTone(kind: string): string {
  if (kind === "error") return "text-danger";
  if (kind === "done") return "text-emerald-700";
  if (kind === "edit" || kind === "write") return "text-foreground";
  return "text-muted-foreground";
}

function ActivityRow({ item }: { item: AxRenewalGenerationActivity }) {
  const when = new Date(item.at);
  return (
    <li className="flex gap-2 py-0.5 text-xs">
      <span className="w-16 shrink-0 tabular-nums text-muted-foreground">
        {Number.isNaN(when.getTime()) ? "" : when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
      <span className={`w-12 shrink-0 font-semibold ${kindTone(item.kind)}`}>{KIND_LABEL[item.kind] ?? "Step"}</span>
      <span className={`min-w-0 break-words ${item.kind === "note" ? "italic text-foreground/80" : "text-foreground"}`}>
        {item.text}
      </span>
    </li>
  );
}

/**
 * What the AI is doing right now, while a Build/Rebuild generates (ADR-082).
 *
 * <p>Everything shown is reported by the backend running the generation: the
 * step it actually reached, real counts, and the model's own actions as the
 * CLI streams them. There is no percentage — nothing knows how much of its
 * work the model has left — so progress is the step reached, out of four.
 *
 * <p>Polls every {@link PROGRESS_POLL_MS} while mounted; the panel mounts it
 * only while the run is `generating`.
 */
export function GenerationProgress({ projectId, runId }: { projectId: string; runId: string }) {
  const [progress, setProgress] = useState<AxRenewalGenerationProgress | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const feedRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let cancelled = false;
    const read = () =>
      fetchImplementationProgress(projectId, runId)
        .then((p) => {
          if (cancelled) return;
          setProgress(p);
          setFailed(false);
        })
        .catch(() => {
          // Keep showing the last good read; say the view is behind.
          if (!cancelled) setFailed(true);
        });
    void read();
    const id = setInterval(() => void read(), PROGRESS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [projectId, runId]);

  // The current step's own clock, ticking between reads.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // A live feed is meant to be watched scrolling, not chased.
  const activityCount = progress?.activity.length ?? 0;
  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [activityCount]);

  if (progress === null) {
    return (
      <p className="mt-3 text-xs text-muted-foreground" role="status">
        {failed ? "Couldn't reach the build's progress yet — retrying…" : "Connecting to the build…"}
      </p>
    );
  }

  if (!progress.available) {
    return (
      <p className="mt-3 rounded-xl border border-surface-border bg-card px-3 py-2 text-xs text-muted-foreground" role="status">
        Live activity is shown on the computer running this build. It is still generating — this panel updates when it
        finishes.
      </p>
    );
  }

  const current = STEPS.findIndex((s) => s.key === progress.step);
  const stepIndex = current < 0 ? 0 : current;
  const stepStartedMs = progress.stepStartedAt ? new Date(progress.stepStartedAt).getTime() : NaN;
  const stepSecs = Number.isNaN(stepStartedMs) ? null : (now - stepStartedMs) / 1000;

  return (
    <section aria-label="Generation progress" className="mt-3 space-y-3">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={stepIndex + 1}
        aria-valuetext={`Step ${stepIndex + 1} of ${STEPS.length}: ${STEPS[stepIndex]!.label}`}
        className="flex gap-1"
      >
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={`h-1.5 flex-1 rounded-full ${
              i < stepIndex ? "bg-primary" : i === stepIndex ? "animate-pulse bg-primary/60" : "bg-surface-border"
            }`}
          />
        ))}
      </div>

      <ol className="space-y-1.5" aria-label="Steps">
        {STEPS.map((s, i) => {
          const state = i < stepIndex ? "done" : i === stepIndex ? "current" : "pending";
          return (
            <li key={s.key} className="flex items-start gap-2.5" aria-current={state === "current" ? "step" : undefined}>
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  state === "done"
                    ? "bg-primary text-primary-foreground"
                    : state === "current"
                      ? "animate-spin border-2 border-primary/30 border-t-primary"
                      : "border border-surface-border"
                }`}
              >
                {state === "done" ? "✓" : ""}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm ${
                    state === "pending" ? "text-muted-foreground" : "font-semibold text-foreground"
                  }`}
                >
                  {s.label}
                  {state === "current" && stepSecs !== null && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">for {formatStepDuration(stepSecs)}</span>
                  )}
                  <span className="sr-only">{state === "done" ? " (done)" : state === "current" ? " (in progress)" : ""}</span>
                </span>
                {state === "current" && <span className="block text-xs text-muted-foreground">{s.detail}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-muted-foreground" aria-label="Counts">
        <span className="font-semibold text-foreground">{progress.actions}</span> {progress.actions === 1 ? "action" : "actions"}
        {" · "}
        <span className="font-semibold text-foreground">{progress.filesRead}</span> {progress.filesRead === 1 ? "file" : "files"} read
        {" · "}
        <span className="font-semibold text-foreground">{progress.filesChanged}</span>{" "}
        {progress.filesChanged === 1 ? "file" : "files"} changed so far
      </p>

      <div className="rounded-xl border border-surface-border bg-card">
        <p className="border-b border-surface-border px-3 py-1.5 text-xs font-semibold text-foreground">What the AI is doing</p>
        {progress.activity.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            {progress.step === "preparing" ? "Copying the source — the AI starts once the copy is ready." : "Waiting for the AI's first step…"}
          </p>
        ) : (
          <ol ref={feedRef} aria-label="Live activity" aria-live="polite" className="max-h-60 overflow-y-auto px-3 py-1.5">
            {progress.earlierActivityDropped && (
              <li className="py-0.5 text-xs text-muted-foreground">Earlier activity not shown — only the most recent is kept.</li>
            )}
            {progress.activity.map((item, i) => (
              <ActivityRow key={`${item.at}-${i}`} item={item} />
            ))}
          </ol>
        )}
      </div>

      {failed && (
        <p role="status" className="text-xs text-muted-foreground">
          Lost touch with the build for a moment — showing the last update, retrying…
        </p>
      )}
    </section>
  );
}
