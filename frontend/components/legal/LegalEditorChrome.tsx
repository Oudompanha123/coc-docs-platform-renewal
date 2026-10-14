"use client";

import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  History,
  LoaderCircle,
  RotateCw,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Modal, ModalFooter } from "@/components/users-roles/Modal";
import type { LegalVersionSummary } from "@/lib/legal/legal-api";
import type { LegalNotice, SaveState } from "./useLegalEditor";

/**
 * The pieces both legal editors share (ADR-104 r2.13): the sticky toolbar,
 * the notice line, the publish dialog, the restore confirmation and the
 * full-screen version preview. One definition, so Terms and Privacy look and
 * behave the same — they had grown two toolbars, two publish flows (a
 * checklist dialog for one, two browser `confirm()`s for the other) and two
 * hard-coded white preview bars that ignored dark mode.
 */

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Where the page stands for its readers. Hover (or focus) for when it went live and who published it. */
export function LegalLiveBadge({
  published,
  livePending,
  unsaved,
}: {
  published: LegalVersionSummary | null;
  livePending: boolean;
  unsaved: boolean;
}) {
  const [label, dot, tone] = !published
    ? [
        "Not published",
        "bg-muted-foreground",
        "border-surface-border bg-muted-surface text-muted-foreground",
      ]
    : livePending || unsaved
      ? [
          "Changes not live",
          "bg-amber-500",
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        ]
      : [
          "Live",
          "bg-emerald-500",
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        ];
  const since = formatDate(published?.publishedAt ?? null);
  const detail = published
    ? `Live since ${since}${published.publishedByName ? ` · published by ${published.publishedByName}` : ""}`
    : "Readers don't see this page yet.";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={`inline-flex h-7 shrink-0 cursor-default items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring ${tone}`}
        >
          <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
          {label}
          <span className="sr-only">. {detail}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{detail}</TooltipContent>
    </Tooltip>
  );
}

/** What has happened to the edits on screen — an icon and a word or two. */
export function LegalSaveStatus({
  unsaved,
  saveState,
  lastSavedAt,
}: {
  unsaved: boolean;
  saveState: SaveState;
  lastSavedAt: Date | null;
}) {
  const base = "inline-flex items-center gap-1.5 text-xs";
  if (saveState === "saving") {
    return (
      <span className={`${base} text-muted-foreground`}>
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        Saving…
      </span>
    );
  }
  if (unsaved) {
    const failed = saveState === "error";
    return (
      <span
        className={`${base} font-medium ${failed ? "text-danger" : "text-amber-700 dark:text-amber-400"}`}
      >
        {failed ? (
          <AlertCircle className="size-3.5" aria-hidden="true" />
        ) : (
          <CircleDot className="size-3.5" aria-hidden="true" />
        )}
        {failed ? "Not saved" : "Unsaved changes"}
      </span>
    );
  }
  return (
    <span className={`${base} text-muted-foreground`}>
      <Check className="size-3.5" aria-hidden="true" />
      {lastSavedAt
        ? `Saved at ${formatTime(lastSavedAt)}`
        : "All changes saved"}
    </span>
  );
}

function ToolbarDivider({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`h-6 w-px shrink-0 bg-surface-border ${className}`}
    />
  );
}

