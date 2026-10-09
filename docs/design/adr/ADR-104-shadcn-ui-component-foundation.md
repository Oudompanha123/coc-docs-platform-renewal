# ADR-104: shadcn/ui as the Frontend Component Foundation

> **Status**: PROPOSED — not implemented, not approved
> **Date**: 2026-10-09
> **Author**: AI (Claude Opus 5), on direct in-session instruction
> **Requester**: the user (product owner), in-session: *"Please create new branch for upgrad UI to shadcnuikit"* / *"draft ADR-104 for upgrade in whole of project (full project)"*. Recorded as a transcription of that instruction. **Approval is a human's and has not been given** (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Supersedes the **BlockNote / Mantine** element of ADR-001 §stack (already dead in practice — see §1.2). Touches no backend decision. Constrained by `CONST-TECH-05` (frontend is presentation only) and `CONST-TECH-07` (no authorisation or authoritative validation moves into a component).
> **Branch**: `feat/shadcn-ui-migration`

---

## 1. Context

### 1.1 What the frontend is today

Measured on `dev` at `2554da5`, 2026-10-09:

| | |
|---|---|
| Component files (`components/**/*.tsx`, excluding tests) | **174** |
| Of the raw `<button>` sites, how many are actually buttons | **roughly half** — see §1.5 |
| Component test files | **87** |
| Routes (`app/**/page.tsx`) | **37** |
| Modal components | **16** |
| Files containing a hand-rolled `role="dialog"` | **8** |
| Files containing a raw `<button>` | **97** |
| Hand-drawn SVG icons in `components/layout/icons.tsx` | **53** |
| `app/globals.css` | **1453 lines** |
| CSS modules / styled-jsx | **0** |
| Shared UI primitive layer (`components/ui/`) | **does not exist** |

Styling is Tailwind 4 throughout, with design tokens declared in `@theme` blocks in `globals.css` (`--color-ink`, `--color-border`, `--color-page`, `--color-dash-ink`, `--color-sidebar*`, `--color-danger`, `--color-brand-purple`, `--color-brand-blue`). Theme switching is an attribute, not a library: `lib/theme.ts` writes `data-theme="light|dark"` on `<html>` and persists it in `localStorage`, with an `@media (prefers-color-scheme: dark)` fallback for `system`. Three shells (`data-shell="admin" | "ax-renewal" | "home"`) read the same preference.

There is no shared primitive layer. Every component composes Tailwind classes directly, and recurring shapes are kept as string constants local to the file that needs them — for example `PANEL_CLASSES` in `components/home/MemberHeader.tsx`. The same dropdown panel, the same modal shell and the same table header exist in several files as independently maintained class strings. That is the actual problem this ADR responds to: not that the UI looks wrong, but that one visual change is an N-file edit and nothing enforces that the N files agree.

### 1.2 Mantine and BlockNote are already dead

`package.json` declares `@blocknote/core`, `@blocknote/mantine`, `@blocknote/react` (0.54.0) and `@mantine/core`, `@mantine/hooks` (9.6.0). A full-text search of the frontend source finds **zero** imports of either — the only matches outside `node_modules` are the dependency lines themselves and stale `.next` build caches.

This matters, and it corrects an assumption carried in earlier discussion of this migration: the belief that Mantine is unavoidable because BlockNote ships on top of it, and that a shadcn migration would therefore leave two design systems in the bundle. That is not the case. The BlockNote editor envisaged by ADR-001 was never adopted; editing is served by `components/markdown/MarkdownEditor.tsx` (ADR-102) and the bespoke forms under `components/docs/editor/`. **There is no second design system to coexist with.** The five packages are dead weight and their removal is a precondition of this work, not a consequence of it.

### 1.3 Decision pressure

None external. No requirement in `REQUIREMENTS-SPEC.md` asks for this; no gate is blocked by it. It is a product-owner initiative to put the UI on a maintained foundation before the component count grows further. That absence of pressure is itself an argument for the staged approach in §2 rather than a rewrite: nothing is forcing a date, so nothing justifies a big bang.

### 1.4 Related risks

