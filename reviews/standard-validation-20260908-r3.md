# Standard Validation Report — 2026-09-08 / r3 (pre-G1)

> Third run of the day. Prior: r1 (83, package baseline) → r2 (96, post-remediation) → **r3, the first run with actual project deliverables to validate.**
> Trigger: run immediately before a gate, per `when_to_use`. Target gate: **G1 (analysis)**.
> Read-only per §5. No file was modified by this skill.

## Summary
| Item | Value |
|------|----|
| Mode | **Project mode** (Skills 01–02 complete, pre-G1) |
| Total score | **91 / 100** |
| Verdict | **WARN** |
| Blocking issues | **0** |
| Warning issues | **5** (3 new, 2 carried from r2) |

Mode is now unambiguous — r1/r2 had to weigh both candidates. `docs/planning/` and `docs/requirements/` hold real deliverables, four commits exist, and `src/` is absent (correct for pre-implementation). Package-inventory sub-checks were run as well and all pass.

## Score
| Dimension | Score | Evidence |
|------|------|------|
| Completeness | 19 / 20 | Package intact (8 skills / 13 agents / 21 templates / 4 hook files / 2 scripts). All Skill 01–02 deliverables present: PROJECT-PROPOSAL, BUSINESS-REQUIREMENTS, REQUIREMENTS-SPEC, requirements-matrix.csv, 7 use cases, 2 dialogue logs. Deduction: VS-013 state/DoD inconsistency. |
| Traceability | 11 / 15 | Strong on substance: REQ-ID scheme applied (`FR-<area>-`, `NFR-<area>-`, `CONST-<area>-`, `UC-`), **84 requirements, 0 orphans, 0 requirements lacking a verification method, 0 duplicate IDs**, all 79 in-scope requirements cited in ≥ 1 use-case file, 30 BR-IDs carried forward from Skill 01. Deduction is entirely mechanical link integrity: **VS-011 (34 of 71 source references unresolvable) and VS-012 (2 dangling anchors)**. |
| Security | 20 / 20 | L1 installed, byte-identical to source, and **exercised on all 4 commits** (0 leaks). L2 blocks rather than TODO-passing; verdict logic fixed in r2 and re-verified. L3 requires 3-party approval with CVSS ≥ 7.0 blocking. All **4 mandatory §7 security cards issued** (NFR-SEC-AUTH / PII / OPS-AUDIT / SEC-CHANNEL), plus SANITIZE and UPLOAD. Security ADR made mandatory (CONST-SEC-01). Phase-2 disclosure gated behind an explicit human decision (BR-026). |
| Performance/automation | 10 / 10 | Hooks operational and demonstrably firing; scripts executable (r2 fix holding); CI verdict logic corrected and functionally tested across 6 scenarios. |
| Readability/documentation | 13 / 15 | Deliverables are thorough, English, and internally cross-referenced. Deduction: VS-005 and VS-007 carried over unremediated from r2. |
| Standards compliance | 9 / 10 | All 8 skills' `lead_agent`/`support_agents` resolve to real agent names — **0 unresolved references** (§2.7 FAIL condition not met). Gates G1/G2/G3 defined with approvers and deliverables. CQ1/CQ2/CQ3 criteria observed in both dialogues, with §4.8's "no unnecessary queries" rule explicitly applied (9 gaps closed by stated default rather than a question). **G1 correctly left unapproved by the AI.** Deduction: VS-013. |
| Testing/validation | 9 / 10 | 56 test scenarios specified across 7 use cases, each requirement carrying a verification method (E2E / integration / unit / security audit / load / review). Deduction: TEST-PLAN is a Skill 3 deliverable and does not yet exist — expected, not a defect. |

## Findings

