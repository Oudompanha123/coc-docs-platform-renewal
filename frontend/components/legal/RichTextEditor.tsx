"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, Extension, Mark, mergeAttributes, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LEGAL_COLOR_CLASS } from "@/lib/legal/color-classes";
import { MD_COLORS, isAllowedLinkHref, type MdColor } from "@/lib/legal/markdown";
import { docToMarkdown, markdownToDoc } from "@/lib/legal/markdown-prosemirror";
import { cn } from "@/lib/utils";

/**
 * Alignment as an attribute on headings and paragraphs (ADR-113), written by
 * hand rather than pulled in as `@tiptap/extension-text-align` — this editor
 * and its renderer take no new dependencies (see `markdown.ts`).
 *
 * Only `center` and `right` exist. Left is the absence of the attribute, which
 * is what keeps every document written before this feature serialising
 * unchanged.
 */
const TextAlign = Extension.create({
  name: "legalTextAlign",
  addGlobalAttributes() {
    return [
      {
        types: ["heading", "paragraph"],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element) => {
              const value = element.style.textAlign;
              return value === "center" || value === "right" ? value : null;
            },
            renderHTML: (attributes) =>
              attributes.textAlign ? { style: `text-align: ${attributes.textAlign}` } : {},
          },
        },
      },
    ];
  },
});

/**
 * The legal pages' text editor — what you type already looks like the
 * published page (product owner, 2026-10-14: "make text and preview the
 * same"): headings are headings, bold is bold, bullets are bullets, and no
 * `##` or `**` is ever on screen.
 *
 * Built on Tiptap (ProseMirror), limited to exactly what the stored Markdown
 * dialect can hold: headings 2–4, bold, italic, bullet and numbered lists (two
 * levels), quote, divider, links. The bar groups them the way a writer reaches
 * for them — one paragraph-style menu, the two marks and the link, the bulleted
 * list, and an "Insert" menu holding the blocks a legal page needs rarely. The
 * same grouping is what makes heading 4 reachable at all: the dialect and the
 * schema have always allowed `####`, but no button offered it. The value in
 * and out is still that Markdown (`markdown-prosemirror.ts`), so the backend,
 * its validator and the public pages are unchanged (ADR-109). Typing `## `,
 * `- `, `1. `, `> ` or `**bold**` still works — Tiptap turns them into the
 * formatting as you type.
 *
 * Its formatting bar sticks just under the page's own toolbar
 * (`--legal-toolbar-h`, published by `LegalEditorToolbar`), never over it,
 * and is opaque, so text scrolling under it doesn't show through. The box
 * rounds its corners with `overflow-clip`, not `overflow-hidden`: hidden
 * would make the box its own scroll container and the bar couldn't stick.
 *
 * Its styles are `.legal-prose` in globals.css, written to match
 * `MarkdownView`'s "document" variant, which the public page renders with.
 */
/**
 * Text colour as a mark (ADR-114). Named tones only — the attribute holds
 * `muted` / `positive` / `caution` / `critical`, never a hex value, so a
 * coloured clause resolves through the theme and stays legible in dark mode.
 */
const TextColor = Mark.create({
  name: "textColor",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-color"),
        renderHTML: (attributes) => (attributes.color ? { "data-color": attributes.color } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-color]" }];
  },
  renderHTML({ HTMLAttributes }) {
    // Without a class here the mark is an invisible `<span data-color=…>`: the
    // tone saves and publishes correctly while the editor shows no change at
    // all, which reads as "colour is broken".
    const color = HTMLAttributes["data-color"] as MdColor | undefined;
    const painted = color && color in LEGAL_COLOR_CLASS ? { class: LEGAL_COLOR_CLASS[color] } : {};
    return ["span", mergeAttributes(HTMLAttributes, painted), 0];
  },
});