- **RISK — test churn.** 87 test files query the rendered DOM. Radix primitives render different structure and ARIA wiring than the hand-rolled equivalents, so a meaningful fraction of those tests will need rewriting. This is the single largest cost and it is not optional work.
- **RISK — half-migrated screens.** The failure mode of every incremental UI migration is a screen where two button styles sit next to each other for a quarter. §2 decision 6 exists solely to prevent it.
- **RISK — token drift.** shadcn components ship expecting their own token names. Adopted verbatim, they would render in shadcn's default palette rather than this product's, and the brand colours would quietly become decoration applied on top.

### 1.5 The 97-file figure overstates the work

Added after migrating three areas, because it changes how the remaining phases should be read.

"97 files contain a raw `<button>`" is true and misleading. Across `auth`, `account` and `settings`, about half the `<button>` elements found were not buttons in any design-system sense:

| What it actually is | Where | Goes to |
|---|---|---|
| Tabs with roving `tabIndex` and arrow-key handling | `SettingsSideMenu` (×2), `settings/Tabs` | Phase 3 `Tabs` |
| Disclosure headers spanning a whole card or row | `AccordionSection`, `SecurityTab` | Phase 3 `Collapsible` |
| Selection chips and cards driven by `aria-pressed` | `account/AppearanceCard`, `settings/AppearanceCard`, `DangerZoneCard`'s grace-period chips | `ToggleGroup` / `RadioGroup` |
| `role="switch"` toggles | `NotificationsCard`, `PushNotificationsCard` | `Switch` |
| A nav row styled to match the `<Link>` beside it | `SettingsSideMenu`'s Log out | Stays as it is |
| An invisible input, or one hidden behind a label | `OtpCodeInput`, the avatar file picker, the colour swatch | Stays as it is |

Each is marked in place with an `eslint-disable-next-line` and a one-line reason naming what it is waiting for, so the linter now carries the remaining to-do list rather than a document going stale beside it. The practical effect: `Button` and `Input` cover less ground than the raw counts suggest, and the overlay and form-control primitives of phases 2–3 cover more.

## 2. Decision

> Adopt **shadcn/ui** as the frontend's component foundation: copy its Radix-backed, Tailwind-styled primitives into `frontend/components/ui/`, remap them onto the design tokens already in `globals.css`, and migrate the existing 174 components onto them **one product area per pull request** over five phases. shadcn is not installed as a dependency — its components become this repository's own source, edited freely.

### Key choices

1. **shadcn/ui, copied in, not depended on.** `npx shadcn@latest add <component>` writes a file into `components/ui/`. That file is then ours: reviewed, edited, tested and committed like any other component. There is no `shadcn` package at runtime and no upstream version to upgrade in lockstep. What *is* a new runtime dependency is **Radix UI** (`@radix-ui/react-*`, one small package per primitive) plus `class-variance-authority`, `clsx` and `tailwind-merge`. Licence: **MIT** for shadcn/ui and for Radix. No cost, no attribution obligation beyond retaining the licence text.

2. **Our tokens, not shadcn's palette.** The `components.json` configuration maps shadcn's semantic token names onto the tokens `globals.css` already defines, instead of importing shadcn's default colour set:

   | shadcn token | maps to |
   |---|---|
   | `--primary` | `--color-brand-purple` |
   | `--background` / `--foreground` | existing `--background` / `--foreground` |
   | `--input` | `--color-border`'s value (`#ececf2`) |
   | `--muted-foreground` | the existing `--color-muted` value (`#6b6b80`) |
   | `--muted-surface` | `--color-page` (`#eef0f8`) |
   | `--card` / `--popover` | `#ffffff` |
   | `--destructive` | `--color-danger` |
   | `--ring` | `--color-brand-blue` |

   Two details settled while implementing this, both worth recording because the obvious choice is wrong in each:

   - **`--color-muted` is not redefined.** It already exists in this project as a *text* colour (`text-muted`, used across dozens of files), whereas shadcn's `muted` is a *surface*. Overwriting it would repaint text in files that have nothing to do with this migration. shadcn's pair is therefore split across two variables: `--color-muted-foreground` takes the existing text value, and the surface becomes `--color-muted-surface`.
   - **The radius scale is not touched.** shadcn's Tailwind-4 preset normally redefines `--radius-sm|md|lg|xl`. The existing UI is built on Tailwind's default scale via `rounded-lg`/`rounded-xl`, so overriding those tokens would silently reshape every corner in the app. Only a standalone `--radius` is introduced, and primitives use the stock utilities.

   The new tokens are exposed through `@theme inline` as `var()` references rather than literals. That indirection is what makes dark mode a swap of a dozen variables under the existing shell-scoped selector, instead of one override rule per utility — which is what the older `@theme` tokens in `globals.css` require, and which that file's own comments document as a frustration.

   A migrated component must be visually indistinguishable from the one it replaced. Any deliberate visual change is a separate PR with its own before/after, never smuggled in under a primitive swap.

