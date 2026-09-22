"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/SessionProvider";
import { useAxRenewalProjectContext } from "@/lib/ax-renewal/AxRenewalProjectContext";
import {
  addComment,
  confirmSection,
  reopenSection,
  runAnalysis,
  startImplementation,
  fetchEngineStatus,
  type AxRenewalEngineStatus,
  type PlanSection,
} from "@/lib/ax-renewal/api";
import { EXPLORER_META, resolveActiveSection, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import { readUseModel, writeUseModel } from "@/lib/ax-renewal/engine-preference";
import { describeCommand, parseCommand } from "@/lib/ax-renewal/commands";
import { SparklesIcon } from "@/components/layout/icons";

const PLAN_SECTIONS: PlanSection[] = ["stack_move", "architecture", "pages", "database"];

/** Per-tab quick phrases — every one a real, executable command (see commands.ts), not a hint for a live model. */
const SUGGESTIONS: Partial<Record<AxRenewalExplorerKey, string[]>> = {
  "stack-move": ["confirm stack move"],
  "plan-architecture": ["confirm architecture"],
  pages: ["confirm pages"],
  database: ["confirm database"],
  output: ["confirm all"],
  implementation: ["start implementation"],
  attach: ["run analysis"],
};

type Note = { text: string; tone: "applied" | "denied" };

/**
 * The right-hand "AX Assistant" column — a command console over actions that
 * already exist and already enforce the right authorization (see
 * commands.ts for what's deliberately in and out of scope), not a live LLM
 * chat. Its message log is the project's real, persisted comment thread
 * (`detail.comments`) rather than the reference prototype's ephemeral,
 * browser-only chat history.
 *
 * Self-contained (own session/project-context reads, own navigation) and
 * mounted at the layout level, sticky/full-height alongside the sidebar —
 * matching CodeRenewalPlatform.html's `.chat` column, which spans the whole
 * shell height rather than living inside the scrolling page content. It
 * shares the one `AxRenewalProjectProvider` instance with the rest of the
 * shell (see that file's comment) so a mutation made here is immediately
 * visible in the main content, not just in this panel.
 */
export function AxAssistantPanel() {
  const { user } = useSession();
  const canEdit = user?.role === "admin" || user?.role === "super_admin";
  // Exact membership, not rank: an Admin does not pass this just by
  // out-ranking Developer (AppRole.exactAuthority(), ADR-039) — matches
  // SecurityConfig's confirm/reopen/start-implementation gate exactly, and
  // the same check in app/ax-renewal/page.tsx.
  const canConfirm = user?.role === "super_admin" || (user?.roles?.includes("developer") ?? false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId, detail, refresh } = useAxRenewalProjectContext();
  // Same sentinel every other AX Renewal component resolves through — a raw
  // `searchParams.get("section") ?? "attach"` here previously let the
  // NO_TAB_OPEN sentinel ("none") through uncaught, so `EXPLORER_META[active]`
  // came back `undefined` and `.group` threw once the last tab was closed.
  const active = resolveActiveSection(searchParams.get("section"));

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note | null>(null);

  // Null until the answer is known. The banner renders nothing in that gap
  // rather than guessing: flashing "no model connected" and correcting a
  // moment later would teach people to distrust the line that exists
  // precisely to be trusted (ADR-043).
  const [engine, setEngine] = useState<AxRenewalEngineStatus | null>(null);
  useEffect(() => {
    void fetchEngineStatus().then(setEngine);
  }, []);

  // Whether this browser wants the configured model used. Read after mount,
  // not during render: localStorage does not exist on the server, and a value
  // read during the first render would differ between the two and fail
  // hydration.
  const [useModel, setUseModelState] = useState(true);
  useEffect(() => {
    setUseModelState(readUseModel());
  }, []);
  function setUseModel(next: boolean) {
    writeUseModel(next);
    setUseModelState(next);
  }
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const meta = active != null ? EXPLORER_META[active] : null;
  const isPlanTab = meta?.group === "Plan";

  // Grows the composer with what's typed (up to a cap, then its own scroll)
  // instead of a fixed single row that hides everything past line one behind
  // a scrollbar — runs on every `text` change, whether typed or set by a
  // suggestion chip. Floored at 67px (the default/empty size) rather than
  // shrinking to a bare single line.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(67, Math.min(el.scrollHeight, 120))}px`;
  }, [text]);

  function onOpenTab(key: AxRenewalExplorerKey) {
    if (projectId) router.push(`/ax-renewal?project=${projectId}&section=${key}`);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !detail) return;
    const projectId = detail.project.id;
    setBusy(true);
    setNote(null);
    try {
      const command = parseCommand(trimmed);
      if (!command) {
        await addComment(projectId, trimmed);
        await refresh();
        setText("");
        return;
      }
      switch (command.type) {
        case "confirm":
          if (!canConfirm) return deny("confirm a section");
          await confirmSection(projectId, command.section);
          break;
        case "reopen":
          if (!canConfirm) return deny("reopen a section");
          await reopenSection(projectId, command.section);
          break;
        case "confirm-all":
          if (!canConfirm) return deny("confirm a section");
          for (const section of PLAN_SECTIONS) {
            if (detail.confirmations[section] == null) await confirmSection(projectId, section);
          }
          break;
        case "run-analysis":
          if (!canEdit) return deny("run analysis");
          await runAnalysis(projectId);
          break;
        case "start-implementation":
          if (!canConfirm) return deny("start implementation");
          await startImplementation(projectId);
          break;
        case "open":
          onOpenTab(command.tab);
          break;
      }
      await refresh();
      setNote({ text: describeCommand(command), tone: "applied" });
      setText("");
    } catch (err) {
      setNote({ text: err instanceof Error ? err.message : "that didn't go through", tone: "denied" });
    } finally {
      setBusy(false);
    }
  }

  function deny(action: string) {
    setNote({ text: `you don't have permission to ${action}`, tone: "denied" });
    setBusy(false);
  }

  if (!detail) return null;

  const suggestions = active != null ? SUGGESTIONS[active] ?? [] : [];

  return (
    <aside className="hidden shrink-0 xl:block xl:w-[360px]">
      {/* h-[calc(100vh-32px)], not h-screen: AxRenewalStatusBar (h-8,
          border-box) now spans the full shell width as its own row below
          this one (see ax-renewal/layout.tsx), matching
          CodeRenewalPlatform.html's own two-row grid — so this stops short
          of the full viewport by that same height instead of running past
          where the status bar starts. */}
      <div className="sticky top-0 flex h-[calc(100vh-32px)] w-[360px] flex-col overflow-hidden border-l border-border bg-page">
        <div className="flex items-center gap-2 border-b border-border bg-white px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-dash-ink">AX Assistant</span>
        </div>
        <div className="border-b border-border px-4 py-2 font-mono text-xs text-muted">
          {meta ? (
            <>
              {isPlanTab ? "acting on " : "reading "}
              <span className="font-semibold text-dash-ink">
                {isPlanTab ? meta.label.toLowerCase() : `${meta.group.toLowerCase()} / ${meta.label.toLowerCase()}`}
              </span>
            </>
          ) : (
            "no tab open"
          )}
        </div>
        {/* Four states now, and one silent one. This line used to assert "No
            model connected" unconditionally — true of every deployment, wrong
            on a machine with a local Claude Code installation, and it is the
            one line in the workspace whose whole job is to be honest about
            what the assistant can do (ADR-043). */}
        {engine?.connected && useModel ? (
          <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
            <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
            <span>
              Local model in use —{" "}
              <span className="font-semibold">
                {engine.readsSource ? "reads your source" : "reads the manifest only"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setUseModel(false)}
              // "Stop using it", not "disconnect": the path in .env.local is
              // untouched and the backend could still run it. All this does is
              // stop asking, which is the only thing a web page honestly can do.
              title="Run the keyword analysis instead. The configured model stays configured."
              className="ml-auto shrink-0 rounded-[5px] border border-emerald-400 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              stop using
            </button>
          </div>
        ) : engine?.connected ? (
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-700">
            <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
            <span>
              A model is available — <span className="font-semibold">not using it here</span>
            </span>
            <button
              type="button"
              onClick={() => setUseModel(true)}
              className="ml-auto shrink-0 rounded-[5px] border border-slate-400 px-2.5 py-0.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              use it
            </button>
          </div>
        ) : engine ? (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
            <span>
              No model connected — <span className="font-semibold">fixed commands only</span>
            </span>
            <button
              type="button"
              onClick={() => onOpenTab("ai-engine")}
              className="ml-auto shrink-0 rounded-[5px] border border-amber-400 px-2.5 py-0.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
            >
              connect
            </button>
          </div>
        ) : null}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {detail.comments.length === 0 && (
            <p className="text-sm text-muted">No comments yet — anything you type that isn&apos;t a command above is recorded here.</p>
          )}
          {detail.comments.map((comment) => (
            <div key={comment.id} className="rounded-[5px] border border-border bg-white px-3 py-2 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-dash-ink">{comment.authorName}</span>
                <span className="shrink-0 text-xs text-muted">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-dash-ink">{comment.body}</p>
            </div>
          ))}
          {note && (
            <p
              className={`rounded-r-md border-l-4 px-3 py-2 font-mono text-xs ${
                note.tone === "applied"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-amber-500 bg-amber-50 text-amber-800"
              }`}
            >
              {note.tone === "applied" ? "applied — " : "not applied — "}
              {note.text}
            </p>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setText(s)}
                className="rounded-[5px] border border-border px-2.5 py-1 font-mono text-xs text-muted hover:border-brand-purple hover:text-brand-purple"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {meta && !isPlanTab && (
          <p className="border-t border-border bg-white px-4 py-2 text-xs italic text-muted">
            Read only here — a comment is recorded, but nothing on this tab is changed by it.
          </p>
        )}

        <form onSubmit={(e) => void handleSend(e)} className="flex items-end gap-2 border-t border-border bg-white p-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={busy}
            placeholder="Type a command (see suggestions above), or leave a comment…"
            rows={1}
            className="no-scrollbar min-h-[67px] max-h-[120px] flex-1 resize-none overflow-y-auto rounded-xl border border-border px-3 py-2 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="rounded-[5px] bg-gradient-to-r from-brand-purple to-brand-blue px-3.5 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </aside>
  );
}
