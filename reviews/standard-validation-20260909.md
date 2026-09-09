# Standard Validation Report — 2026-09-09 / r4

> Prior runs: r1 (83, package baseline) · r2 (96, post-remediation) · r3 (91, pre-G1)
> Trigger: **harness change** — standard 1.5 → 1.6, a ninth skill added. Run per `when_to_use`.
> Read-only per §5. Nothing was modified by this skill.

## Summary
| Item | r3 (2026-09-08) | r4 (2026-09-09) |
|------|----|----|
| Mode | Project | Project |
| Total score | 91 / 100 | **94 / 100** |
| Verdict | WARN | **WARN** |
| Blocking issues | 0 | **0** |
| Warning issues | 5 | **4** |

## Score
| Dimension | Score | Evidence |
|------|------|------|
| Completeness | 20 / 20 | **9 skills · 13 agents · 21 templates · 4 hook files · 3 scripts** — all present. Every Skill 01–03 deliverable exists, plus 8 ADRs, 7 use cases, CONTRIBUTING.md. |
| Traceability | 15 / 15 | 88 matrix rows, **0 orphans**, 0 missing verification methods. The r3 reference defects stay fixed — all `source_ref` values resolve. Threat model: 26 rows, **0 orphan threats**. |
| Security | 18 / 20 | L1 gitleaks firing on every commit; **L2 CI finally activated** after sitting unused since setup; pre-push branch guard present and tested; Maven Enforcer pinning Java 21, verified both ways. Deduction: VS-014 — the guard protects 1 machine of 6. |
| Performance/automation | 10 / 10 | Both workflows installed and targeting `main`/`dev`; `core.hooksPath` makes hooks versioned rather than hand-copied; installer checks the toolchain at setup. |
| Readability/documentation | 13 / 15 | Deduction: VS-005 and VS-007 still open from r2. |
| Standards compliance | 8 / 10 | Skill frontmatter → agent resolution: **0 unresolved across all 9 skills**. §3.0 owner table has 9 rows; §3.x has 9 skill sections; version 1.6 consistent across standard, state file and template. G1 and G2 approved, G3 correctly `not_reached`. Deduction: VS-015 — two unratified changes to the standard. |
| Testing/validation | 10 / 10 | TEST-PLAN v2.0 covering two suites, contract testing, and direct-API negative tests. 7 use cases, 56+ test scenarios. |

**Total: 94 / 100 → WARN**

## Findings

| Level | ID | Location | Description | Recommended action |
|------|----|------|------|-----------|
| WARN | **VS-014** | `.githooks/` · 5 developer machines | **The push guard protects one machine of six.** `core.hooksPath = .githooks` is set here; nobody else has run `scripts/install-hooks.sh`. Git hooks are per-clone configuration, not repository state, so pulling the repo does **not** activate them. Compounding this: the GitHub ruleset was created correctly but **is not enforced** — rulesets do not apply to private repositories on a personal Free account. Right now the only thing preventing a direct push to `main` is a script five people have not run. | Post the setup instruction to the team. Longer term, move the repo to a GitHub Team organisation, where the ruleset would enforce server-side and machine configuration stops mattering. |
| WARN | **VS-015** | `docs/HARNESS-PROCESS-STANDARD.md` changelog | **Two changes to the standard remain unratified.** §9 states the standard changes only after standards-committee review. Neither has had one: (1) the 2026-09-08 editorial re-sync of §2/§4.4/§10 against shipped assets, (2) today's 1.5 → 1.6 addition of `09-dev-workflow`. Both are recorded honestly — the changelog entry says "Not yet ratified" — but they are live in a document other projects will copy. | Table both together at the next committee conversation. Neither is disputed on content; the gap is procedural. |
| WARN | VS-005 | 4 locations | Carried from r2/r3, unchanged. `docs/specs/2026-06-12-harness-assistant-design.md` is cited by the 08 skill, the standard §3.8, the HARNESS-STATE template and the project's own state file. It does not exist. | Ship the document, or drop the four references. |
| WARN | VS-007 | `HARNESS-PROCESS-STANDARD.md` §5.8 | Carried from r2/r3. Cites "WORKFLOW-GUIDE Appendix A"; no such document exists. | Ship it, or repoint the citation to §3. |
| NOTE | NOTE-06 | changelog line 934 | The v1.3 entry says "8 skills". **Correct for its date and deliberately left alone** — §2.7 exempts historical mentions, and editing a changelog to match the present would falsify the record. Recorded so a future run does not flag it. | None. |
| NOTE | NOTE-07 | `07-validate-standard/SKILL.md` §2.1 | This run validated a skill whose own criteria were edited hours earlier (8 → 9 skills, and the frontmatter check extended to `09-dev-workflow`). Self-referential, and worth stating: had the criteria not been updated, r4 would have reported drift the same author created. They were updated in the same commit as the skill. | None. Noted for transparency. |

## Gate Decision

- **G1: APPROVED** 2026-09-08.
- **G2: APPROVED** 2026-09-09 — against the rebuilt design, after being reverted when the stack changed. Both record `recorded_by` provenance rather than implying direct human entry.
- **G3: N/A** — not reached. Blocked correctly: no implementation exists yet, and 8 threats at CVSS ≥ 7.0 are designed-but-unverified, which is a G3 condition (threat-model §4.1).

**0 FAIL.** No §3 immediate-FAIL condition present: three gates exist with approvers; L1/L2/L3 all present, and L1 is demonstrably firing; the L2 AI audit blocks rather than TODO-passing; no unresolved CVSS ≥ 7.0 *verified* defect; secret-scan bypass requires an `APPROVED` evidence file; destructive-operation policy exists.

## Notes

- **Why the score rose 91 → 94**: r3's traceability defects (VS-011, VS-012) were fixed, CI went from absent to installed, and the toolchain is now enforced by the build rather than by asking people. Offset by VS-014 and VS-015, both new.
- **Exceptions carried forward**: NOTE-01 (README/PACKAGE-INDEX absence is by design in Project mode), NOTE-02 (write_dirs nesting deliberate per §4.4), NOTE-03 (parity N/A — rebuild, not a port), NOTE-04 (AMB-006 resolved 2026-09-09: session TTL 1 day).
- **Evidence tiers (§3.0)**: every finding rests on **tier 1 machine verification** — file counts, frontmatter parsing, `grep`, `git config`, resolution checks. The dimension scores are tier 3 and are a reference metric, not a blocking basis.
- Per §5, nothing was modified. VS-014 and VS-015 are separated into distinct work.

---
**Validated by**: `code-reviewer` (lead) · support: `security-auditor`, `trace-mapper`, `docs-writer`
**Method**: read-only inspection of the working tree, git config, installed hooks, workflows, and every stated count in the standard against the actual file tree