3. **The existing theme mechanism stays.** shadcn assumes a `.dark` class on `<html>`; this project uses `data-theme="dark"` plus a `system` media-query fallback, and `lib/theme.ts` is already wired into three shells and a settings screen. The attribute wins. Tailwind 4 is told so once, in `globals.css`:

   ```css
   @custom-variant dark (&:where(
     :root[data-theme="dark"] :is([data-shell="admin"], [data-shell="ax-renewal"], [data-shell="home"]),
     :root[data-theme="dark"] :is([data-shell="admin"], [data-shell="ax-renewal"], [data-shell="home"]) *
   ));
   ```

   **The shell scoping is not decoration.** Dark mode in this project is not "dark when the attribute is set" — it is deliberately confined to the three shells, and `/login`, `/register` and `/welcome` stay light whatever the stored preference is, because they share class names (`text-muted`, `border-border`) with the shells. The obvious one-line variant (`&:where([data-theme="dark"], [data-theme="dark"] *)`) is wrong in the permissive direction: it would turn every migrated primitive on the auth pages dark for any visitor who had once chosen dark mode and then signed out. Both selector forms are present for the same reason the rest of the file carries both — a descendant combinator never matches an element against itself, and several page roots carry `data-shell` and the styled class on one element.

   `lib/theme.ts` is not modified. No component learns about theming.

4. **The icon set stays bespoke.** `components/layout/icons.tsx` holds 53 hand-drawn icons that match the product's drawing weight. shadcn's examples import `lucide-react`; where a copied component does, the import is swapped for the local icon during review. `lucide-react` is **not** added. Running two icon sets would introduce a second, purely cosmetic migration axis on top of this one. If a genuine gap appears, it is recorded as an amendment to this ADR, not decided inside a PR.

5. **Five phases, lowest risk first.**

   | Phase | Scope | Why here |
   |---|---|---|
   | **0 — Groundwork** | Remove the 5 dead Mantine/BlockNote packages; add the Radix/`cva`/`clsx`/`tailwind-merge` base; `components.json`; `lib/utils.ts` (`cn`); the token map and the `dark` variant in `globals.css` | No visual change, no test change, nothing imports any of it yet. Independently revertible. `components/ui/` and the decision-7 ESLint rule arrive in phase 1 — git cannot carry an empty directory, and the rule has no migrated area to guard until then |
   | **1 — Form & action** | `Button`, `Input`, `Textarea`, `Label`, `Select`, `Checkbox`, `Switch` | Smallest DOM delta, highest reuse (97 files hold a raw `<button>`). Builds confidence before touching focus management |
   | **2 — Overlays** | `Dialog`, `DropdownMenu`, `Popover`, `Tooltip`, `Sheet` | The biggest correctness win: replaces 8 hand-rolled `role="dialog"` implementations and their focus traps, outside-click handlers and Escape wiring with audited ones. Also the biggest test churn — deliberately after phase 1 |
   | **3 — Data display** | `Table`, `Card`, `Badge`, `Tabs`, `Avatar`, `Skeleton` | The 8 table-bearing files and the dashboard cards converge on one shape |
   | **4 — Feedback & sweep** | `Alert`, `Progress`, toast; then the remaining bespoke components, area by area | Whatever phases 1–3 did not reach |
   | **5 — Cleanup** | Delete superseded class-string constants; prune the rules in `globals.css` that only existed to style them; ESLint rule to error | `globals.css` should shrink. If it has not, the migration did not actually consolidate anything |

