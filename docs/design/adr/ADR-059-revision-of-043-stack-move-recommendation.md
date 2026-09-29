# ADR-059: A Connected Local Model May Now Recommend a Target Stack — Reviewable, Optional, Never Applied Automatically

> **Status**: PROPOSED
> **Date**: 2026-09-29
> **Author**: backend/frontend (paired), on the PM's explicit instruction
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Revises [ADR-043](ADR-043-local-claude-analysis.md) (removes its "do not recommend a target stack; that is a decision a person makes later" prompt rule for one specific, opt-reviewed field).

---

## 1. Context

ADR-043 drew a hard line: analysis describes what a project runs on *today*
(`runningOnToday`), and never suggests what it should move to. Plan → Stack
move's own `newTarget` field has always started blank — matching
`CodeRenewalPlatform.html`'s reference prototype in structure (a per-layer
old/new row, a free-text or pill-picked target) but not in content, since
that prototype's `to`/`options`/`why` values are a fixed, fictional
nine-layer catalogue (e.g. `{layer:"Runtime", from:"Node 12", to:"Node 22
LTS", options:[...], why:"..."}`), invented once for a demo and never
computed from anything real.

The PM's instruction that prompted this ADR is direct: **use AI to
recommend the target stack** — the reference prototype's own example is
"Old Runtime: Node.js 12 → Recommended New Runtime: Node.js 22 LTS" — **and
let the user review and change the recommendation, or ignore it and choose
their own target instead.** The recommendation must be optional in both
directions: offering none is fine when the model is not confident, and a
person is never forced to accept one that is offered.

A follow-up instruction (same day) sharpened this further: **every
architectural layer must get a recommendation attempt, every time** — not a
list that silently omits layers the model was unsure about. Silence and "no
recommendation" are not the same thing to someone reading the screen; §2's
design was revised (v1.1, still pre-approval) so the model reports one entry
per layer regardless, explicitly saying "not confident enough" (as a real
JSON `null`, not an invented value) rather than leaving nothing behind.

This is a real reversal of a previous, deliberate decision, not an
extension of an unaddressed gap — hence a revision ADR rather than a plain
feature note.

- Related requirements: FR-AXR (AX Renewal workspace)
- Related risks: a recommendation that looks like a decided fact rather
  than a hint; a fabricated technology/version presented with the same
  confidence as a real one; losing the "never fabricate" posture every
  other analysis field in this feature already holds itself to

## 2. Decision

> **`LocalClaudeAnalyzer`'s prompt gains a new, separate output field,
> `recommendedStackMove` — exactly one entry per `runningOnToday` layer,
> every time, each carrying a `recommendedTarget` (a real successor, or JSON
> `null` when the model is not confident), zero or more `alternativeTargets`,
> and a `why` either way. `runningOnToday` itself keeps describing only the
> present, unchanged. The recommendation is persisted alongside the rest of
> the analysis, returned to the frontend, and shown in Plan → Stack move as
> a hint beside each layer's target field — either the recommendation, or a
> plainly stated reason there isn't one; never silence. Never written into
> the target field automatically, never required, and always changeable.**

### Key Choices

- **A new field, not a loosened rule on an old one.** `runningOnToday`
  keeps its original "describe only the present" contract untouched — the
  recommendation lives in its own array, matched back to a layer by
  `layerKey` repeating that layer's own `runningOnToday[].label` exactly.
  A caller that only wants "what runs today" (nothing currently depends on
  this, but the contract matters) is unaffected.
- **Grounded, not invented.** The prompt requires the model to name only a
  real, currently-maintained technology it is actually confident exists —
  a well-known LTS/stable release over the newest possible one unless the
  project's own evidence points somewhere specific.
- **Always attempted, never silently skipped — `null` is a real answer, not
  an omission.** `recommendedStackMove`'s length must equal
  `runningOnToday`'s: the model reports on every layer, setting
  `recommendedTarget` to `null` (not an empty string, not a guess) when it
  is not confident, with `why` saying briefly what would be needed to be
  confident. `normalizeRecommendedStackMove` (backend) only drops an entry
  for a missing `layerKey` — a missing/blank/`null` `recommendedTarget` is
  preserved as `null`, the same honest "not confident" answer, not treated
  as malformed. This needed one Jackson-specific fix along the way:
  `NullNode.asText()` returns the literal string `"null"`, not an empty
  string, so every string field is read through a small `textOr` helper
  that checks `isTextual()` first — otherwise a model correctly following
  the prompt (`recommendedTarget: null`) would have shown up on screen as
  the word "null".
