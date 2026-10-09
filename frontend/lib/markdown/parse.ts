/**
 * A small Markdown parser for announcement bodies (ADR-102).
 *
 * <p>Deliberately a subset, and deliberately not HTML. It turns text into a
 * tree of known node types, and {@link MarkdownContent} turns that tree into
 * React elements — nothing on the way ever becomes markup, so a `<script>` in
 * the source is shown as the literal characters `<script>`, the same structural
 * guarantee ADR-010 gives page content by having no raw-HTML block type.
 *
 * <p>Supported: `#`–`######` headings, paragraphs (single line breaks kept),
 * `**bold**` / `__bold__`, `*italic*` / `_italic_`, `` `code` ``, fenced
 * ```` ``` ```` code blocks, `-` / `*` / `+` and `1.` lists, `>` quotes,
 * `---` rules, and `[text](url)` links. A link whose url is not http(s),
 * mailto or a site path keeps its text and loses the link.
 *
 * <p>One extension: `[text]{color=red}` colours text. The colour is a name
 * from {@link TEXT_COLORS}, never a CSS value, and the renderer maps it to a
 * fixed class — so nothing the writer types becomes a style. An unknown name
 * keeps its text and loses the colour, the same rule as an unsafe link.
 *
 * // req: ADR-102
 */

/** The colours text may take, in palette order. */
export const TEXT_COLORS = ["red", "orange", "green", "blue", "purple", "gray"] as const;
export type TextColor = (typeof TEXT_COLORS)[number];

export function isTextColor(name: string): name is TextColor {
  return (TEXT_COLORS as readonly string[]).includes(name);
}

export type Inline =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "color"; color: TextColor; children: Inline[] }
  | { type: "br" };

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; start: number; items: Inline[][] }
  | { type: "quote"; children: Block[] }
  | { type: "code"; lang: string; value: string }
  | { type: "rule" };

const FENCE = /^\s*```\s*([\w+-]*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const QUOTE = /^\s*>\s?(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*(\d{1,9})[.)]\s+(.*)$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;

/** Whether a line starts a block of its own, ending any paragraph before it. */
function startsBlock(line: string): boolean {
  return (
    FENCE.test(line) || HEADING.test(line) || QUOTE.test(line) || BULLET.test(line) || NUMBERED.test(line) || RULE.test(line)
  );
}

/** Parses a whole document into blocks. */
export function parseMarkdown(source: string): Block[] {
  return parseBlocks(source.replace(/\r\n?/g, "\n").split("\n"));
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === "") {
      i++;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      // An unclosed fence runs to the end, as in every common renderer: the
      // writer is mid-typing, and the preview should not flicker into prose.
      while (i < lines.length && !FENCE.test(lines[i]!)) body.push(lines[i++]!);
      i++;
      blocks.push({ type: "code", lang: fence[1] ?? "", value: body.join("\n") });
      continue;
    }

    // Checked before the bullet list: "---" and "* * *" are rules, not items.
    if (RULE.test(line)) {
      blocks.push({ type: "rule" });
      i++;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const level = heading[1]!.length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: "heading", level, children: parseInline(heading[2] ?? "") });
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i]!)) inner.push(QUOTE.exec(lines[i++]!)![1]!);
      blocks.push({ type: "quote", children: parseBlocks(inner) });
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet || numbered) {
      const ordered = numbered !== null;
      const marker = ordered ? NUMBERED : BULLET;
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i]!;
        const item = marker.exec(current);
        if (item) {
          items.push(ordered ? item[2]! : item[1]!);
        } else if (current.trim() !== "" && /^\s+/.test(current) && !startsBlock(current)) {
          // An indented line carries on the item above it.
          items[items.length - 1] += `\n${current.trim()}`;
        } else {
          break;
        }
        i++;
      }
      blocks.push({
        type: "list",
        ordered,
        start: ordered ? Number(numbered![1]) : 1,
        items: items.map((text) => parseInline(text)),
      });
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i]!.trim() !== "" && (paragraph.length === 0 || !startsBlock(lines[i]!))) {
      paragraph.push(lines[i++]!.trim());
    }
    blocks.push({ type: "paragraph", children: parseInline(paragraph.join("\n")) });
  }

  return blocks;
}

const INLINE_CODE = /^`([^`\n]+)`/;
const COLOR = /^\[([^\]\n]+)\]\{color=([a-z]+)\}/;
// The url may hold one level of balanced parentheses ("…/Foo_(bar)").
const LINK = /^\[([^\]\n]+)\]\(\s*((?:[^()\s]|\([^()\s]*\))+)\s*\)/;
const STRONG = /^(\*\*|__)(?=\S)([\s\S]*?\S)\1/;
const EM_STAR = /^\*(?=[^\s*])([\s\S]*?[^\s*])\*(?!\*)/;
const EM_UNDERSCORE = /^_(?=[^\s_])([\s\S]*?[^\s_])_(?![A-Za-z0-9_])/;

