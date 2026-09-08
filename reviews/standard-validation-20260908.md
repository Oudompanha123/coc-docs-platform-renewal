# Standard Validation Report — 2026-09-08

## Summary
| Item | Value |
|------|----|
| Mode | **Project mode** (freshly set up, pre-Skill-1) — Package inventory sub-checks also applied |
| Total score | **83 / 100** |
| Verdict | **WARN** |
| Blocking issues | 0 |
| Warning issues | 7 (+3 LOW) |

### Mode determination (07 §1 — ambiguous, both candidates recorded)
| Candidate | Evidence for | Evidence against |
|-----------|--------------|------------------|
| Package mode | `.claude/skills/`, `templates/`, `hooks/`, `scripts/` all present at root | `HARNESS-PROCESS-STANDARD.md` sits in `docs/`, not root; `README.md` / `PACKAGE-INDEX.md` absent |
| **Project mode (selected)** | Layout matches the §2.1 quick-start copy result exactly (`docs/HARNESS-PROCESS-STANDARD.md`, `.claude/`, `templates/`, `hooks/`, `scripts/`); `git init` done; L1 hook installed at `.git/hooks/pre-commit`; residual `harness-standards` clone reference and empty `my-new-project/` | No project deliverables yet (`docs/planning/`, `src/` absent) — consistent with step `00` |

**Consequence of this determination**: `README.md` and `PACKAGE-INDEX.md` are **not** copied by the §2.1 quick-start (it copies only `.claude/`, the standard doc, `templates/`, `hooks/`, `scripts/`). Their absence here is therefore **by design, recorded as an exception — not a FAIL**. See NOTE-01.

## Score
| Dimension | Score | Evidence |
|------|------|------|
| Completeness | 17 / 20 | Inventory complete and machine-verified: 8 skills, 13 agents, 21 templates, 3 hook levels, 2 scripts. Deduction: §2 structure tree is stale vs. the actual tree (VS-003). |
| Traceability | 13 / 15 | REQ-ID scheme (`FR-001` / `NFR-AUTH-01`, §3.2), `// source:` and `// req:` rules (§5.1, §5.7), mandatory-ADR table plus `templates/design/ADR.template.md`, and `templates/implementation/TRACE-CSV.template.csv` all present. Deduction: the design document referenced by three assets is missing (VS-005). |
| Security | 18 / 20 | L1 installed and byte-identical to source (`diff` clean), `gitleaks` on PATH, bypass requires an `APPROVED` evidence file plus a syslog audit entry. L2 covers gitleaks / OWASP DC `--failOnCVSS 7` / SBOM / license denylist / lockfile / CodeQL, and the AI audit **explicitly blocks rather than passing as TODO** (`hooks/ci-security-auditor.yml:161-163`). L3 requires PM + information security + operations, with CVSS ≥ 7.0 as a blocking item. Destructive-operation approval policy present (§4.7). REJECT criteria present in `code-reviewer.md:56-68` and `security-auditor.md:67`. Deduction: VS-006. |
| Performance/automation | 8 / 10 | `parity-check.sh`, `generate-codecs.sh`, plus scheduled and PR-triggered CI. Deductions: VS-006 (L2 always fails on `push`), VS-009 (scripts not executable in the index). |
| Readability/documentation | 11 / 15 | 897-line standard, fully English, tables and basis tags throughout. Deductions: broken or dangling references VS-002, VS-005, VS-007; stale tree VS-003. |
| Standards compliance | 8 / 10 | Skill frontmatter ↔ §3.0 owner table match on **all 8 skills, 100%**; every `lead_agent` / `support_agents` reference resolves to a real agent `name:` field (including `team-leader`, declared inside `_team-leader.md`); all 13 agents declare `write_dirs`; no deprecated aliases (`java-porter`, `parity-tester`); no `seed.yaml` / bootstrap in the mandatory flow. Deductions: VS-001 (broken gitlink), VS-004 (§4.4 table drift and self-contradiction). |
| Testing/validation | 8 / 10 | TEST-PLAN / QA-TEST-REPORT / PARITY-REPORT / CROSS-VALIDATION templates present; coverage 80/70 tagged `[basis:industry-convention]`; cross-vendor cross-validation mandatory (§5.8). No project tests yet — N/A at step 00, not penalized. Deduction: shared with VS-006. |

**Total: 83 / 100 → WARN**

