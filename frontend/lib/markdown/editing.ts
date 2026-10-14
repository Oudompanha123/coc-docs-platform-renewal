/**
 * What each Markdown toolbar button does to the text (ADR-102).
 *
 * <p>Pure: text and selection in, text and selection out. The editor applies
 * the result to its textarea; keeping the edits here is what lets every one
 * be tested without a browser. Each returns the selection to leave behind,
 * so the next keystroke goes where the writer expects — over the placeholder
 * in an empty "**bold text**", for instance, so typing replaces it.
 *
 * // req: ADR-102
 */

export type EditState = { value: string; start: number; end: number };

export type MarkdownAction =
  | "bold"
  | "italic"
  | "h1"
  | "h2"
  | "h3"
  | "bulletList"
  | "numberedList"
  | "link"
  | "codeBlock"
  | "quote";

export function applyMarkdownAction(state: EditState, action: MarkdownAction): EditState {
  switch (action) {
    case "bold":
      return toggleInline(state, "**", "bold text");
    case "italic":
      return toggleInline(state, "_", "italic text");
    case "h1":
      return toggleHeading(state, 1);
    case "h2":
      return toggleHeading(state, 2);
    case "h3":
      return toggleHeading(state, 3);
    case "bulletList":
      return toggleLinePrefix(state, () => "- ", /^\s*[-*+]\s+/);
    case "numberedList":
      return toggleLinePrefix(state, (n) => `${n + 1}. `, /^\s*\d+[.)]\s+/);
    case "quote":
      return toggleLinePrefix(state, () => "> ", /^\s*>\s?/);
    case "link":
      return insertLink(state);
    case "codeBlock":
      return insertCodeBlock(state);
  }
}

/**
 * Wraps the selection in `marker`, or unwraps it if it is already wrapped —
 * either with the markers just outside the selection (what this function
 * leaves behind) or inside it (the writer selected "**word**" whole).
 */
function toggleInline({ value, start, end }: EditState, marker: string, placeholder: string): EditState {
  const m = marker.length;
  const before = value.slice(start - m, start);
  const after = value.slice(end, end + m);
  if (start >= m && before === marker && after === marker) {
    return {
      value: value.slice(0, start - m) + value.slice(start, end) + value.slice(end + m),
      start: start - m,
      end: end - m,
    };
  }

  const selected = value.slice(start, end);
  if (selected.length >= 2 * m && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(m, -m);
    return { value: value.slice(0, start) + inner + value.slice(end), start, end: start + inner.length };
  }

  const text = selected || placeholder;
  return {
    value: value.slice(0, start) + marker + text + marker + value.slice(end),
    start: start + m,
    end: start + m + text.length,
  };
}

/** The start of the first selected line and the end of the last. */
function lineRange(value: string, start: number, end: number): [number, number] {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  // A selection ending just after a newline has not really reached the next line.
  const lastChar = end > start && value[end - 1] === "\n" ? end - 1 : end;
  const nl = value.indexOf("\n", lastChar);
  return [from, nl === -1 ? value.length : nl];
}

/**
 * Prefixes every selected line, or removes the prefix if every non-empty
 * selected line already has it. Lines carrying a different list or quote
 * marker have it replaced rather than stacked ("- 1. item").
 */
function toggleLinePrefix(
  { value, start, end }: EditState,
  prefix: (index: number) => string,
  existing: RegExp,
): EditState {
  const [from, to] = lineRange(value, start, end);
  const lines = value.slice(from, to).split("\n");
  const filled = lines.filter((line) => line.trim() !== "");
  const allHave = filled.length > 0 && filled.every((line) => existing.test(line));
  const anyMarker = /^\s*([-*+]|\d+[.)]|>)\s?/;

  let n = 0;
  const next = lines.map((line) => {
    if (allHave) return line.replace(existing, "");
    if (line.trim() === "" && lines.length > 1) return line;
    return prefix(n++) + line.replace(anyMarker, "");
  });
  const replaced = next.join("\n");
  const updated = value.slice(0, from) + replaced + value.slice(to);
  // An empty line just prefixed leaves the caret after the marker, ready to type.
  if (start === end && lines.length === 1 && lines[0]!.trim() === "") {
    return { value: updated, start: from + replaced.length, end: from + replaced.length };
  }
  return { value: updated, start: from, end: from + replaced.length };
}

