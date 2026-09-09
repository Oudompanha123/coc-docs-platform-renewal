# ADR-010: Content Model and Block Vocabulary

## Status
**ACCEPTED** — 2026-09-08

- Deciders: `architect` (lead), `data-model-designer`, PM
- Related: ADR-001 (BlockNote), ADR-003 (persistence)

> This is the **most consequential decision in the project**. It determines whether NFR-USE-01 can be met, and it dominates the cost of migrating 105 panels.

### Reversibility

**This is the least reversible decision on the project**, and it is coupled to the editor choice in [ADR-001 §7](ADR-001-tech-stack.md).

Once the 105 panels are stored in this block format, changing the model — or changing the editor, since BlockNote's block JSON is the canonical form — means migrating all of them a **second** time. ADR-001 §7 records the same point from the editor side: the database choice there is comparatively cheap to revisit, the editor decision is not.

That is why §Validation below makes the pilot a genuine go/no-go rather than a formality: the cost of discovering this ADR is wrong rises from *two doc sets* to *a hundred panels* the moment mass migration starts.

---

## Context

Today a page body is a compiled React element tree:

```ts
// content/types.ts:14-59
export type Content = {
  ui:     { nav: NavStrings; chat: ChatStrings; copy: {...}; footerHtml: string };
  meta:   Record<Slug, { title: string; description: string }>;
  panels: Record<Slug, ReactNode>;      // <-- an arbitrary React element tree
};
```

A database column cannot hold a `ReactNode`. Content must be re-expressed as **data**.

### What is actually in the content

Measured across `content/{en,km,ko}/*.tsx` — ~14,000 lines, 105 panels:

| Feature | Count | Migration implication |
|---|---:|---|
| Distinct CSS-class block structures | **32** | A hand-rolled block vocabulary already exists, expressed as markup + classes rather than as a typed model |
| Copyable code blocks (`pre.copyable`) | **183** | Carries behaviour, not just formatting — must survive as a distinct type |
| Real `<table>` elements | **81** | Needs a genuine table block, not a rich-text approximation |
| Images | **0** | Nothing to migrate; but new content will have them (FR-MEDIA-001) |
| In-page anchors (`id=`) | **0** | No sub-page deep links to preserve |
| Files using `dangerouslySetInnerHTML` | **15 of 15** | `.tree` diagrams, code blocks, `footerHtml` — raw, unescaped, hand-authored |
| Live React components inside content | `HarnessDemo`, `OwnerTree` | Not content at all — embedded applications |
| Data-bound rendering | `idea.tsx` maps over `ideaData.ts` | Content generated from shared, language-neutral data |

### Constraints

- **CONST-TECH-03** — block schema, not MDX. MDX is code; a non-technical editor facing JSX and imports is blocked exactly as today.
- **CONST-TECH-04** — vocabulary limited to 8–10 types, reduced from 32.
- **NFR-USE-01** — a non-technical colleague must edit and publish unaided.
- **CONST-RES-01** — one part-time developer. Every block type costs an editing UI *and* a renderer.

---

## Decision

### 1. A page body is an ordered array of typed blocks

```ts
type PageBody = Block[];

type Block =
  | { type: 'heading';   level: 2 | 3; text: RichText }
  | { type: 'paragraph'; text: RichText }
  | { type: 'list';      ordered: boolean; items: RichText[] }
  | { type: 'table';     headers: RichText[]; rows: RichText[][] }
  | { type: 'code';      language: string; source: string; copyable: boolean; command?: string }
  | { type: 'callout';   variant: 'note' | 'important'; body: Block[] }
  | { type: 'steps';     items: { title: RichText; body: Block[] }[] }
  | { type: 'cards';     items: { icon?: string; title: RichText; body: RichText; link?: LinkTarget }[] }
  | { type: 'image';     assetId: string; alt: string; caption?: RichText }
  | { type: 'embed';     component: 'HarnessDemo' | 'OwnerTree'; props: Record<string, unknown> };
```

**Ten block types.** `RichText` is an inline model supporting bold, emphasis, inline code, and links.

A link is a `LinkTarget`, which is exactly one of two shapes — never both:

```ts
type LinkTarget = PageRef | ExternalRef;

type PageRef     = { pageId: string; href?: never };   // internal — a page reference
type ExternalRef = { pageId?: never; href: string };   // external — a validated URL
```

- **Internal links are stored as `pageId`, never as a literal URL.** Renaming a slug therefore cannot break an internal link, and finding references to a deleted page is a foreign-key lookup rather than a text search (FR-READ-003, FR-CONT-007).
- **External links are stored as `href`**, and are validated at persistence time: only a same-site relative path (`/…`, not `//…`) or an absolute `http:` / `https:` URL is accepted. `javascript:`, `data:`, `vbscript:` and every other scheme are rejected before the value is written, rather than being escaped at render time (NFR-SEC-SANITIZE).

The validator enforces that exactly one of `pageId` or `href` is present; supplying both, or neither, is a validation error.

### 2. The 32 → 10 mapping

| AS-IS structures | Becomes |
|---|---|
| `hero`, `eyebrow`, `lede` | `heading` + `paragraph` — visual treatment moves to CSS keyed on position, not to distinct block types |
| `grid`, `card reveal`, `card` | `cards` |
| `steps`, `step` | `steps` |
| `callout`, `callout important` | `callout` with a `variant` |
| `tbl-scroll`, `<table>` | `table` — horizontal scrolling is a rendering concern, not a content one |
| `pre.copyable` (+ `data-cmd`) | `code` with `copyable: true` and optional `command` |
| `faq details` | `steps` (collapsed variant) or `heading`+`paragraph` pairs |
| `timeline`, `release` | `steps` |
| `badge-gate`, misc decorative | dropped — re-authored as `callout` or plain text |
| `.tree` ASCII diagrams | `code` with `language: 'text'` — **see Consequences** |

