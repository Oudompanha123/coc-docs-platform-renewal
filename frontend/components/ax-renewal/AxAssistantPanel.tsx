"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useGuardedRouter } from "@/lib/ax-renewal/unsavedChanges";
import { ResizeHandle } from "@/components/ax-renewal/ResizeHandle";
import { useSession } from "@/lib/auth/SessionProvider";
import { useAxRenewalProjectContext } from "@/lib/ax-renewal/AxRenewalProjectContext";
import {
  addComment,
  chatWithAssistant,
  confirmSection,
  deleteComment,
  reopenSection,
  runAnalysis,
  startImplementation,
  fetchEngineStatus,
  type AxRenewalChatTurn,
  type AxRenewalEngineStatus,
  type PlanSection,
} from "@/lib/ax-renewal/api";
import { EXPLORER_META, resolveActiveSection, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import { axRenewalPermissions } from "@/lib/ax-renewal/permissions";
import { readUseModel, writeUseModel } from "@/lib/ax-renewal/engine-preference";
import { describeCommand, parseCommand } from "@/lib/ax-renewal/commands";
import { SparklesIcon } from "@/components/layout/icons";
import { textareaBaseClass } from "@/components/ui/textarea";

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

/** One turn on screen in Chat. Held here and nowhere else — see `mode` below. */
type ChatMessage = AxRenewalChatTurn;

/**
 * The right-hand "AX Assistant" column, in two modes:
 *
 * - **Thread** (always available) — a command console over actions that
 *   already exist and already enforce the right authorization (see
 *   commands.ts for what's deliberately in and out of scope). Its message log
 *   is the project's real, persisted comment thread (`detail.comments`).
 * - **Chat** (only where a local Claude Code installation is configured) —
 *   free text answered by that local model, and **stored nowhere**: the
 *   conversation lives in this component's state, is replayed to the backend
 *   so the model has context, and is gone on refresh. That is deliberate
 *   (ADR-046), and the panel says so rather than letting somebody assume
 *   they can come back to it.
 *
 * Keeping both in one column is why the toggle exists at all: two message
 * logs, one persisted and one not, must never be mistakable for each other.
 *
 * Self-contained (own session/project-context reads, own navigation) and
 * mounted at the layout level, sticky/full-height alongside the sidebar —
 * matching CodeRenewalPlatform.html's `.chat` column, which spans the whole
 * shell height rather than living inside the scrolling page content. It
 * shares the one `AxRenewalProjectProvider` instance with the rest of the
 * shell (see that file's comment) so a mutation made here is immediately
 * visible in the main content, not just in this panel.
 */
type AxAssistantPanelProps = {
  /** Desktop-only drag-to-resize width, in pixels — see AxRenewalSidebar's own matching prop for why this is lifted to the layout. Optional (defaulting to the panel's original fixed width) so every existing render site/test that doesn't care about resizing is unaffected. */
  width?: number;
  onResizeStart?: (event: PointerEvent<HTMLDivElement>) => void;
  isResizing?: boolean;
};

export function AxAssistantPanel({ width = 360, onResizeStart = () => {}, isResizing = false }: AxAssistantPanelProps) {
  const { user } = useSession();
  const router = useGuardedRouter();
  const searchParams = useSearchParams();
  const { projectId, detail, refresh } = useAxRenewalProjectContext();
  // The same rules as app/ax-renewal/page.tsx, from the same place
  // (permissions.ts): role decides what, membership decides where (ADR-069).
  const { onProject, canEdit, canConfirm } = axRenewalPermissions(user, detail?.project ?? null);
  // Same sentinel every other AX Renewal component resolves through — a raw
  // `searchParams.get("section") ?? "attach"` here previously let the
  // NO_TAB_OPEN sentinel ("none") through uncaught, so `EXPLORER_META[active]`
  // came back `undefined` and `.group` threw once the last tab was closed.
  const active = resolveActiveSection(searchParams.get("section"));

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note | null>(null);

  // Chat lives here and only here: no fetch on mount, no write on send, no
  // cache. Unmounting this component is the conversation ending (ADR-046).
  const [mode, setMode] = useState<"thread" | "chat">("thread");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  /** The comment whose Remove has been pressed once and is awaiting a second. */
  const [confirming, setConfirming] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

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

  // Chat is offered only where there is actually a model to answer it — and
  // withdrawn the moment "stop using" is pressed, rather than left as a tab
  // that would now fail with a 409. `engine === null` (not yet known) counts
  // as unavailable for the same reason the banner renders nothing there.
  // Also only to a caller who can use it: /assistant/chat sits at the admin
  // floor (ADR-046), so a Developer, Reviewer or Lead would only ever get a
  // 403 from it (ADR-068). The thread — comments — stays open to them.
  const chatAvailable = Boolean(engine?.connected) && useModel && canEdit;
  useEffect(() => {
    if (!chatAvailable) setMode("thread");
  }, [chatAvailable]);

  // Follow the conversation as it grows, the way a terminal does. Thread
  // mode is a scrollback somebody reads top-down, so it stays put.
  useEffect(() => {
    // Optional call: scrollIntoView is missing in jsdom, and following the
    // log is a nicety — never a reason for the panel to throw.
    if (mode === "chat") logEndRef.current?.scrollIntoView?.({ block: "end" });
  }, [chat, busy, mode]);

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

  /**
   * One chat turn. Deliberately shares nothing with the command path below:
   * no `parseCommand`, so "confirm pages" typed in Chat is a question about
   * confirming pages and not a confirmation — a mode that can silently
   * change the project would be the worst of both designs. No `refresh()`
   * either, because nothing on the server changed.
   */
  async function sendChat(message: string, projectId: string) {
    // What's on screen before this message — the model's only context, since
    // the backend keeps none.
    const history = chat;
    setChat((prev) => [...prev, { role: "you", text: message }]);
    setText("");
    setNote(null);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { reply } = await chatWithAssistant(projectId, message, history, controller.signal);
      setChat((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setNote({ text: "stopped — nothing was recorded", tone: "denied" });
        return;
      }
      setNote({
        text: err instanceof Error ? err.message : "the assistant didn't answer",
        tone: "denied",
      });
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !detail) return;
    const projectId = detail.project.id;
    if (mode === "chat") {
      await sendChat(trimmed, projectId);
      return;
    }
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
          await confirmSection(projectId, command.section, detail.project.revision);
          break;
        case "reopen":
          if (!canConfirm) return deny("reopen a section");
          await reopenSection(projectId, command.section);
          break;
        case "confirm-all":
          if (!canConfirm) return deny("confirm a section");
          // One revision for every section: a confirmation checks it but
          // never bumps it (ADR-067), so each call in this loop is checked
          // against the same plan the person was looking at.
          for (const section of PLAN_SECTIONS) {
            if (detail.confirmations[section] == null) {
              await confirmSection(projectId, section, detail.project.revision);
            }
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

  /**
   * Removes one comment from the thread (ADR-045). Two presses, not a
   * `confirm()` dialog: the second press is the confirmation, and it keeps a
   * mistake one click from being undone-by-not-clicking rather than behind a
   * modal nobody reads.
   *
   * <p>Soft on the server — this hides a comment, it does not erase what was
   * said, and there is no edit anywhere.
   */
  async function handleDelete(commentId: string) {
    if (!detail) return;
    if (confirming !== commentId) {
      setConfirming(commentId);
      return;
    }
    setConfirming(null);
    setBusy(true);
    setNote(null);
    try {
      await deleteComment(detail.project.id, commentId);
      await refresh();
      setNote({ text: "comment removed", tone: "applied" });
    } catch (err) {
      setNote({
        text: err instanceof Error ? err.message : "that comment could not be removed",
        tone: "denied",
      });
    } finally {
      setBusy(false);
    }
  }

  function deny(action: string) {
    // Say which of the two rules said no: a non-member can fix theirs by
    // asking to be added, which "no permission" alone would not tell them.
    setNote({
      text: onProject
        ? `you don't have permission to ${action}`
        : `you're not a member of this project, so you can't ${action} — ask a member to add you`,
      tone: "denied",
    });
    setBusy(false);
  }

  if (!detail) return null;

  const suggestions = active != null ? SUGGESTIONS[active] ?? [] : [];

  return (
    <aside className="hidden shrink-0 xl:block" style={{ width }}>
      {/* h-[calc(100vh-32px)], not h-screen: AxRenewalStatusBar (h-8,
          border-box) now spans the full shell width as its own row below
          this one (see ax-renewal/layout.tsx), matching
          CodeRenewalPlatform.html's own two-row grid — so this stops short
          of the full viewport by that same height instead of running past
          where the status bar starts. Width is inline style, not a Tailwind
          class, since it's a runtime drag value (see useResizableWidth). */}
      <div
        className="sticky top-0 relative flex h-[calc(100vh-32px)] flex-col overflow-hidden border-l border-surface-border bg-muted-surface"
        style={{ width }}
      >
        <ResizeHandle edge="left" onPointerDown={onResizeStart} isDragging={isResizing} label="Resize AX Assistant panel" />
        <div className="flex items-center gap-2 border-b border-surface-border bg-card px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">AX Assistant</span>
          {chatAvailable && (
            // Only rendered where a model can actually answer: a permanently
            // disabled tab would advertise a capability this deployment
            // does not have (ADR-043's whole point about the banner).
            <div className="ml-auto flex overflow-hidden rounded-xl border border-surface-border" role="tablist">
              {(["chat", "thread"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={mode === key}
                  onClick={() => setMode(key)}
                  className={`px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                    mode === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-b border-surface-border px-4 py-2 font-mono text-xs text-muted-foreground">
          {meta ? (
            <>
              {isPlanTab ? "acting on " : "reading "}
              <span className="font-semibold text-foreground">
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
          <Alert
            variant="success"
            icon={<SparklesIcon />}
            className="mx-4 mt-3 w-auto text-xs"
            action={
              <button
                type="button"
                onClick={() => setUseModel(false)}
                // "Stop using it", not "disconnect": the path in .env.local is
                // untouched and the backend could still run it. All this does is
                // stop asking, which is the only thing a web page honestly can do.
                title="Run the keyword analysis instead. The configured model stays configured."
                className="shrink-0 rounded-xl border border-emerald-400 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                stop using
              </button>
            }
          >
            Local model in use —{" "}
            <span className="font-semibold">
              {engine.readsSource ? "reads your source" : "reads the manifest only"}
            </span>
          </Alert>
        ) : engine?.connected ? (
          <Alert
            variant="default"
            icon={<SparklesIcon />}
            className="mx-4 mt-3 w-auto text-xs"
            action={
              <button
                type="button"
                onClick={() => setUseModel(true)}
                className="shrink-0 rounded-xl border border-surface-border px-2.5 py-0.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted-surface"
              >
                use it
              </button>
            }
          >
            A model is available — <span className="font-semibold">not using it here</span>
          </Alert>
        ) : engine ? (
          <Alert
            variant="warning"
            icon={<SparklesIcon />}
            className="mx-4 mt-3 w-auto text-xs"
            action={
              <button
                type="button"
                onClick={() => onOpenTab("ai-engine")}
                className="shrink-0 rounded-xl border border-amber-400 px-2.5 py-0.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                connect
              </button>
            }
          >
            No model connected — <span className="font-semibold">fixed commands only</span>
          </Alert>
        ) : null}
        {mode === "chat" && (
          <p className="border-b border-surface-border bg-card px-4 py-2 text-xs italic text-muted-foreground">
            Not saved — this conversation is gone when you refresh, and nothing here changes the
            project.
          </p>
        )}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {mode === "chat" ? (
            <>
              {chat.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ask about this project — the local model answers here.
                </p>
              )}
              {chat.map((message, i) => (
                <div
                  key={i}
                  className={
                    message.role === "you"
                      ? "ml-8 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground"
                      : "mr-8 rounded-xl border border-surface-border bg-card px-3 py-2 text-sm text-foreground"
                  }
                >
                  {/* whitespace-pre-wrap: the reply is the model's own prose,
                      lists and line breaks included, and collapsing them
                      would make a structured answer unreadable. */}
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                </div>
              ))}
              {busy && <p className="font-mono text-xs text-muted-foreground">thinking…</p>}
              <div ref={logEndRef} />
            </>
          ) : (
            <>
          {detail.comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet — anything you type that isn&apos;t a command above is recorded here.</p>
          )}
          {detail.comments.map((comment) => {
            // Mirrors the backend's rule (author, or super_admin) so the
            // button is not offered where it would 403 — the check itself is
            // the server's, always (ADR-045).
            const canRemove =
              user?.role === "super_admin" || (user?.id != null && user.id === comment.authorId);
            return (
            <div key={comment.id} className="rounded-xl border border-surface-border bg-card px-3 py-2 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-foreground">{comment.authorName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-foreground">{comment.body}</p>
              {canRemove && (
                <div className="mt-1.5 flex justify-end gap-2">
                  {confirming === comment.id && (
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleDelete(comment.id)}
                    className={`text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      confirming === comment.id
                        ? "text-rose-600 hover:text-rose-700"
                        : "text-muted-foreground hover:text-rose-600"
                    }`}
                  >
                    {confirming === comment.id ? "Really remove" : "Remove"}
                  </button>
                </div>
              )}
            </div>
            );
          })}
            </>
          )}
          {note && (
            <Alert variant={note.tone === "applied" ? "success" : "warning"} className="font-mono text-xs">
              {note.tone === "applied" ? "applied — " : "not applied — "}
              {note.text}
            </Alert>
          )}
        </div>

        {/* Command chips belong to Thread: in Chat they'd be typed as text
            and answered as a question, which is not what pressing one looks
            like it will do. */}
        {mode === "thread" && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-surface-border px-4 py-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setText(s)}
                className="rounded-xl border border-surface-border px-2.5 py-1 font-mono text-xs text-muted-foreground hover:border-primary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {mode === "thread" && meta && !isPlanTab && (
          <p className="border-t border-surface-border bg-card px-4 py-2 text-xs italic text-muted-foreground">
            Read only here — a comment is recorded, but nothing on this tab is changed by it.
          </p>
        )}

        <form onSubmit={(e) => void handleSend(e)} className="flex items-end gap-2 border-t border-surface-border bg-card p-3">
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
            placeholder={
              mode === "chat"
                ? "Ask the local model about this project…"
                : "Type a command (see suggestions above), or leave a comment…"
            }
            rows={1}
            className={`${textareaBaseClass} no-scrollbar min-h-[67px] max-h-[120px] flex-1 resize-none overflow-y-auto`}
          />
          {/* A local model reading real source can think for a minute or
              two. Stop aborts the request, same as the analysis panel's
              own — the subprocess is left to the backend's timeout, and the
              note says only what actually happened here. */}
          {mode === "chat" && busy ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => abortRef.current?.abort()}
              className="text-muted-foreground"
            >
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={busy || !text.trim()}
            >
              Send
            </Button>
          )}
        </form>
      </div>
    </aside>
  );
}
