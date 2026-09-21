"use client";

import { useState } from "react";
import type { AxRenewalProjectDetail, PlanSection } from "@/lib/ax-renewal/api";
import { EXPLORER_META, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import { describeCommand, parseCommand } from "@/lib/ax-renewal/commands";

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

type AxAssistantPanelProps = {
  active: AxRenewalExplorerKey;
  detail: AxRenewalProjectDetail;
  canEdit: boolean;
  canConfirm: boolean;
  onOpenTab: (key: AxRenewalExplorerKey) => void;
  onConfirm: (section: PlanSection) => Promise<void>;
  onReopen: (section: PlanSection) => Promise<void>;
  onRunAnalysis: () => Promise<void>;
  onStartImplementation: () => Promise<void>;
  onPostComment: (text: string) => Promise<void>;
};

/**
 * The right-hand "AX Assistant" column — a command console over actions that
 * already exist and already enforce the right authorization (see
 * commands.ts for what's deliberately in and out of scope), not a live LLM
 * chat. Its message log is the project's real, persisted comment thread
 * (`detail.comments`) rather than the reference prototype's ephemeral,
 * browser-only chat history — this is the one comment thread for the
 * project, so it replaces the equivalent card that used to live only on the
 * Implementation tab.
 */
export function AxAssistantPanel({
  active,
  detail,
  canEdit,
  canConfirm,
  onOpenTab,
  onConfirm,
  onReopen,
  onRunAnalysis,
  onStartImplementation,
  onPostComment,
}: AxAssistantPanelProps) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    setNote(null);
    try {
      const command = parseCommand(trimmed);
      if (!command) {
        await onPostComment(trimmed);
        setText("");
        return;
      }
      switch (command.type) {
        case "confirm":
          if (!canConfirm) return deny("confirm a section");
          await onConfirm(command.section);
          break;
        case "reopen":
          if (!canConfirm) return deny("reopen a section");
          await onReopen(command.section);
          break;
        case "confirm-all":
          if (!canConfirm) return deny("confirm a section");
          for (const section of PLAN_SECTIONS) {
            if (detail.confirmations[section] == null) await onConfirm(section);
          }
          break;
        case "run-analysis":
          if (!canEdit) return deny("run analysis");
          await onRunAnalysis();
          break;
        case "start-implementation":
          if (!canConfirm) return deny("start implementation");
          await onStartImplementation();
          break;
        case "open":
          onOpenTab(command.tab);
          break;
      }
      setNote(describeCommand(command));
      setText("");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "That didn't go through.");
    } finally {
      setBusy(false);
    }
  }

  function deny(action: string) {
    setNote(`You don't have permission to ${action}. A Super Admin or the Developer capability can.`);
    setBusy(false);
  }

  const suggestions = SUGGESTIONS[active] ?? [];

  return (
    <aside className="hidden w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-page shadow-sm xl:flex xl:w-[360px]">
      <div className="flex items-center gap-2 border-b border-border bg-white px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-brand-purple" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted">AX Assistant</span>
      </div>
      <div className="border-b border-border px-4 py-2 font-mono text-xs text-muted">
        acting on <span className="font-semibold text-dash-ink">{EXPLORER_META[active].label.toLowerCase()}</span>
      </div>

      <div className="max-h-[480px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {detail.comments.length === 0 && (
          <p className="text-sm text-muted">No comments yet — anything you type that isn&apos;t a command above is recorded here.</p>
        )}
        {detail.comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-dash-ink">{comment.authorName}</span>
              <span className="shrink-0 text-xs text-muted">{new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-dash-ink">{comment.body}</p>
          </div>
        ))}
        {note && <p className="rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-3 py-2 text-xs text-dash-ink">{note}</p>}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setText(s)}
              className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted hover:border-brand-purple hover:text-brand-purple"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => void handleSend(e)} className="flex items-end gap-2 border-t border-border bg-white p-3">
        <textarea
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
          className="flex-1 resize-none rounded-xl border border-border px-3 py-2 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-3.5 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </aside>
  );
}
