"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { List, ListOrdered, TextQuote } from "lucide-react";
import { CodeBracketsIcon, LinkIcon } from "@/components/layout/icons";
import { applyMarkdownAction, applyTextColor, type EditState, type MarkdownAction } from "@/lib/markdown/editing";
import { TEXT_COLORS, type TextColor } from "@/lib/markdown/parse";
import { MarkdownContent, TEXT_COLOR_CLASSES } from "./MarkdownContent";

type Tool = { action: MarkdownAction; label: string; shortcut?: string; icon: ReactNode };

const BulletListIcon = <List className="h-4 w-4" aria-hidden="true" />;

const NumberedListIcon = <ListOrdered className="h-4 w-4" aria-hidden="true" />;

const QuoteIcon = <TextQuote className="h-4 w-4" aria-hidden="true" />;

const Glyph = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span aria-hidden="true" className={`text-xs leading-none ${className}`}>
    {children}
  </span>
);

/** In toolbar order; each inner array is one group, separated by a divider. */
const TOOL_GROUPS: Tool[][] = [
  [
    { action: "bold", label: "Bold", shortcut: "B", icon: <Glyph className="font-bold">B</Glyph> },
    { action: "italic", label: "Italic", shortcut: "I", icon: <Glyph className="font-serif italic">I</Glyph> },
  ],
  [
    { action: "h1", label: "Heading 1", icon: <Glyph className="font-bold">H1</Glyph> },
    { action: "h2", label: "Heading 2", icon: <Glyph className="font-bold">H2</Glyph> },
    { action: "h3", label: "Heading 3", icon: <Glyph className="font-bold">H3</Glyph> },
  ],
  [
    { action: "bulletList", label: "Bulleted list", icon: BulletListIcon },
    { action: "numberedList", label: "Numbered list", icon: NumberedListIcon },
  ],
  [
    { action: "link", label: "Link", shortcut: "K", icon: <LinkIcon className="h-4 w-4" /> },
    { action: "codeBlock", label: "Code block", icon: <CodeBracketsIcon className="h-4 w-4" /> },
    { action: "quote", label: "Quote", icon: QuoteIcon },
  ],
];

const SHORTCUTS: Record<string, MarkdownAction> = { b: "bold", i: "italic", k: "link" };

/**
 * A Markdown textarea with a formatting toolbar and a Preview tab (ADR-102).
 *
 * <p>Still a plain textarea underneath, not a rich-text surface: what is saved
 * is exactly what the writer sees in "Write", the character count means what
 * it says, and the backend's 5000-character limit applies to the same text.
 * The toolbar only inserts Markdown around the selection
 * ({@link applyMarkdownAction}); Ctrl/⌘ + B, I and K do the same. Text colour
 * comes from a fixed palette and is written as `[text]{color=red}`
 * ({@link applyTextColor}).
 *
 * <p>"Preview" renders through the same {@link MarkdownContent} readers see,
 * so it cannot disagree with what gets published.
 */
