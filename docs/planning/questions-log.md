# Skill 01 — 12-Question Dialogue Log

> Project: {TBD — set at Q1}
> Started: 2026-09-08 · Facilitator: `docs-writer` (lead), dialogue run at Opus per §0 model caution
> Shape: **legacy migration** (PM: "migrate my old project"), source to be shared later
> Criteria: all 12 are CQ1 (required inputs for downstream deliverables) — HARNESS-PROCESS-STANDARD §4.8

| # | Question | Status | Answer summary |
|---|----------|--------|----------------|
| 1 | One-line project definition | ASKED | |
| 2 | Why now / business problem | pending | |
| 3 | Primary users / personas | pending | |
| 4 | Top 3 core scenarios (MVP scope) | pending | |
| 5 | Screen / menu structure | pending | |
| 6 | External system integrations | pending | |
| 7 | Non-functional requirements | pending | |
| 8 | Schedule / budget / staffing | pending | |
| 9 | Success metrics (KPI) | pending | |
| 10 | Risks / assumptions | pending | |
| 11 | Preferred technology stack | pending | |
| 12 | Approval / governance | pending | |

## §6 Financial / regulated-industry checks
Not yet triggered — no financial keywords in the dialogue so far. Auto-added (as CQ3) if account/remittance/payment/PII terms appear.

## Notes
- Migration shape has downstream consequences already locked by the standard: `// source: <path>:<line>` comments become **mandatory** (§5.1), parity testing becomes a Skill 5 deliverable, and `legacy-analyst` joins Phase 1 Discovery.

---

## Q1 — One-line project definition · CQ1 · 2026-09-08

**PM (verbatim)**: "my old project just web for docs guide now I want to seperate have backend , front end for dynamic admin can control"

**Extracted**:
- AS-IS: a web-based documentation / guide site, content presumably static (authored in files, shipped by deploy)
- TO-BE: separated backend + frontend, plus an admin console so content is managed dynamically
- Driver: an administrator should be able to change content without a developer/deploy cycle

**Project-shape reclassification (supersedes the initial reading)**:
Initially read as a legacy port. It is not — it is a **rebuild + content migration**.
Consequences corrected:
- `// source:` comments: NOT mandatory (that rule is for ported code, §5.1). Use `// req: <REQ-ID>` (greenfield, recommended).
- Byte-level parity testing: not meaningful here. The equivalent obligation is **content-fidelity verification** — every existing guide page present and correctly rendered post-migration. To be specified in the Skill 3 TEST-PLAN.
- `legacy-analyst`: reduced role. The old site is an inventory/extraction source, not a call-graph analysis target.
- Formal classification to be fixed in Skill 3 / ADR-001.

**Q1 CONFIRMED — project name: `Coc Docs Platform`**

Final one-liner:
> Migrate **Coc Docs Platform** from a static documentation website into a separated
> backend + frontend application with an admin console, so that guide content,
> site navigation, and editorial users can be managed by administrators without a
> code change or deploy — with the admin capability set expected to grow over time.

**Admin scope (MVP)**: options 2 + 3 combined —
  - page content: create / edit / delete guide pages, text, images
  - navigation & structure: menu tree, section order, categories, page hierarchy
  - users & permissions: multiple admin accounts, roles (author / publisher / admin),
    draft-review-publish workflow implied
**PM addition**: "next time have more" → the admin feature set is expected to expand.
  Recorded as an **extensibility NFR + architecture constraint** (not a vague aspiration):
  the admin must be built so new managed entity types can be added without rework.
  Carry into Q7 (NFR) and ADR-001.

### §6 regulated-industry check — TRIGGERED
| Check item | Applies | Basis |
|---|---|---|
| Personal data processing (PII columns expected) | **YES** | admin user accounts: name, email, credentials, session/audit records |
| Financial transaction processing (BigDecimal) | no | no monetary domain |
| Regulatory scope (EFSR / ISMS-P / Credit Info Act) | TBD | depends on hosting jurisdiction + whether end-user data is collected — revisit at Q7 |
| Audit log retention obligation | TBD | revisit at Q7; "who changed which page when" is likely wanted for editorial reasons regardless |
| PCI-DSS / KISA certification | no | no card data |

