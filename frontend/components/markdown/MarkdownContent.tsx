import type { ReactNode } from "react";
import { parseMarkdown, type Block, type Inline, type TextColor } from "@/lib/markdown/parse";

/**
 * Renders announcement Markdown (ADR-102) as React elements.
 *
 * <p>No `dangerouslySetInnerHTML` anywhere on this path: every node is one of
 * the types {@link parseMarkdown} knows, and its text goes in as a React
 * child, which React escapes. That is the whole XSS argument, and it is a
 * structural one — there is no sanitiser to get wrong.
 *
 * <p>Links to other sites open in a new tab without handing that tab a
 * reference back to this one (`noopener noreferrer`).
 */
export function MarkdownContent({ source, className = "" }: { source: string; className?: string }) {
  return <div className={`space-y-3 break-words ${className}`}>{parseMarkdown(source).map(renderBlock)}</div>;
}

/**
 * Each palette colour's class — written out in full so Tailwind sees them.
 * The class is chosen by name from this table; nothing from the text itself
 * reaches the style (ADR-102).
 */
export const TEXT_COLOR_CLASSES: Record<TextColor, string> = {
  red: "text-red-600",
  orange: "text-orange-600",
  green: "text-green-600",
  blue: "text-blue-600",
  purple: "text-foreground",
  gray: "text-gray-500",
};

const HEADING_CLASSES: Record<number, string> = {
  1: "text-xl font-semibold text-foreground",
  2: "text-lg font-semibold text-foreground",
  3: "text-base font-bold text-foreground",
  4: "text-[15px] font-semibold text-foreground",
  5: "text-sm font-semibold text-foreground",
  6: "text-sm font-medium text-muted-foreground",
};

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as const;
      return (
        <Tag key={key} className={HEADING_CLASSES[block.level]}>
          {renderInline(block.children)}
        </Tag>
      );
    }
    case "paragraph":
      return <p key={key}>{renderInline(block.children)}</p>;
    case "list": {
      const items = block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>);
      return block.ordered ? (
        <ol key={key} start={block.start} className="list-decimal space-y-1 pl-6">
          {items}
        </ol>
      ) : (
        <ul key={key} className="list-disc space-y-1 pl-6">
          {items}
        </ul>
      );
    }
    case "quote":
      return (
        <blockquote key={key} className="space-y-3 border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
          {block.children.map(renderBlock)}
        </blockquote>
      );
    case "code":
      return (
        <pre
          key={key}
          className="overflow-x-auto rounded-xl bg-muted-surface px-4 py-3 font-mono text-[13px] leading-6 text-foreground not-italic"
        >
          <code>{block.value}</code>
        </pre>
      );
    case "rule":
      return <hr key={key} className="border-surface-border" />;
  }
}

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return node.value;
      case "br":
        return <br key={i} />;
      case "code":
        return (
          <code key={i} className="rounded bg-muted-surface px-1.5 py-0.5 font-mono text-[0.9em] text-foreground not-italic">
            {node.value}
          </code>
        );
      case "strong":
        return (
          <strong key={i} className="font-semibold text-foreground">
            {renderInline(node.children)}
          </strong>
        );
      case "em":
        return <em key={i}>{renderInline(node.children)}</em>;
      case "color":
        return (
          <span key={i} className={TEXT_COLOR_CLASSES[node.color]}>
            {renderInline(node.children)}
          </span>
        );
      case "link": {
        const external = !node.href.startsWith("/");
        return (
          <a
            key={i}
            href={node.href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
          >
            {renderInline(node.children)}
          </a>
        );
      }
    }
  });
}