function IconAction({
  label,
  children,
  ...rest
}: { label: string; children: ReactNode } & ComponentProps<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          className="size-9"
          {...rest}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The editor's one toolbar: how you're looking at the page (Edit / Preview),
 * where it stands (live badge, save state), and what you can do — the two
 * occasional actions as icon buttons, the two main ones as labelled buttons
 * on the right, Publish last. Sticky, so Save and Publish are never a scroll
 * away.
 *
 * The sticky layer is an opaque strip of page background with the card
 * inside it, so text scrolling up is hidden behind it — corners included —
 * rather than showing through a translucent bar. `z-10`: above the page,
 * below the Topbar's menus (z-50).
 */
export function LegalEditorToolbar({
  livePath,
  modeSwitch,
  published,
  livePending,
  unsaved,
  saveState,
  lastSavedAt,
  canEdit,
  canSave,
  canPublish,
  publishing,
  onSave,
  onPublish,
  onHistory,
}: {
  livePath: string;
  modeSwitch?: ReactNode;
  published: LegalVersionSummary | null;
  livePending: boolean;
  unsaved: boolean;
  saveState: SaveState;
  lastSavedAt: Date | null;
  canEdit: boolean;
  canSave: boolean;
  canPublish: boolean;
  publishing: boolean;
  onSave: () => void;
  onPublish: () => void;
  onHistory: () => void;
}) {
  // Publishes this bar's height as --legal-toolbar-h, so the editor's own
  // formatting bar sticks just below it instead of sliding over it. Only a
  // visible bar reports (the hidden tab's measures 0).
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const report = () => {
      const h = el.offsetHeight;
      if (h > 0) document.documentElement.style.setProperty("--legal-toolbar-h", `${h}px`);
    };
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <TooltipProvider>
      <div ref={barRef} className="sticky top-0 z-20 -mt-2 bg-background pb-3 pt-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-surface-border bg-card p-2 pl-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {modeSwitch}
          {modeSwitch && <ToolbarDivider className="hidden sm:block" />}
          <div className="flex min-w-0 items-center gap-3" aria-live="polite">
            <LegalLiveBadge
              published={published}
              livePending={livePending}
              unsaved={unsaved}
            />
            {canEdit && (
              <LegalSaveStatus
                unsaved={unsaved}
                saveState={saveState}
                lastSavedAt={lastSavedAt}
              />
            )}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <IconAction label="Version history" onClick={onHistory}>
              <History className="size-4" aria-hidden="true" />
            </IconAction>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="size-9">
                  <Link
                    href={livePath}
                    target="_blank"
                    rel="noopener"
                    aria-label="View live page"
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View live page ({livePath})</TooltipContent>
            </Tooltip>
            {canEdit && (
              <>
                <ToolbarDivider className="mx-1.5" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canSave}
                  onClick={onSave}
                >
                  {saveState === "saving" ? "Saving…" : "Save draft"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canPublish}
                  onClick={onPublish}
                  className="ml-1"
                >
                  <Send className="size-4" aria-hidden="true" />
                  {publishing ? "Publishing…" : "Publish"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/** One line under the toolbar. A conflict offers Reload instead of reloading over your edits. */
export function LegalNoticeBar({
  notice,
  onDismiss,
  onReload,
}: {
  notice: LegalNotice | null;
  onDismiss: () => void;
  onReload: () => void;
}) {
  if (!notice) return null;
  return (
    <Alert
      variant={notice.kind === "error" ? "destructive" : "success"}
      className="mt-3"
      onDismiss={onDismiss}
      action={
        notice.conflict ? (
          <Button type="button" variant="outline" size="sm" className="h-7" onClick={onReload}>
            <RotateCw className="size-3.5" aria-hidden="true" />
            Reload
          </Button>
        ) : undefined
      }
    >
      {notice.message}
    </Alert>
  );
}

/**
 * Publishing, confirmed: what goes live and where, anything that blocks it
 * (each with "Go to field" when the editor can point at one), an optional
 * note for History, and — when there are edits on screen — that they will be
 * saved first, so nobody publishes an older draft than the one they see.
 */
export function LegalPublishDialog({
  pageName,
  livePath,
  issues,
  willSaveFirst,
  warning,
  publishing,
  onGoToField,
  onConfirm,
  onCancel,
}: {
  pageName: string;
  livePath: string;
  issues: Record<string, string>;
  willSaveFirst: boolean;
  warning?: ReactNode;
  publishing: boolean;
  onGoToField?: (path: string) => void;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  const issueEntries = Object.entries(issues);
  const blocked = issueEntries.length > 0;

  return (
    <Modal
      title={`Publish ${pageName}?`}
      onClose={onCancel}
      ariaLabel={`Publish ${pageName}`}
      className="w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-border bg-card p-6 shadow-xl"
    >
      <p className="text-sm text-muted-foreground">
        Everyone visiting{" "}
        <span className="font-mono text-foreground">{livePath}</span> will see
        this version right away. The current live version stays in History.
      </p>

      {blocked ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">
            Fix{" "}
            {issueEntries.length === 1
              ? "this"
              : `these ${issueEntries.length}`}{" "}
            first:
          </p>
          <ul className="mt-2 space-y-1.5">
            {issueEntries.map(([path, message]) => (
              <li
                key={path}
                className="flex items-start justify-between gap-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
              >
                <span>{message}</span>
                {onGoToField && (
                  <button
                    type="button"
                    onClick={() => onGoToField(path)}
                    className="shrink-0 font-medium text-foreground hover:underline"
                  >
                    Go to field
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          Ready to publish — no issues found.
        </p>
      )}

      {willSaveFirst && !blocked && (
        <p className="mt-3 text-xs text-muted-foreground">
          Your unsaved changes will be saved first, then published.
        </p>
      )}
      {warning}

      {!blocked && (
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-muted-foreground">
            Publish note (optional)
          </span>
          <Textarea
            rows={2}
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Updated the data retention section"
            className="mt-1.5"
          />
          <span className="mt-1 block text-right text-xs text-muted-foreground">
            {200 - note.length} characters left
          </span>
        </label>
      )}

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={blocked || publishing}
          onClick={() => onConfirm(note.trim())}
        >
          <Send className="size-4" aria-hidden="true" />
          {publishing ? "Publishing…" : "Publish"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}


/** A past version, full screen, clearly marked as not the draft. Esc closes it. */
export function LegalVersionPreview({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Version preview"
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-surface-border bg-background/95 px-6 py-3 backdrop-blur">
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {label}{" "}
          <span className="text-muted-foreground">
            — not your current draft
          </span>
        </span>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Back to editor
        </Button>
      </div>
      {children}
    </div>
  );
}

/** The Edit / Preview segmented switch both editors put at the toolbar's left. */
export function LegalModeSwitch({
  mode,
  onChange,
  editIcon,
  previewIcon,
}: {
  mode: "edit" | "preview";
  onChange: (mode: "edit" | "preview") => void;
  editIcon: ReactNode;
  previewIcon: ReactNode;
}) {
  return (
    <div
      role="tablist"
      aria-label="Mode"
      className="inline-flex rounded-full bg-muted-surface p-0.5"
    >
      {(["edit", "preview"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors ${
            mode === m
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {m === "edit" ? editIcon : previewIcon}
          {m === "edit" ? "Edit" : "Preview"}
        </button>
      ))}
    </div>
  );
}
