import { Fragment, type ReactNode } from "react";

/**
 * Renders a catalogue string with its `**bold**` runs as <strong>. Lets a
 * translation move the emphasis with the words it belongs to, which a
 * component splitting the sentence into pieces could not (word order differs
 * between English, Khmer and Korean). Plain text only — no other markup.
 *
 * // req: FR-I18N-001
 */
export function renderBold(text: string): ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}