/** Parses one run of inline text (a paragraph, heading, or list item). */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer) out.push({ type: "text", value: buffer });
    buffer = "";
  };

  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const ch = text[i]!;

    if (ch === "\n") {
      flush();
      out.push({ type: "br" });
      i++;
      continue;
    }

    // A backslash makes the next marker character literal.
    if (ch === "\\" && i + 1 < text.length && /[\\`*_[\]()#>+\-.!{}]/.test(text[i + 1]!)) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }

    let match: RegExpExecArray | null;

    if (ch === "`" && (match = INLINE_CODE.exec(rest))) {
      flush();
      out.push({ type: "code", value: match[1]! });
      i += match[0].length;
      continue;
    }

    if (ch === "[" && (match = COLOR.exec(rest))) {
      flush();
      const children = parseInline(match[1]!);
      const color = match[2]!;
      if (isTextColor(color)) out.push({ type: "color", color, children });
      else out.push(...children);
      i += match[0].length;
      continue;
    }

    if (ch === "[" && (match = LINK.exec(rest))) {
      flush();
      const children = parseInline(match[1]!);
      const href = safeHref(match[2]!);
      if (href) out.push({ type: "link", href, children });
      else out.push(...children);
      i += match[0].length;
      continue;
    }

    if ((ch === "*" || ch === "_") && (match = STRONG.exec(rest))) {
      flush();
      out.push({ type: "strong", children: parseInline(match[2]!) });
      i += match[0].length;
      continue;
    }

    // `_` only opens emphasis at a word boundary, so snake_case_names and
    // URLs pasted as text stay as they were typed.
    const atWordBoundary = i === 0 || !/[A-Za-z0-9]/.test(text[i - 1]!);
    if (
      (ch === "*" && (match = EM_STAR.exec(rest))) ||
      (ch === "_" && atWordBoundary && (match = EM_UNDERSCORE.exec(rest)))
    ) {
      flush();
      out.push({ type: "em", children: parseInline(match[1]!) });
      i += match[0].length;
      continue;
    }

    buffer += ch;
    i++;
  }

  flush();
  return out;
}

/**
 * The url a link may point at, or null to drop the link.
 *
 * <p>An allow-list, not a block-list: `javascript:`, `data:`, `vbscript:` and
 * any scheme nobody has thought of yet are all refused by not being one of
 * these. A path on this site ("/docs/…") is allowed; a protocol-relative
 * "//host" is not, since it is an external link wearing a local one's shape.
 */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^(https?:\/\/|mailto:)/i.test(href)) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  return null;
}

/**
 * The words alone, for places that show an excerpt or search the text: the
 * admin list's two-line preview should read "Maintenance on Friday", not
 * "## **Maintenance** on Friday".
 */
export function markdownToPlainText(source: string): string {
  return parseMarkdown(source)
    .map(blockText)
    .filter((text) => text !== "")
    .join("\n");
}

function blockText(block: Block): string {
  switch (block.type) {
    case "heading":
    case "paragraph":
      return inlineText(block.children);
    case "list":
      return block.items.map(inlineText).join("\n");
    case "quote":
      return block.children.map(blockText).join("\n");
    case "code":
      return block.value;
    case "rule":
      return "";
  }
}

function inlineText(nodes: Inline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
        case "code":
          return node.value;
        case "br":
          return "\n";
        default:
          return inlineText(node.children);
      }
    })
    .join("");
}