export function RichTextEditor({
  value,
  onChange,
  maxLength,
  disabled,
  placeholder,
  invalid,
  id,
}: {
  value: string;
  onChange: (markdown: string) => void;
  maxLength: number;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
}) {
  // The Markdown this editor last produced — so a parent echoing it back as
  // `value` doesn't reset the document (and the cursor) on every keystroke.
  const lastEmitted = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ["mailto"],
          defaultProtocol: "https",
          isAllowedUri: (url) => isAllowedLinkHref(url),
          HTMLAttributes: { rel: "noopener noreferrer", target: null },
        },
      }),
      TextAlign,
      TextColor,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    content: markdownToDoc(value),
    editorProps: {
      attributes: {
        class: "legal-prose min-h-[420px] px-5 py-4 outline-none sm:px-8 sm:py-6",
        ...(id ? { id } : {}),
        "aria-label": "Content",
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor: e }) => {
      const markdown = docToMarkdown(e.getJSON());
      lastEmitted.current = markdown;
      onChange(markdown);
    },
  });

  // Content replaced from outside (load, reload, restore from History).
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(markdownToDoc(value), { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const length = value.length;

  return (
    <div
      className={cn(
        "overflow-clip rounded-xl border bg-background transition-[border-color,box-shadow]",
        "focus-within:border-foreground/25 focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]",
        invalid ? "border-destructive/50" : "border-surface-border",
        disabled && "opacity-70",
      )}
    >
      {editor && !disabled && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-surface-border px-4 py-1.5 text-[11.5px] text-muted-foreground">
        <span>Tip: type ## for a section, - for a bullet, **text** for bold.</span>
        <span className={length > maxLength ? "font-semibold text-danger" : undefined}>
          {length.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

/**
 * The heading levels the dialect can store, each its own button (product
 * owner, 2026-10-14: nothing behind a menu). Clicking the pressed one toggles
 * back to plain text, so "Text" needs no button of its own. The deepest level
 * is here deliberately: the format and the editor schema have always allowed
 * `####`, but until now the only way to reach it was to type the hashes.
 *
 * The buttons read H1–H3 because that is what they are *to the writer* — the
 * page's only real `<h1>` is the Title field, so the body's top level is `##`
 * and the numbering is offset by one. Storage and the published page are
 * unaffected; this is a label, not a level. The accessible name keeps the
 * visible text inside it (WCAG 2.5.3) so speech input still reaches them.
 */
const HEADINGS = [
  { label: "H1 heading", short: "H1", level: 2 },
  { label: "H2 heading", short: "H2", level: 3 },
  { label: "H3 heading", short: "H3", level: 4 },
] as const;

/**
 * The three alignments, each its own button on the bar (product owner,
 * 2026-10-14: not behind a menu). `null` is left — stored as the absence of
 * the attribute, never as `{align=left}`, so untouched text stays untouched,
 * and it is the one that reads as pressed on an ordinary clause.
 */
const ALIGNMENTS = [
  { label: "Align left", value: null, icon: <AlignLeft /> },
  { label: "Align centre", value: "center", icon: <AlignCenter /> },
  { label: "Align right", value: "right", icon: <AlignRight /> },
] as const;

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      level: [2, 3, 4].find((l) => e.isActive("heading", { level: l })) ?? null,
      align: (e.getAttributes("heading").textAlign ?? e.getAttributes("paragraph").textAlign ?? null) as
        | "center"
        | "right"
        | null,
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      color: (e.getAttributes("textColor").color ?? null) as MdColor | null,
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <TooltipProvider>
    <div
      role="toolbar"
      aria-label="Formatting"
      className="sticky top-[var(--legal-toolbar-h,0px)] z-10 flex flex-wrap items-center gap-1.5 border-b border-surface-border bg-background px-2.5 py-2"
    >
      <Tool label="Bold (Ctrl+B)" pressed={state.bold} onClick={() => chain().toggleBold().run()}>
        <span className="text-[15px] font-bold leading-none">B</span>
      </Tool>
      <Tool label="Italic (Ctrl+I)" pressed={state.italic} onClick={() => chain().toggleItalic().run()}>
        <span className="font-serif text-[15px] italic leading-none">I</span>
      </Tool>
      <ColorTool editor={editor} active={state.color} />
      <LinkTool editor={editor} active={state.link} />
      <Divider />
      {HEADINGS.map((heading) => (
        <Tool
          key={heading.level}
          label={heading.label}
          pressed={heading.level === state.level}
          onClick={() => chain().toggleHeading({ level: heading.level }).run()}
        >
          <span className="text-[14px]">{heading.short}</span>
        </Tool>
      ))}
      <Divider />
      {ALIGNMENTS.map((alignment) => (
        <Tool
          key={alignment.label}
          label={alignment.label}
          pressed={alignment.value === state.align}
          onClick={() =>
            chain()
              .updateAttributes("heading", { textAlign: alignment.value })
              .updateAttributes("paragraph", { textAlign: alignment.value })
              .run()
          }
        >
          {alignment.icon}
        </Tool>
      ))}
      <Divider />
      <Tool label="Bulleted list" pressed={state.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List />
      </Tool>
      <Tool label="Numbered list" pressed={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered />
      </Tool>
      <Tool label="Quote" pressed={state.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote />
      </Tool>
      <Tool label="Divider" onClick={() => chain().setHorizontalRule().run()}>
        <Minus />
      </Tool>
      <span className="ml-auto flex items-center gap-0.5">
        <Tool label="Undo (Ctrl+Z)" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <Undo2 />
        </Tool>
        <Tool label="Redo (Ctrl+Shift+Z)" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <Redo2 />
        </Tool>
      </span>
    </div>
    </TooltipProvider>
  );
}

function Tool({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={pressed}
          disabled={disabled}
          // Keep the selection: a mousedown on the button would otherwise blur the editor first.
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          className={cn(
            "flex h-9 min-w-9 items-center justify-center rounded-[10px] px-2.5 text-foreground transition-colors [&_svg]:size-[18px]",
            "hover:bg-accent disabled:pointer-events-none disabled:text-muted-foreground disabled:opacity-40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            pressed && "bg-muted-surface",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-2 h-6 w-px bg-surface-border" />;
}

function LinkTool({ editor, active }: { editor: Editor; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
      setError(null);
    }
  }

  function apply() {
    const href = url.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setOpen(false);
      return;
    }
    if (!isAllowedLinkHref(href)) {
      setError("Use an https://, mailto: or /site-relative address.");
      return;
    }
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !active) chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
    else chain.setLink({ href }).run();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Link"
          aria-pressed={active}
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            "flex h-9 min-w-9 items-center justify-center rounded-[10px] px-2.5 text-foreground transition-colors [&_svg]:size-[18px]",
            "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active && "bg-accent",
          )}
        >
          <Link2 />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <label className="text-xs font-medium text-muted-foreground" htmlFor="legal-link-url">
            Link address
          </label>
          <Input
            id="legal-link-url"
            autoFocus
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://… or mailto:…"
            aria-invalid={Boolean(error) || undefined}
            className="mt-1.5 h-9"
          />
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            {active && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  setOpen(false);
                }}
              >
                Remove
              </Button>
            )}
            <Button type="submit" size="sm">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Text colour. The trigger is the reference bar's "A" over a coloured bar: the
 * selection's own tone when it has one, and red otherwise, which is what the
 * reference does (product owner, 2026-10-14) — it reads as "colour lives here",
 * not as a claim about the current text. The surface is a row of named swatches
 * rather than a picker, because a hex field puts colours on a legal page that
 * fail contrast in dark mode and that nobody can find again (ADR-114).
 */
function ColorTool({ editor, active }: { editor: Editor; active: MdColor | null }) {
  const [open, setOpen] = useState(false);

  function apply(color: MdColor | null) {
    const chain = editor.chain().focus().extendMarkRange("textColor");
    if (color) chain.setMark("textColor", { color }).run();
    else chain.unsetMark("textColor").run();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Text colour"
              aria-pressed={Boolean(active)}
              onMouseDown={(e) => e.preventDefault()}
              className={cn(
                "flex h-9 min-w-9 flex-col items-center justify-center gap-[3px] rounded-[10px] px-2.5 text-foreground transition-colors",
                "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-accent",
              )}
            >
              <span className="text-[15px] font-semibold leading-none">A</span>
              <span className={cn("h-[3px] w-5 rounded-full", active ? SWATCH[active] : "bg-danger")} />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Text colour</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-2">
        <div className="flex items-center gap-1.5">
          {([null, ...MD_COLORS] as const).map((color) => (
            <button
              key={color ?? "default"}
              type="button"
              aria-label={color ? COLOR_LABEL[color] : "Default"}
              aria-pressed={color === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => apply(color)}
              className={cn(
                "size-7 rounded-full border transition-[box-shadow,border-color]",
                color ? SWATCH[color] : "bg-foreground",
                color === active ? "border-foreground ring-2 ring-ring ring-offset-1 ring-offset-background" : "border-surface-border",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The swatch fills, and the names the swatches announce. Colour on a legal
 *  page carries status, never decoration (ADR-104 decision 2, ADR-114). */
const SWATCH: Record<MdColor, string> = {
  muted: "bg-muted-foreground",
  positive: "bg-success",
  caution: "bg-caution",
  critical: "bg-danger",
};

const COLOR_LABEL: Record<MdColor, string> = {
  muted: "Muted",
  positive: "Positive",
  caution: "Caution",
  critical: "Critical",
};
