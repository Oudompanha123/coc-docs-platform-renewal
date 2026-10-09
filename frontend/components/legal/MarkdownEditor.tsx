"use client";

import { useId, useLayoutEffect, useRef, useState, type SVGProps } from "react";
import {
  cycleHeading,
  insertDivider,
  insertLink,
  toggleList,
  toggleQuote,
  toggleWrap,
  type EditorSelection,
} from "@/lib/legal/markdown-editing";
import { isAllowedLinkHref, markdownWordCount } from "@/lib/legal/markdown";
import { MarkdownView } from "./MarkdownView";

type ViewMode = "write" | "preview" | "side-by-side";

function iconBase(props: SVGProps<SVGSVGElement>) {
  return { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...props };
}
function QuoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M7 15c-1.8 0-3-1.3-3-3.3C4 8.5 6 6.3 9 5l.8 1.6C8 7.4 7 8.6 7 10c1.3 0 2.5 1 2.5 2.5S8.3 15 7 15Z" />
      <path d="M16 15c-1.8 0-3-1.3-3-3.3 0-3.2 2-5.4 5-6.7l.8 1.6c-1.8.8-2.8 2-2.8 3.4 1.3 0 2.5 1 2.5 2.5S17.3 15 16 15Z" />
    </svg>
  );
}
function BulletListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9 6h11M9 12h11M9 18h11" />
    </svg>
  );
}
function OrderedListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 5.5h1v3M4 8.5h1.6" />
      <path d="M4 13.5h1.6l-1.6 1.8h1.6" />
    </svg>
  );
}
function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 7.5 12.3 6.2a3 3 0 0 1 4.2 4.2L15.3 11.7" />
      <path d="M13 16.5 11.7 17.8a3 3 0 0 1-4.2-4.2L8.7 12.3" />
    </svg>
  );
}
function DividerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M4 12h16" />
    </svg>
  );
}
function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}
function SplitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <path d="M12 5v14" />
    </svg>
  );
}
function FullscreenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M9 4.5H4.5V9M15 4.5h4.5V9M4.5 15v4.5H9M19.5 15v4.5H15" />
    </svg>
  );
}

const LINE_PREFIX_RE = /^(#{3,4}\s|-\s|\d+\.\s|>\s|---$)/;

/**
 * Real inline Markdown constructs only (task: "fix purple brackets" — a
 * plain `(`/`)`/`[`/`]`/`*` used as ordinary punctuation, e.g. `(the
 * "Terms")`, must never be colored just for existing). Each alternative is a
 * COMPLETE, closed construct — an opening delimiter, non-empty content, and
 * its matching closing delimiter — captured into named groups so {@link
 * tokenizeInline} can mark only the delimiter characters, never the
 * punctuation this used to light up for:
 *
 * - `**bold**` / `*italic*` — content must not start or end with whitespace
 *   (`(?=\S)`/`\S` before the close), which is also what stops a lone `*`
 *   with nothing to pair against (e.g. `5 * 3`) from ever matching: without
 *   a second, properly-flanked `*` later on the line there is no valid
 *   close, so the construct simply never completes.
 * - `_italic_` — additionally `\b`-guarded on both sides, so `my_var_name`
 *   (an underscore inside a word) never reads as emphasis.
 * - `[text](url)` — only the full bracket+paren pattern; a lone `[`, `]`,
 *   `(`, or `)` with no matching partner in that exact shape never matches.
 *
 * Alternation order matters: `\*\*` is listed before the single-`\*` rule so
 * `**bold**` is matched whole by the first, rather than being torn into two
 * `*bold*`-shaped (wrong) attempts by the second.
 */
const INLINE_PATTERN_RE =
  /(?<boldOpen>\*\*)(?=\S)(?<boldText>[\s\S]*?\S)(?<boldClose>\*\*)|(?<!\*)(?<italicStarOpen>\*)(?!\*)(?=\S)(?<italicStarText>[^*\n]*?\S)(?<!\*)(?<italicStarClose>\*)(?!\*)|\b(?<italicUnderOpen>_)(?=\S)(?<italicUnderText>[^_\n]*?\S)(?<italicUnderClose>_)\b|(?<linkOpenBracket>\[)(?<linkText>[^\]\n]*)(?<linkCloseBracket>\])(?<linkOpenParen>\()(?<linkUrl>[^)\n]*)(?<linkCloseParen>\))/g;

/** One matched construct broken into its render pieces, each tagged with
 *  whether IT is a delimiter (marker, purple) or content (normal color) —
 *  bold/italic are a simple open/text/close triple, but a link's `](` run
 *  is two delimiters back to back, which a position-based (odd/even) rule
 *  can't express. */
