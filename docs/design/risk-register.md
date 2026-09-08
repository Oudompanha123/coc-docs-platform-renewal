# Risk Register — Coc Docs Platform

> **Version**: 1.0 · **Date**: 2026-09-08 · **Owner**: PM (Socheat-Hun)
> **Preceding**: [PROJECT-PROPOSAL.md §10](../planning/PROJECT-PROPOSAL.md) (12 risks drafted) — refined and extended here
> **Related**: [threat-model.md](threat-model.md) (security threats, CVSS-scored) · [DEV-PLAN.md §7](DEV-PLAN.md) (scope levers)
> **Count**: 16 (minimum 10 required, Skill 03 §4 `[basis:sg-gw-retrospective,adjustable]`)

Security threats are tracked separately in the threat model with CVSS v3.1 scores. This register covers **project** risks; only security risks with project-level consequences are duplicated here.

---

## Heat Map

| | **Impact H** | **Impact M** | **Impact L** |
|---|---|---|---|
| **Prob H** | **RISK-001** | RISK-011 | — |
| **Prob M** | RISK-002, 003, 005, 007 | RISK-004, 006, 008, 010, 012, 013, 015 | RISK-016 |
| **Prob L** | RISK-009, 014 | — | — |

---

## RISK-001 — The project stalls
- **Area**: Staffing
- **Impact**: H · **Probability**: H
- **Response strategy**: Mitigate
- **Description**: One part-time developer, no deadline, no external accountability (CONST-RES-01). The largest risk on this project is not technical failure — it is that work simply stops, leaving a half-migrated system that is worse than either endpoint.
- **Response plan**: Every sprint ends in something usable (DEV-PLAN §4). Sprint 1 delivers five editable pages, so value lands early rather than at the end. Coexistence (DEV-PLAN §5) means an abandoned project degrades to "some doc sets migrated" rather than "broken site". Scope levers named in advance (DEV-PLAN §7) so cutting is a decision, not a crisis.
- **Owner**: PM
- **Monitoring checkpoint**: End of every sprint — if two consecutive sprints slip with no commits, invoke the scope levers.

## RISK-002 — Vocabulary reduction causes visible regression
- **Area**: Technology
- **Impact**: H · **Probability**: M
- **Response strategy**: Accept (with verification)
- **Description**: 32 block structures collapse to 10 (ADR-010). `hero`, `eyebrow`, `badge-gate` and other decorative treatments are lost; `.tree` diagrams degrade to monospace code blocks. Some pages will not look as they do today.
- **Response plan**: Accepted deliberately at the Q-block-vocabulary decision — it is the price of an editor one person can build. Sprint 2 measures the actual damage on the hardest content before mass migration. If `.tree` proves important, an 11th block type is the named remedy.
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 2 exit — side-by-side comparison of migrated `coach` pages against the live site.

## RISK-003 — Automated conversion proves infeasible
- **Area**: Technology
- **Impact**: H · **Probability**: M
- **Description**: Content is compiled JSX with interleaved expressions, template-literal hrefs, `.map()` calls and `dangerouslySetInnerHTML`. A converter may handle common cases only, leaving up to 105 panels needing manual re-authoring.
- **Response strategy**: Mitigate
- **Response plan**: Sprint 1 hand-migrates 15 versions *before* any converter is written, so the converter is built from evidence rather than guesswork. Sprint 6 budgets manual review of **every** panel regardless — automation is treated as an accelerator, not a substitute. TEST-PLAN content-fidelity verification catches what conversion drops.
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 1 retro — record actual time per panel and extrapolate to 105.

## RISK-004 — Silent loss of translation completeness
- **Area**: Technology
- **Impact**: M · **Probability**: M
- **Description**: Today `tsc` fails the build if any locale lacks any page, which is why coverage is 100%. A database cannot enforce that. The pattern is already proven: the only two untranslated pages on the site are the two authored outside the content system.
- **Response strategy**: Mitigate
- **Response plan**: FR-I18N-003 translation status screen as the compensating control; NFR-I18N-01 makes coverage measurable; FR-I18N-006 warns on publishing an incomplete page. Staleness derived, not flagged (ADR-003 §5), so it cannot drift.
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 4 exit and every sprint thereafter — coverage must read 100%.