- **Connected-model only, same gating as `moduleCoupling`/`fileLayout`.**
  The keyword-stub path (no local Claude Code installed) always reports
  `[]` — a fixed, small keyword-to-version lookup table would itself be a
  kind of fabrication (confident-looking output with no real reasoning
  behind it), the same reason that path already reports empty
  `moduleCoupling`/`fileLayout` rather than a guess.
- **A hint, never an autofill.** The frontend never writes
  `recommendedTarget` into the row's own `newTarget` field on its own —
  doing so would make an AI suggestion indistinguishable from something a
  person actually typed and reviewed. It renders as its own labelled block
  under the target input, with a "Use this" action that copies it in only
  on an explicit click, and — mirroring the reference prototype's `options`
  pills — a row of `alternativeTargets` buttons for a quick alternative
  pick. Typing anything else directly into the field always works and is
  never blocked or overwritten by the presence of a recommendation.
- **Looked up at render time, not baked into the suggested row.**
  `suggestRows` (which seeds a brand-new, unsaved row from analysis) still
  leaves `newTarget` blank exactly as before — unchanged, so its existing
  tests and behaviour are untouched. `findRecommendation(layerKey,
  recommendations)` is a separate, pure lookup the component calls per row
  regardless of whether that row is a fresh suggestion or an
  already-persisted, previously-confirmed layer — so re-running analysis
  later can surface a new hint against a layer someone saved (or even
  confirmed) long ago, without needing to re-suggest the whole row.
- **Every row always shows one of exactly two states — never nothing.**
  `recommendationStatus(layerKey, analysis)` wraps `findRecommendation` and
  returns a discriminated `{kind:"recommended", recommendation}` or
  `{kind:"unavailable", reason}` for every layer, covering every reason
  "no recommendation" can be true honestly: no analysis yet, no model
  connected (the keyword stub), a connected model that ran but never
  addressed this layer despite the prompt's instruction, or an explicit
  `recommendedTarget: null` — the last two share one rendering, using the
  model's own `why` when an entry exists and falling back to a generic,
  still-honest sentence when it does not. The component always renders one
  of the two blocks under the target field; there is no third, blank state.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | New `recommendedStackMove` field, connected-model only, shown as an optional, reviewable hint never auto-applied (this ADR) | Matches the PM's instruction exactly; keeps `runningOnToday`'s existing contract intact; consistent with how every other model-derived field in this feature already handles "not confident" | One more field to persist/wire through five layers (prompt → parse → repository → DTO → frontend type) | **Adopted** |
| B | Loosen `runningOnToday` itself to allow a `recommendedTarget` alongside each entry | Smaller diff, one field instead of two | Conflates "what it runs on today" with "what to move to" in the one place several other panels (Codebase, Architecture) already read as pure present-tense fact; breaks that existing contract for every consumer, not just Stack move | Not adopted |
| C | Prefill `newTarget` directly from the recommendation when a row is first suggested | Fewer clicks for the common case | Makes an AI guess visually indistinguishable from a value a person typed and reviewed — directly against the instruction that review/change must be possible, and against this feature's established "never let a suggestion read as an already-made decision" pattern (`PagesSection`'s own `isSuggestion` banner exists for exactly this reason) | Not adopted |
| D | A fixed keyword→version lookup table on the keyword-stub path too (e.g. "Node" → "Node 22 LTS") | Works with no model configured at all | A static table dressed up as a recommendation is the fabrication this whole feature has consistently refused elsewhere (moduleCoupling/fileLayout/indexed all report empty rather than guess without a connected model) | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts

- Delivers the PM's ask directly: a connected local model recommends a
  specific target per layer (e.g. Node.js 12 → Node.js 22 LTS), reviewable
  and changeable, never forced.
- `runningOnToday`'s existing "present only" contract, and every other
  consumer that already reads it, is untouched.
