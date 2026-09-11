# ADR-015: Public Landing Page — Content Adopted from jexmcp

> **Status**: PROPOSED
> **Date**: 2026-09-10
> **Author**: `claude` (drafted per explicit PM direction)
> **Approver**: PM (pending)
> **Related ADR**: ADR-001 (tech stack / product scope), ADR-010 (content model), ADR-012 (backend stack revision)

---

## 1. Context

Coc Docs Platform has no public page today. `frontend/app/page.tsx` is a single unconditional redirect to `/login`:

```tsx
export default function Home() {
  redirect("/login");
}
```

Every route in the app (`/login`, `/register`, `/overview`) is either the auth gate itself or behind it. ADR-001's Context frames the whole product as an internal tool — *"Coc Docs Platform moves documentation content... into a database behind an admin console operated by non-technical editors"* — with no mention of a public-facing surface, and REQUIREMENTS-SPEC.md's scope has no requirement for one. The absence of a landing page is not an oversight; it is simply outside what has been specified so far.

**PM decision, 2026-09-10**: add a public landing page, and populate it with **jexmcp's real content** — hero copy, the "Your whole JEX workflow" section, its 4 feature cards, its nav structure, its footer — sourced from `D:\AX Quality Development Dept\Small Service` (jexmcp's real, live Next.js site; confirmed via direct inspection of `content/en/jex3.0.tsx` and `components/Sidebar.tsx`, not assumed). `D:\AX Quality Development Dept\Coc Docs Platform\jexmcp3.0` was also inspected and confirmed to be the Claude Code **plugin package** (`.claude-plugin/`, `commands/`, `hooks/`, `installers/` — no web app, no landing page) — it is not, and must not be treated as, a source for this work.

A prior pass additionally restyled the admin dashboard's colors, backgrounds, and sidebar to match jexmcp's visual design tokens. That restyle was reverted before this ADR was drafted (Phase 0 of this task) — it is explicitly **out of scope** here. This decision is content/data only.

## 2. Decision

> Coc Docs Platform adds one new public route — a landing page — populated with jexmcp's real marketing content (copy, nav item list, feature-card text, structure), sourced from `Small Service`. The page is styled entirely with Coc Docs Platform's own existing design system (colors, typography, spacing, card/button shapes) established in `frontend/app/globals.css` and its component library. Nothing about jexmcp's visual identity, product name, backend, plugin logic, or auth model is adopted.

### Key Choices
- **New route, not a replacement.** `/` currently redirects to `/login`; that redirect either moves to a more specific path (e.g. `/login` stays reachable directly) or is replaced by the new landing page, with sign-in still reachable from it. The existing `/login`, `/register`, `/overview` routes, their logic, and their data are untouched.
- **Content is ported, not paraphrased.** Structure and copy come from `Small Service`'s `content/*.tsx` (or equivalent) verbatim, adapted only to Next.js/React conventions already used in this codebase.
- **Product name stays "Coc Docs Platform."** jexmcp's wordmark, plugin name, and self-referential copy are not adopted as-is; anywhere jexmcp's copy names itself or its own functionality, that line is flagged for a real decision (see §4.2) rather than silently ported or silently rewritten.
- **Visual system is Coc Docs Platform's own**, as restored in Phase 0 of this task — no jexmcp color tokens, fonts, or component shapes.
- **No backend, plugin, or auth scope.** jexmcp's MCP server, Claude Code plugin commands, JexStudio integration, Flow integration, and its own auth model are explicitly out of scope — this ADR concerns one static/marketing page's text and structure only.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | Port jexmcp's content onto a new route, Coc Docs Platform's own visual styling | Gives the product the public page the PM wants; keeps Coc Docs Platform's own identity, data model, and existing functionality intact | Content still references jexmcp-specific functionality in places (WSVC, IDO, MCP tools) that don't exist in Coc Docs Platform — requires editorial follow-up | Adopted |
| B | Port jexmcp's content *and* visual design (the identity-merge task attempted, then reversed, earlier in this session) | Maximal fidelity to jexmcp as a reference | Discards Coc Docs Platform's own established design system for no product reason yet articulated; conflates two unrelated products' visual identities | Not adopted — explicitly reversed (Phase 0) |
| C | Write original landing-page copy for Coc Docs Platform instead of porting jexmcp's | Content would actually describe this product's real functionality | Not what was decided — PM explicitly directed jexmcp's real content as the source | Not adopted (this time) |