## Findings
| Level | ID | Location | Description | Recommended action |
|------|----|------|------|-----------|
| WARN | VS-001 | git index | `harness-standards` is staged as a **gitlink (mode 160000, `7c306c8…`)** with no `.gitmodules` and no working-tree content. A clone of this repo yields a broken submodule pointer to an object this repo does not contain. | `git rm --cached harness-standards`, then add `harness-standards/` to `.gitignore` — it is the upstream clone, not a project deliverable. |
| WARN | VS-002 | `docs/HARNESS-PROCESS-STANDARD.md:870` | §10 links `[PACKAGE-INDEX.md](PACKAGE-INDEX.md)`, which resolves to `docs/PACKAGE-INDEX.md` — nonexistent in both the package and the project layout. A dangling link in the master definition document. | Correct the link to the package-root-relative path, or annotate it "package only — not copied into projects". |
| WARN | VS-003 | `docs/HARNESS-PROCESS-STANDARD.md:73-145` | The §2 structure tree lists **15 templates**; the package ships **21**. Missing from the tree: `design/THREAT-MODEL`, `implementation/HARNESS-STATE`, `implementation/INCIDENT-POSTMORTEM`, `implementation/SPRINT-RETRO`, `qa/PARITY-REPORT`, `qa/QA-TEST-REPORT`. §10 and §3.7 both correctly state "21 templates" — the tree contradicts them. | Regenerate the §2 tree from the actual file listing. |
| WARN | VS-004 | `docs/HARNESS-PROCESS-STANDARD.md:565-580` | The §4.4 write-permission table has drifted from agent frontmatter, and its heading contradicts its own content ("only its own **single** write directory" above rows listing 2-3 directories). Missing rows: `team-leader`, `adapter-builder`, `data-model-designer` (only 10 of 13 listed). Mismatched rows: `architect` (doc says `docs/design/adr/`, actual `docs/design/`), `backend-developer` (`src/` vs. `src/main/`), `qa-engineer` (missing `tests/`), `trace-mapper` (missing `docs/requirements/`). | Regenerate the §4.4 table from the 13 agents' `write_dirs`, and reword the heading to "its own declared write scope". |
| WARN | VS-005 | `.claude/skills/08-harness/SKILL.md:7`, `docs/HARNESS-PROCESS-STANDARD.md:522`, `templates/implementation/HARNESS-STATE.template.yaml:2` | Three assets cite `docs/specs/2026-06-12-harness-assistant-design.md` as the authoritative design document; `docs/specs/` does not exist. The 08 skill's stated rationale has no retrievable source. | Ship the design document, or drop the three references and inline the needed rationale into §3.8. |
| WARN | VS-006 | `hooks/ci-security-auditor.yml:169-186` | `l2-verdict` runs with `if: always()` and requires every `needs` result to equal `"success"`, but `security-auditor-agent` is gated `if: github.event_name == 'pull_request'`. On the `push` triggers to `main`/`develop` that job is **skipped**, so its result is `"skipped"` and **L2 fails unconditionally on every push**. The Monday `schedule` run is affected identically. | Treat `skipped` as acceptable for that job (e.g. `!= 'success' && != 'skipped'`), or make `l2-verdict`'s dependency list event-dependent. |
| WARN | VS-007 | `docs/HARNESS-PROCESS-STANDARD.md:764` | §5.8 cites "WORKFLOW-GUIDE Appendix A" for the AI-tool-neutrality procedure. No WORKFLOW-GUIDE exists in the package or this project, so 07 §2.2's WORKFLOW quick-start consistency check is unverifiable. | Ship the WORKFLOW-GUIDE, or replace the citation with the in-document §3 introduction. |
| LOW | VS-008 | `my-new-project/` | Empty directory at project root — a leftover from the §2.1 quick-start. Holds no content and is untracked (git does not track empty directories). | Delete it, or adopt it as the actual project root and re-run setup there. |
| LOW | VS-009 | git index | `hooks/pre-commit-gitleaks.sh`, `scripts/parity-check.sh`, and `scripts/generate-codecs.sh` are all mode `100644` in the index. The quick-start `chmod +x`s only the copied pre-commit hook, so `scripts/*.sh` are never made executable. (L2's AI-audit step enforces an `-x` check on its own script — the same class of failure.) | Run `git update-index --chmod=+x` on the three `.sh` files. |
| LOW | VS-010 | `docs/HARNESS-PROCESS-STANDARD.md:876-877` | §10 references `societe_generale_gw/docs/submission/*.pptx` — paths outside the package, unresolvable for any adopting project. | Annotate them "internal reference — not distributed", or remove. |
| NOTE | NOTE-01 | root | `README.md` / `PACKAGE-INDEX.md` absent. **Recorded as an exception, not a finding**: §2.1 does not copy them into a project. 07 §2.1/§2.2's README/PACKAGE-INDEX cross-checks are therefore **N/A in Project mode**, and are the only inventory checks not executed in this run. | None. Re-run 07 against the package root to exercise those checks. |
| NOTE | NOTE-02 | agents' `write_dirs` | Nested overlaps exist (`docs/` ⊃ `docs/design/`, `docs/requirements/`, `docs/sprints/`; `reviews/` ⊃ `reviews/leader-reports/`). Under 07 §2.3 these would be WARN, **but §4.4 documents them as deliberate nested ownership with rationale** ("it is not a conflict unless two agents write to the same **file**"). Excepted. | None. |

## Gate Decision
- **G1 entry possible: N/A** — the project is at step `00`; `docs/requirements/REQUIREMENTS-SPEC.md` has not been authored. No gate is blocked by a FAIL.
- **G2 entry possible: N/A** — prerequisite G1 not reached.
- **G3 entry possible: N/A** — prerequisite G2 not reached.
- **0 FAIL items.** All 7 WARNs are pre-gate remediation recommendations; none blocks entry to Skill 1.

## Notes
- The `seed.yaml` / bootstrap approach is excluded from the current standard harness's required flow. Verified: it appears only as an explicit *exclusion* statement (`docs/HARNESS-PROCESS-STANDARD.md:507,509,889`) and within 07's own criteria text — never as an active flow.
- False positives recorded as exceptions with rationale: **NOTE-01** (README / PACKAGE-INDEX absence is by design in Project mode) and **NOTE-02** (write_dirs nesting is deliberate per §4.4).
- Blocking-decision evidence tiers (07 §3.0): every finding above rests on **tier 1 machine verification** (file existence, `git ls-files -s`, `diff`, `grep`, frontmatter parsing). No tier-3 AI self-evaluation was used as a verdict basis.
- Per 07 §5, this report makes **no modifications**. Remediation is separate work, handed to `/08-harness` audit mode.

---
**Validated by**: `code-reviewer` (lead) · support: `security-auditor`, `trace-mapper`, `docs-writer`
**Method**: read-only inspection of the 47 tracked files, the git index, and the installed hooks