**Consequence**: §6 states that if ANY of the five applies, a **separate security ADR is
mandatory in Skill 3**. It now applies. Scope: authentication, session management,
password storage, role enforcement, and PII handling for admin accounts.
`security-auditor` (Skill 01 support) flagged this as an early risk signal.

| # | Question | Status |
|---|----------|--------|
| 1 | One-line project definition | **DONE** |
| 2 | Why now / business problem | ASKED |

---

## AS-IS analysis — kicked off 2026-09-08 (skill §1 path [B-1])

**Source**: `D:\my_project\jexmcp3.0`, branch `site` (tracking `origin/site`).
Checked out from a clean tree on `main`; no stashes, nothing at risk. Same repo also
holds `origin/harness-standards` — i.e. this harness package and the site share an origin.

**Stack (confirmed from package.json)**: Next.js 15.3 (App Router) · React 19 · TypeScript 5.6 ·
google-auth-library 9.15 · server-only · deployed via Vercel (`vercel.json`). 80 tracked files.
Trilingual: `content/en`, `content/km`, `content/ko`. No database dependency of any kind.

### Git-history evidence for Q2 (independent of agent analysis)
Branch lifespan 2026-07-02 → 2026-08-27 (~8 weeks), **103 commits**.

| Metric | Value | Reading |
|---|---|---|
| Commits touching `content/` | **31 of 103 (30%)** | content changes ~4×/week, every one requiring a rebuild + redeploy |
| Commits touching ONLY `content/` | **11** | so 20 content edits were entangled with code changes — content and code are not separable today |
| `content/` files | 21 files, **13,497 lines** | non-trivial volume to migrate |
| Churn, `coach` page | `km` 10 · `ko` 9 · `en` 9 | **near-perfectly parallel** — every content edit is performed three times, once per language |
| Churn, `idea` page | `ko` 8 · `km` 8 · `en` 8 | same triple-edit pattern, exactly |

**Interpretation (to be confirmed by the content agent)**: content files carry a `.tsx`
extension — they are React components, not data. This is the single most important finding
so far, because it means content cannot simply be copied into database rows; it will need a
block/rich-text schema or an MDX pipeline. Sizing and TO-BE architecture both hinge on it.

**Q2 candidate value proposition (draft, pending PM confirmation)**:
The cost being absorbed today is a *three-times-plus-deploy* tax on every content change —
roughly 4 times a week, for eight weeks straight — and it requires a developer every time.

---

## AS-IS architecture analysis — `legacy-analyst`, 2026-09-08

### Correction to the earlier reading
Not a static site. `next.config.mjs` has **no** `output: 'export'`; the `ai-usage` section
(`revalidate=60`, `runtime='nodejs'`) and three API routes (`/api/login`, `/api/logout` edge;
`/api/ingest` node, `force-dynamic`) are genuinely server-rendered. It is a **hybrid SSG + SSR
app on Vercel**, entirely login-gated (`robots.ts` disallows all; `sitemap.ts` returns `[]`).
This is good news for the proposal: a working precedent already exists in this codebase for
server-side, per-request rendering against an external mutable data source.

### The central finding — content is compiled React, not data
`content/types.ts:14-59`:
```ts
export type Content = {
  ui:     { nav: NavStrings; chat: ChatStrings; copy: {...}; footerHtml: string };
  meta:   Record<Slug, { title: string; description: string }>;
  panels: Record<Slug, ReactNode>;      // <-- the blocker
};
```
`panels` is `Record<Slug, ReactNode>` — an arbitrary React element tree. A database column
cannot hold a `ReactNode`. Scale: **15 content modules** (5 doc sets x 3 locales),
**~13.4k lines**; `content/ko/jex3.0.tsx` alone is 982 lines.

Three distinct kinds of non-data content are embedded:
1. **Live React components inside content** — `content/{en,km,ko}/workflow.tsx:3-4` import
   and instantiate `HarnessDemo` and `OwnerTree`. These pages are not "content with
   formatting"; they are bespoke mini-applications embedded in the content stream.
2. **Raw HTML via `dangerouslySetInnerHTML`** across all 15 content modules — `.tree`
   box-drawing diagrams, `pre.copyable` code blocks with `data-cmd`, and `footerHtml`.
   Unescaped, hand-authored HTML. Moving this into an editor raises an XSS question:
   who may now author HTML that renders unescaped?
