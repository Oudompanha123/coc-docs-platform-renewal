/**
 * A small, closed Markdown dialect for the plain-language box and every
 * section body — hand-written parser and types, no library (task
 * constraint: never add a new dependency for the editor or renderer).
 *
 * Whitelist: paragraphs, `##`/`###`/`####` headings (`##` starts a
 * section of a legal page and gets an anchor — ADR-104 r2.13), `**bold**`, `*italic*`,
 * `-`/`1.` lists (2 levels), `> `quotes, `---` dividers, `[text](url)`
 * links (`https://`/`mailto:`, or a same-origin relative path starting with
 * a single `/`). Anything else — images, raw HTML,
 * tables, code blocks — is not special syntax here: it just renders back
 * out as plain text, the same "unsupported syntax is inert, not dangerous"
 * property `legalDocToReact`'s React-only rendering gives for free (no
 * `dangerouslySetInnerHTML` anywhere, matching ADR-010 §3's structural
 * no-raw-HTML rule).
 */

export type MdSpan = { text: string; bold?: boolean; italic?: boolean; href?: string; color?: MdColor };

/**
 * Text colour, carried as `[text]{color=…}` (ADR-114). Named tones from the
 * design system, never a hex value: a legal page has to stay legible in both
 * themes, and a colour nobody can name is a colour nobody can change later.
 * Default is the absence of the marker.
 */
export const MD_COLORS = ["muted", "positive", "caution", "critical"] as const;
export type MdColor = (typeof MD_COLORS)[number];

/**
 * Alignment, carried as a trailing `{align=…}` marker on a heading or
 * paragraph (ADR-113). Left is the default and is never written, so every
 * document that existed before this feature round-trips byte-for-byte.
 */
export type MdAlign = "center" | "right";

const ALIGN_RE = /\s*\{align=(center|right)\}$/;

/** Splits a trailing alignment marker off a block's text. */
export function takeAlign(text: string): { text: string; align?: MdAlign } {
  const match = ALIGN_RE.exec(text);
  return match ? { text: text.slice(0, match.index), align: match[1] as MdAlign } : { text };
}

/** The marker to append when serialising, or "" for the default. */
export function alignSuffix(align: string | null | undefined): string {
  return align === "center" || align === "right" ? ` {align=${align}}` : "";
}

export type MdBlock =
  | { kind: "paragraph"; spans: MdSpan[]; align?: MdAlign }
  | { kind: "heading"; level: 2 | 3 | 4; spans: MdSpan[]; align?: MdAlign }
  | { kind: "bulletList"; items: MdBlock[][] }
  | { kind: "orderedList"; items: MdBlock[][] }
  | { kind: "blockquote"; blocks: MdBlock[] }
  | { kind: "horizontalRule" };

export type MdDoc = MdBlock[];

const ALLOWED_LINK_SCHEMES = ["https://", "mailto:"];

export function isAllowedLinkHref(href: string): boolean {
  if (ALLOWED_LINK_SCHEMES.some((scheme) => href.startsWith(scheme))) return true;
  // A same-origin relative path only — a single leading slash. Not "//host"
  // (a scheme-relative URL that silently points at a different origin).
  return href.startsWith("/") && !href.startsWith("//");
}

// ---------------------------------------------------------------------------
// Inline parsing: **bold**, *italic*, [text](href) — a single flat pass,
// left to right, first match wins; nesting marks inside one another isn't
// supported (the toolbar never produces it, and the whitelist doesn't ask
// for it).
// ---------------------------------------------------------------------------

// The href group tolerates one level of balanced parens inside the URL
// itself (e.g. a Wikipedia-style link) without ending the match at that
// inner `)` — a bare `[^)]*` stops at the first `)`, which breaks on any
// URL containing one.
const HREF_PATTERN = "[^\\s()]*(?:\\([^()]*\\)[^\\s()]*)*";
const COLOR_PATTERN = MD_COLORS.join("|");
const INLINE_PATTERN = new RegExp(
  `\\*\\*([^*]+)\\*\\*|\\*([^*]+)\\*|\\[([^\\]]*)\\]\\((${HREF_PATTERN})\\)|\\[([^\\]]*)\\]\\{color=(${COLOR_PATTERN})\\}`,
  "g",
);

