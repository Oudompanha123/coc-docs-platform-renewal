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

4. ~~**The icon set stays bespoke.**~~ **Amended in r2.5 — the icon set is Lucide.** The original decision kept the 53 hand-drawn icons in `components/layout/icons.tsx` and left `lucide-react` out, to avoid a second, purely cosmetic migration axis. The product owner reversed that in-session (*"icon after login still old icon not icon shadcnKit"*): once the r2 repaint moved the product onto shadcn's look, the hand-drawn 1.7px glyphs were the most visible thing that still read as the old UI. `lucide-react` is added (pinned to `1.47.0`; ISC licence). The "two icon sets" risk is avoided the cheap way: every export in `icons.tsx` keeps its name and now renders its Lucide counterpart, so the 75 importing files changed in one edit and there is still exactly one icon set. Hand-drawn inline `<svg>` icons elsewhere move to Lucide too. Illustrations, diagrams, logos and the default avatar are not icons and stay as drawn.

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
| 2026-10-09 | 2.0–2.4 | Visual upgrade (r2.0–r2.4, product-owner request): the legacy brand palette repointed to shadcn's neutrals; one field style; a quiet focus state; native-input Checkbox/Radio; the landing pages repainted and rescaled. Recorded in commit messages `023e865`…`ae7600c` | AI (Claude Opus 5) |
| 2026-10-09 | 2.5 | Decision 4 amended: icons are Lucide (`lucide-react` 1.47.0), behind the unchanged `icons.tsx` export names. Text on `bg-primary` must be `text-primary-foreground`, never `text-white`: `--primary` inverts to near-white in dark mode, and about 80 call sites had rendered white-on-white. /welcome's dark mode moved from per-element hex to a `.landing-dark` token scope. Sign-in loading overlay and `Spinner` are now shadcn's spinner (`LoaderCircle`) | AI (Claude Opus 5.5) |
| 2026-10-09 | 2.6 | The product owner's **coc-docs design system** installed as a project skill (`.claude/skills/coc-docs/`), with `CLAUDE.md` recording where project decisions override it. Two conflicts the product owner resolved in its favour: buttons take its 7.2px radius (`--radius-control`, registered with `tailwind-merge` in `lib/utils.ts`) instead of the r2.0 pill, across `Button` and 114 hand-written button class strings — text fields stay pills, by the product owner's follow-up choice; and `h1`/`h2` are set in Cal Sans (self-hosted, SIL OFL) with an Inter → Pretendard fallback | AI (Claude Opus 5.5) |
| 2026-10-09 | 2.7 | Admin shell moved onto the design system's dashboard pattern (structure only — the pattern's scraped coral/Geist palette is ignored in favour of the root neutral tokens): a light sidebar on new `--nav-*` tokens with a per-theme logo, a 64px header with ghost icon buttons, flat `bg-card` stat cards and panels on a `bg-background` page. Product owner's follow-ups on shape: text fields are pills everywhere; buttons take the 7.2px radius in the app but stay pills on the sign-in pages, expressed as `Button`'s new `shape` variant (`default` / `pill`) rather than per-call overrides | AI (Claude Opus 5.5) |
| 2026-10-09 | 2.8 | Multi-line fields stop being pills. Every textarea had inherited `inputBaseClass` by plain string concatenation, so its `rounded-full h-10` stayed on the element beside any override and won on stylesheet order — the product editor's description fields rendered as 120px-tall pills, and three AX Renewal textareas were clipped to 40px. The shared surface is now `fieldSurfaceClass`; `inputBaseClass` adds the single-line pill and a new `Textarea` primitive (`textareaBaseClass`) adds `rounded-xl` and a minimum height. Reported by the product owner | AI (Claude Opus 5.5) |
| 2026-10-09 | 2.9 | Whole-app pass, at the product owner's request ("improve all in app", "elements look big", "tables look big", "search fields differ", "no shadow on buttons"). New shared primitives: `SearchInput` (the only search field), `Table` parts (compact shadcn data table — every hand-written `<table>` converted), `NavMenu`/`NavMenuItem` (hover-to-open header menu, title-and-description panel; /welcome and member home). Buttons: pills again — `--radius-control` is now `9999px`, one line — with no shadow anywhere; controls shrink to shadcn's sizes (`Button` h-9, `Input` h-9). Admin sidebar gains a desktop icon-rail collapse (persisted per viewer in localStorage); member header shows the avatar only. Every area moved off the legacy colour tokens (`text-ink`/`text-dash-ink`/`text-muted`/`border-border`/`bg-white`/`bg-page`) onto the design-system tokens, cards flattened (no shadow, `rounded-xl`), uppercase letter-spaced labels to sentence case. Done by seven parallel per-area agents; four were cut off by a usage limit and their areas were finished by codemod and hand | AI (Claude Opus 5.5) |
| 2026-10-09 | 2.10 | Two more Radix primitives, pinned at releases ≥2 weeks old: `@radix-ui/react-select` 2.3.7 → `Select`/`SimpleSelect` (every native `<select>` in the app — 13 call sites — replaced, because the OS draws a native select's open list and no CSS reaches it outside Chromium; `SimpleSelect` maps this app's `""` = "All" onto Radix's non-empty item values), and `@radix-ui/react-dropdown-menu` 2.1.24 → `DropdownMenu`/`RowActions` (per-row action buttons on Announcements and Users & Roles collapsed into one "⋯" menu), and `@radix-ui/react-tooltip` 1.2.16 → `Tooltip` (role descriptions in the roles picker moved from printed text into tooltips; the picker became compact pills). jsdom shims for pointer capture/`scrollIntoView` added to `vitest.setup.ts`; `select.test-utils.ts` gives tests `openSelect`/`pickOption`. Admin Settings moved to the design system's settings layout (section menu + single column, scroll-spy). Announcement editor restructured (header/description/close, scrolling body, fixed footer); `Modal` gains an opt-in `ariaLabel` that makes its panel a named `role="dialog"` | AI (Claude Opus 5.5) |
| 2026-10-14 | 2.11 | Product-owner requests: "auto theme looks wrong", "skeleton loading on every dashboard page", "landing page not smooth", "date picker is the default style". (1) **Theme `system` resolves to `data-theme="light|dark"`** instead of clearing the attribute: every dark rule and the `dark:` variant key on `data-theme="dark"`, so `system` had darkened only the two root colours the `prefers-color-scheme` query covers. `lib/theme.ts` now writes the OS's answer, follows OS changes while the choice stays `system`, and a pre-paint script in `app/layout.tsx` applies it before hydration. The stored choice is still `system`. (2) New `Skeleton` primitives (`components/ui/skeleton.tsx`: stat cards, table, list, card, form) replace the "Loading…" text in every admin loading state. `RequireSession` gains a `fallback` the admin shell fills with `ShellSkeleton`; it had rendered a blank screen while the session was checked, and the skeleton carries no navigation or data. `app/(shell)/loading.tsx` covers route transitions. (3) /welcome's hero and dashboard preview enter together (`.animate-hero-entrance`): the preview's 120ms delay had left an empty hole under a finished headline. (4) `DatePicker` (`Calendar` on `react-day-picker` 9.14.0 in a new `Popover` on `@radix-ui/react-popover` 1.1.23, both releases ≥2 weeks old; 1.3.x was skipped as too new) replaces every `<input type="date">` (4 call sites). The value stays a `YYYY-MM-DD` string, read in local time. | AI (Claude Opus 5.5) |
| 2026-10-14 | 2.12 | Admin sidebar, product-owner request: "can swipe scale", "move icon" beside the logo, "when menu close keep icon" in the header. The expanded sidebar is **resizable** by dragging its right edge (`SidebarResizeHandle`, the claude.ai pattern: an invisible strip that shows a short grey pill on hover), 208–400px, default 256, remembered per browser (`coc-docs-sidebar-width`, `ShellContext.sidebarWidth`). Dragging well below the minimum folds it to the rail and keeps the earlier width for reopening; double-click resets; ←/→/Home/End resize from the keyboard (`role="separator"` with its value). The fold button moved into the sidebar header beside the logo while expanded, and appears in the Topbar only while folded. | AI (Claude Opus 5.5) |
| 2026-10-14 | 2.13 | Product-owner requests: logo 28→36px in the expanded sidebar; favicon rebuilt from `app/icon.png` (16/32/48/64); the app icon and name above every auth page's title (`AuthShell`); "redo /legal-pages — wrong UI/UX and wrong logic"; "one text editor" (content model: ADR-109). /legal-pages: one `LegalPageEditor` for both tabs on a shared `useLegalEditor` hook and `LegalEditorChrome`. Logic fixed: **Publish saves unsaved edits first** (it had published the last saved draft, then reloaded over the screen); the badge compares the saved draft with the live version (it showed the draft row's status, always "draft"); a save **conflict offers Reload** instead of reloading over your text; restoring over unsaved edits asks in an app dialog; autosave is quiet and only on the visible tab; reload after publish/restore keeps the form on screen. UX: both tabs stay mounted (switching no longer asks or loses work; a dot marks unsaved tabs), one leave-page guard, the same publish dialog for both pages (issues with Go to field, optional note, "will be saved first"), Preview for both, a Sections card listing the body's `##` headings, version preview in theme tokens (it was hard-coded white). | AI (Claude Opus 5.5) |
| 2026-10-14 | 2.14 | Legal editor toolbar redone at the product owner's request: capitalised Edit/Preview segments, one status pill (Live / Changes not live / Not published — hover or focus for "Live since … · published by …"), save state as icon + text, History and View live as icon buttons with tooltips, then Save draft and Publish. Body edited in a visual Tiptap editor (ADR-109 amendment) styled by `.legal-prose`, which mirrors `MarkdownView`'s document variant. Auth: the register checkbox now agrees to the Terms of Service **and** Privacy Policy (both linked, new tab) (`components/auth/LegalLink.tsx`). A matching "By signing in, you agree…" line on /login was added and then removed at the product owner's request. | AI (Claude Opus 5.5) |
| 2026-10-14 | 2.15 | Sidebar `⋮` menus (`SidebarItemMenu`, `SidebarGroupMenu`) moved onto the shared `DropdownMenu` (new `DropdownMenuSub*` parts): theme popover and Lucide icons instead of a hard-coded navy panel with emoji, Radix keyboard/focus/positioning instead of hand-rolled code (`menuPosition.ts`, `usePopoverLifecycle.ts` removed), a trigger whose hover shows on the light sidebar. Logic: system pages have no Delete row (it was always disabled); a disabled Delete states its reason in the row, not a hover title; "New group…" refuses a blank or duplicate name; deleting a group asks in an app dialog instead of `window.confirm`; the product delete dialog uses `Modal`/`Input`/`Button`. Topbar menus raised to `z-50` (a page’s sticky toolbar drew over them). /legal-pages: the toolbar is opaque and aligned with a 960px content column, and the editor’s formatting bar sticks under it (`--legal-toolbar-h`) instead of sliding over it. | AI (Claude Opus 5.5) |
| 2026-10-14 | 2.16 | Alerts and alert dialogs, app-wide (product-owner request). New primitives: `Alert` (`components/ui/alert.tsx`: default/info/success/warning/destructive, icon by default, `action`, `onDismiss`, role alert for errors and status otherwise) replacing the hand-drawn `role="alert"` banners; `AlertDialog` on `@radix-ui/react-alert-dialog` 1.1.23 (≥2 weeks old; 1.1.24 skipped) — no outside-click dismissal, focus starts on Cancel; `useConfirm()` + `ConfirmProvider` (root `Providers`) replacing `window.confirm` (content-type switch, remove feature/section/step, remove product item, legal restore, legal-pages leave guard), falling back to the native confirm only without a provider; `ConfirmDialog` for confirmations with their own body, busy state or error (Delete/Deactivate account, disable tracking, announcement publish/unpublish/delete, sidebar product/group delete). Legal restore now asks once (the history panel no longer asks a second time). Still native on purpose: `beforeunload`, and AX Renewal’s synchronous unsaved-changes guard. | AI (Claude Opus 5.5) |
| 2026-10-09 | 1.2 | Phase 1 done for the auth area. Recorded the measured bundle cost (≈9–10 kB First Load JS per migrated route, shared chunk unchanged at 103 kB) against §4.2, which had predicted the direction but no magnitude. Narrowed phase 1's primitive list to what call sites actually needed. Noted that the test churn §1.4 warns about did **not** materialise here — `Button` and `Input` render the same elements, so all 1418 existing tests passed untouched. That churn is a phase-2 cost, when Radix's overlays change the DOM, and §1.4 should not be read as applying evenly across the phases | AI (Claude Opus 5) |

---

**Approval**

| Date | Approver | Comments | Status |
|---|---|---|---|
| | | | **PENDING** |
