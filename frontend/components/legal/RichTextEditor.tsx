"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
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
import { isAllowedLinkHref } from "@/lib/legal/markdown";
import { docToMarkdown, markdownToDoc } from "@/lib/legal/markdown-prosemirror";
import { cn } from "@/lib/utils";

/**
 * The legal pages' text editor — what you type already looks like the
 * published page (product owner, 2026-10-14: "make text and preview the
 * same"): headings are headings, bold is bold, bullets are bullets, and no
 * `##` or `**` is ever on screen.
 *
 * Built on Tiptap (ProseMirror), limited to exactly what the stored Markdown
 * dialect can hold: section heading (H2), sub-heading (H3), bold, italic,
 * bullet and numbered lists (two levels), quote, divider, links. The value in
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

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
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
      className="sticky top-[var(--legal-toolbar-h,0px)] z-10 flex flex-wrap items-center gap-0.5 border-b border-surface-border bg-muted-surface px-2 py-1.5"
    >
      <Tool label="Section heading" pressed={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 />
      </Tool>
      <Tool label="Sub-heading" pressed={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 />
      </Tool>
      <Divider />
      <Tool label="Bold (Ctrl+B)" pressed={state.bold} onClick={() => chain().toggleBold().run()}>
        <Bold />
      </Tool>
      <Tool label="Italic (Ctrl+I)" pressed={state.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic />
      </Tool>
      <LinkTool editor={editor} active={state.link} />
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
            "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors [&_svg]:size-4",
            "hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            pressed && "bg-background text-foreground shadow-sm",
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
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-surface-border" />;
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
            "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors [&_svg]:size-4",
            "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active && "bg-background text-foreground shadow-sm",
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