## 4. Consequences

### 4.1 Positive Impacts
- Coc Docs Platform gains a public entry point where none existed.
- Reuses real, already-written, already-designed-for-scanning marketing copy rather than starting from a blank page.
- Cleanly separated from the earlier (reverted) visual-identity attempt — this decision doesn't repeat that scope creep.

### 4.2 Negative Impacts / Costs to Accept
- **jexmcp's copy describes jexmcp's own functionality**, not Coc Docs Platform's. Lines referencing WSVC/IDO scaffolding, the jex MCP server, SVN guard hooks, JexStudio, or Claude Code plugin mechanics do not describe anything Coc Docs Platform does. Per this ADR's scope, such lines are **flagged for PM decision during Phase 2**, not silently ported (misleading) or silently rewritten (no longer "jexmcp's real content" as instructed). Expect the finished page to need real editorial follow-up before it's presentable to an actual audience.
- **A public, unauthenticated route is new attack surface** that ADR-011's security model was not written against (everything else in the app assumes an authenticated session). Because this page is static/informational with no data fetching, no forms, and no access to protected data, it does not appear to weaken ADR-011's guarantees — but ADR-011 and the threat model should be given a follow-up read once the page exists, not assumed safe by this ADR alone.
- **Product identity dissonance risk**: a Coc Docs Platform page whose structure and voice are recognizably jexmcp's could confuse anyone who's seen both products. Accepted as a known cost of the PM's explicit direction, not overlooked.

### 4.3 Follow-up Work
- [ ] Phase 2 implementation: build the route, port structure/copy, flag jexmcp-functionality-specific lines individually for PM decision (rewrite vs. remove vs. keep-and-explain).
- [ ] PM resolves each flagged line before the page is considered content-complete.
- [ ] Someone (security-auditor or architect) confirms the new public route doesn't require an ADR-011 revision.
- [ ] Decide root-route behavior: does `/` become the landing page (moving today's `/login` redirect elsewhere), or does the landing page live at its own path with `/` unchanged? Not yet decided — flagged for Phase 2 kickoff.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| No jexmcp-functionality-specific copy ships unflagged | Manual read-through of ported content against `Small Service` source, diffed against the flagged-lines list in the Phase 2 report | Once, at Phase 2 completion | 100% of functionality-specific lines flagged or resolved |
| Visual system stays Coc Docs Platform's own | Diff new page's classNames/tokens against `frontend/app/globals.css`; zero jexmcp token values (`#0071e3`, etc.) present | Once, at Phase 2 completion | 0 jexmcp-sourced color/token values in the new page |
| Existing functionality unaffected | `npm run typecheck && npm run lint && npm run test` | Once, at Phase 2 completion | All pass, same as before this ADR |

## 6. References

- Related code: `frontend/app/page.tsx` (current root redirect), `frontend/app/globals.css` (Coc Docs Platform's own design tokens, restored Phase 0 of this task)
- Source of content: `D:\AX Quality Development Dept\Small Service\content\en\jex3.0.tsx`, `components/Sidebar.tsx` (jexmcp's real site — read-only reference, not modified)
- Confirmed non-source: `D:\AX Quality Development Dept\Coc Docs Platform\jexmcp3.0` (the Claude Code plugin package — no landing page exists in it)
- Related ADR: ADR-001 (original product scope — internal tool, no public page specified), ADR-010 (content/block model — unaffected; this page is static, not CMS-authored content), ADR-012 (backend stack — unaffected, no backend involvement)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-10 | 1.0 | Initial draft, per PM direction to add a jexmcp-content-sourced public landing page while keeping Coc Docs Platform's own visual identity and data model | `claude` |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| | PM | | PENDING |
