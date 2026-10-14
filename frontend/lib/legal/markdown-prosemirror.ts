import type { JSONContent } from "@tiptap/react";
import { isAllowedLinkHref, parseMarkdown, type MdBlock, type MdSpan } from "./markdown";

/**
 * Converts between the legal pages' Markdown dialect (`markdown.ts`) and the
 * document tree the visual editor (Tiptap / ProseMirror) edits — both ways,
 * through our own parser, so no HTML is ever produced or parsed (ADR-010 §3's
 * no-raw-HTML rule) and storage, the backend validator and the public pages
 * stay exactly as they were (ADR-109 §2).
 *
 * The editor can express a little more than the dialect (marks nested inside
 * each other, lists deeper than two levels, several paragraphs in one list
 * item); `docToMarkdown` folds each of those into the nearest thing the
 * dialect has, the same way the old plain-text editor's toolbar never
 * produced them in the first place.
 */

// ---------------------------------------------------------------------------
// Markdown -> editor document
// ---------------------------------------------------------------------------

function spansToInline(spans: MdSpan[]): JSONContent[] {
  return spans
    .filter((s) => s.text.length > 0)
    .map((s) => {
      const marks: JSONContent["marks"] = [];
      if (s.bold) marks.push({ type: "bold" });
      if (s.italic) marks.push({ type: "italic" });
      if (s.href) marks.push({ type: "link", attrs: { href: s.href } });
      return marks.length ? { type: "text", text: s.text, marks } : { type: "text", text: s.text };
    });
}

function paragraph(spans: MdSpan[]): JSONContent {
  const content = spansToInline(spans);
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
}

function blockToNode(block: MdBlock): JSONContent {
  switch (block.kind) {
    case "paragraph":
      return paragraph(block.spans);
    case "heading": {
      const content = spansToInline(block.spans);
      return { type: "heading", attrs: { level: block.level }, ...(content.length ? { content } : {}) };
    }
    case "bulletList":
    case "orderedList":
      return {
        type: block.kind,
        content: block.items.map((item) => ({ type: "listItem", content: item.map(blockToNode) })),
      };
    case "blockquote":
      return { type: "blockquote", content: block.blocks.map(blockToNode) };
    case "horizontalRule":
      return { type: "horizontalRule" };
  }
}

export function markdownToDoc(source: string): JSONContent {
  const blocks = parseMarkdown(source ?? "");
  const content = blocks.map(blockToNode);
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

// ---------------------------------------------------------------------------
// Editor document -> Markdown
// ---------------------------------------------------------------------------

type Run = { text: string; bold: boolean; italic: boolean; href: string | null };

function inlineRuns(nodes: JSONContent[] | undefined): Run[] {
  const runs: Run[] = [];
  for (const node of nodes ?? []) {
    if (node.type === "hardBreak") {
      // The dialect joins a paragraph's lines with a space.
      runs.push({ text: " ", bold: false, italic: false, href: null });
      continue;
    }
    if (node.type !== "text" || !node.text) continue;
    const marks = node.marks ?? [];
    const link = marks.find((m) => m.type === "link");
    const href = typeof link?.attrs?.href === "string" && isAllowedLinkHref(link.attrs.href) ? link.attrs.href : null;
    runs.push({
      text: node.text,
      bold: marks.some((m) => m.type === "bold"),
      italic: marks.some((m) => m.type === "italic"),
      href,
    });
  }
  // Merge neighbours with the same formatting, so "**ab**" never becomes "**a****b**".
  const merged: Run[] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && last.bold === run.bold && last.italic === run.italic && last.href === run.href) last.text += run.text;
    else merged.push({ ...run });
  }
  return merged;
}

function runToMarkdown(run: Run): string {
  if (run.href) return `[${run.text}](${run.href})`;
  // The dialect has no nesting: bold wins over italic, as the toolbar always did.
  const marker = run.bold ? "**" : run.italic ? "*" : "";
  if (!marker || !run.text.trim()) return run.text;
  // Markers must hug the text, or the parser doesn't see them.
  const lead = run.text.match(/^\s*/)![0];
  const trail = run.text.match(/\s*$/)![0];
  return `${lead}${marker}${run.text.trim()}${marker}${trail}`;
}

function inlineToMarkdown(nodes: JSONContent[] | undefined): string {
  return inlineRuns(nodes).map(runToMarkdown).join("").replace(/\s*\n\s*/g, " ");
}

function listToMarkdown(list: JSONContent, depth: number): string[] {
  const ordered = list.type === "orderedList";
  const indent = depth > 1 ? "  " : "";
  const lines: string[] = [];
  (list.content ?? []).forEach((item, i) => {
    const children = item.content ?? [];
    const text = children
      .filter((c) => c.type === "paragraph" || c.type === "heading")
      .map((c) => inlineToMarkdown(c.content))
      .filter(Boolean)
      .join(" ");
    lines.push(`${indent}${ordered ? `${i + 1}.` : "-"} ${text}`);
    for (const child of children) {
      if (child.type === "bulletList" || child.type === "orderedList") {
        // Two levels is the dialect's cap; anything deeper sits at level two.
        lines.push(...listToMarkdown(child, Math.min(depth + 1, 2)));
      }
    }
  });
  return lines;
}

function nodeToMarkdown(node: JSONContent): string {
  switch (node.type) {
    case "paragraph":
      return inlineToMarkdown(node.content);
    case "heading": {
      const level = Math.min(4, Math.max(2, Number(node.attrs?.level) || 2));
      const text = inlineToMarkdown(node.content);
      return text ? `${"#".repeat(level)} ${text}` : "";
    }
    case "bulletList":
    case "orderedList":
      return listToMarkdown(node, 1).join("\n");
    case "blockquote": {
      const text = (node.content ?? []).map((c) => inlineToMarkdown(c.content)).filter(Boolean).join(" ");
      return text ? `> ${text}` : "";
    }
    case "horizontalRule":
      return "---";
    default:
      return inlineToMarkdown(node.content);
  }
}

export function docToMarkdown(doc: JSONContent): string {
  return (doc.content ?? [])
    .map(nodeToMarkdown)
    .filter((block) => block.trim().length > 0)
    .join("\n\n");
}
