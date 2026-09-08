# Project Proposal — Coc Docs Platform

> **Version**: 1.0
> **Date**: 2026-09-08
> **Author**: Socheat-Hun (PM)
> **Approver**: Socheat-Hun (PM), with colleague review before G1 and G2
> **Status**: DRAFT

---

## 1. One-Line Project Definition

> Migrate **Coc Docs Platform** from a documentation site whose content is compiled TypeScript into a separated backend + frontend application with an admin console, so that guide content, site navigation and editorial users can be managed by non-technical administrators without a code change or a deploy.

---

## 2. Business Background / Problem

### 2.1 Why Now

The site works. Nothing is broken. What has become untenable is **who is required to change it**.

Content is authored as React components in `content/{en,km,ko}/*.tsx`. Editing a sentence therefore means editing TypeScript, committing, and redeploying. One person — the PM — is a hard dependency for all 105 content panels, and that dependency is exercised roughly four times a week.

### 2.2 Problem to Solve

Measured from the `site` branch over an eight-week window (2026-07-02 → 2026-08-27, 103 commits):

| Evidence | Value | Consequence |
|---|---|---|
| Commits touching `content/` | **31 of 103 (30%)** | A content change requires a rebuild and redeploy ~4× per week |
| Commits touching *only* `content/` | **11** | The other 20 content edits were entangled with code changes — content and code are not separable today |
| `coach` page edit counts (km / ko / en) | **10 / 9 / 9** | Near-perfectly parallel |
| `idea` page edit counts (ko / km / en) | **8 / 8 / 8** | Identical pattern |
| Content volume | 21 files, **~14,000 lines / ~39,000 words** | Non-trivial migration payload |

The trilingual symmetry is the tell: **every content edit is performed three times**, once per language, then built and deployed — and every one of those edits requires a developer, because the content *is* code.

The loss being absorbed is therefore twofold: the PM's time on work that is not development, and — more expensively — the changes that never get requested at all, because asking is more effort than living with the error.

### 2.3 Core Value Proposition

**Remove the developer from the content-change loop.** People who own the documentation should be able to change their own documentation, in a browser, without asking anyone and without a deploy.

*(Selected by the PM at Q2 over three alternatives: eliminating the triple-edit tax, scaling to more doc sets, and productisation. Those remain benefits, but they are not the driver, and the scope below is prioritised accordingly.)*

---

## 3. Users / Personas