export function MarkdownEditor({
  id,
  value,
  onChange,
  maxLength,
  placeholder,
  rows = 8,
  disabled,
  required,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  describedBy?: string;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // The selection to restore once React has written the new value — setting
  // it before then would be overwritten by the re-render.
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    const textarea = textareaRef.current;
    if (!selection || !textarea) return;
    pendingSelection.current = null;
    textarea.focus();
    textarea.setSelectionRange(selection.start, selection.end);
  });

  function apply(action: MarkdownAction) {
    edit((state) => applyMarkdownAction(state, action));
  }

  function edit(change: (state: EditState) => EditState) {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;
    const current: EditState = { value, start: textarea.selectionStart, end: textarea.selectionEnd };
    const next = change(current);
    // Over the limit, nothing happens rather than the text being cut: a
    // truncated closing "**" would leave the writer with broken formatting
    // they never asked for.
    if (maxLength !== undefined && next.value.length > maxLength) {
      textarea.focus();
      return;
    }
    pendingSelection.current = { start: next.start, end: next.end };
    onChange(next.value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
    const action = SHORTCUTS[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    apply(action);
  }

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? "⌘" : "Ctrl+";

  return (
    // No overflow-hidden: the colour menu has to drop out below the toolbar.
    // The toolbar rounds its own top corners and the text area is transparent,
    // so nothing pokes past the frame's rounded edge without it.
    <div className="mt-1.5 rounded-lg border border-surface-border bg-card transition-colors focus-within:border-[#1c70e2]">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border-b border-surface-border bg-muted-surface/50 px-1.5 py-1">
        <div role="toolbar" aria-label="Formatting" aria-controls={id} className="flex flex-wrap items-center gap-0.5">
          {TOOL_GROUPS.map((group, g) => (
            <div key={g} className="flex items-center gap-0.5">
              {g > 0 && <span aria-hidden="true" className="mx-1 h-4 w-px bg-surface-border" />}
              {group.map((tool) => {
                const title = tool.shortcut ? `${tool.label} (${mod}${tool.shortcut})` : tool.label;
                return (
                  <button
                    key={tool.action}
                    type="button"
                    // Keeps the textarea's selection: a mousedown on a button
                    // would otherwise move focus and lose it before onClick.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => apply(tool.action)}
                    disabled={disabled || mode === "preview"}
                    aria-label={tool.label}
                    title={title}
                    className="flex h-7 min-w-7 items-center justify-center rounded-md px-1 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground/70"
                  >
                    {tool.icon}
                  </button>
                );
              })}
              {/* Colour sits with bold and italic: all three are about how
                  the words look rather than what kind of block they are. */}
              {g === 0 && (
                <TextColorPicker
                  disabled={disabled || mode === "preview"}
                  onPick={(color) => edit((state) => applyTextColor(state, color))}
                />
              )}
            </div>
          ))}
        </div>

        <div role="tablist" aria-label="Editor mode" className="flex items-center gap-0.5 rounded-md border border-surface-border bg-card p-0.5">
          {(["write", "preview"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className={`rounded px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                mode === key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {key === "write" ? "Write" : "Preview"}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden rather than unmounted in Preview, so the textarea keeps its
          selection, scroll position and undo history across a peek. */}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-describedby={describedBy}
        hidden={mode === "preview"}
        // Deliberately not `textareaBaseClass`: the frame around the toolbar
        // and the text is the one border this editor has, so the textarea
        // itself is borderless and transparent. (`markdown-editor-input` once
        // exempted it from a global textarea rule in globals.css; that rule
        // went in ADR-104 r2.1 and the class is now only a hook.)
        className="markdown-editor-input block w-full resize-y border-0 bg-transparent px-3 py-2 font-mono text-[13px] leading-6 text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground"
      />

      {mode === "preview" && (
        <div
          role="tabpanel"
          aria-label="Preview"
          className="max-h-80 min-h-[9rem] overflow-y-auto px-3 py-2 text-sm leading-6 text-foreground/70"
        >
          {value.trim() ? (
            <MarkdownContent source={value} />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

/** The colours the picker offers — every renderable colour except blue, which
 *  the product owner dropped from the editor: in body text it reads as a link
 *  that goes nowhere. `TEXT_COLORS` still includes it, so announcements
 *  already written in blue keep rendering. */
const PICKER_COLORS = TEXT_COLORS.filter((color) => color !== "blue");

const SWATCH_CLASSES: Record<TextColor, string> = {
  red: "bg-red-600",
  orange: "bg-orange-600",
  green: "bg-green-600",
  blue: "bg-blue-600",
  purple: "bg-primary",
  gray: "bg-gray-500",
};

const COLOR_LABELS: Record<TextColor, string> = {
  red: "Red",
  orange: "Orange",
  green: "Green",
  blue: "Blue",
  purple: "Purple",
  gray: "Gray",
};

/**
 * The toolbar's text-colour button and its swatch menu.
 *
 * <p>The "A" carries a bar in the last colour picked, as in word processors,
 * and each swatch shows its colour as an "A" in that colour's own text class —
 * the same class readers will see. Every control swallows its mousedown, like
 * the other toolbar buttons, so the textarea keeps the selection the colour is
 * meant for.
 */
function TextColorPicker({ disabled, onPick }: { disabled?: boolean; onPick: (color: TextColor | null) => void }) {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<TextColor>("red");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  function pick(color: TextColor | null) {
    if (color) setLast(color);
    setOpen(false);
    onPick(color);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label="Text color"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Text color"
        className="flex h-7 min-w-7 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground/70"
      >
        <span aria-hidden="true" className="text-xs font-bold leading-none">
          A
        </span>
        <span aria-hidden="true" className={`h-[3px] w-3.5 rounded-full ${SWATCH_CLASSES[last]}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Text color"
          className="absolute left-0 top-full z-30 mt-1 w-48 rounded-lg border border-surface-border bg-card p-1.5 shadow-lg"
        >
          <div className="grid grid-cols-5 gap-1">
            {PICKER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="menuitem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(color)}
                aria-label={COLOR_LABELS[color]}
                title={COLOR_LABELS[color]}
                className={`flex h-7 items-center justify-center rounded-md text-sm font-bold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${TEXT_COLOR_CLASSES[color]} ${
                  color === last ? "bg-muted-surface" : ""
                }`}
              >
                <span aria-hidden="true">A</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            role="menuitem"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(null)}
            className="mt-1 w-full rounded-md px-2 py-1 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            Default color
          </button>
        </div>
      )}
    </div>
  );
}