6. **One product area per pull request, never a partial screen.** The unit of migration is a directory under `components/` (`account`, `announcements`, `attendance`, `auth`, `ax-renewal`, `claude-usage`, `dashboard`, `docs`, `home`, `layout`, `legal`, `markdown`, `reports`, `settings`, `users-roles`, `welcome`) together with the routes that render it. A PR that leaves one screen with a shadcn `Button` beside a hand-rolled one does not merge. Mixed primitives *between* areas during the migration are expected and fine; mixed primitives *within a screen* are not.

7. **New code uses the primitives, enforced per migrated area.** A new component reaching for a raw `<button>`/`<input>` where a primitive exists is a review rejection, and an ESLint rule carries it. The rule is scoped by file glob to the areas already migrated, and the glob grows with each PR — so it **errors** in migrated areas from the moment they land, and is silent elsewhere. The first draft of this ADR said "warn globally from phase 0"; that was wrong in practice, because 97 files currently hold a raw `<button>` and a global warning would bury the two real lint warnings the project has under hundreds of expected ones, making `npm run lint` useless for the entire migration. Scoping it instead means the signal stays sharp and a migrated area can never regress.

8. **Nothing about authorisation, validation or data moves.** Primitives are presentational. `CONST-TECH-05` and `CONST-TECH-07` are untouched — no shadcn component makes a decision the backend owns, and `lib/content/validate.ts` stays advisory. Each migrated file keeps its `// req:` traceability comments verbatim.

9. **Tests are migrated, not deleted.** When a Radix primitive changes the DOM a test queried, the test is rewritten against the new accessible name or role — preferably a more semantic query than the one it replaced. A test that is deleted rather than rewritten must be justified by name in its PR description. Coverage does not fall across a phase boundary.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | **shadcn/ui, staged by area** | MIT, no runtime framework lock-in; components become our source and stay editable; Radix brings audited focus management and ARIA for the 8 hand-rolled dialogs; targets Tailwind 4 + React 19, which this project already runs; revertible one area at a time | Radix is a real new dependency surface; ~87 test files face DOM churn; spans several sprints with two styles coexisting between areas | **Adopted** |
| B | **shadcn/ui, big-bang rewrite** | One consistent result, no coexistence period | 174 components and 87 tests in one unreviewable PR, no safe revert, and every open feature branch conflicts with it. The three branches merged on 2026-10-09 alone touched 50 files | Not adopted |
| C | **Extract our own primitive layer, no library** | Zero new dependencies; total control; no test churn beyond what we choose | We hand-write and own the focus traps, ARIA wiring, keyboard navigation and screen-reader behaviour that Radix has already got right — the part of the 8 dialogs most likely to be subtly wrong today. Solves the duplication but not the correctness | Not adopted |
| D | **Adopt a full component library (Mantine properly, MUI)** | Batteries included; Mantine is already in `package.json` | Runtime framework lock-in and a second styling system beside Tailwind 4; its theming would fight `data-theme`; restyling to the brand is harder than with copied source. The dead Mantine packages are an argument against this path, not for it — it was chosen once in ADR-001 and never adopted | Not adopted |

### Scoring

| Dimension | Weight | A | B | C | D |
|---|---|---|---|---|---|
| Team proficiency | 25% | 8 | 8 | 7 | 5 |
| Ecosystem | 15% | 9 | 9 | 4 | 8 |
| Licensing / cost | 15% | 10 | 10 | 10 | 9 |
| Accessibility correctness | 15% | 9 | 9 | 5 | 8 |
| Migration risk | 15% | 8 | 2 | 9 | 3 |
| Long-term maintenance | 15% | 9 | 9 | 6 | 6 |
| **Weighted total** | | **8.75** | 7.70 | 6.85 | 6.35 |

The gap to the runner-up is **>10%**, so no PM tie-break is mandated by the scoring itself. PM approval is still required, because this supersedes a stack element of ADR-001.

## 4. Consequences

### 4.1 Positive

- One definition per UI shape. A visual change becomes a one-file edit instead of a search across 174.
- The 8 hand-rolled dialogs inherit Radix's focus trap, focus restore, Escape handling, scroll lock and ARIA wiring — behaviour currently reimplemented per file and unverified.
- Five dead packages leave `package.json`, and with them a dependency-audit surface nothing uses.
- `globals.css` should shrink materially as per-component rules collapse into primitives. It is the migration's clearest quantitative signal.
- New screens start from a primitive instead of from a copied class string.