### 3. Raw HTML is not a block type

There is no `html` block. `dangerouslySetInnerHTML` does not survive the migration.

This is deliberate and is the single most important safety decision in the model. Today raw HTML is tolerable because one trusted person authors it for an authenticated audience. Both halves of that assumption end: authors become several non-technical people, and readers become public in phase 2. A raw-HTML block would hand every `admin` a stored-XSS primitive (NFR-SEC-SANITIZE, RISK-005).

The `.tree` box-drawing diagrams — the main legitimate use — become `code` blocks with monospace rendering, which is what they always were visually.

### 4. Embedded components are referenced, never authored

The `embed` block names a component from a **closed server-side registry** and passes props. An editor can place `HarnessDemo` on a page; an editor cannot define, modify, or add a component. Adding one is a developer task and a code change.

This keeps Tier B content working without turning the CMS into an arbitrary code-execution surface.

### 5. Shared data stays shared

`ideaData.ts` (`PROJECTS`, `VM`) remains a code-resident, language-neutral module surfaced through an `embed`-style block. It is **not** copied into three language rows — that would triplicate the data and invite drift.

---

## Alternatives Considered

| Option | Score | Why not |
|---|---|---|
| **MDX stored in the database** | Rejected | Excluded by CONST-TECH-03. Preserves every existing page perfectly and would make migration nearly mechanical — genuinely the cheapest migration. But the editor becomes a code editor, so NFR-USE-01 fails and the project's purpose is defeated. **The cheapest migration is the wrong migration here.** |
| **Keep all 32 block types** | Rejected | Preserves the current look exactly. Costs 32 editing UIs and 32 renderers — realistically the largest single piece of work in the project, against one part-time developer. Rejected on CONST-RES-01. |
| **Tiered blocks: 10 rich + a raw-HTML escape hatch** | Rejected | Was on the table and is superficially attractive — preserves the look without building 32 editors. Rejected because the escape hatch reintroduces exactly the XSS surface §3 removes, and in practice becomes the path of least resistance for any awkward page, quietly recreating the 32-type problem inside an unsanitised field. |
| **HTML-as-canonical (store sanitised HTML)** | Rejected | Simple and flexible, but unstructured: no way to enforce a table is a table, no reliable transformation, and sanitisation becomes the only line of defence rather than one of several. |
| **Portable Text / Slate JSON** | Considered | Sound models, but choosing BlockNote (ADR-001) makes its native block JSON the pragmatic canonical form. Revisit only if the editor decision is reversed. |

---

## Consequences

### Positive
- Content becomes queryable data — impossible today.
- Sanitisation is structural, not merely filtered: there is no field in which raw markup is legal.
- A small vocabulary is a small build, which is what CONST-RES-01 demands.
- Translations become comparable at block level, which makes the staleness signal (FR-I18N-002) meaningful rather than a whole-page flag.

### Negative — stated plainly
- **Some pages will not look as they do today.** `hero`, `eyebrow`, `badge-gate` and other decorative treatments are collapsed. This was accepted at the Q-block-vocabulary decision, and it is the price of a buildable editor.
- **The `.tree` diagrams degrade.** Rendering them as monospace `code` is honest but loses any styling `.tree` carried. If they matter visually, a dedicated `diagram` block is the first candidate for an 11th type — measure during the pilot before deciding.
- **Migration is not fully automatable.** JSX with interleaved expressions, template-literal hrefs and `.map()` calls cannot be mechanically converted with confidence. Expect a converter that handles the common cases plus **manual review of every one of the 105 panels**. This is the dominant cost in the plan and is scheduled as such.
- **`footerHtml` and the `mailBody` `{user}` placeholder** are templates with variables, not prose. They stay in code as configuration, not content.
- Committing to BlockNote's block JSON means an editor change later implies a second content migration (ADR-001 §7).

### Risks raised
- RISK-002 (visual regression from vocabulary reduction) — H/M
- RISK-003 (automated conversion infeasible, manual re-authoring) — H/M
- RISK-012 (Tier B boundary shifts — more panels embed components than the three identified) — M/M

---

## Validation

The pilot decides whether this model is right, before it becomes expensive:

1. Migrate **`jex2.0`** (5 slugs, 534 lines en) into these 10 blocks.
2. Then attempt the **hardest** content — `coach.tsx`, 1,707 lines — because that is where a block model breaks, not the easy pages.
3. If either cannot be expressed without adding block types or an escape hatch, **this ADR is wrong** and must be revised before the remaining panels are touched.

Exit criterion: both sets render acceptably and a non-technical editor can modify them (NFR-USE-01 dry run).

---

## References

- Requirements: CONST-TECH-03, CONST-TECH-04, CONST-RES-01, FR-CONT-002/009/010/011, FR-MEDIA-002, FR-I18N-002, NFR-USE-01, NFR-SEC-SANITIZE, NFR-EXT-01
- AS-IS: `content/types.ts:14-59`, `content/ideaData.ts:16-34`, `content/{en,km,ko}/workflow.tsx:3-4`
- `docs/planning/questions-log.md#Q-block-vocabulary`
