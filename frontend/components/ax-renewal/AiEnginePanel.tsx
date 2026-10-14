"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, SparklesIcon, WarningIcon } from "@/components/layout/icons";
import { fetchEngineStatus, type AxRenewalEngineStatus } from "@/lib/ax-renewal/api";

const CODE = "rounded bg-muted-surface px-1.5 py-0.5 font-mono text-[11px] text-foreground";

/**
 * Real current engine status (ADR-043), plus the exact steps to turn it on.
 *
 * Replaces a panel that used to say "no AI model is connected on this
 * deployment yet" unconditionally, with no check behind the claim — true the
 * day it was written, false the moment ADR-043 shipped local Claude Code
 * support, and never updated to look. This calls the same `/engine` status
 * `AttachSourceSection`/`AxAssistantPanel` already read, and only shows the
 * "not connected" copy when that status actually says so.
 *
 * The setup steps below are not guessed: the env var names, the example
 * values, and the "why this can't be a deployment setting" reasoning all
 * come straight from `backend/.env.example` and `CONTRIBUTING.md`'s own
 * "Real analysis, on your own machine" section — this panel is that section,
 * surfaced where the person actually needs it instead of a file they may
 * never open.
 */
export function AiEnginePanel() {
  const [status, setStatus] = useState<AxRenewalEngineStatus | null>(null);

  useEffect(() => {
    void fetchEngineStatus().then(setStatus);
  }, []);

  const connected = status?.connected ?? false;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-border bg-card p-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-foreground" />
          <h3 className="text-sm font-semibold text-foreground">AI engine</h3>
        </div>

        {status == null ? (
          <p className="mt-4 text-sm text-muted-foreground">Checking…</p>
        ) : connected ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-surface-border bg-secondary px-4 py-3">
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            <p className="text-sm text-foreground">
              Connected on this machine — Run analysis, Generate, and the AX Assistant all use your local Claude
              Code install.{" "}
              {status.readsSource
                ? "It reads your attached source directly."
                : "It reads the stored manifest only right now — add a source path (step 3 below) so it reads your actual code."}
            </p>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-surface-border bg-secondary px-4 py-3">
            <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            <p className="text-sm text-foreground">
              No AI model is connected on this machine yet. Run analysis uses a small, disclosed keyword match
              against the attached manifest instead of a real reading of your source (see Findings), and Generate/the
              AX Assistant are unavailable until it&apos;s on. The steps below turn it on.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-surface-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Set up Claude Code on this machine</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Local only, by design — what makes this work is the backend, the CLI, your signed-in seat and the source
          folder all being one computer. A deployed instance has none of those, so it keeps the keyword stub
          regardless; there is no equivalent setting for it. Each teammate sets this up on their own machine
          separately — nothing here is shared through the project.
        </p>

        <ol className="mt-4 space-y-4">
          <li>
            <p className="text-sm font-semibold text-foreground">1. Install Claude Code, if you haven&apos;t</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className={CODE}>npm install -g @anthropic-ai/claude-code</span>
            </p>
          </li>

          <li>
            <p className="text-sm font-semibold text-foreground">2. Find its real path on this machine</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Windows (Command Prompt or PowerShell): <span className={CODE}>where claude</span>
              <br />
              macOS/Linux: <span className={CODE}>which claude</span>
              <br />
              Use exactly what that command prints — the install location varies by machine (npm&apos;s global
              prefix differs from one setup to the next), so a path that worked for a teammate will not necessarily
              exist on yours.
            </p>
          </li>

          <li>
            <p className="text-sm font-semibold text-foreground">3. Set two lines in your own backend/.env.local</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This file is gitignored on purpose — personal to your machine. If you don&apos;t have one yet, copy{" "}
              <span className={CODE}>backend/.env.example</span> to <span className={CODE}>backend/.env.local</span>{" "}
              first, then add:
            </p>
            <pre className="mt-2 overflow-auto rounded-lg border border-surface-border bg-[#0b0d12] p-3 font-mono text-[11px] leading-relaxed text-[#c9d1d9]">
              {"APP_AXRENEWAL_CLAUDECLIPATH=" + "<the path step 2 printed>"}
              {"\n"}
              {"APP_AXRENEWAL_SOURCEPATH=" + "<the legacy project's folder on this machine>"}
            </pre>
            <p className="mt-2 text-sm text-muted-foreground">
              The first line alone turns this on, reading the stored manifest only. Add the second and it reads your
              actual source instead — both are optional, and the panel above says which of the two you have.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Any drive works — <span className={CODE}>E:\work\legacy-project</span>,{" "}
              <span className={CODE}>D:\...</span>, whatever this project actually lives at on your machine. Nothing
              here assumes a particular drive letter; only <em>this</em> path has to be real on <em>this</em> computer.
            </p>
          </li>

          <li>
            <p className="text-sm font-semibold text-foreground">4. Restart the backend</p>
            <p className="mt-1 text-sm text-muted-foreground">
              These are read once at startup, so stop and restart{" "}
              <span className={CODE}>mvn -f backend/pom.xml spring-boot:run</span> (or your IDE run configuration)
              for the change to take effect, then come back to this tab — it will show &quot;Connected&quot; above.
            </p>
          </li>
        </ol>

        <p className="mt-4 text-xs text-muted-foreground">
          Still shows not connected after restarting? It falls back to the keyword stub rather than failing your
          request, and logs why at WARN — a mistyped path, a missing binary, a timeout. Check the backend&apos;s own
          console for that line rather than guessing.
        </p>
      </div>

      <div className="rounded-xl border border-surface-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">What changes once it&apos;s connected</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Codebase</span> and{" "}
            <span className="font-medium text-foreground">Findings</span> reflect an actual reading of your attached
            files, not a keyword match against the manifest.
          </li>
          <li>
            <span className="font-medium text-foreground">Generate</span> (Build → Implementation) can produce real
            code changes for a confirmed Plan — reviewed before anything is written to your destination.
          </li>
          <li>
            <span className="font-medium text-foreground">AX Assistant</span> can answer questions about the attached
            project directly, rather than staying unavailable.
          </li>
        </ul>
      </div>
    </div>
  );
}
