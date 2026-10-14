import type { ReactNode } from "react";
import { NodesIcon, PaperclipIcon, PlayIcon, RenewIcon, SparklesIcon } from "@/components/layout/icons";

const STEPS = [
  {
    icon: PaperclipIcon,
    title: "Attach",
    description: "Point at a project's folder. Only the dependency manifest found inside it is read.",
  },
  {
    icon: SparklesIcon,
    title: "Analyze",
    description: "Detect the current stack and surface findings a renewal would need to address.",
  },
  {
    icon: NodesIcon,
    title: "Plan",
    description: "Agree the stack move, architecture, pages and database changes — each one signed off.",
  },
  {
    icon: PlayIcon,
    title: "Build",
    description: "Start implementation once every plan section is confirmed and a destination is set.",
  },
] as const;

/**
 * Shown in place of the workspace when no project is open yet — the first
 * thing anyone new to AX Renewal sees, since the project picker alone gave no
 * indication of what the tool does or why it has four locked-until-you're-
 * ready sections. Mirrors the docs product landing (hero card + eyebrow +
 * feature grid) used by ContentRenderer's "hero" kind, for a consistent look
 * across the app. `children` is the picker/create control itself, kept as a
 * separate component rather than folded in here, so this stays pure
 * explanation and that stays the one place project selection state lives.
 */
export function AxRenewalLanding({ children }: { children: ReactNode }) {
  return (
    <div className="break-words">
      <div className="rounded-xl border border-surface-border bg-card p-6 text-center sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <RenewIcon className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Plan a legacy-code renewal</h1>
        <p className="mt-2 text-base font-medium text-foreground">
          Attach an existing codebase and see what a migration would involve.
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Agree the plan section by section, and record the sign-off before anything is built.
        </p>
        <div className="mx-auto mt-6 max-w-xl">{children}</div>
      </div>

      <div className="mt-6">
        <p className="text-center">
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
            How it works
          </span>
        </p>
        <h2 className="mt-2 text-center text-xl font-semibold text-foreground">Attach, analyze, plan, build.</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
          Nothing moves to the next stage until it&rsquo;s been agreed — no surprises once implementation starts.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-xl border border-surface-border bg-card p-4">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
                <step.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                <span className="text-muted-foreground">Step {i + 1} · </span>
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