function constructPieces(groups: Record<string, string | undefined>): { text: string; marker: boolean }[] {
  if (groups.boldOpen !== undefined) {
    return [
      { text: groups.boldOpen, marker: true },
      { text: groups.boldText!, marker: false },
      { text: groups.boldClose!, marker: true },
    ];
  }
  if (groups.italicStarOpen !== undefined) {
    return [
      { text: groups.italicStarOpen, marker: true },
      { text: groups.italicStarText!, marker: false },
      { text: groups.italicStarClose!, marker: true },
    ];
  }
  if (groups.italicUnderOpen !== undefined) {
    return [
      { text: groups.italicUnderOpen, marker: true },
      { text: groups.italicUnderText!, marker: false },
      { text: groups.italicUnderClose!, marker: true },
    ];
  }
  return [
    { text: groups.linkOpenBracket!, marker: true },
    { text: groups.linkText!, marker: false },
    { text: groups.linkCloseBracket!, marker: true },
    { text: groups.linkOpenParen!, marker: true },
    { text: groups.linkUrl!, marker: false },
    { text: groups.linkCloseParen!, marker: true },
  ];
}

function tokenizeInline(text: string): { text: string; marker: boolean }[] {
  const tokens: { text: string; marker: boolean }[] = [];
  let lastIndex = 0;
  INLINE_PATTERN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE_PATTERN_RE.exec(text))) {
    if (m.index > lastIndex) tokens.push({ text: text.slice(lastIndex, m.index), marker: false });
    tokens.push(...constructPieces(m.groups as Record<string, string | undefined>));
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length || tokens.length === 0) tokens.push({ text: text.slice(lastIndex), marker: false });
  return tokens;
}

function tokenizeLine(line: string): { text: string; marker: boolean }[] {
  const prefixMatch = LINE_PREFIX_RE.exec(line);
  if (!prefixMatch) return tokenizeInline(line);
  return [{ text: prefixMatch[0], marker: true }, ...tokenizeInline(line.slice(prefixMatch[0].length))];
}

const HELP_ITEMS = [
  ["### / ####", "Heading (level 3 / 4)"],
  ["**bold**", "Bold"],
  ["*italic*", "Italic"],
  ["- item", "Bullet list (indent 2 spaces to nest)"],
  ["1. item", "Numbered list"],
  ["> text", "Quote"],
  ["---", "Divider"],
  ["[text](https://…)", "Link (https:// or mailto: only)"],
];