| Level | ID | Location | Description | Recommended action |
|------|----|------|------|-----------|
| WARN | **VS-011** | `docs/requirements/requirements-matrix.csv` (34 rows) | **34 of 71 `source_ref` values do not resolve from any plausible base directory.** Two causes: (a) 27 rows cite `BUSINESS-REQUIREMENTS.md#BR-xxx`, but that file lives in `docs/planning/` while the matrix lives in `docs/requirements/` — the correct relative path is `../planning/BUSINESS-REQUIREMENTS.md`; (b) 4 rows cite a bare `SKILL.md#7`, which is ambiguous across 8 skill files. A further inconsistency: 20 refs resolve relative to `docs/requirements/` while 17 resolve only relative to `docs/` or the repo root — **the matrix uses at least three different base directories**. | Normalise every `source_ref` to one base (recommend: relative to the matrix's own location, matching the link style already used in REQUIREMENTS-SPEC.md). Replace bare `SKILL.md` with the full skill path. |
| WARN | **VS-012** | `requirements-matrix.csv` — rows `CONST-TECH-04`, `NFR-SEC-SESSION` | **2 genuinely dangling anchors.** `planning/questions-log.md#Q-block` — the string `Q-block` appears **0 times** in that file; the decision is recorded there under the heading "Block vocabulary decision". `questions-log.md#AMB-006` — `AMB-006` appears **0 times** in `docs/requirements/questions-log.md`; it is defined only in `REQUIREMENTS-SPEC.md` §6 (2 occurrences). | Retarget both anchors to text that exists, or add the referenced anchors to the source documents. |
| WARN | **VS-013** | `docs/.harness-state.yaml:13` vs `.claude/skills/02-define-requirements/SKILL.md:121` | **State/DoD inconsistency.** The state file records `"02": { status: done, outputs_verified: true }`, but Skill 02's own DoD line 121 requires `**G1 analysis gate passed** (PM approval)`, and G1 is `pending`. By the skill's definition, step 02 is not complete. The state file's inline comment does acknowledge this, but `status: done` overstates it. | Either introduce a distinct status (e.g. `outputs_complete`) or revert 02 to `in_progress` until G1 is recorded. Files are the source of truth (08 §3 [B-2]); the state currently disagrees with the skill definition. |
| WARN | VS-005 | `.claude/skills/08-harness/SKILL.md:20`, `docs/HARNESS-PROCESS-STANDARD.md:526`, `templates/implementation/HARNESS-STATE.template.yaml:2`, **`docs/.harness-state.yaml:2`** | Carried from r2, and **now worse**: `docs/specs/2026-06-12-harness-assistant-design.md` still does not exist, and the reference has propagated into the project's own committed state file via the template. 4 locations now, up from 3. | As r2: ship the design document, or drop the references. Fix the template too, or every future project inherits it. |
| WARN | VS-007 | `docs/HARNESS-PROCESS-STANDARD.md:775` | Carried from r2. §5.8 cites "WORKFLOW-GUIDE Appendix A"; no such document exists, so 07 §2.2's WORKFLOW quick-start check remains unverifiable. | As r2: ship it, or repoint the citation to the in-document §3 introduction. |
| NOTE | NOTE-03 | project scope | **Parity validation is N/A for this project.** §2.6 asks that parity conditions be defined; the word "parity" appears 0 times in both Skill 01 and 02 deliverables. This is correct, not an omission: the project is a rebuild plus content migration, not a 1:1 port, so byte-level equivalence is meaningless. Per §5, a criterion that does not fit the project's nature is downgraded and left as a PM-judgment item. The fitting analogue — **content-fidelity verification** — is already specified (NFR-I18N-01, FR-I18N-003, and the UC-007 test scenarios). | None. Confirm the substitution in the Skill 3 TEST-PLAN. |
| NOTE | NOTE-04 | `REQUIREMENTS-SPEC.md` §6 | `AMB-006` (session TTL: `lib/auth.ts:9` = 1 day vs `CLAUDE.md:172` = 30 days) remains open. **This does not block G1**: Skill 02's DoD permits an item to be "explicitly deferred", and it is — deferred to Skill 3 with a stated reason. It is an inherited defect in the existing system, not a gap in these requirements. | Resolve before the session model is designed (blocks NFR-SEC-SESSION). |
| NOTE | NOTE-05 | package-level | The r2 remediation (CI verdict fix, file modes, four §2/§4.4/§10 document corrections) exists **only in this project copy**. The upstream package on `origin/harness-standards` still carries every one of those defects, so the next project created from it inherits them. | Propagate the r2 fixes upstream. Outside this project's scope; recorded so it is not forgotten. |

## Gate Decision

- **G1 entry possible: YES.** All §2.2 and §2.5 preconditions are met — `docs/requirements/REQUIREMENTS-SPEC.md` exists with a REQ-ID scheme, the traceability matrix is complete with 0 orphans and 0 missing verification methods, every requirement carries a MoSCoW priority, and no `[AMBIGUOUS]` item is unresolved-and-undeferred. The 5 WARNs are pre-gate remediation recommendations; **none blocks the gate**.
  **Recommendation**: fix VS-011 and VS-012 before recording approval. They are ~20 minutes of mechanical path correction, and a traceability matrix whose references do not resolve is materially less useful at audit time — which is the matrix's entire purpose.
- **G2 entry possible: NO.** Two independent reasons: G1 is not approved, and the required deliverables (`DEV-PLAN.md`, `TEST-PLAN.md`, `adr/ADR-001-tech-stack.md`, `threat-model.md`) do not exist — they are Skill 3 outputs.
- **G3 entry possible: N/A.** Prerequisite G2 not reached.

**0 FAIL items.** No immediate-FAIL condition from §3 is present: all three gates exist with named approvers; L1/L2/L3 are all present and L1 is demonstrably firing; the L2 AI audit blocks rather than TODO-passing; no CVSS ≥ 7.0 defect exists (no code yet); secret-scan bypass requires an `APPROVED` evidence file; a destructive-operation approval policy exists (§4.7).

## Notes

- The `seed.yaml` / bootstrap approach is excluded from the current standard harness's required flow. Re-verified: it appears only as an explicit exclusion statement and within 07's own criteria text.
- **False positives recorded as exceptions**: NOTE-03 (parity N/A by project nature, §5 downgrade) and NOTE-04 (AMB-006 is an explicit deferral permitted by Skill 02's DoD, not an unresolved blocker). Carried forward from r2 and still valid: NOTE-01 (README/PACKAGE-INDEX absence is by design in Project mode) and NOTE-02 (write_dirs nesting is deliberate per §4.4).
- **A methodological note on this run.** VS-011 and VS-012 are defects in the Skill 02 deliverable produced earlier in this same session. The first automated pass at checking them used an incorrect base-directory assumption and produced a misleading result; the check was rerun against both plausible bases before anything was recorded here. Findings rest on the corrected run.
- Evidence tiers (§3.0): every finding is **tier 1 machine verification** — file existence, path resolution, `grep` counts, frontmatter parsing, CSV field extraction, `diff`. No tier-3 AI self-evaluation was used as a verdict basis. The dimension scores in the Score table are themselves tier 3 and are a reference metric, not a blocking basis.
- Per §5, this report modified nothing. VS-011, VS-012 and VS-013 are separated into distinct remediation work.

---
**Validated by**: `code-reviewer` (lead) · support: `security-auditor`, `trace-mapper`, `docs-writer`
**Method**: read-only inspection of the working tree, git index and history, installed hooks, and mechanical resolution of all 71 traceability references