export function parseInline(text: string): MdSpan[] {
  const spans: MdSpan[] = [];
  let lastIndex = 0;
  INLINE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_PATTERN.exec(text))) {
    if (match.index > lastIndex) {
      spans.push({ text: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      spans.push({ text: match[1], bold: true });
    } else if (match[2] !== undefined) {
      spans.push({ text: match[2], italic: true });
    } else if (match[5] !== undefined) {
      spans.push({ text: match[5], color: match[6] as MdColor });
    } else {
      const linkText = match[3] ?? "";
      const href = match[4] ?? "";
      spans.push(isAllowedLinkHref(href) ? { text: linkText, href } : { text: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    spans.push({ text: text.slice(lastIndex) });
  }
  return spans.length > 0 ? spans : [{ text: "" }];
}

// ---------------------------------------------------------------------------
// Block parsing — line-oriented.
// ---------------------------------------------------------------------------

const HEADING_RE = /^(#{2,4})\s+(.*)$/;
const HR_RE = /^-{3,}\s*$/;
const BULLET_RE = /^([ \t]*)-\s+(.*)$/;
const ORDERED_RE = /^([ \t]*)\d+\.\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;

function indentLevel(leading: string): 1 | 2 {
  const spaces = leading.replace(/\t/g, "  ").length;
  return spaces >= 2 ? 2 : 1;
}

/** Parses a run of consecutive list-item lines at the given indent `level`
 *  (1 = top-level, 2 = nested) into one list block, consuming every line
 *  that belongs to it — including, for a level-1 item, one level of nested
 *  sub-list directly beneath it (the whitelist's "2 levels" cap: a nested
 *  call is always `level: 2` and never recurses further). */
function parseList(lines: string[], start: number, ordered: boolean, level: 1 | 2 = 1): { block: MdBlock; next: number } {
  const itemRe = ordered ? ORDERED_RE : BULLET_RE;
  const items: MdBlock[][] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i]!;
    const m = itemRe.exec(line);
    if (!m || indentLevel(m[1]!) !== level) break;
    i++;
    const itemBlocks: MdBlock[] = [{ kind: "paragraph", spans: parseInline(m[2]!.trim()) }];
    if (level === 1) {
      const nestedKind = i < lines.length ? classifyNested(lines[i]!) : null;
      if (nestedKind) {
        const nested = parseList(lines, i, nestedKind === "ordered", 2);
        itemBlocks.push(nested.block);
        i = nested.next;
      }
    }
    items.push(itemBlocks);
  }
  return { block: { kind: ordered ? "orderedList" : "bulletList", items }, next: i };
}

function classifyNested(line: string): "bullet" | "ordered" | null {
  const bulletMatch = BULLET_RE.exec(line);
  if (bulletMatch && indentLevel(bulletMatch[1]!) === 2) return "bullet";
  const orderedMatch = ORDERED_RE.exec(line);
  if (orderedMatch && indentLevel(orderedMatch[1]!) === 2) return "ordered";
  return null;
}

export function parseMarkdown(source: string): MdDoc {
  const lines = (source ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim().length === 0) {
      i++;
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      const headingText = takeAlign(heading[2]!.trim());
      blocks.push({
        kind: "heading",
        level: heading[1]!.length as 2 | 3 | 4,
        spans: parseInline(headingText.text.trim()),
        ...(headingText.align ? { align: headingText.align } : {}),
      });
      i++;
      continue;
    }

    if (HR_RE.test(line)) {
      blocks.push({ kind: "horizontalRule" });
      i++;
      continue;
    }

    const bulletTop = BULLET_RE.exec(line);
    if (bulletTop && indentLevel(bulletTop[1]!) === 1) {
      const { block, next } = parseList(lines, i, false);
      blocks.push(block);
      i = next;
      continue;
    }

    const orderedTop = ORDERED_RE.exec(line);
    if (orderedTop && indentLevel(orderedTop[1]!) === 1) {
      const { block, next } = parseList(lines, i, true);
      blocks.push(block);
      i = next;
      continue;
    }

    if (QUOTE_RE.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && QUOTE_RE.test(lines[i]!)) {
        quoted.push(QUOTE_RE.exec(lines[i]!)![1]!);
        i++;
      }
      blocks.push({ kind: "blockquote", blocks: [{ kind: "paragraph", spans: parseInline(quoted.join(" ").trim()) }] });
      continue;
    }

    // Paragraph: soft-wrapped consecutive plain lines, joined with a space.
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim().length > 0 &&
      !HEADING_RE.test(lines[i]!) &&
      !HR_RE.test(lines[i]!) &&
      !(BULLET_RE.exec(lines[i]!) && indentLevel(BULLET_RE.exec(lines[i]!)![1]!) === 1) &&
      !(ORDERED_RE.exec(lines[i]!) && indentLevel(ORDERED_RE.exec(lines[i]!)![1]!) === 1) &&
      !QUOTE_RE.test(lines[i]!)
    ) {
      paragraphLines.push(lines[i]!.trim());
      i++;
    }
    const paragraphText = takeAlign(paragraphLines.join(" "));
    blocks.push({
      kind: "paragraph",
      spans: parseInline(paragraphText.text),
      ...(paragraphText.align ? { align: paragraphText.align } : {}),
    });
  }

  return blocks;
}

/** Lowercases, strips punctuation, dashes the rest — "Acceptable Use" → "acceptable-use". */
function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

export type MdOutlineEntry = { id: string; title: string };

/**
 * The document's sections — every `##` heading, in order, each with a unique
 * anchor id (`-2`, `-3` on repeats). `MarkdownView` gives each `<h2>` the id
 * from this same function, so a contents list built from it always links to
 * the right place.
 */
export function markdownOutline(source: string): MdOutlineEntry[] {
  const seen = new Set<string>();
  const entries: MdOutlineEntry[] = [];
  for (const block of parseMarkdown(source)) {
    if (block.kind !== "heading" || block.level !== 2) continue;
    const title = block.spans.map((s) => s.text).join("").trim();
    const base = slugify(title);
    let id = base;
    for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
    seen.add(id);
    entries.push({ id, title });
  }
  return entries;
}

export function isMarkdownEmpty(source: string | null | undefined): boolean {
  return !source || source.trim().length === 0;
}

export function markdownWordCount(source: string | null | undefined): number {
  const trimmed = (source ?? "").trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/;
const LINK_HREF_RE = new RegExp(`\\[[^\\]]*\\]\\((${HREF_PATTERN})\\)`, "g");

/** Advisory mirror of the backend's Markdown validator (ADR-012 §3). */
export function validateMarkdown(source: string, maxLength: number, label: string): string | null {
  if (isMarkdownEmpty(source)) {
    return `${label} is required`;
  }
  if (source.length > maxLength) {
    return `${label} exceeds ${maxLength} characters`;
  }
  if (HTML_TAG_RE.test(source)) {
    return `${label} contains HTML, which isn't allowed`;
  }
  LINK_HREF_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LINK_HREF_RE.exec(source))) {
    if (!isAllowedLinkHref(match[1] ?? "")) {
      return `${label} has a link that isn't an https://, mailto:, or site-relative (/...) address`;
    }
  }
  return null;
}
