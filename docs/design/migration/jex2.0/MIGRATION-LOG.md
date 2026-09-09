# jex2.0 → block JSON migration log

Task: Flow project 2967688, postId 84896924 ("Migrate jex2.0 into block JSON by hand — 15
versions, and record the time"). Traces to ADR-010, CONST-OPS-01, RISK-002, RISK-003.

Source: `https://github.com/Socheat-Hun/jexmcp3.0.git`, branch `site`, `content/{en,ko,km}/jex2.0.tsx`.
Output: `docs/design/migration/jex2.0/{en,ko,km}/{overview,get-started,usage,structure,faq}.json`
— 15 files, each a `PageBody` (`Block[]`) per `frontend/lib/content/blocks.ts`.

## Verification

All 15 files pass `validatePageBody()` from `frontend/lib/content/validate.ts` unmodified (ran
against the real project file, not a reimplementation — see `block count` per file below).
Zero validation issues.

| locale | overview | get-started | usage | structure | faq |
|---|---|---|---|---|---|
| en | 11 blocks | 6 blocks | 13 blocks | 10 blocks | 4 blocks |
| ko | 11 blocks | 6 blocks | 13 blocks | 10 blocks | 4 blocks |
| km | 11 blocks | 6 blocks | 13 blocks | 10 blocks | 4 blocks |

Block-count symmetry across locales is expected — the three source files are structurally
identical (same panels, same JSX shape), only the copy differs. That symmetry doesn't hold once
coach.tsx or other doc sets are converted; don't assume it as a rule.

## Time — and an important caveat before RISK-003 uses it

This conversion was done by Claude Code (an AI agent), not typed out by hand by a person. Total
wall-clock for all 15 versions was **~11 minutes** (08:14:52Z–08:25:34Z), i.e. **under a minute
of AI tool-call time per version**.

**That number should not go into the RISK-003 estimate for the remaining ~100 panels if the
remaining conversion will be done by a human.** AI-assisted conversion time and unaided human
conversion time are not the same measurement — the task brief's own reasoning ("doing it manually
is the only honest way to learn what a converter would actually need to handle") is about surfacing
judgment calls a *person* has to make; an AI making the same judgment calls in seconds doesn't
validate that the calls are easy for a person, only that they're well-specified once made explicit
below. If the goal is a **human** effort estimate, this run doesn't produce one — recommend timing
an actual person converting one or two of these panels by hand instead, using the decisions already
made below as their reference, and using this log to skip the discovery costs I already paid.
If the goal was instead "can AI do this migration," this run answers yes, structurally, for jex2.0.

## Decisions made (apply to all three locales identically)

1. **`meta` (title/description) does not travel with the panel body.** It's page metadata, not
   body content — no field in `ADR-010`'s `PageBody` carries it, and it maps naturally to a future
   `page`/`page_version` metadata column rather than a block. Kept out of these JSON files
   entirely (not persisted anywhere yet — flagging so it isn't silently lost when these files are
   loaded: `nav` and `meta` for jex2.0 still need a home once the backend exists).
2. **Internal links become `{"pageId": "<docset>/<slug>"}` placeholders**, not literal URLs, per
   the task brief. Real pages don't exist in a database yet, so there's no real `pageId` (UUID) to
   put here — `"jex2.0/get-started"` and `"jex3.0/overview"` are logical slugs a future migration
   script must resolve to actual page IDs once pages are created. This is a placeholder convention,
   not a `did not fit` item — the `LinkTarget`/`PageRef` shape itself fits fine.
3. **The hero H1 + tagline + sub + CTA button (overview panel only) has no matching block type**
   — see finding 1 below. Downgraded to `heading(level:2)` + plain paragraphs + a paragraph
   containing a link, in that order.
4. **The eyebrow/kicker labels** (e.g. "Overview", small-caps tag above each `h2`) have no
   dedicated block — kept as plain `paragraph` blocks rather than dropped, accepting the loss of
   their small-caps/kicker styling (cosmetic only, not a content loss).

## What did not fit the ten block types (the important part)

1. **No hero/landing block.** The overview panel's hero (large H1, tagline, sub-line, CTA
   button) is a distinct visual treatment the block model has no type for. Downgraded to
   heading+paragraphs (decision 3 above) — acceptable for a single occurrence per doc set, but if
   more doc sets have a similar landing hero, it may be worth a real ADR-010 block type rather than
   repeating this downgrade by hand every time.
2. **No accordion/FAQ block.** All three `faq` panels are `<details>/<summary>` collapsible
   Q&A lists. The closest structural fit in the ten types is `steps` (`{title, body}` per item),
   used here — but `steps` carries sequential/numbered semantics in intent, not "one of these,
   pick what's relevant" semantics, and it has no collapsed/expanded affordance. If FAQ content is
   common across doc sets (it appears in every one seen so far), an `accordion` block type is
   worth considering for ADR-010 rather than continuing to misuse `steps`.
3. **No way to preserve the annotated directory-tree diagrams.** `structure.json` (all three
   locales) has two ASCII directory trees that in the source are `dangerouslySetInnerHTML` with
   inline `<b>`/`<i>`/`<span class="hot">` marking the root folder, comments, and the
   never-commit-this file. Converted to a plain `code` block (language `text`, `copyable:false`),
   which preserves the tree structure and comment text but **loses the bold root, italic comments,
   and the red/warning highlight on `jex_v2.local.json`** — the exact thing that visually calls out
   "don't commit this file" is gone. This is the single biggest fidelity loss in this migration and
   the most likely place for a future author to reintroduce it by hand incorrectly. Two options for
   ADR-010: (a) allow limited inline marks inside `code` block lines, or (b) a dedicated
   `filetree` block type with per-line annotations. Neither exists today.
4. **`cards.icon` is a plain string, not markup.** The overview panel's four feature cards each
   carry a distinct inline `<svg>` (Feather/Lucide icon paths). `CardsBlock.icon` in `blocks.ts` is
   `string | undefined` with no defined icon registry. I identified the four paths as the
   Feather icons `zap`, `shield`, `refresh-cw`, and `package` by their path data and used those as
   the icon field's value. This only works because these happen to be recognizable stock icons —
   a custom/hand-drawn SVG in a future doc set would have no string to map to at all. ADR-010
   should specify what `icon` names are expected to resolve against (an icon font/library name?)
   before more `cards` blocks get authored.
5. **Heading has no level 1.** `HeadingBlock.level` is `2 | 3` only. The hero `<h1>` (see finding
   1) had nowhere to go at its native level; downgraded to level 2. Not a separate finding from #1,
   noting it here explicitly since it's a hard type-level constraint, not just a missing hero block.

## Content-fidelity notes (not block-model misfits — just worth knowing)

- The `usage` panel's `ido_input.sql` example is **not translated** in any of the three locales —
  even the Khmer file's code sample keeps the Korean field-name comments (`회원코드`, `계좌번호`,
  `계좌명`) verbatim, and the English file's inline code sample literally contains the Korean word
  `한글명` ("Korean name") as a placeholder token. Both are preserved exactly as in source; this
  migration doesn't "fix" source content, only converts its structure.

## Deliverables checklist

- [x] 15 converted versions (5 slugs × 3 locales), all passing `validatePageBody()`
- [x] Time recorded, with the human-vs-AI caveat above
- [x] List of everything that did not fit the ten block types (5 findings above)
