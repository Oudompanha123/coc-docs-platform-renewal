# Standard Validation Report (re-run after remediation) — 2026-09-08 / r2

> Baseline: `reviews/standard-validation-20260908.md` (r1, pre-remediation).
> Remediation applied via `/08-harness` audit mode, 8 of 10 items, user-approved.

## Summary
| Item | r1 (before) | r2 (after) | Δ |
|------|----|----|----|
| Mode | Project mode | Project mode | — |
| Total score | 83 / 100 | **96 / 100** | **+13** |
| Verdict | WARN | **WARN** | — (2 documentation WARNs remain) |
| Blocking issues | 0 | **0** | — |
| Warning issues | 7 | **2** | **−5** |
| LOW issues | 3 | **0** | **−3** |

## Score comparison
| Dimension | r1 | r2 | Δ | What changed |
|------|----|----|----|------|
| Completeness | 17 / 20 | **20 / 20** | +3 | §2 tree regenerated — now lists all 21 templates; set-diff against disk is empty |
| Traceability | 13 / 15 | **13 / 15** | 0 | VS-005 deferred (design doc still referenced but absent) |
| Security | 18 / 20 | **20 / 20** | +2 | VS-006 fixed — L2 no longer fails unconditionally on push/schedule, and the PR-path AI audit remains mandatory |
| Performance/automation | 8 / 10 | **10 / 10** | +2 | VS-006 + VS-009 fixed — CI green path restored, all 3 `.sh` files now mode `100755` |
| Readability/documentation | 11 / 15 | **13 / 15** | +2 | VS-002, VS-003, VS-004 fixed; VS-005 and VS-007 deferred |
| Standards compliance | 8 / 10 | **10 / 10** | +2 | VS-001 fixed (0 gitlinks in index); §4.4 table now matches all 13 agents' frontmatter exactly |
| Testing/validation | 8 / 10 | **10 / 10** | +2 | VS-006 fixed — the verification pipeline can actually pass |

## Applied items — verification evidence
| ID | Fix | Verification (tier 1, machine) | Result |
|----|-----|-------------------------------|--------|
| VS-006 | `l2-verdict` now treats `skipped` as acceptable for the PR-only `security-auditor-agent`, while still blocking a PR where that job is skipped, failed, or cancelled | Logic extracted and executed against 6 scenarios | push+skipped → PASS · schedule+skipped → PASS · PR+success → PASS · **PR+skipped → FAIL** · PR+failure → FAIL · push+cancelled → FAIL. All 6 as intended. |
| VS-001 | `git rm --cached harness-standards`; added `.gitignore` with `harness-standards/` | `git ls-files -s \| grep -c '^160000'` | `0` gitlinks in index |
| VS-004 | §4.4 regenerated from frontmatter; heading reworded to "its own declared write scope"; normative-source note added | `diff` of the 13 parsed table rows against the 13 agents' `write_dirs` | **IDENTICAL — all 13 rows match** |
| VS-003 | §2 template tree regenerated (added THREAT-MODEL, SPRINT-RETRO, INCIDENT-POSTMORTEM, HARNESS-STATE, QA-TEST-REPORT, PARITY-REPORT); header annotated "(21)" | `diff` of template basenames in tree vs. `find templates -type f` | **IDENTICAL SETS**, 21 = 21 |
| VS-002 | §10 `PACKAGE-INDEX.md` demoted from a markdown link to annotated plain text ("package root only; §2.1 does not copy it") | `grep '](PACKAGE-INDEX'` | no dangling link |
| VS-009 | `git update-index --chmod=+x` on the 3 shipped `.sh` files | `git ls-files -s -- '*.sh'` | all three `100755` |
| VS-008 | Removed empty `my-new-project/` (emptiness confirmed before deletion) | `ls -d my-new-project` | removed |
| VS-010 | §10 sg-gw `.pptx` paths annotated "internal reference, not distributed with this package" | `grep -c 'not distributed'` | `2` |

## Remaining Findings
| Level | ID | Location | Description | Recommended action | Status |
|------|----|------|------|-----------|--------|
| WARN | VS-005 | `.claude/skills/08-harness/SKILL.md:7`, `docs/HARNESS-PROCESS-STANDARD.md:522`, `templates/implementation/HARNESS-STATE.template.yaml:2` | Three assets cite `docs/specs/2026-06-12-harness-assistant-design.md`; `docs/specs/` does not exist. The 08 skill's authority chain has no retrievable source. | Cheap (~10 min): drop the 3 references, inline the rationale into §3.8. Full (~1-2 h): author the design document. | **Deferred — needs a cheap-vs-full decision** |
| WARN | VS-007 | `docs/HARNESS-PROCESS-STANDARD.md:764` | §5.8 cites "WORKFLOW-GUIDE Appendix A"; no WORKFLOW-GUIDE exists, so 07 §2.2's WORKFLOW quick-start consistency check stays unverifiable. | Cheap (~5 min): repoint the citation to the in-document §3 introduction. Full (~1-2 h): author the guide. | **Deferred — needs a cheap-vs-full decision** |

Both remaining items are documentation-reference defects. Neither blocks a gate, and neither affects executable behaviour.

## Gate Decision
- **G1 entry possible: N/A** — project is at step `00`; `docs/requirements/REQUIREMENTS-SPEC.md` not yet authored.
- **G2 entry possible: N/A** — prerequisite G1 not reached.
- **G3 entry possible: N/A** — prerequisite G2 not reached.
- **0 FAIL items.** The 2 remaining WARNs are pre-gate remediation recommendations; neither blocks entry to Skill 1.

## Notes and caveats
- **§9 change-policy caveat (requires attention)**: VS-002, VS-003, VS-004, and VS-010 modified `docs/HARNESS-PROCESS-STANDARD.md`. §9 states this standard "is changed only after **standards committee review**", and the Changelog was deliberately **not** bumped, since a version bump is a committee act. These four edits are corrections of the document to match its own already-shipped assets — no normative rule was changed — but they should still be tabled for committee ratification. Recommended committee-facing summary: *"editorial re-sync of §2, §4.4, §10 against the shipped package; no rule changes."*
- Upstream propagation: the same four document edits, plus the VS-006 CI fix and VS-009 file modes, apply to the **upstream harness package** as well as to this project copy. Applying them here does not fix the package other projects will copy from.
- Exceptions carried forward unchanged from r1: **NOTE-01** (README / PACKAGE-INDEX absence is by design in Project mode) and **NOTE-02** (write_dirs nesting is deliberate per §4.4).
- Evidence tiers (07 §3.0): every verdict above rests on **tier 1 machine verification**. No tier-3 AI self-evaluation was used as a blocking basis.
- No state file (`docs/.harness-state.yaml`) exists, so step [A-6] `last_audit` update was skipped. Creating one is the first action of `/08-harness new`.

---
**Validated by**: `code-reviewer` (lead) · support: `security-auditor`, `trace-mapper`, `docs-writer`
**Remediation dispatched by**: `team-leader` via `/08-harness` audit mode