export function MarkdownEditor({
  value,
  onChange,
  maxLength,
  bulletStyle,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
  bulletStyle: "circle" | "check";
  disabled?: boolean;
  placeholder?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("write");
  const [fullscreen, setFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [linkPopover, setLinkPopover] = useState<{ selection: EditorSelection; url: string; error?: string } | null>(null);
  const linkInputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pendingSelection = useRef<EditorSelection | null>(null);

  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(250, ta.scrollHeight)}px`;
    if (pendingSelection.current) {
      ta.setSelectionRange(pendingSelection.current.start, pendingSelection.current.end);
      ta.focus();
      pendingSelection.current = null;
    }
  }, [value]);

  useLayoutEffect(() => {
    if (!fullscreen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  function getSelection(): EditorSelection {
    const ta = textareaRef.current;
    if (!ta) return { start: value.length, end: value.length };
    return { start: ta.selectionStart, end: ta.selectionEnd };
  }

  function applyEdit(result: { text: string; selection: EditorSelection }) {
    pendingSelection.current = result.selection;
    onChange(result.text);
  }

  function onScroll() {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      applyEdit(toggleWrap(value, getSelection(), "**"));
    } else if (key === "i") {
      e.preventDefault();
      applyEdit(toggleWrap(value, getSelection(), "*"));
    } else if (key === "k") {
      e.preventDefault();
      openLinkPopover();
    }
  }

  function openLinkPopover() {
    setLinkPopover({ selection: getSelection(), url: "https://" });
  }

  function confirmLink() {
    if (!linkPopover) return;
    if (!isAllowedLinkHref(linkPopover.url)) {
      setLinkPopover({ ...linkPopover, error: "Only https:// or mailto: links are allowed." });
      return;
    }
    applyEdit(insertLink(value, linkPopover.selection, linkPopover.url));
    setLinkPopover(null);
  }

  const charsLeft = maxLength - value.length;
  const lineCount = value.length === 0 ? 0 : value.split("\n").length;
  const wordCount = markdownWordCount(value);

  const toolbar = (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-surface-border bg-muted-surface/60 px-2 py-1.5">
      <ToolbarButton label="Bold (Ctrl+B)" disabled={disabled} onClick={() => applyEdit(toggleWrap(value, getSelection(), "**"))}>
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton label="Italic (Ctrl+I)" disabled={disabled} onClick={() => applyEdit(toggleWrap(value, getSelection(), "*"))}>
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton label="Heading (cycles H3 → H4 → plain)" disabled={disabled} onClick={() => applyEdit(cycleHeading(value, getSelection()))}>
        <span className="font-semibold">H</span>
      </ToolbarButton>
      <Divider />
      <ToolbarButton label="Quote" disabled={disabled} onClick={() => applyEdit(toggleQuote(value, getSelection()))}>
        <QuoteIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Bullet list" disabled={disabled} onClick={() => applyEdit(toggleList(value, getSelection(), false))}>
        <BulletListIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Numbered list" disabled={disabled} onClick={() => applyEdit(toggleList(value, getSelection(), true))}>
        <OrderedListIcon className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton label="Link (Ctrl+K)" disabled={disabled} onClick={openLinkPopover}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Divider" disabled={disabled} onClick={() => applyEdit(insertDivider(value, getSelection()))}>
        <DividerIcon className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        label="Preview"
        pressed={viewMode === "preview"}
        onClick={() => setViewMode((m) => (m === "preview" ? "write" : "preview"))}
      >
        <EyeIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Side by side"
        pressed={viewMode === "side-by-side"}
        onClick={() => setViewMode((m) => (m === "side-by-side" ? "write" : "side-by-side"))}
      >
        <SplitIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Fullscreen" pressed={fullscreen} onClick={() => setFullscreen((f) => !f)}>
        <FullscreenIcon className="h-4 w-4" />
      </ToolbarButton>
      <div className="relative ml-auto flex items-center gap-2">
        <ToolbarButton label="Markdown syntax help" pressed={showHelp} onClick={() => setShowHelp((s) => !s)}>
          <span className="font-semibold">?</span>
        </ToolbarButton>
        <span className="pr-1 text-xs font-semibold text-muted-foreground">Markdown</span>
        {showHelp && (
          <div className="absolute right-0 top-full z-20 mt-1.5 w-72 rounded-xl border border-surface-border bg-card p-3 text-xs shadow-lg">
            <p className="mb-2 font-semibold text-foreground">Markdown syntax</p>
            <dl className="space-y-1">
              {HELP_ITEMS.map(([syntax, label]) => (
                <div key={syntax} className="flex items-baseline gap-2">
                  <code className="shrink-0 rounded bg-muted-surface px-1 py-0.5 font-mono text-foreground">{syntax}</code>
                  <dd className="text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );

  const writePane = (
    <div className="relative">
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words p-3 font-mono text-sm leading-relaxed text-foreground"
      >
        {(value.length === 0 ? [""] : value.split("\n")).map((line, i) => (
          <div key={i}>
            {tokenizeLine(line).map((tok, j) =>
              tok.marker ? (
                <span key={j} className="text-muted-foreground">
                  {tok.text}
                </span>
              ) : (
                <span key={j} className="text-foreground">
                  {tok.text}
                </span>
              ),
            )}
            {line.length === 0 ? " " : null}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
        spellCheck={false}
        // The real textarea's own text is always invisible by design — the
        // overlay above is what actually renders it, with marker characters
        // colored separately. Its caret and text selection must stay
        // visible though, which a plain `text-transparent` CLASS achieves
        // (only `color` is unset) without an inline style. `caret-dash-ink`
        // (a class, not an inline `caretColor`) is what lets the existing
        // dark-mode `.caret-dash-ink` override repaint it, the same
        // mechanism the overlay's own text color uses.
        className="relative min-h-[250px] w-full resize-none bg-transparent p-3 font-mono text-sm leading-relaxed text-transparent caret-dash-ink outline-none"
      />
    </div>
  );

  const previewPane = <MarkdownView source={value} bulletStyle={bulletStyle} className="space-y-2 p-3" />;

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-card" : "rounded-xl border border-surface-border bg-card"}>
      {toolbar}
      <div className={fullscreen ? "flex-1 overflow-y-auto" : ""}>
        {viewMode === "write" && writePane}
        {viewMode === "preview" && previewPane}
        {viewMode === "side-by-side" && (
          <div className="grid grid-cols-1 divide-x divide-surface-border sm:grid-cols-2">
            {writePane}
            {previewPane}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-surface-border px-3 py-1.5 text-[11.5px] text-muted-foreground">
        <span>
          lines: {lineCount} · words: {wordCount}
        </span>
        <span className={charsLeft <= 0 ? "font-semibold text-danger" : undefined}>
          {charsLeft.toLocaleString()} characters left · English (US)
        </span>
      </div>

      {linkPopover && (
        <div
          role="dialog"
          aria-label="Insert link"
          className="absolute z-30 mt-1 w-72 rounded-xl border border-surface-border bg-card p-3 shadow-lg"
        >
          <label htmlFor={linkInputId} className="text-xs font-semibold text-muted-foreground">
            URL (https:// or mailto:)
          </label>
          <input
            id={linkInputId}
            autoFocus
            className="mt-1 w-full rounded-lg border border-surface-border px-2.5 py-1.5 text-sm outline-none focus:border-foreground/30 focus:ring-[3px] focus:ring-ring/50"
            value={linkPopover.url}
            onChange={(e) => setLinkPopover({ ...linkPopover, url: e.target.value, error: undefined })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmLink();
              } else if (e.key === "Escape") {
                setLinkPopover(null);
              }
            }}
          />
          {linkPopover.error && <p className="mt-1 text-xs text-danger">{linkPopover.error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setLinkPopover(null)} className="rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent">
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmLink}
              className="rounded-full bg-muted-surface px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted-surface"
            >
              Insert
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border" />;
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 ${
        pressed ? "bg-muted-surface text-foreground" : ""
      }`}
    >
      {children}
    </button>
  );
}
