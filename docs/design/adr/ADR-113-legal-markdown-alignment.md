# ADR-113: Alignment in the legal Markdown dialect

- **Status:** Proposed
- **Date:** 2026-10-14
- **Supersedes:** none
- **Amends:** ADR-109 (legal pages single body), ADR-010 §3 (content model, no raw HTML)

## Context

The legal pages editor stores a page body as a string in a small, closed,
hand-written Markdown dialect (`frontend/lib/legal/markdown.ts`). The dialect
carries paragraphs, `##`–`####` headings, bold, italic, two levels of list,
quotes, dividers and links, and nothing else.

The product owner asked for alignment controls in the Content editor, matching
a reference toolbar (left / centre / right).

Alignment has no representation in the dialect. Wiring alignment buttons to the
editor without extending the format produces the worst available outcome: the
text looks centred while editing, `docToMarkdown` silently drops the attribute
on save, and the published page is left-aligned. Nothing errors, so the loss is
invisible until a reader sees it.

Two options were considered.

1. **Move the legal body to the platform block model** (`lib/content/blocks.ts`),
   which is where tables and images also live. This is the right long-term
   destination, but it is a storage migration for four live pages, with no
   one-to-one mapping for `####`, blockquote or `---`, and it needs its own
   ADR and a render-and-diff migration pass.
2. **Extend the dialect with an alignment marker.** Contained, reversible,
   and does not block option 1 later.

This ADR takes option 2 to deliver the requested control now. It does not
withdraw option 1.

## Decision

Alignment is stored as a **trailing marker on a heading or paragraph**:

```
## Signed {align=center}
For and on behalf of the Company {align=right}
```

- Only `center` and `right` exist. **Left is the default and is never
  written** — there is no `{align=left}`. Every document written before this
  change therefore serialises byte-for-byte unchanged, and a document nobody
  aligns never grows a marker.
- The marker is recognised **only at the very end of a block**, and only with
  exactly those two values. `{align=center}` mid-sentence, or `{align=middle}`
  anywhere, stays literal text — consistent with the dialect's existing
  "unsupported syntax is inert" property.
- Alignment applies to headings and paragraphs only. Lists, quotes and
  dividers do not take it.

Implemented across the four stages the dialect lives in:

| Stage | File | Change |
|---|---|---|
| Parse | `lib/legal/markdown.ts` | `MdAlign`, `takeAlign()`, `alignSuffix()`; `align?` on the paragraph and heading blocks |
| Editor bridge | `lib/legal/markdown-prosemirror.ts` | `textAlign` attribute read and written in both directions |
| Editor | `components/legal/RichTextEditor.tsx` | A hand-written `legalTextAlign` global attribute and the Alignment menu |
| Public page | `components/legal/MarkdownView.tsx` | `text-center` / `text-right` on the rendered block |

The Tiptap attribute is written by hand rather than installed as
`@tiptap/extension-text-align`, honouring the standing constraint in
`markdown.ts` that this editor and renderer take no new dependencies.

**The backend is unchanged.** `MarkdownValidator` rejects HTML tags and checks
link schemes; `{align=center}` contains neither a tag nor a link, so it passes
the existing rules unmodified. No migration, no endpoint, no schema change.

## Consequences

**Good**

- The requested control works end to end: centred in the editor, centred on the
  published page, and durable across save, reload and version restore.
- Existing content is untouched, including byte-for-byte serialisation.
- No new dependency, no backend change, no database change.
- Reversible: deleting the marker from the parser degrades aligned text to
  plain text with a visible `{align=center}` suffix, rather than corrupting it.

**Bad / accepted**

- The dialect is no longer only standard Markdown. `{align=center}` is our own
  invention, and anything that reads these strings with a stock Markdown parser
  will show the marker as literal text.
- A writer who literally needs the characters `{align=center}` at the end of a
  paragraph cannot have them.
- Alignment is presentation stored in a content format, which is the thing the
  block model exists to avoid. This is a deliberate trade for delivery speed,
  and option 1 remains the destination.

**Follow-up**

- Underline, strikethrough, colour, images and tables are still **not** in the
  dialect and are still absent from the toolbar for the same reason this ADR
  exists. Strikethrough (`~~`) is the cheapest next one and needs its own ADR.
- When the legal body moves to the block model, `align` maps to an `align?`
  field on the paragraph and heading blocks, and this marker is converted and
  retired by the migration.

// req: ADR-010, ADR-109, CONST-TECH-08