## RISK-005 — Stored XSS via authored content
- **Area**: Security
- **Impact**: H · **Probability**: M
- **Description**: Non-technical authors submit content that is rendered to other users. Today's `dangerouslySetInnerHTML` usage is safe only because one trusted person writes it for an authenticated audience; both halves of that assumption end.
- **Response strategy**: Mitigate
- **Response plan**: Structural, not filter-based — ADR-010 §3 removes raw HTML from the model entirely, so there is no field in which markup is legal. Per-block-type allowlist sanitisation (ADR-011). The tiered "escape hatch" variant was considered and rejected precisely because it reintroduces this. See threat-model TM-010.
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 5 security tests; every editor-feature change thereafter.

## RISK-006 — Upload becomes an attack surface
- **Area**: Security
- **Impact**: M · **Probability**: M
- **Description**: Image upload is entirely new — zero images exist today and no upload, storage or validation pattern exists to inherit.
- **Response strategy**: Mitigate
- **Response plan**: Three-signal validation — declared type, sniffed content type, size — plus storage outside any executable path (NFR-SEC-UPLOAD, ADR-011). SVG handled as a special case, since it is a scriptable format.
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 4 security tests.

## RISK-007 — Encoding corruption during migration
- **Area**: Technology
- **Impact**: H · **Probability**: M
- **Description**: Windows PowerShell 5.1 reads UTF-8 as the Korean system codepage and corrupts em-dashes, Korean and Khmer text (CLAUDE.md:152). The development workstation is Windows, and ~9,000 lines of km/ko content will pass through migration tooling.
- **Response strategy**: Avoid
- **Response plan**: CONST-OPS-01 forbids PowerShell 5.1 for bulk content operations outright. Tooling uses Git Bash or Node with explicit UTF-8. TEST-PLAN mandates round-trip verification on every conversion batch. Corruption is often invisible on inspection, so verification is automated, not eyeballed.
- **Owner**: PM
- **Monitoring checkpoint**: Every migration batch — byte-level round-trip check before commit.

## RISK-008 — Database becomes a single point of failure for reading
- **Area**: Technology
- **Impact**: M · **Probability**: M
- **Description**: Today's pages are pre-rendered and survive a total backend outage. Once content is database-backed, a Supabase outage takes documentation offline — a capability regression.
- **Response strategy**: Mitigate
- **Response plan**: NFR-AVAIL-02 requires published pages to remain servable from cache during database unavailability. Failure-injection test in TEST-PLAN. NFR-AVAIL-01 commits to no SLA, so expectations stay honest.
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 7 failure-injection drill.

## RISK-009 — Loss of content history and backup
- **Area**: Technology
- **Impact**: H · **Probability**: L
- **Description**: Content currently lives in git, backed up implicitly on every push to every clone, with full history and rollback. Migration removes all of that at once.
- **Response strategy**: Mitigate
- **Response plan**: FR-CONT-012 versioning (≥20 versions, NFR-OPS-VERSION), NFR-OPS-BACKUP daily backup with a **restore drill before go-live** — the drill is the requirement, not the backup config. CONST-OPS-03 keeps the `site` branch deployable until sign-off.
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 7 restore drill — must actually be performed, not assumed.

## RISK-010 — Editor choice proves wrong after content is migrated
- **Area**: Technology
- **Impact**: M · **Probability**: M
- **Description**: BlockNote won by 2.7% over TipTap (ADR-001) — inside the noise of a subjective scale. Content is stored in its block format, so reversing the decision after mass migration means migrating 105 panels twice.
- **Response strategy**: Mitigate
- **Response plan**: Sprint 1 and 2 exist to expose this while it is 5–15 pages rather than 105. Block JSON (ADR-010) is defined as a project schema rather than adopted wholesale from the library, limiting coupling. Exit criteria in Sprint 2 explicitly permit "this ADR is wrong — stop and revise".
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 2 exit — go/no-go on the content model.