### 4.2 Negative / costs accepted

- **Radix becomes a runtime dependency**, one package per primitive. Bundle impact is per-component and tree-shaken, but it is not zero — and phase 1 put a number on it. The five auth routes each gained **≈9–10 kB of First Load JS** (`/login` 118 → 128 kB, `/register` 115 → 126 kB, `/reset-password` 112 → 123 kB), while "First Load JS shared by all" held at 103 kB. Most of that is `tailwind-merge`, which is load-bearing rather than optional: without it a caller's `pl-10` does not displace a primitive's base padding and the winner is decided by stylesheet emission order (see `components/ui/input.tsx`). The cost is paid once and shared more widely as further areas migrate onto the same chunk; it does not scale with the number of migrated components. It should be re-measured at the end of each phase against the 103 kB baseline, and it is the one line in this ADR most likely to justify reversing the decision if it turns out otherwise.
- **Test churn across up to 87 files.** Unavoidable, and the main reason this is phased.
- **A coexistence period of several sprints** where migrated and unmigrated areas differ in internals (decision 6 confines this to *between* areas).
- **Merge conflicts with in-flight feature branches.** Anything touching a component in a phase's area will conflict. Phase order should be announced before each phase starts so parallel work can be sequenced — a coordination cost on the whole team, not only on whoever runs the migration.
- **shadcn components are copied, so they do not receive upstream fixes.** An upstream accessibility fix is a manual re-copy. This is the price of owning the source, accepted knowingly.

### 4.3 Follow-up work

- [x] **Phase 0** — removed `@blocknote/*` (3) and `@mantine/*` (2); added `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`
- [x] **Phase 0** — `components.json`, `lib/utils.ts`, the §2.2 token map and the `@custom-variant dark` rule in `globals.css`. Verified: typecheck clean, lint unchanged at 0 errors / 2 pre-existing warnings, 1418 tests pass, `npm run build` succeeds with shared First Load JS at **103 kB** (the baseline later phases are measured against)
- [x] **Phase 1** — `Button`, `Input`, `Label` in `components/ui/`; the decision-7 ESLint rule scoped to `components/auth` and the five auth routes; 11 buttons and every auth text field migrated. **Textarea, Select, Checkbox and Switch were not built**, because no call site in the pilot area needs them and shipping an unused primitive is how `@blocknote/*` came to sit in `package.json` for a year. The two checkboxes on /login and /register are exempted in place with a reason, and get a real primitive when the phase that can absorb the DOM change reaches them
- [x] **Phase 1 (cont.)** — `components/account` and `components/settings`. 20 further buttons and the profile fields migrated; `md` size and a `destructiveOutline` variant added; `Input` gained a `dashboard` variant
- [ ] **Phase 1 (cont.)** — remaining areas on the current primitives, one PR each: `layout`, `users-roles`, `claude-usage`, `announcements`, `attendance`, `home`, `welcome`, `reports`, `markdown`, `docs`, `ax-renewal`
- [ ] **PM decision — how many text-field styles does this product have?** Four were found while migrating, and nothing distinguishes them but the week each was written: the auth pages (`py-3`, 4px focus ring, border changes on focus), the settings cards (`py-2`, 2px ring, border fixed), `MailCredentialCard` (`rounded-lg`, `bg-surface`, border-only focus, no ring at all) and `settings/ProfileCard` (`rounded-lg`, `px-2.5 py-1.5`, 4px ring). Two are encoded as `Input` variants; the other two are left in place with a note, because a primitive with four variants is a class string with extra syntax. The answer should delete three of them, and it is a design decision rather than a migration one
- [ ] **PM decision — the button size scale.** Same story: `py-3`, `py-2.5`, `py-2` and `py-1.5` all exist for the same kinds of action, alongside four radii (`rounded-xl`, `rounded-full`, `rounded-lg`, `rounded-md`) and three disabled opacities (40, 50, 60). The migration preserves every one of them rather than silently normalising; collapsing the scale is a visible change and needs its own before/after
- [ ] **Bug found, not fixed** — `components/settings/AppearanceCard.tsx` nests `<input type="color">` inside a `<button>`. Interactive content inside interactive content is invalid HTML and unpredictable under assistive technology. Fixing it means deciding how the swatch opens its picker, which is a design change rather than a primitive swap, so it is reported here instead of being altered under cover of this work
- [ ] **Phase 2** — Dialog, DropdownMenu, Popover, Tooltip, Sheet; migrate the 16 modals and the 8 `role="dialog"` sites
- [ ] **Phase 3** — Table, Card, Badge, Tabs, Avatar, Skeleton
- [ ] **Phase 4** — Alert, Progress, toast; sweep the remaining areas
- [ ] **Phase 5** — delete superseded class-string constants, prune `globals.css`, ESLint rule to error
- [ ] Update `ADR-INDEX.md`, and note in ADR-001 that its BlockNote/Mantine stack element is superseded
- [ ] Decide, before phase 2, whether `AnnouncementEditorModal` and `MarkdownEditor` (ADR-102) migrate with `announcements`/`markdown` or are held back as a separate change

