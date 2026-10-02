# ADR-087: One Password Strength Policy, Enforced Server-Side and Mirrored in the Form

> **Status**: PROPOSED
> **Date**: 2026-10-02
> **Author**: AI, at the PM's request
> **Approver**: PM
> **Related ADR**: ADR-017 (registration and the approval gate), ADR-018 (reset), ADR-022 / ADR-024 / ADR-030 (the three callers of change-password), ADR-012 Decision 3 (backend authoritative, frontend advisory)

---

## 1. Context

Registration accepted `qqq`. The form checked only that the field was non-empty, and the backend
checked only `@Size(min = 8)` — no character classes anywhere, and the two never agreed about
what they were checking.

That is three separate problems:

- **Eight characters with no composition rule** is a weak floor for a password that protects an
  account which can read HR attendance data.
- **The form said nothing**, so the first a person heard of any rule was a rejected submit — or,
  for anything between 1 and 7 characters, a 400 with a message written for an API client.
- **Four places set a password** (register, reset, change, create-first) and each had its own
  copy of the rule, which is how they came to disagree.

- **Related requirements**: NFR-SEC-AUTH, FR-AUTH-002
- **Related risks**: a guessable password on an account with access to personal data
- **Decision pressure**: none — this is a tightening, not a fix for an incident

## 2. Decision

> One policy, stated once per side: `PasswordPolicy` in Java is authoritative, and
> `passwordPolicy.ts` mirrors it for the form. A password must be **8–200 characters**, with
> **no composition rules**. It is applied by a `@StrongPassword` constraint on every request that
> *sets* a password, and never on one that presents an existing password.
>
> **Revised at v1.1** (2026-10-02, PM instruction): v1.0 required 12 characters and four
> character classes. The classes and the checklist UI are removed and the floor returns to 8.

### Key Choices

- **Eight, and no character classes** — which is what NIST SP 800-63B §5.1.1.2 actually asks for:
  a length floor, and verifiers that SHOULD NOT impose composition rules. v1.0's twelve-plus-four
  was the stricter-looking option, not the better-evidenced one. What the revision genuinely gives
  up is length, which is the part that resists guessing — see §4.2.
- **A constraint annotation, not a check in each service.** A fifth place to set a password cannot
  silently skip the rule: the DTO either carries `@StrongPassword` or it does not, and that is
  visible in the file a reviewer is already reading.
- **Never on sign-in.** `PasswordLoginRequest` deliberately does not carry it. An account whose
  password predates this policy must still be able to log in — and then be asked to change it —
  rather than being locked out by a rule introduced after it was chosen.
- **Every unmet rule is reported at once**, in a fixable order. Revealing one requirement per
  refusal is what trains people to append `1!` until the complaining stops.
- **A symbol is defined by exclusion** — anything that is not a letter, a digit or whitespace — so
  that punctuation from any script counts. An allow-list of ASCII punctuation would quietly reject
  somebody whose keyboard produces a different dash, with no way for them to find out why.
- **The frontend copy is advisory** (CONST-TECH-07, ADR-012 Decision 3) and says so in its own
  header. It exists so the form can complain while someone types; it decides nothing.

## 3. Considered Alternatives

| | Option | Pros | Cons | Chosen |
|---|---|---|---|---|
| A | **Length floor only** (NIST SP 800-63B) | What the standard recommends; no rules to remember; nothing to re-teach | NIST pairs it with a breach-list check this project does not have | **Yes, at v1.1** |
| B | **Length + four character classes** (v1.0, reverted) | Clear, checkable identically on both sides, matches the request | Composition rules are weak evidence of strength and push people toward predictable substitutions | No — reverted at v1.1 |
| C | **A strength meter (zxcvbn)** | Scores real guessability rather than shape | A ~400 KB dependency in the auth bundle, and no Java equivalent that would agree with it | No |
| D | **Leave it at eight** | No change | `qqq` was accepted by the form; eight is a weak floor for this data | No |

## 4. Consequences

### 4.1 Positive Impacts

- `qqq` and everything like it is refused, by the form immediately and by the server regardless.
- The requirements are visible as a checklist while typing, rather than discovered one refusal at
  a time.
- All four password-setting paths share one rule, and a parity test fails if the two
  implementations drift.

### 4.2 Negative Impacts / Costs to Accept

- **The floor is eight, which is low.** Length is the part that resists guessing, and v1.1 gives
  up the twelve that v1.0 had. Eight is the standard's minimum rather than a good target, and
  with no breach-list check behind it, `password` and `12345678` are both accepted today.
  **This is the gap that `§4.3`'s breach-list follow-up exists to close, and it matters more now
  than it did at v1.0.**
- Dropping the character classes is *not* itself a loss: 800-63B argues they buy little and cost
  real usability. The loss is the four characters of length that went with them.
- **Existing accounts keep weaker passwords.** Nothing forces a change, and sign-in deliberately
  does not apply the policy. Those accounts are no stronger than before this ADR.
- **Two implementations of one rule.** Mitigated by the shared case lists in both test suites, not
  eliminated: a change made on one side alone fails a test rather than being impossible.
- **bcrypt truncates past 72 bytes**, so the 200-character ceiling is generous in a way that is
  partly decorative. Kept because it was the existing contract and lowering it would reject
  passwords people may already have.

### 4.3 Follow-up Work

- A breach-list check (k-anonymity against Have I Been Pwned, or a local list) would be worth more
  than every rule here combined, and would justify dropping the character classes.
- Prompt accounts holding a pre-policy password to change it at next sign-in.
- Apply the same policy to the generated temporary password in `AccountService`, which is
  currently governed by its own generator.

## 5. Verification / Monitoring

- Tests assert each rule rejects a password breaking only that rule.
- Tests assert every unmet rule is reported at once, in a pinned order shared with the frontend.
- Parity tests on both sides run the same accepted and rejected case lists.
- A test asserts a symbol from a non-ASCII script counts, and that a space does not.

## 6. References

- `backend/src/main/java/com/coc/docs/auth/PasswordPolicy.java` — authoritative
- `frontend/lib/auth/passwordPolicy.ts` — advisory mirror
- NIST SP 800-63B §5.1.1.2, on memorized secrets and composition rules
- NFR-SEC-AUTH, FR-AUTH-002, CONST-TECH-07

## Change History

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-10-02 | 1.0 | Initial draft, replacing the `@Size(min = 8)` rule and the form's non-empty check. | AI |
| 2026-10-02 | 1.1 | Reverted to a length-only policy at 8 characters on the PM's instruction; removed the four character classes and the register form's checklist. Closer to NIST's shape, but gives up the length floor — §4.2. | AI |
