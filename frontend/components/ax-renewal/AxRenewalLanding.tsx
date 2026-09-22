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
      <div className="rounded-[5px] border border-border bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-white">
          <RenewIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold text-dash-ink">Plan a legacy-code renewal</h1>
        <p className="mt-3 text-lg font-medium text-dash-ink">
          Attach an existing codebase and see what a migration would involve.
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Agree the plan section by section, and record the sign-off before anything is built.
        </p>
        <div className="mx-auto mt-7 max-w-xl">{children}</div>
      </div>

      <div className="mt-6">
        <p className="text-center">
          <span className="inline-flex items-center rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-semibold text-brand-purple">
            How it works
          </span>
        </p>
        <h2 className="mt-1 text-center text-2xl font-bold text-dash-ink">Attach, analyze, plan, build.</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-base text-muted">
          Nothing moves to the next stage until it&rsquo;s been agreed — no surprises once implementation starts.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-[5px] border border-border bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-dash-ink">
                <span className="text-muted">Step {i + 1} · </span>
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