## 5. Verification / Monitoring

| Item | Measurement | Frequency | Threshold |
|---|---|---|---|
| Build integrity | `npm run check` (typecheck + lint + test) | Every PR | 0 type errors, 0 lint errors, 0 failing tests |
| Test coverage | Test file and test count vs. the phase's starting commit | End of each phase | No net loss; deletions named in the PR |
| Visual parity | Before/after of each migrated screen in the PR | Every PR | Indistinguishable, or the change is called out deliberately |
| Mixed primitives in one screen | Review | Every PR | Zero (decision 6) |
| `globals.css` size | `wc -l app/globals.css` | End of each phase | Trending down from 1453; not up |
| Bundle | `npm run build` route sizes vs. the phase's starting commit | End of each phase | No route grows >10% without a stated reason |
| Dialog accessibility | Keyboard-only pass: focus trap, focus restore, Escape | End of phase 2 | All 16 modals pass |

## 6. References

- Related code: `frontend/components/` (174 files), `frontend/app/globals.css`, `frontend/lib/theme.ts`, `frontend/components/layout/icons.tsx`, `frontend/package.json`
- Related constraints: `CONST-TECH-05`, `CONST-TECH-07` (REQUIREMENTS-SPEC v1.1, §263–266)
- Related ADR: ADR-001 (stack — its BlockNote/Mantine element is superseded here), ADR-102 (Markdown editor, migrates in phase 4)
- External: shadcn/ui — https://ui.shadcn.com (MIT) · Radix Primitives — https://www.radix-ui.com (MIT)

---

## Change History

| Date | Version | Changes | Author |
|---|---|---|---|
| 2026-10-09 | 1.0 | Initial draft on branch `feat/shadcn-ui-migration` | AI (Claude Opus 5) |
| 2026-10-09 | 1.1 | Corrected three things phase 0 proved wrong in the draft: the `dark` variant must be **shell-scoped** or it darkens the auth pages; `--color-muted` and the radius scale must **not** be redefined; the decision-7 ESLint rule is **scoped per migrated area**, not a global warning. Phase 0 marked done with its measured baseline | AI (Claude Opus 5) |
| 2026-10-09 | 1.3 | `components/account` and `components/settings` migrated. Added §1.5: about half the raw `<button>` sites are tabs, disclosures, chips or switches rather than buttons, so the 97-file figure overstates what `Button` and `Input` can reach. Recorded two PM decisions the migration surfaced but must not make on its own — four text-field styles and a four-step button scale — and one invalid-HTML bug found in `settings/AppearanceCard` | AI (Claude Opus 5) |
| 2026-10-09 | 1.2 | Phase 1 done for the auth area. Recorded the measured bundle cost (≈9–10 kB First Load JS per migrated route, shared chunk unchanged at 103 kB) against §4.2, which had predicted the direction but no magnitude. Narrowed phase 1's primitive list to what call sites actually needed. Noted that the test churn §1.4 warns about did **not** materialise here — `Button` and `Input` render the same elements, so all 1418 existing tests passed untouched. That churn is a phase-2 cost, when Radix's overlays change the DOM, and §1.4 should not be read as applying evenly across the phases | AI (Claude Opus 5) |

---

**Approval**

| Date | Approver | Comments | Status |
|---|---|---|---|
| | | | **PENDING** |
