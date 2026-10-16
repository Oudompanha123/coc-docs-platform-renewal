# ADR-114: Text colour in the legal Markdown dialect

- **Status:** Proposed
- **Date:** 2026-10-14
- **Supersedes:** none
- **Amends:** ADR-113 (alignment in the dialect), ADR-010 §3 (content model), ADR-104 decision 2 (colour vocabulary)

## Context

The product owner asked for the reference toolbar's colour control (the "A"
with a coloured bar) in the legal pages editor, and for every control to sit
on the bar rather than inside a menu.

Colour has the same problem alignment had in ADR-113: the dialect has no inline
token for it, so a colour button without format work would show colour while
editing and publish plain text, silently.

Two shapes were available for the value itself:

1. **A colour picker storing hex.** Matches the reference most literally, and
   is what most editors do.
2. **A fixed set of named tones**, resolved through the theme's tokens.

Option 1 fails this product in two concrete ways. A legal page renders in both
light and dark (`data-theme="dark"` on the admin shell), and a hex chosen
against white will fail contrast on the dark ground with nothing to catch it.
And a hex value cannot be restyled later: changing the product's red means
finding every literal in every published legal page.

## Decision

Text colour is stored as a **bracketed inline span with a named tone**:

```
[Do not share your password]{color=critical}
```

- Exactly four tones exist: `muted`, `positive`, `caution`, `critical`.
  **Default is the absence of the marker** — there is no `{color=default}`, so
  uncoloured text serialises unchanged, as with alignment.
- Any other value is not a tone. `{color=neon}` stays literal text, the same
  inert-not-dangerous property the dialect already has.
- Colour carries status, never decoration, which is ADR-104 decision 2 applied
  to content rather than chrome. The editor offers swatches with names, and
  there is **no hex field and no picker**.
- **Colour composes with the other marks** (amended 2026-10-16, see below).
  Around bold or italic it is the outer bracket; on a link it is a suffix
  after the target:

  ```
  [**Do not share your password**]{color=critical}
  [write to us](mailto:legal@example.com){color=critical}
  ```

  Bold and italic still do not nest in each other, and colour does not nest in
  colour — a colour span's text holds no `]`, so the inner marker is simply
  not reachable.

Two theme tokens were missing and are added in `app/globals.css` beside
`--color-danger`: `--color-success` and `--color-caution`, each with a
dark-shell lift matching how `text-danger` is already handled. No new scale,
no new palette.

Implemented across the same four stages as ADR-113:

| Stage | File | Change |
|---|---|---|
| Parse | `lib/legal/markdown.ts` | `MD_COLORS`, `MdColor`, `color?` on `MdSpan`, a fourth alternative in the inline pattern, and an optional colour suffix on the link alternative |
| Editor bridge | `lib/legal/markdown-prosemirror.ts` | `textColor` mark both directions; colour joins the run-merge key |
| Editor | `components/legal/RichTextEditor.tsx` | A hand-written `textColor` mark and the swatch control |
| Public page | `components/legal/MarkdownView.tsx` | Tone → theme token class |

**The backend is unchanged.** `MarkdownValidator` rejects HTML tags and checks
link schemes; `[text]{color=critical}` is neither a tag nor a link. No
migration, no endpoint, no schema change.

### Toolbar layout

Recorded here because it was decided at the same time: every control sits on
the bar — marks, colour, link, the three heading levels, the three alignments,
both lists, quote and divider. Nothing is behind a menu. Clicking a pressed
heading returns the block to plain text, so "Text" needs no button of its own.

### Amendment, 2026-10-16 — colour composes

As first written this ADR said colour "does not nest with other marks", and
the implementation honoured that by precedence: a run that had both a link and
a tone serialised as the link alone, and a run that had both bold and a tone
serialised as the tone alone. Both are the silent-drop failure this ADR exists
to prevent — the editor showed the colour (and the bold), save wrote neither,
and the writer learned about it from the published page. It was reported
against a coloured mailto link the day after the feature landed: the trailing
full stop outside the link kept its colour, the link did not.

Precedence is not available as a fix, because there is no order of these marks
that is not someone's data loss. So the dialect carries both. A document
written before this amendment still parses and serialises unchanged — the new
forms are additions, and uncoloured text is still the absence of a marker.

A corollary, since the tone now reaches a link: the rendered `<a>` wears the
tone class itself. The anchor's own `text-foreground` beats a colour inherited
from a wrapping span, so wrapping the link would have stored the tone and
published it invisibly — the same bug one layer further down.

## Consequences

**Good**

- The control works end to end and survives save, reload, restore and publish.
- Colour stays legible in both themes, and the product can restyle a tone in
  one place forever.
- Existing content is untouched and still serialises byte-for-byte.
- No new dependency, no backend change, no database change.

**Bad / accepted**

- A writer cannot have an arbitrary colour. This is deliberate, and it will
  read as a limitation to anyone comparing against the reference editor.
- The dialect drifts further from standard Markdown: `{align=…}` and now
  `{color=…}` are both ours. A stock Markdown reader shows both as literal text.
- Text that literally ends in `[word]{color=critical}`, or in
  `](href){color=critical}`, cannot be written.
- Colour in a content format is presentation, which the block model exists to
  avoid. Same trade as ADR-113, same destination.

**Follow-up**

- Underline, strikethrough, images and tables remain outside the dialect.
- A pre-publish check should flag colour used as decoration (a whole clause in
  `positive`, for instance) — colour that means nothing is worse than none.
- When the legal body moves to the block model, tones map to a `tone` on the
  inline node and this marker is converted and retired.

// req: ADR-010, ADR-104, ADR-109, ADR-113
