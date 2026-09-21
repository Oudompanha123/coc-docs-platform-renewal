import { SparklesIcon, WarningIcon } from "@/components/layout/icons";

/**
 * A static status/explainer screen — there is nothing to connect yet.
 *
 * The reference prototype's AI engine tab lets a caller paste an Anthropic
 * API key or authorization token into the browser, which then calls
 * api.anthropic.com directly from client-side JavaScript. That pattern is
 * incompatible with this app's architecture: the frontend never holds a
 * credential (ADR-011/012), and any external call the backend makes is
 * server-side and configured, not typed in by whoever happens to open this
 * tab. So this panel only explains the current, honest state rather than
 * offering a connect flow that would have to work around those rules.
 */
export function AiEnginePanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-[5px] border border-border bg-white p-5">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-brand-purple" />
          <h3 className="text-sm font-bold text-dash-ink">AI engine</h3>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-3">
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
          <p className="text-sm text-dash-ink">
            No AI model is connected on this deployment yet. Run analysis uses a small, disclosed keyword match
            against the attached manifest instead of a real reading of your source (see Findings).
          </p>
        </div>
        <p className="mt-4 text-sm text-muted">
          A later phase would wire a real model call into <code>Run analysis</code> server-side, with no credential
          ever reaching the browser — this app never lets a client hold or send a third-party API key directly.
        </p>
      </div>

      <div className="rounded-[5px] border border-border bg-white p-5">
        <h3 className="text-sm font-bold text-dash-ink">What changes once a model is connected</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            <span className="font-medium text-dash-ink">Codebase</span> would reflect an actual reading of the
            attached files, not just the one detected runtime.
          </li>
          <li>
            <span className="font-medium text-dash-ink">Findings</span> would list real issues found in your source,
            each with a location — not the single placeholder notice shown today.
          </li>
          <li>
            <span className="font-medium text-dash-ink">Old → New</span> and the page inventory would be generated
            from what the model actually sees, rather than left for you to fill in by hand.
          </li>
        </ul>
      </div>
    </div>
  );
}