3. **Hardcoded `next/link` navigation** inside content bodies.

Visual vocabulary that any replacement renderer must reproduce (from `CLAUDE.md:22`):
`hero`, `eyebrow`, `lede`, `grid/card reveal`, `steps/step`, `callout [important]`, `.tree`,
`.tbl-scroll`, `.badge-gate`, `.faq details`, `.timeline`.

### Auth — there are no users
Shared team username + password from env (`SITE_USERNAME` / `SITE_PASSWORD`), signed stateless
HMAC cookie `jex_session` (`lib/auth.ts:11-32`), constant-time credential compare
(`lib/auth.ts:55-80`). **No user table, no per-user identity, no roles** — one binary state,
authenticated or not. `google-auth-library` is present but used only for the Sheets service
account, not human login.
=> The requested author/publisher/admin roles are a **from-scratch subsystem**, not an
extension of existing auth.

### Persistence — none, except a spreadsheet
No database, no ORM, no SQL/NoSQL driver anywhere in the dependency tree. The **only**
persistent mutable store in the whole application is a **Google Sheet**, written by
`/api/ingest` and read by `lib/usage/sheets.ts` for the ai-usage dashboard (tab-per-month,
upsert keyed on `(user_email, date)`). Content, navigation, and locale strings are all
compiled into the Vercel build.

### Rendering-model coupling
`app/[lang]/docs/[version]/[slug]/page.tsx:37-45` uses `generateStaticParams()` +
`dynamicParams = false`. The app **cannot serve a slug that was not known at build time**.
"Add a page without a deploy" therefore requires a rendering-model change (on-demand ISR/SSR),
not merely a data-source swap — and it interacts with `generateMetadata`'s per-locale
`alternates.languages` logic (`page.tsx:73-98`).

### Other coupling to price in
- `Sidebar.tsx` hardcodes per-doc-set icons (`Record<Slug, ReactNode>`) and branches explicitly
  on `version === 'coach'|'idea'|'jex2.0'|'workflow'|'jex3.0'`; `lib/i18n.ts:101-112` and
  `content/index.ts:43-67` carry a parallel `is*Slug`/`get*Content` per doc set. Adding one doc
  set today means editing ~4 places (`CLAUDE.md:24-29`).
- `PageFx` relocates `pre.copyable` nodes into DOM wrappers React did not create; pages must
  render inside a single keyed `<section>` or unmount throws `NotFoundError: removeChild`
  (`CLAUDE.md:122-125`). Any new dynamic renderer must satisfy this or PageFx needs rework.
- km/ko are hand-duplicated siblings of en with **no i18n library and no message catalogue**
  (`lib/i18n.ts`) — there is no translation-key system to hang a workflow off; the DB schema
  must invent one.

### Cleanly separable (low risk)
`lib/usage/*` (pure functions + one I/O module — best in-repo template for a DB-backed
feature) · auth (small, Web-Crypto, edge-portable — additive) · `lib/i18n.ts` enumerations ·
`meta.{title,description}` (already plain strings) · nav label records.

### Flags
- **[UNKNOWN] session TTL**: `lib/auth.ts:9` sets `SESSION_DAYS = 1`; `CLAUDE.md:172` says
  30 days. Resolve before designing the new session model.
- **[HAZARD] encoding**: `CLAUDE.md:152` — never bulk-edit content with Windows PowerShell 5.1
  (`Get-Content`/`-replace`/`Set-Content`); it reads UTF-8 as the Korean system codepage and
  corrupts em-dashes, Korean and Khmer text. **Directly binding on any content-migration
  tooling we write**, since this workstation is Windows/PowerShell. Use Git Bash `sed` or
  editor tooling.

---

## AS-IS content inventory — `doc-spec-parser`, 2026-09-08

### What the site actually documents
Internal developer-tooling documentation for **jexmcp**, a Claude Code plugin suite for
**JEX Studio** — a legacy enterprise low-code Java platform behind the company's
banking/insurance products (CHECKPAY, LOAN, INSU, ELECDOC, DUREADMIN, PLUGIN;
`content/ideaData.ts:16-24`). Six sections: jex3.0 (main plugin), jex2.0 (older CHECKPAY-family
plugin), coach (the 8-skill AI dev-process harness — i.e. this very standard), idea (IntelliJ
run-config setup), workflow (AI Engineering Harness vision, with live demos), ai-usage
(Claude Code token dashboard).

