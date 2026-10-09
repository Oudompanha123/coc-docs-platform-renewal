/**
 * Pure text-editing operations behind the Markdown editor's toolbar — given
 * the current text and selection, each returns the new text and where the
 * selection should land afterwards. Kept separate from `MarkdownEditor.tsx`
 * so the cursor-math is unit-testable without a DOM/textarea at all.
 */

export type EditorSelection = { start: number; end: number };
export type EditResult = { text: string; selection: EditorSelection };

function lineBounds(text: string, at: number): { start: number; end: number } {
  const start = text.lastIndexOf("\n", at - 1) + 1;
  const nextBreak = text.indexOf("\n", at);
  const end = nextBreak === -1 ? text.length : nextBreak;
  return { start, end };
}

/** Wraps the selection with `marker` on both sides (bold `**`, italic `*`) —
 *  or, if the selection is already wrapped by it, removes it (toggle off). */
export function toggleWrap(text: string, sel: EditorSelection, marker: string): EditResult {
  const { start, end } = sel;
  const selected = text.slice(start, end);
  const before = text.slice(Math.max(0, start - marker.length), start);
  const after = text.slice(end, end + marker.length);

  if (selected.length > 0 && before === marker && after === marker) {
    const newText = text.slice(0, start - marker.length) + selected + text.slice(end + marker.length);
    return { text: newText, selection: { start: start - marker.length, end: end - marker.length } };
  }

  const placeholder = selected.length > 0 ? selected : "";
  const newText = text.slice(0, start) + marker + placeholder + marker + text.slice(end);
  const newStart = start + marker.length;
  const newEnd = newStart + placeholder.length;
  return { text: newText, selection: { start: newStart, end: newEnd } };
}

const HEADING_LINE_RE = /^(#{3,4}) /;

/** Cycles the current line: plain -> `### ` -> `#### ` -> plain. */
export function cycleHeading(text: string, sel: EditorSelection): EditResult {
  const { start: lineStart, end: lineEnd } = lineBounds(text, sel.start);
  const line = text.slice(lineStart, lineEnd);
  const match = HEADING_LINE_RE.exec(line);

  let newLine: string;
  let delta: number;
  if (!match) {
    newLine = "### " + line;
    delta = 4;
  } else if (match[1] === "###") {
    newLine = "#" + line;
    delta = 1;
  } else {
    newLine = line.slice(5);
    delta = -5;
  }

  const newText = text.slice(0, lineStart) + newLine + text.slice(lineEnd);
  const shift = (pos: number) => Math.max(lineStart, pos + (pos >= lineStart ? delta : 0));
  return { text: newText, selection: { start: shift(sel.start), end: shift(sel.end) } };
}

function everyLineSpanning(text: string, sel: EditorSelection): { start: number; end: number; lines: string[] } {
  const start = text.lastIndexOf("\n", sel.start - 1) + 1;
  const nextBreak = text.indexOf("\n", Math.max(sel.end - 1, sel.start));
  const end = sel.end === sel.start && nextBreak !== -1 && nextBreak < sel.start ? sel.start : nextBreak === -1 ? text.length : nextBreak;
  const block = text.slice(start, end);
  return { start, end, lines: block.length === 0 ? [""] : block.split("\n") };
}

const BULLET_LINE_RE = /^-\s+/;
const ORDERED_LINE_RE = /^\d+\.\s+/;

/** Toggles a bullet or ordered list over every line the selection spans —
 *  already-listed lines with the SAME kind are un-listed (toggle off);
 *  lines with the other kind are converted. */
export function toggleList(text: string, sel: EditorSelection, ordered: boolean): EditResult {
  const { start, end, lines } = everyLineSpanning(text, sel);
  const alreadyThisKind = lines.every((l) => (ordered ? ORDERED_LINE_RE : BULLET_LINE_RE).test(l) || l.trim() === "");

  let n = 1;
  const newLines = lines.map((line) => {
    const stripped = line.replace(BULLET_LINE_RE, "").replace(ORDERED_LINE_RE, "");
    if (alreadyThisKind) return stripped;
    if (stripped.trim() === "") return stripped;
    return ordered ? `${n++}. ${stripped}` : `- ${stripped}`;
  });

  const newBlock = newLines.join("\n");
  const newText = text.slice(0, start) + newBlock + text.slice(end);
  const delta = newBlock.length - (end - start);
  return { text: newText, selection: { start, end: Math.max(start, end + delta) } };
}

/** Toggles a `> ` blockquote prefix over every line the selection spans. */
export function toggleQuote(text: string, sel: EditorSelection): EditResult {
  const { start, end, lines } = everyLineSpanning(text, sel);
  const alreadyQuoted = lines.every((l) => l.startsWith("> ") || l.trim() === "");
  const newLines = lines.map((line) => {
    if (alreadyQuoted) return line.startsWith("> ") ? line.slice(2) : line;
    return line.trim() === "" ? line : `> ${line}`;
  });
  const newBlock = newLines.join("\n");
  const newText = text.slice(0, start) + newBlock + text.slice(end);
  const delta = newBlock.length - (end - start);
  return { text: newText, selection: { start, end: Math.max(start, end + delta) } };
}

/** Inserts a horizontal rule on its own blank-line-separated block. */
export function insertDivider(text: string, sel: EditorSelection): EditResult {
  const before = text.slice(0, sel.start);
  const after = text.slice(sel.end);
  const leadingBreak = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trailingBreak = after.length === 0 || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const insertion = `${leadingBreak}---${trailingBreak}`;
  const newText = before + insertion + after;
  const cursor = before.length + insertion.length;
  return { text: newText, selection: { start: cursor, end: cursor } };
}

/** Wraps the selection (or a placeholder) as a `[text](url)` link. */
export function insertLink(text: string, sel: EditorSelection, url: string): EditResult {
  const { start, end } = sel;
  const selected = text.slice(start, end);
  const linkText = selected.length > 0 ? selected : "link text";
  const markdown = `[${linkText}](${url})`;
  const newText = text.slice(0, start) + markdown + text.slice(end);
  const cursor = start + markdown.length;
  return { text: newText, selection: { start: cursor, end: cursor } };
}