/** Sets the selected lines to heading `level`, or back to text if they already are. */
function toggleHeading({ value, start, end }: EditState, level: number): EditState {
  const [from, to] = lineRange(value, start, end);
  const lines = value.slice(from, to).split("\n");
  const marker = `${"#".repeat(level)} `;
  const filled = lines.filter((line) => line.trim() !== "");
  const allThisLevel = filled.length > 0 && filled.every((line) => line.startsWith(marker));
  const anyHeading = /^#{1,6}\s+/;

  const next = lines.map((line) => {
    if (line.trim() === "" && lines.length > 1) return line;
    const text = line.replace(anyHeading, "");
    return allThisLevel ? text : marker + text;
  });
  const replaced = next.join("\n");
  const updated = value.slice(0, from) + replaced + value.slice(to);
  if (start === end && lines.length === 1 && lines[0]!.trim() === "") {
    return { value: updated, start: from + replaced.length, end: from + replaced.length };
  }
  return { value: updated, start: from, end: from + replaced.length };
}

/** `[selection](https://)`, with the url selected so it can be typed or pasted over. */
function insertLink({ value, start, end }: EditState): EditState {
  const label = value.slice(start, end) || "link text";
  const url = "https://";
  const inserted = `[${label}](${url})`;
  const urlStart = start + label.length + 3;
  return {
    value: value.slice(0, start) + inserted + value.slice(end),
    start: urlStart,
    end: urlStart + url.length,
  };
}

/** Fences the selected lines, or an empty block with "code" selected. */
function insertCodeBlock({ value, start, end }: EditState): EditState {
  const selected = value.slice(start, end);
  const code = selected || "code";
  // A fence has to sit on lines of its own to be one.
  const lead = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
  const trail = end < value.length && value[end] !== "\n" ? "\n" : "";
  const inserted = `${lead}\`\`\`\n${code}\n\`\`\`${trail}`;
  const codeStart = start + lead.length + 4;
  return {
    value: value.slice(0, start) + inserted + value.slice(end),
    start: codeStart,
    end: codeStart + code.length,
  };
}

const COLORED_WHOLE = /^\[([^\]\n]+)\]\{color=[a-z]+\}$/;
const COLOR_SUFFIX = /^\]\{color=[a-z]+\}/;

/**
 * Colours the selection `[text]{color=…}`, recolours it, or — with `null` —
 * takes the colour off.
 *
 * <p>"Already coloured" is recognised two ways, as with bold: the selection is
 * the text inside a span (what this function leaves selected), or it is the
 * whole span, brackets and all. Either way the span is rewritten rather than
 * wrapped again, so picking a second colour never nests one inside another.
 */
export function applyTextColor({ value, start, end }: EditState, color: string | null): EditState {
  const selected = value.slice(start, end);

  // The text inside a span: "[" just before, "]{color=…}" just after.
  const suffix = COLOR_SUFFIX.exec(value.slice(end));
  if (start > 0 && value[start - 1] === "[" && suffix) {
    const spanStart = start - 1;
    const spanEnd = end + suffix[0].length;
    return rewrap(value, spanStart, spanEnd, selected, color);
  }

  // The whole span selected.
  const whole = COLORED_WHOLE.exec(selected);
  if (whole) return rewrap(value, start, end, whole[1]!, color);

  if (color === null) return { value, start, end };
  const text = selected || "colored text";
  const inserted = `[${text}]{color=${color}}`;
  return { value: value.slice(0, start) + inserted + value.slice(end), start: start + 1, end: start + 1 + text.length };
}

/** Replaces `value[from, to)` with `text` coloured `color`, or bare if null; leaves `text` selected. */
function rewrap(value: string, from: number, to: number, text: string, color: string | null): EditState {
  const replacement = color === null ? text : `[${text}]{color=${color}}`;
  const textStart = from + (color === null ? 0 : 1);
  return {
    value: value.slice(0, from) + replacement + value.slice(to),
    start: textStart,
    end: textStart + text.length,
  };
}