- Consistent with this feature's established honesty posture: no
  recommendation is offered where the model (or the keyword stub) has no
  real basis for one.

### 4.2 Negative Impacts / Costs to Accept

- A sixth JSON field to keep in step across the prompt, `parse`,
  `AxRenewalAnalysisRepository`, `ApiDtos`, and the frontend type — one
  more thing a future analysis-schema change has to remember to update in
  all five places, same maintenance cost every prior field in this record
  already carries.
- The recommendation is only ever as good as the model's own general
  knowledge of current LTS/stable releases at the time it answers — it is
  not re-verified against a live registry, so a model trained before a
  newer release shipped could recommend a now-slightly-stale (but still
  real, still reasonable) version. Accepted: the "why" and the visible
  "AI recommends" framing already signal this is a suggestion to check,
  not a verified fact, and alternatives/free typing remain available.

### 4.3 Follow-up Work

- [ ] PM decision: should confirming Stack move with an unaddressed
      recommendation still visible (never applied, never dismissed) surface
      any different signal, or is "it's just a hint, confirming without
      touching it means nothing" the intended behaviour? Left as the
      latter for this pass.
- [ ] Consider whether `AxRenewalStackRecommendation` should carry any
      evidence pointer (e.g. which finding prompted it) once Findings and
      Stack move need to cross-reference each other more directly.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| `recommendedStackMove` is `[]` on the keyword-stub path | `AxRenewalService` (manual/integration) | Every build | Never populated without a connected model |
| An entry missing `layerKey` is dropped; a `null`/blank `recommendedTarget` is preserved as `null`, not dropped | `LocalClaudeAnalyzer` (`normalizeRecommendedStackMove`) | Code review | Only a missing `layerKey` excludes an entry |
| A literal JSON `null` for `recommendedTarget` reads as `null`, never the string `"null"` | `LocalClaudeAnalyzer` (`textOr`) | Code review | `NullNode.asText()`'s `"null"`-string footgun is guarded against |
| `suggestRows` still leaves `newTarget` blank regardless of a matching recommendation | `StackMoveSection.test.ts` | Every build | Existing + new "still leaves newTarget blank" case |
| `findRecommendation` matches by exact `layerKey`, `null` otherwise | `StackMoveSection.test.ts` | Every build | Table-driven cases incl. no match |
| `recommendationStatus` covers all four "unavailable" reasons plus the recommended case | `StackMoveSection.test.ts` | Every build | No analysis / no model / null-with-why / null-without-why / entry missing entirely |
| Clicking "Use this"/an alternative pill sets `newTarget`; typing over it always works | Manual (no `.tsx` interaction test exists for this component today, consistent with its siblings `PagesSection`/`ArchitectureSection`) | Before release | — |

## 6. References

- Related code: `backend/src/main/java/com/coc/docs/axrenewal/LocalClaudeAnalyzer.java`
  (`Result`, `prompt`, `normalizeRecommendedStackMove`, `textOr`), `AxRenewalAnalysis.java`,
  `AxRenewalAnalysisRepository.java`, `AxRenewalService.java`
  (`runAnalysis`/`persistLocalAnalysis`), `web/ApiDtos.java`
  (`AxRenewalAnalysisResponse`),
  `backend/src/main/resources/db/migration/V52__ax_renewal_analysis_recommended_stack_move.sql`,
  `frontend/lib/ax-renewal/api.ts` (`AxRenewalStackRecommendation`),
  `frontend/components/ax-renewal/StackMoveSection.tsx`
  (`findRecommendation`, `recommendationStatus`)
- Related ADR: ADR-037 (AX Renewal), ADR-043 (the "never recommend" rule
  this revises), ADR-054/055 (per-call source path, unaffected by this
  change)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-29 | 1.0 | Initial draft | backend/frontend |
| 2026-09-29 | 1.1 | Every layer now gets a recommendation attempt, every time — `recommendedTarget` is JSON `null` (a real, honest answer) rather than the whole entry being skipped when the model is not confident. Fixes a Jackson `NullNode.asText()` footgun this change surfaced (`textOr` helper). Frontend gains `recommendationStatus`, which always renders either the recommendation or a plainly stated reason there isn't one. Still pre-approval. | backend/frontend |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| | PM | | PENDING |