| User | Persona | Primary Usage Scenario |
|--------|---------|----------------|
| Primary (editor) | **`admin` — non-technical colleague** (writer, PM, or domain owner; does not code) | Opens a page in a WYSIWYG, edits text, inserts a screenshot, publishes. No code, no deploy. |
| Primary (reader) | `user` — internal developer at the company | Reads setup and plugin documentation; consults own Claude Code usage |
| Primary (reader) | `guest` — external or unauthenticated reader *(phase 2)* | Reads public plugin documentation without an account |
| Operations | `super admin` — the PM (today's sole author) | Creates accounts, assigns roles, controls section visibility |

### 3.1 Role Model

A single ordered ladder governs both **read access** and **edit capability**, rather than a separate visibility flag bolted onto a permissions system.

| Role | Read | Edit content & navigation | Manage users |
|---|---|---|---|
| `guest` (not logged in) | public pages only | — | — |
| `user` | + internal pages | — | — |
| `admin` | all | **yes** | — |
| `super admin` | all | yes | **yes** |

Every page carries a **minimum role required to view**.

**Note**: no user identity exists today. Authentication is a single shared username and password held in environment variables, producing a signed stateless cookie (`lib/auth.ts`). There is no user table and no concept of a role. This ladder is therefore a **from-scratch subsystem**, not an extension of existing auth.

---

## 4. Core Scenarios (MVP Scope)

| # | Scenario | User | Outcome |
|---|---------|--------|------|
| 1 | Open an existing page, edit it in a WYSIWYG, save → live | `admin` | **The bottleneck is removed.** Primary justification for the project. |
| 2 | Create a new page in a section; it appears in the navigation | `admin` | No deploy, no `lib/i18n.ts` edit, no `Sidebar.tsx` edit |
| 3 | Reorder or rename navigation items | `admin` | Replaces three hand-synchronised arrays with one `order` field |
| 5 | Create an account and assign a role | `super admin` | Makes scenarios 1–3 available to anyone other than the PM |

### 4.1 Explicitly Deferred to Phase 2

- **Scenario 4** — `guest` reads a public page without an account
- Per-page minimum-role visibility enforcement
- Reversing `robots.ts` (currently disallow-all) and `sitemap.ts` (currently returns `[]`); SEO work
- The security consequences of public exposure (§10, RISK-006 and RISK-009)

**Rationale**: MVP retains today's "everything behind login" posture so that the content migration and public exposure do not land at the same time. This materially de-risks the project at no cost to the stated driver — the bottleneck is removed either way.

### 4.2 Content Migration Scope — Tiered

Not all 105 panels need to become admin-editable.

| Tier | Content | Treatment |
|---|---|---|
| **A** | Prose, headings, callouts, tables, code blocks, steps — the large majority | → database, fully editable in the WYSIWYG. **This is where the bottleneck actually is.** |
| **B** | `workflow` panels embedding the live `HarnessDemo` and `OwnerTree` components; `idea` panels bound to `ideaData.ts` | → remain code components, referenced from the database as an embed. Non-technical staff were never going to edit these. |
| **C** | `ai-usage/guide` and `ai-usage/config` — raw JSX in route files, English-only, already outside the content system | → decided individually in Skill 2 |

Exact tier boundaries are fixed per doc set during requirements definition.

---

## 5. Screens / Menu Structure

### 5.1 Reader-Facing Menu Tree (unchanged from today)

Six top-level sections, each a **flat ordered list**. No page has children — the information architecture is only two levels deep.

```
/{lang}/
├─ docs/jex3.0/    overview · get-started · usage · flow[New] · structure · updating · releases · faq
├─ docs/jex2.0/    overview · get-started · usage · structure · faq
├─ docs/coach/     overview · quick-start · usage · workflow · structure · skills · agents · templates · security-gates · releases
├─ docs/idea/      overview · prerequisites · run-configs · from-scratch · verify
├─ docs/workflow/  overview · roadmap · tools · workspace · agents · demo · metrics
└─ ai-usage/       (dashboard) · guide · config
```

A doc-set switcher (dropdown) moves between sections; order is fixed by the array `['jex3.0','jex2.0','coach','idea','workflow','ai-usage']` (`Sidebar.tsx:430`).

**Today, ordering exists only as array-literal order duplicated in three hand-synchronised places** — `lib/i18n.ts` slug arrays, `Sidebar.tsx` item arrays, and content-file key order. There is no `order` field and no naming convention. Nothing enforces that the three agree except developer discipline. Introducing an explicit `order` field and reconciling the three is a required migration step.

### 5.2 Admin Console (new build)

```
Admin console
├─ Login                    Google sign-in
├─ Dashboard                recent edits · translation status at a glance
├─ Pages                    list; filter by section / language / status
│   └─ Page editor          WYSIWYG body + title · description · slug
│       └─ Preview          render exactly as readers will see it, before publish
├─ Navigation               reorder · rename · move between sections        [scenario 3]
├─ Translation status       which pages are missing or stale in km / ko
├─ Media                    upload · browse · insert images
└─ Users & roles            accounts · role assignment       [scenario 5, super admin]
```

**Dropped from MVP**: a `Sections` screen for creating whole new doc sets. Creating a section remains a developer task. This does not weaken scenario 2 — admins still create *pages* within existing sections.

**Media is a genuinely new capability.** The current site contains **zero images**; every visual is hand-authored inline SVG, and no upload, storage or asset-handling pattern exists anywhere in the codebase. It is included in MVP because the first instinct of a non-technical editor in a WYSIWYG is to paste a screenshot; without it they are blocked on day one and return to the PM, defeating the project's purpose.

**Translation status is a compensating control, not a convenience.** See §7.

---

## 6. External System Integrations

| # | System | Protocol | Direction | Notes |
|---|--------|---------|------|------|
| 1 | Google Sheets | REST + service-account JWT | Bidirectional | **Today the only persistent store in the entire application** — holds ai-usage data. To be migrated into the new database. |
| 2 | Vercel | Platform | — | Hosting, build, deploy. Retained. |
| 3 | Google Fonts | CDN | Inbound | Layout fonts |
| 4 | **Google Sign-In** | OAuth | Inbound | **New.** Replaces shared username/password. Removes password storage, reset flows and lockout from scope. `google-auth-library` is already a dependency. |
| 5 | **Database** | — | Bidirectional | **New.** Content, navigation, users, roles, ai-usage. Selection deferred to ADR-001. |
| 6 | **Object storage** | — | Bidirectional | **New.** Uploaded images. Selection deferred to ADR-001. |

`flow.team` appears in the content as *documented subject matter* about the jexmcp plugin, not as an integration of this site.

---

## 7. Non-Functional Requirements (NFR Baseline)

| Area | Requirement | Unit of Measure |
|------|---------|----------|
| Performance | Page load comparable to today's pre-rendered pages. No hard SLA. `[ASSUMED]` | ms |
| Availability | Best-effort on Vercel; no uptime commitment. `[ASSUMED]` | uptime % |
| Security | Google sign-in; 4-role ladder; HTML sanitisation on all rich content; upload type/size validation; teammate PII access-restricted | Controls in place |
| **Extensibility** | New managed entity types addable without rework *(from Q1: "next time have more")* | Architectural constraint → ADR-001 |
| **Translation integrity** | Coverage must not regress from today's **100%** | % pages complete in all 3 locales |
| Operations | Editorial audit trail (who changed which page, when); database backup | Retention policy `[ASSUMED]` |

### 7.1 The Translation-Integrity Requirement Explained

Today, translation coverage is **100%, and it is enforced by the compiler**. Because the content model types panels as `Record<Slug, ReactNode>` over a literal-union key type (`content/types.ts:21-22`), TypeScript **fails the build** if any language omits any page. Untranslated content physically cannot ship.

**A database cannot enforce this.** Moving to a database therefore *loses* a safety property currently held for free — a genuine regression, not a theoretical one.

The evidence that this matters is already on the site: the only two untranslated pages (`ai-usage/guide`, `ai-usage/config`) are precisely the two authored outside the content system, in raw JSX route files with a hand-built `PendingTranslation` fallback. Escaping the type system is exactly what produced the gap.

The **Translation status screen** (§5.2) is the deliberate compensating control. Without it, that pattern proliferates silently.

---

## 8. Constraints

| Category | Description |
|------|------|
| **Staffing** | **One person (the PM), part-time.** The dominant constraint on this project. |
| **Schedule** | No deadline. |
| Budget | None allocated; hosting continues on existing Vercel usage. |
| Technology | Existing Next.js 15 / React 19 / TypeScript stack retained as the frontend base. |
| **Encoding** | Content must never be bulk-edited with Windows PowerShell 5.1 (`Get-Content` / `-replace` / `Set-Content`) — it reads UTF-8 as the Korean system codepage and corrupts em-dashes, Korean and Khmer text (`CLAUDE.md:152`). **Binding on all migration tooling**, since the development workstation is Windows. |
| Operations | Legacy `/#slug` hash URLs must keep working (`LegacyHashRedirect.tsx:11-21`) or inbound bookmarks break. |

### 8.1 Scope Versus Capacity — Stated Plainly

The MVP in §4, plus a WYSIWYG, image upload, preview, translation status, navigation management, Google auth, roles, migration of ~14,000 lines of JSX, and moving ai-usage off Google Sheets, is **a large scope for one part-time person**.

The dominant hidden cost is the block vocabulary. Today's content uses **32 distinct block types**, plus 81 tables and 183 copyable code blocks. In a WYSIWYG, every block type requires **both an editing UI and a renderer** — 32 of them is not a content migration, it is building a small CMS.

**Decision taken (Q-block)**: cut the vocabulary to **~8–10 core blocks** (text, heading, list, table, code, callout, image, embed, steps, cards). Accepted consequence: some pages will not look exactly as they do today.

**Recommended sequencing**: migrate `jex2.0` first — the smallest doc set, 5 slugs, 534 lines — to prove the block schema end-to-end before touching the remaining ~100 panels. Then test the schema against the *hardest* content (`coach.tsx`, 1,707 lines) early, because that is where a block model breaks. Failing fast here costs weeks; failing late costs months.

---

## 9. Success Metrics (KPI)

| KPI | Target | Measurement Method |
|-----|------|---------|
| **Content changes requiring a deploy** | **0** | Count commits touching content and their associated builds. Baseline already measured: 31 content-touching commits in 8 weeks (~4/week). |
| Content changes published by someone other than the PM | > 0, then rising | Editorial audit trail — the direct test of the §2.3 value proposition |
| Translation coverage | Remains **100%** | Translation status screen; proves the §7.1 regression was contained |

---

## 10. Pre-Identified Risks / Assumptions

### Assumptions

- The existing Next.js 15 / React 19 application remains the frontend base; this is a re-platform of the content layer, not a rewrite of the site.
- Vercel remains the hosting platform.
- Re-authoring content into a reduced block vocabulary is acceptable where pages lose bespoke styling.
- Colleagues who will edit content have Google Workspace accounts usable for sign-in.
- No regulatory regime applies to this documentation platform itself. *(The systems it documents are banking/insurance; the docs platform is not a financial system. To be confirmed before phase 2.)*

### Risks

*(Refined into `docs/design/risk-register.md` in Skill 3)*

| ID | Risk | Impact | Probability |
|----|------|------|------|
| **RISK-001** | **Solo, part-time, no deadline is a stall profile.** The highest risk on this project is not technical — it is that the project never finishes. | **H** | **H** |
| RISK-002 | Reducing 32 block types to ~10 causes visible regression on pages with bespoke styling; re-authoring effort is larger than estimated | H | M |
| RISK-003 | Content is compiled JSX (`panels: Record<Slug, ReactNode>`), not data. Automated conversion may prove infeasible, forcing manual re-authoring of up to 105 panels | H | M |
| RISK-004 | Loss of compile-time translation completeness leads to silent untranslated pages (§7.1) | M | M — mitigated by the Translation status screen |
| RISK-005 | Non-technical authors plus raw-HTML blocks plus (phase 2) public readers create an XSS surface. Today `dangerouslySetInnerHTML` is safe only because one trusted author writes it for an authenticated audience | H | M — mitigated by mandatory sanitisation |
| RISK-006 | Image upload introduces a new attack surface (file type, size, storage exhaustion, content-type confusion) | M | M |
| RISK-007 | Migration tooling run under Windows PowerShell 5.1 corrupts Khmer/Korean/em-dash content (§8) | **H** | M — mitigated by tooling policy |
| RISK-008 | Slug renaming during migration breaks legacy `/#slug` inbound links (`LegacyHashRedirect.tsx`) | M | M |
| RISK-009 | **Phase 2 only** — publishing the `idea` doc set exposes the internal application portfolio: 9 system names (CHECKPAY, LOAN, LOAN_ADMIN, INSU, ELECDOC, ELECDOC_ADMIN, DUREADMIN, PLUGIN, PLUGIN_ADMIN), environment IDs, config filenames, debug ports, Tomcat versions (9.0.117 / 8.5.100) and workspace paths (`content/ideaData.ts:16-34`) | **H** | M — requires an explicit human decision, not a default |
| RISK-010 | **Phase 2 only** — ai-usage holds employee PII (per-teammate email + individual token usage). Must never be world-readable | **H** | L — mitigated by the role ladder |
| RISK-011 | Migrating ai-usage off Google Sheets is scope that does not serve the §2.3 driver; first candidate to defer if capacity tightens | M | M |
| RISK-012 | Tier B boundary shifts — more panels turn out to embed components or data bindings than the three identified | M | M |

**Reassuring finding**: every URL in the content is `localhost`. No internal hostnames or IP addresses are exposed; network topology is not leaked.

---

## 11. Technology Stack Preferences (Reference only — finalized in ADR-001)

| Area | Preference |
|------|------|
| Language / Runtime | TypeScript 5.6 / Node — retained |
| Framework | Next.js 15 (App Router) / React 19 — retained |
| Hosting | Vercel — retained |
| Authentication | Google Sign-In |
| DB | **Open** — to be compared in ADR-001 |
| Object storage | **Open** — to be compared in ADR-001 |
| **Content model** | **Block schema** (leading candidate). MDX is the alternative to be argued *against*: MDX is still code, so it would leave non-technical editors exactly as blocked as today — it would move the bottleneck, not remove it. |
| Editor library | **Open** — to be compared in ADR-001 |
| CI/CD | GitHub + Vercel — retained |

### 11.1 Rendering-Model Change Required

The current documentation route uses `generateStaticParams()` with `dynamicParams = false` (`app/[lang]/docs/[version]/[slug]/page.tsx:37-45`). **The application cannot serve a slug that was not known at build time.**

Scenario 2 ("create a page without a deploy") therefore requires changing the rendering model to on-demand ISR or SSR — not merely swapping the data source. This interacts with `generateMetadata`'s per-locale `alternates.languages` logic (`page.tsx:73-98`), which assumes the full locale set is known in advance.

A useful precedent already exists in the codebase: the `ai-usage` section runs `runtime='nodejs'` with `revalidate=60` against an external data source, which is architecturally the same shape a database-backed page needs.

---

## 12. Approvals / Governance

### Approval Gate Mapping

| Gate | Timing | Approver |
|--------|------|--------|
| G1 Analysis | Skill 2 complete | PM (Socheat-Hun) — **colleague reviews requirements first** |
| G2 Design | Skill 3 complete | PM (Socheat-Hun) — **colleague reviews design first** |
| G3 Release | Skill 5 complete | PM (Socheat-Hun) |

Gate approvals must be recorded **by a human** in `docs/.harness-state.yaml`. The AI must never record a gate approval (HARNESS-PROCESS-STANDARD §4.8 CQ3).

**Mandatory security ADR**: §6 of Skill 01 is triggered — personal data is processed (admin account names, email addresses, credentials, session and audit records; plus teammate PII in ai-usage). A **separate security ADR is therefore mandatory in Skill 3**, covering authentication, session management, role enforcement, HTML sanitisation, upload validation, and PII handling.

### Regular Reporting

| Frequency | Audience | Format |
|------|------|------|
| Per sprint | PM | md (`docs/sprints/SPRINT-N-LOG.md`) |
| At each gate | PM + reviewing colleague | md |

---

## Appendix A. Glossary

Extracted by frequency from `content/en/*.tsx`. None of the first five is defined anywhere on the site today — writers assume reader familiarity, which is itself a documentation gap worth closing.

| Term | Occurrences | Definition |
|------|------|------|
| **SVN** | 43 | Subversion — version control for the JexStudio workspace, synchronised before and after jexmcp operations |
| **JEX** | 39 | The legacy enterprise platform family this tooling automates |
| **Claude Code** | 33 | Anthropic's CLI coding agent; the host for the jexmcp plugin |
| **Tomcat** | 32 | Application server used to run JexStudio projects locally |
| **MCP** | 28 | Model Context Protocol — the tool-calling interface jexmcp exposes (14 tools) |
| **IDO** | 24 | JexStudio artifact type — domain/interface data object managed by jexmcp |
| **JexStudio** | 17 | The IDE/platform whose projects jexmcp scaffolds and automates |
| **jexmcp** | 15 | The plugin suite this documentation site describes |
| **WSVC** | 8 | JexStudio artifact type — web service component |
| **CHECKPAY** | 8 | One of the JEX-family applications |
| **flow.team** | 6 | External task-tracking tool jexmcp integrates with |
| `status` / `doctor` | 13 / 9 | jexmcp's built-in self-diagnostic commands |

## Appendix B. References / Materials

- AS-IS system: `D:\my_project\jexmcp3.0`, branch `site` (80 tracked files)
- AS-IS conventions: `CLAUDE.md` in that repository
- Content model: `content/types.ts`, `content/index.ts`, `content/ideaData.ts`
- Routing / rendering: `app/[lang]/layout.tsx`, `app/[lang]/docs/[version]/[slug]/page.tsx`, `middleware.ts`
- Navigation: `components/Sidebar.tsx`
- Auth: `lib/auth.ts`, `app/api/login/route.ts`
- ai-usage subsystem: `lib/usage/*`, `app/api/ingest/route.ts`, `components/usage/*`
- Full 12-question dialogue record: `docs/planning/questions-log.md`

### Open Items Carried Into Skill 2

| Item | Question |
|------|------|
| Editorial workflow | Does `admin` split into author (writes) vs publisher (approves)? Q1 implied a review step; the role ladder has a single editing role. |
| ai-usage granularity | "Each user sees only their own usage; admin sees all" is stricter and safer than a flat `user` role. |
| Tier boundaries | Exact per-doc-set A/B/C assignment. |
| Tier C disposition | Migrate `ai-usage/guide` and `config` into the system, or leave as code pages? |
| Session TTL | `lib/auth.ts:9` sets `SESSION_DAYS = 1`; `CLAUDE.md:172` states 30 days. One is wrong — resolve before designing the new session model. |
| NFR confirmation | §7 items marked `[ASSUMED]` need PM confirmation. |

---

**Approval History**

| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-08 | — | Draft produced from the 12-question dialogue plus AS-IS analysis of the `site` branch | PENDING |
