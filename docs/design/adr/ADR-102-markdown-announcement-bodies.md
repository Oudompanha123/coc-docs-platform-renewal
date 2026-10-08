# ADR-102: Announcement Bodies Are Markdown, Rendered Without HTML

> **Status**: ACCEPTED — implemented (in-session instruction)
> **Date**: 2026-10-08
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction: *"For New Announcement, I want to add a text editor for the announcement content. Please make it support rich Markdown editing, with a toolbar for common formatting such as bold, italic, headings, lists, links, code blocks, and quotes, and include a preview option."*, extended in the same session: *"Now please allow users to add text colors in the editor."* Recorded here as a transcription of that instruction, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Revises ADR-098 decision 7 ("the body renders as plain text … never as HTML"). Follows ADR-010's structural XSS rule (no raw-HTML block type).

---

## 1. Context

ADR-098 stored an announcement body as plain text and showed it in a `whitespace-pre-wrap` block. Admins could break lines but could not format, so headings, lists and links could not be written. The request is a Markdown editor with a toolbar and a preview.

The risk is the usual one with user-written formatting: as soon as text becomes markup, it can carry script. Every member sees these bodies, so an XSS here would reach the whole user base.

## 2. Decision

1. **Storage is unchanged.** The body is still text (≤5000 characters, `V69`), and the text is now Markdown source. There is no migration. Every existing body is valid Markdown, and its line breaks still render as line breaks. The backend does not parse or validate Markdown.
2. **Rendering never produces HTML.** `lib/markdown/parse.ts` parses a fixed subset of Markdown into a typed tree: headings, paragraphs, bold, italic, inline code, fenced code blocks, bullet and numbered lists, quotes, rules and links. `components/markdown/MarkdownContent.tsx` maps that tree to React elements, and all text goes in as React children. There is no `dangerouslySetInnerHTML`, no HTML pass-through and no sanitiser. `<script>` in a body is shown as the characters `<script>`. This is the same structural argument as ADR-010.
3. **Links are allow-listed.** Only `http:`, `https:`, `mailto:` and site paths (`/…`, not `//…`) become links. Anything else (`javascript:`, `data:`, `vbscript:` or unknown schemes) keeps its text and loses the link. External links open with `target="_blank" rel="noopener noreferrer"`.
3a. **Text colour is a named palette, not CSS.** Markdown has no colour syntax, so one extension is added: `[text]{color=name}`. The name must be one of six (`red`, `orange`, `green`, `blue`, `purple`, `gray`). The renderer looks up a fixed Tailwind class for it, so no colour value, style attribute or CSS from the text ever reaches the page. Only `[a-z]+` names are matched. An unknown name keeps its text and loses the colour, the same rule as an unsafe link. A fixed palette also keeps announcements readable and on brand: there is no light-grey-on-white or neon text.
4. **No new dependency.** A Markdown library would bring HTML support that would have to be switched off and kept off. A subset parser of about 200 lines, with its own tests, is smaller than that guarantee would be to audit.
5. **Editor** (`components/markdown/MarkdownEditor.tsx`): still a textarea, so what is saved is exactly what is typed and the character count stays honest. A toolbar (bold, italic, text colour, H1–H3, bulleted list, numbered list, link, code block, quote) and Ctrl/⌘ + B, I and K insert Markdown around the selection, using the pure functions in `lib/markdown/editing.ts`. A Write/Preview tab pair renders through the same `MarkdownContent` readers see. An edit that would pass the length limit does nothing rather than truncate. The text-colour button opens a swatch menu with a "Default color" entry. Picking a colour for text that already has one recolours it rather than nesting spans.
6. **Where it shows:** the reader dialog (`AnnouncementModal`) renders the Markdown. The admin list's two-line excerpt and its search use `markdownToPlainText`, so they show and match words rather than markers. Bell rows and push banners carry only the title or a fixed sentence (ADR-098), so they are unaffected.

## 3. Consequences

- Admins can format announcements, and readers see headings, lists and links.
- `[text]{color=…}` is this product's own syntax. Another Markdown renderer would show it as literal text, which still reads acceptably.
- The parser is a subset. Tables, images, nested lists and raw HTML are not supported; unsupported syntax shows as typed text. Adding a construct means adding a node type and its renderer, never an HTML escape hatch.
- Toolbar edits replace the textarea's value through React state, so the browser's native undo does not step back through them. Typed text undoes as normal.
- Covered by `lib/markdown/parse.test.ts` (including the link allow-list and literal HTML), `lib/markdown/editing.test.ts`, `components/markdown/MarkdownEditor.test.tsx` and `components/announcements/AnnouncementModal.test.tsx`.
