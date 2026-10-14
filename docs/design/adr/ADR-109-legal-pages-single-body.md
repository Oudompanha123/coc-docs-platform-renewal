# ADR-109: Legal pages are one Markdown body; sections are its `##` headings

> **Status**: PROPOSED — implemented on `feat/shadcn-ui-migration`, awaiting PM approval
> **Date**: 2026-10-14
> **Author**: AI (Claude Opus 5.5), at the product owner's request
> **Approver**: PM
> **Related ADR**: ADR-010 (content model fit check), ADR-012 §3 (two-tier validation), ADR-104 r2.13 (the editor UI)

---

## 1. Context

The two legal pages had grown two different content shapes and two editors:

- **Terms of Service** (V74): title, subtitle, a `draft`/`approved` status flag, an ordered `sections[]` list (id, title, Markdown body), an end note and a byline. Edited through an outline and an accordion, one card per section.
- **Privacy Policy** (V72/V73, restored by V75): title, lead, eyebrow, exactly three icon "highlight" cards, a plain-language box, `sections[]` with an icon each, and a CTA box.

The product owner's request, 2026-10-14: *"Legal pages just one text editor, should not [have] section[s], because the user can do sections in the text editor."* Asked which pages, they chose **both**, accepting that Privacy loses its highlight cards, plain-language box and CTA.

The editors also had logic faults (ADR-104 r2.13): publishing with unsaved edits published the *last saved* draft and then reloaded over the screen; a save conflict reloaded immediately and discarded the editor's text; the status badge always read "draft", because the editor only ever holds the draft row.

## 2. Decision

> Both slugs store one shape — `{ title, subtitle, lastUpdated, updatedBy, body }` — where `body` is Markdown in the existing whitelisted dialect, extended with `##` headings. A `##` heading starts a section; the public page builds its contents list and anchors from them (`markdownOutline`). One validator (Java `LegalDocumentValidator`, authoritative; `legal-document-validate.ts`, advisory) and one editor (`LegalPageEditor`) serve both pages.

### Key choices
- **The dialect gains `##` only.** `MarkdownValidator` never parsed heading levels (it checks length, raw HTML and link schemes), so the backend whitelist is unchanged; `markdown.ts` now parses levels 2–4 and `MarkdownView` gives each `<h2>` a stable anchor id.
- **`V81__legal_pages_single_body.sql` transforms rows in place**, archived versions included, so History can still preview and restore them. Nothing is dropped silently: plain-language → a quote, highlights → a bullet list, sections → `## title` + body, CTA → a closing section, end note → after a `---` rule, Privacy's `lead` → `subtitle`. Unlike V71–V75 it does not reseed: editors have saved real content since.
- **The `draft`/`approved` "sample text" flag is retired.** Whether a page is live is the publish state, shown in the editor's toolbar ("Live" / "Changes not live" / "Not published yet").
- **A public `/terms` route is restored**, rendering the same `LegalDocument` as `/privacy`; the editor's "View live" pointed at a page that no longer existed.
- Body limit 120,000 characters (what 30 × 4,000-character sections allowed).

### Amendment, same day — a visual editor
The product owner asked for typing and preview to look the same ("like Word / Google Docs"), and for no contents box on the page. The body is now edited in **Tiptap** (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, all pinned at 3.31.3 — released 2026-09-04, ≥2 weeks old; 3.31.4 was exactly two weeks old and skipped for margin), limited to what the dialect holds (H2/H3/H4, bold, italic, two-level lists, quote, divider, whitelisted links). **Storage is unchanged**: `markdown-prosemirror.ts` converts Markdown ⇄ the editor's document through our own parser, never through HTML, so the backend, its validator and the public pages are untouched. The plain-text `MarkdownEditor` and `markdown-editing.ts` are removed. The public page no longer shows an "On this page" box; `##` headings keep their anchor ids. Cost: /legal-pages' first-load JS grows from 192 kB to 323 kB (the editor loads only on that admin route).

## 3. Considered Alternatives

| Option | Why not |
|---|---|
| Terms only; Privacy keeps its cards/CTA | Two shapes, two validators and two editors to keep forever; the product owner chose both pages |
| Both get one body, Privacy keeps cards/CTA above it | Still two shapes; the cards duplicate what a list in the body does |
| Keep `sections[]` storage, edit it as one text and split on save | Two representations of one thing; splitting rules (text before the first heading, duplicate titles) become hidden behaviour |

## 4. Consequences

### 4.1 Positive
- One shape, one validator, one editor, one renderer — the preview is exactly what readers see.
- Editors write sections the way they write everything else; reordering is cut and paste.

### 4.2 Negative / costs accepted
- Privacy's highlight cards, plain-language box and CTA lose their dedicated styling; their text survives as Markdown in the body.
- Per-section icons (Privacy) are gone.
- A page's structure is only as good as its headings: a body with no `##` has no contents list.

### 4.3 Follow-up
- Run the backend integration suite (`mvn verify`, needs Docker) against V81 before merging.
- Review the converted Privacy body on a real database and tidy wording where a card became a bullet.

## 5. Verification
- `LegalDocumentValidatorTest`, `MarkdownValidatorTest` (unit, pass).
- `LegalPageServiceIntegrationTest` updated to the new shape — **not yet run** (no Docker in the authoring environment).
- Frontend: `legal-document-validate.test.ts`, `markdown.test.ts` (outline + `##`), `LegalDocument.test.tsx`, `LegalPageEditor.test.tsx`, `PublicLegalPage.test.tsx`.

## 6. References
- `backend/src/main/resources/db/migration/V81__legal_pages_single_body.sql`
- `frontend/components/legal/LegalPageEditor.tsx`, `useLegalEditor.ts`, `LegalEditorChrome.tsx`, `LegalDocument.tsx`

---

**Approval**

| Date | Approver | Comments | Status |
|---|---|---|---|
| | | | **PENDING** |