## RISK-011 — Scope grows beyond one part-time person
- **Area**: Schedule
- **Impact**: M · **Probability**: H
- **Description**: MVP already spans a WYSIWYG, image upload, preview, translation status, navigation management, Google auth, roles and a 105-panel migration. "Next time have more" was stated as an expectation at Q1.
- **Response strategy**: Mitigate
- **Response plan**: Scope levers pre-named and pre-ordered (DEV-PLAN §7), with the non-cuttable set stated explicitly. Phase-2 boundary already drawn: public access, search, section CRUD, review workflow and ai-usage migration are all `Won't`.
- **Owner**: PM
- **Monitoring checkpoint**: Every sprint planning — new requests go to phase 2 by default.

## RISK-012 — Tier B boundary shifts
- **Area**: Technology
- **Impact**: M · **Probability**: M
- **Description**: Three panels are known to embed components or bind to shared data. More may surface during migration, each needing an embed registration or a code component rather than a block.
- **Response strategy**: Accept
- **Response plan**: The `embed` block generalises to any registered component, so additional cases are registrations rather than redesign. Sprint 2 deliberately migrates `workflow.tsx` and `idea.tsx` — the two known-hard files — to surface the real boundary early.
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 2 and Sprint 6 per-panel review.

## RISK-013 — NFR-USE-01 fails at the end
- **Area**: Staffing
- **Impact**: M · **Probability**: M
- **Description**: The project's central requirement is a human task test. If first attempted in Sprint 7, a failure means rework of the editor after everything is built — the most expensive possible moment to learn it.
- **Response strategy**: Mitigate
- **Response plan**: A dry run is scheduled in **Sprint 2**, not Sprint 7. Identifying the specific colleague is a **Sprint 1** task (DEV-PLAN §8) — the requirement cannot be validated without a named, willing person.
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 2 dry run; repeat each shippable slice.

## RISK-014 — Google OIDC outage locks everyone out
- **Area**: External
- **Impact**: H · **Probability**: L
- **Description**: Google is the sole authentication path. FR-AUTH-002 forbids stored passwords, so there is no local fallback by design.
- **Response strategy**: Accept
- **Response plan**: Accepted deliberately — a fallback would reintroduce credential handling, which is the main thing Google sign-in removes from scope. Documented in UC-004 E-5 and ADR-008. Readers are unaffected once phase 2 makes public pages anonymous.
- **Owner**: PM
- **Monitoring checkpoint**: Reviewed at phase-2 planning.

## RISK-015 — Slug or URL changes break inbound links
- **Area**: External
- **Impact**: M · **Probability**: M
- **Description**: Admins can rename slugs and move pages between sections. Existing bookmarks, and legacy `/#slug` hash URLs from a prior site generation, must keep working.
- **Response strategy**: Mitigate
- **Response plan**: `page_slug_history` with permanent redirects (ADR-003 §7, FR-READ-003); legacy hash resolution preserved (FR-READ-002, CONST-OPS-02). Internal links stored as page references, not strings, so renames cannot break them (ADR-003 §6).
- **Owner**: PM
- **Monitoring checkpoint**: Sprint 3 (rename) and Sprint 7 (cutover) E2E tests.

## RISK-016 — Phase-2 disclosure exposes the internal portfolio
- **Area**: Security
- **Impact**: L (MVP) / H (phase 2) · **Probability**: L
- **Description**: The `idea` doc set publishes 9 internal system names, environment IDs, config filenames, debug ports and Tomcat versions. In phase 2 a visibility setting could expose this publicly by default. ai-usage additionally holds employee PII.
- **Response strategy**: Avoid
- **Response plan**: BR-026 requires an explicit human decision before any page becomes `guest`-visible — the default must never be "public". MVP keeps everything behind login, so this is not live yet. Threat model TM-020/TM-021 require re-review before phase 2 ships.
- **Owner**: PM
- **Monitoring checkpoint**: Phase-2 planning gate — mandatory threat-model re-review.

---

## Review Cadence

| When | What |
|---|---|
| Every sprint retro | Re-score probability on RISK-001, 003, 011, 013 |
| Sprint 2 exit | Go/no-go on RISK-002, 010, 012 (content model) |
| Sprint 7 | Verify RISK-008, 009 mitigations by drill, not by assertion |
| Phase-2 planning | Full re-review, mandatory for RISK-016 |