### Volume (the migration payload)
| Metric | Value |
|---|---|
| Doc sets | **5** authored + 1 live section (ai-usage) |
| Slugs per language | **35** (jex3.0 8 · coach 10 · idea 5 · jex2.0 5 · workflow 7) |
| Authored panels | **105** (35 x 3 locales) |
| Distinct navigable URLs | ~114 |
| Content volume | **~14,000 lines / ~39,000 words** (counts vary slightly with file set) |
| Largest single file | `content/en/coach.tsx` — 1,707 lines / 5,759 words |
| Copyable code blocks | **183** (`<pre className="copyable">`) |
| Real `<table>` elements | **81** |
| Distinct CSS-class block types | **32** (hand-rolled block vocabulary, no typed model) |
| Images | **0** — all visuals are inline SVG or CSS |

### Information architecture — flat, 2 levels, no nesting
6 top-level sections, each a flat ordered list of pages. **No page has children.**
A doc-set dropdown switches sections; order fixed by the literal array
`['jex3.0','jex2.0','coach','idea','workflow','ai-usage']` (`Sidebar.tsx:430`).

```
/{lang}/
├── docs/jex3.0/   overview · get-started · usage · flow[New] · structure · updating · releases · faq
├── docs/jex2.0/   overview · get-started · usage · structure · faq
├── docs/coach/    overview · quick-start · usage · workflow · structure · skills · agents · templates · security-gates · releases
├── docs/idea/     overview · prerequisites · run-configs · from-scratch · verify
├── docs/workflow/ overview · roadmap · tools · workspace · agents · demo · metrics
└── ai-usage/      (dashboard) · guide · config
```

**Ordering is expressed only as array-literal order, duplicated in three hand-synced places**:
`lib/i18n.ts` `*Slugs` arrays · `Sidebar.tsx` `*Items` arrays · content-file object key order.
No `order` field, no position number, no filename convention. Nothing enforces the three agree
except developer discipline. A DB migration must introduce an explicit `order` field and
reconcile all three.

### i18n — 100% coverage, and it is compiler-enforced
All 35 doc slugs exist in all 3 languages. This is not diligence, it is the type system:
`panels: Record<Slug, ReactNode>` over a literal-union key type means **`tsc` fails the build if
any language omits any slug**. Untranslated content literally cannot ship.

> **Consequence — a genuine regression risk.** A database has no such guarantee. Moving to a DB
> *loses* compile-time translation completeness. The admin console must replace it with explicit
> validation/warning UI, or silent gaps will proliferate. Evidence that this happens: the two
> pages that already escaped the content system (below) are the only untranslated pages on the site.

**The one existing gap**: `ai-usage/guide` and `ai-usage/config` are authored as raw JSX directly
in route files (`app/[lang]/ai-usage/guide/page.tsx`, `.../config/page.tsx`), bypassing `content/`
entirely — English only, with a hand-built `PendingTranslation` fallback for km/ko. They will not
be found by any tool that only walks `content/`.

### Migration hazards beyond those already logged
1. **Data-driven rendering** — `content/*/idea.tsx` maps over shared, language-neutral arrays in
   `content/ideaData.ts` (`PROJECTS`, `VM`) to generate tables and `<pre>` blocks. A per-language
   text dump would triplicate this data and invite drift.
2. **Links are executable expressions**, not stored URLs — built from a per-file base const
   (`const L = '/en/docs/jex3.0'`) plus template literals, or from `lib/i18n.ts` path builders.
   Copying rendered text turns every internal link into a dead string.
3. **Copy-button code blocks** — 183 `<pre className="copyable">` depend on the `PageFx` runtime
   enhancer. "Copyable code block" must survive as a distinct block type, not a fenced string.
4. **Inline SVG icons** duplicated across `ICONS`/`COACH_ICONS`/`IDEA_ICONS`/`WORKFLOW_ICONS`
   (`Sidebar.tsx:94-310`) — a text export drops all iconography; needs de-duplication into a real
   icon system.
5. **Legacy hash-URL compatibility** — `LegacyHashRedirect.tsx:11-21` maps old `/#faq`-style URLs
   into the current scheme. Any slug rename during migration breaks inbound bookmarks unless this
   is preserved.
6. **Template strings with placeholders** — `footerHtml` raw HTML, and a `mailBody` containing a
   `{user}` token substituted at runtime by `InviteChat`. A plain DB text field breaks the
   substitution contract.

### Glossary seed for Appendix A (frequency in `content/en/*.tsx`)
SVN 43 · JEX 39 · Claude Code 33 · Tomcat 32 · MCP 28 · IDO 24 · JexStudio 17 · jexmcp 15 ·
status/doctor 13/9 · WSVC 8 · CHECKPAY 8 · flow.team 6 · IntelliJ IDEA 3.
None of WSVC / IDO / MCP / SVN / JexStudio is defined anywhere on the site — writers assume
reader familiarity. Canonical one-line definitions needed.

---

## Q2 — Why now / business problem · CQ1 · 2026-09-08 — **ANSWERED**

**PM selected**: "Free me from being the bottleneck" (single選択; explicitly did NOT select the
triple-edit tax, scaling to more doc sets, or productisation).

**Core value proposition (§2.3 of the proposal)**:
> Remove the developer from the content-change loop. Today every content change is a TypeScript
> edit plus a deploy, so one person is a hard dependency for all 105 panels. The project buys
> *other people being able to change their own documentation*.

**Evidence of the cost being absorbed (§2.2)**: 31 of 103 commits over 8 weeks touched `content/`
(~4x/week); only 11 were content-only, so 20 content changes were entangled with code; every
change is authored three times (en/km/ko — `coach` churn 10/9/9, `idea` 8/8/8); each requires a
rebuild and redeploy; all of it requires a developer, because content is `.tsx`.

### Derived consequence — this constrains the content-model ADR
The driver is **non-developer editing**. That is decisive for the biggest open decision:

| Content model | Fits "free me from the bottleneck"? |
|---|---|
| MDX + code-ish editor | **No.** MDX is still code. A non-developer facing JSX/imports is blocked exactly as today; it would move the bottleneck, not remove it. |
| **Block / structured schema + WYSIWYG** | **Yes.** Required if the editor is genuinely non-technical. |

=> Skill 3 ADR should treat "block schema" as the leading candidate and MDX as the alternative to
be argued *against*, rather than an open coin-flip. Record in ADR-00N-content-model.

### Derived consequence — content tiering (scope reduction opportunity)
It does **not** follow that all 105 panels must become admin-editable. The analysis shows the
content divides naturally:

| Tier | What | Count (approx) | Treatment |
|---|---|---|---|
| A — prose + standard blocks | headings, text, callouts, tables, code blocks, steps | the large majority | Move to DB, fully admin-editable. This is where the bottleneck actually is. |
| B — bespoke/interactive | `workflow` panels embedding `HarnessDemo`, `OwnerTree`; `idea` panels binding to `ideaData.ts` | a handful | Keep in code, referenced from the DB as a component embed. Non-developers were never going to edit these. |
| C — outside the system | `ai-usage/guide`, `ai-usage/config` (raw JSX in route files, EN-only) | 2 | Decide explicitly: migrate into the system, or leave as code pages. |

Tiering is a **scope-reduction lever**: it avoids paying to make interactive demos editable by
people who will never edit them. Confirm tier boundaries during Skill 2.

| # | Question | Status |
|---|----------|--------|
| 2 | Why now / business problem | **DONE** |
| 3 | Primary users / personas | ASKED |

---

## Q3 — Users / personas · CQ1 · 2026-09-08 — **ANSWERED**

**Editors**: "Non-technical colleagues" — people who do not code at all.
=> A true WYSIWYG is required. This is the highest-cost editor option and it **confirms the
block-schema decision from Q2**: MDX would leave these users exactly as blocked as today.

**Readers**: PM initially selected "Fully public", then on being shown the conflicts refined it to
a **role ladder**: `guest · user · admin · super admin` (PM: "next time should have site
visibility : guest, user, admin, super admin").

### Security findings that drove the refinement (`security-auditor` early risk signals)
Raised before the proposal committed to "fully public":
1. **ai-usage is employee PII** — per-teammate email + individual token usage
   (`lib/usage/sheets.ts`, rows keyed `(user_email, date)`). Cannot be world-readable.
2. **`idea` doc set publishes the internal application portfolio** — `content/ideaData.ts:16-24`
   lists 9 internal systems (CHECKPAY, LOAN, LOAN_ADMIN, INSU, ELECDOC, ELECDOC_ADMIN,
   DUREADMIN, PLUGIN, PLUGIN_ADMIN) with environment IDs, config filenames, debug ports,
   **Tomcat versions** (9.0.117 / 8.5.100) and internal workspace paths
   (`C:\Projects Workspace\...`). For a banking/insurance context this is portfolio +
   version disclosure.
3. **Public readers + non-technical authors + `dangerouslySetInnerHTML` = XSS surface.**
   Today the raw-HTML blocks are contained (single trusted author, authenticated audience).
   Both ends change. **Sanitisation becomes a hard requirement**, not a nice-to-have.
   Feeds the mandatory §6 security ADR.
4. **Reassuring**: every URL in content is `localhost`; no internal hostnames or IPs are
   exposed. Network topology is not leaked.

### Resolved model — one ordered role ladder, page-level minimum role
| Role | Read | Edit content / nav | Manage users |
|---|---|---|---|
| `guest` (not logged in) | public pages only | no | no |
| `user` | + internal pages | no | no |
| `admin` | all | **yes** | no |
| `super admin` | all | yes | **yes** |

Each page/section carries a **minimum role required to view**. This subsumes the
public/internal visibility flag proposed earlier — one concept instead of two.

**Personas for §3 of the proposal**
| Type | Persona | Scenario |
|---|---|---|
| Primary (reader) | `guest` — external developer / prospective user | Reads public plugin docs without an account |
| Primary (reader) | `user` — internal developer at the company | Reads internal setup docs (idea), own usage |
| **Primary (editor)** | `admin` — **non-technical colleague** (writer / PM / domain owner) | Creates and edits pages in a WYSIWYG, no code, no deploy |
| Operations | `super admin` — the PM (today's sole author) | Manages accounts, roles, section visibility |

**Open point deferred to Skill 2**: whether `admin` later splits into author vs publisher
(draft → review → publish). The Q1 answer implied a review workflow; the role ladder as stated
has a single editing role. Not blocking for the proposal.

**Open point deferred to Skill 2**: ai-usage granularity — "each user sees only their own usage,
admin sees everyone" is the privacy-preserving default and is stricter than a flat `user` role.

| # | Question | Status |
|---|----------|--------|
| 3 | Primary users / personas | **DONE** |
| 4 | Top 3 core scenarios (MVP scope) | ASKED |

---

## Q4 — Core scenarios / MVP scope · CQ1 · 2026-09-08 — **ANSWERED**

**MVP = scenarios 1 + 2 + 3 + 5** ("full content management"), **behind login**.
PM addition: *"next time will have page for need to login (user)"* → the guest/user visibility
ladder is **phase 2**, not MVP. Scenario 4 (guest reads a public page) is explicitly deferred.

### MVP scenarios (§4 of the proposal)
| # | Scenario | Actor | Outcome |
|---|---|---|---|
| 1 | Open an existing page, edit text in a WYSIWYG, save → live | `admin` (non-technical) | The bottleneck is removed. Primary justification for the project. |
| 2 | Create a new page in a section; it appears in the nav | `admin` | No deploy, no `lib/i18n.ts` edit, no `Sidebar.tsx` edit |
| 3 | Reorder / rename nav items | `admin` | Replaces the three hand-synced arrays with one `order` field |
| 5 | Create an account, assign a role | `super admin` | Makes 1-3 possible for anyone other than the PM |

### Phase 2 (explicitly out of MVP)
- Per-page minimum-role visibility (`guest` / `user`)
- Public/anonymous reading; reversing `robots.ts` (currently disallow-all) and `sitemap.ts`
  (currently returns `[]`); SEO work
- The security consequences of going public (raw-HTML sanitisation hardening, portfolio-disclosure
  decision on the `idea` doc set, ai-usage PII exposure) land with phase 2, **not** MVP.
  => MVP keeps today's "everything behind login" posture, so the migration and the public
  exposure do not land simultaneously. Materially de-risks the project.

### Migration scope — **TIERED** (PM chose the recommended option)
| Tier | Content | Treatment |
|---|---|---|
| A | prose, headings, callouts, tables, code blocks, steps — the large majority of the 105 panels | → database, fully admin-editable via WYSIWYG |
| B | `workflow` panels embedding `HarnessDemo` / `OwnerTree`; `idea` panels bound to `ideaData.ts` | → stay as code components, referenced from the DB as an embed. Non-technical staff were never going to edit these. |
| C | `ai-usage/guide`, `ai-usage/config` (raw JSX in route files, EN-only) | → decide individually in Skill 2 |

Exact tier boundaries to be fixed per doc set during Skill 2 (requirements).

| # | Question | Status |
|---|----------|--------|
| 4 | Top 3 core scenarios (MVP scope) | **DONE** |
| 5 | Screen / menu structure | ASKED |

---

## Q5 — Screens / menu structure · CQ1 · 2026-09-08 — **ANSWERED**

**Reader-facing IA**: unchanged from AS-IS — 6 sections, flat ordered lists, no nesting.
Captured verbatim in the content-inventory section above; goes into §5.1 of the proposal as-is.

**Admin console (new build)** — PM confirmed the proposed structure, added two screens,
and dropped one:
```
Admin console
├─ Login
├─ Dashboard              recent edits · translation status at a glance
├─ Pages                  list, filter by section / language / status
│   └─ Page editor        WYSIWYG body + title / description / slug
│       └─ Preview        [ADDED] render exactly as readers will see it, before publish
├─ Navigation             reorder · rename · move between sections        [scenario 3]
├─ Translation status     [ADDED] which pages are missing / stale in km / ko
├─ Media                  [ADDED via image decision] upload, browse, insert
└─ Users & roles          accounts · role assignment       [scenario 5, super admin]
```
**DROPPED from MVP**: `Sections` (creating a whole new doc set). Remains a developer task for
now. Note this does not weaken scenario 2 — admins can still create *pages* inside existing
sections; they just cannot create a new section.

### Image upload — **IN MVP** (PM chose the recommended option)
Today: **zero images** in `content/` (grep for `<img>`/`next/image` returns 0); all visuals are
hand-authored inline SVG. There is **no upload, storage, or asset-handling pattern anywhere in
the codebase** — this is a genuinely new capability, not an extension.

Rationale recorded: the first instinct of a non-technical editor in a WYSIWYG is to paste a
screenshot. Without image support they are blocked on day one and return to the PM — defeating
the project's stated purpose (Q2). Cost accepted: file storage, upload validation, size/type
limits, and a new attack surface (feeds the mandatory §6 security ADR).

### Translation status screen — the deliberate replacement for a lost guarantee
Directly answers the regression identified in the content inventory: today
`panels: Record<Slug, ReactNode>` makes `tsc` **fail the build** if any language lacks any page,
so untranslated content cannot ship. A database cannot enforce that. This screen is the
compensating control. Without it, the ai-usage guide/config pattern (the only untranslated pages
on the site, and the only ones authored outside the content system) would proliferate.

| # | Question | Status |
|---|----------|--------|
| 5 | Screen / menu structure | **DONE** |
| 6 | External system integrations | DERIVED — confirming |

---

## Q6 — External integrations · 2026-09-08 — **ANSWERED (derived + PM decisions)**

**AS-IS (from analysis, not from PM memory)**
| System | Protocol | Direction | Purpose |
|---|---|---|---|
| Google Sheets | REST + service-account JWT (`lib/usage/sheets.ts`) | read + write | the ONLY persistent store; ai-usage data |
| Vercel | platform | — | hosting / build / deploy |
| Google Fonts | CDN | inbound | layout fonts (`app/[lang]/layout.tsx`) |

No external identity provider today — credentials are env vars (`SITE_USERNAME`/`SITE_PASSWORD`).
`flow.team` appears only as documented subject matter about the jexmcp plugin, **not** as a site
integration.

**TO-BE decisions**
- **ai-usage → migrate into the new database.** PM chose consolidation over leaving it on Sheets.
  Noted: this is scope that does not serve the Q2 driver (the content bottleneck). It is contained
  — `lib/usage/*` is pure functions plus one I/O module, so the backend swaps behind the existing
  `readUsageRows`/`upsertUsageRow` signatures — but it is the **first candidate to defer** if
  capacity becomes tight. Recorded as a sequencing note, not an objection; PM decision stands.
- **Google sign-in** for authentication. Removes password storage, reset flows, lockout and
  credential handling from scope — which strips most of what the mandatory §6 security ADR would
  otherwise have to cover. `google-auth-library` is already a dependency (currently used only for
  the Sheets service account).
- New: database, file/object storage for images.

## Q8 — Schedule / budget / staffing · CQ1 — **ANSWERED**
**"Just me, part-time, no deadline."** Solo, unfunded, unbounded.
This is the single most important constraint in the proposal and it governs sequencing.
See the sizing analysis and pilot recommendation below.

| # | Question | Status |
|---|----------|--------|
| 6 | External system integrations | **DONE** |
| 8 | Schedule / budget / staffing | **DONE** |

---

## Q7 — Non-functional requirements · DERIVED, for confirmation at review [D]
Not asked as a separate question (§4.8 "no unnecessary queries" — most of it follows from
answers already given). Stated as explicit assumptions for the PM to correct at [D]:
- **Performance**: no hard SLA. Internal-scale audience today; page load comparable to today's
  pre-rendered pages is sufficient. Assumption `[ASSUMED]`.
- **Availability**: best-effort on Vercel. No uptime commitment. `[ASSUMED]`
- **Security**: Google sign-in; 4-role ladder; HTML sanitisation on all rich content; upload
  type/size validation; teammate PII (ai-usage) restricted. Mandatory §6 security ADR in Skill 3.
- **Extensibility** (from Q1, "next time have more"): new managed entity types must be addable
  without rework. Architectural constraint, carried into ADR-001.
- **Operations**: editorial audit trail (who changed which page, when) — needed for a
  multi-author system and cheap to add at schema level. DB backup required (content becomes the
  system of record instead of git). `[ASSUMED]`
- **Translation integrity**: coverage must not regress from today's 100%.

## Q9 — Success metric · CQ1 — **ANSWERED**
**"Zero deploys for content changes."** Directly measurable, with a clean baseline already in
hand: 31 of 103 commits over 8 weeks touched `content/` (~4/week). Target: content edits
requiring a build drops to **0**.

## Q10 — Risks / assumptions · DRAFTED (refined in Skill 3 risk-register.md)
Highest-ranked risk is **not technical**: solo + part-time + no deadline is a stall profile.
Full register in the proposal §10.

## Q11 — Technology stack preference · DERIVED, decided properly in ADR-001
Keep Next.js 15 / React 19 / TypeScript / Vercel (working, known, already paid for). New
components — database, object storage, WYSIWYG editor library — are genuine alternatives to be
compared in ADR-001 (Skill 3), not settled here.

## Q12 — Approvals / governance · CQ1/CQ3 — **ANSWERED**
**"Me, plus a colleague reviews."** PM (Socheat-Hun) approves G1/G2/G3; a colleague reviews
requirements and design before G1 and G2. Stronger than self-approval. Approver names must be
recorded by a human in `docs/.harness-state.yaml` — the AI must never record a gate approval
(§4.8 CQ3).

## Block vocabulary decision — **CUT TO ~8-10 CORE BLOCKS**
The largest cost lever in the project. Today: **32 distinct block types**, 81 tables, 183
copyable code blocks. Each block type in a WYSIWYG needs both an editing UI and a renderer, so
32 types is a small CMS build — not viable solo/part-time. Accepted consequence: some pages will
not look exactly as they do today.

## Recommended sequencing — pilot before committing
Migrate **`jex2.0` first** (smallest doc set: 5 slugs, 534 lines en) to prove the block schema
end-to-end before touching the remaining ~100 panels. Then test the schema against the *hardest*
content (`coach.tsx`, 1,707 lines) early, since that is where a block model breaks. Failing fast
here costs weeks; failing late costs months.

| # | Question | Status |
|---|----------|--------|
| 7 | Non-functional requirements | DERIVED |
| 9 | Success metrics (KPI) | **DONE** |
| 10 | Risks / assumptions | DRAFTED |
| 11 | Preferred technology stack | DERIVED -> ADR-001 |
| 12 | Approval / governance | **DONE** |

**All 12 questions answered, derived, or explicitly deferred. DoD item 1 satisfied.**
