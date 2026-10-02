# ADR-088: One Email Address Policy, Enforced Server-Side and Mirrored in the Forms

> **Status**: PROPOSED
> **Date**: 2026-10-02
> **Author**: AI, at the PM's request
> **Approver**: PM
> **Related ADR**: ADR-087 (the password policy this is shaped after), ADR-017 (registration), ADR-012 Decision 3 (backend authoritative, frontend advisory)

---

## 1. Context

Registration accepted `qqq@qqq`. Both layers believed they were validating:

- The backend used Jakarta's `@Email`, which implements RFC 5322's grammar. Under that grammar
  `qqq@qqq` and `person@localhost` are valid addresses — correct as a grammar check, and the wrong
  rule for a system whose addresses must receive a registration code over the public internet.
- The frontend had **three different hand-written patterns** and one form with none at all:
  `/^\S+@\S+\.\S+$/` in forgot-password, `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` in the add-account modal,
  a non-empty check in register, and nothing but "not empty" in the invite modal. "Valid" meant
  something different on each screen.

The cost of the gap is specific: an address that cannot receive mail is accepted at registration,
the verification code goes nowhere, and the person is left with an account they cannot confirm and
no way to find out why.

- **Related requirements**: NFR-SEC-AUTH, FR-AUTH-002
- **Related risks**: rejecting somebody's real address — see §2
- **Decision pressure**: none; this is a tightening

## 2. Decision

> One policy, stated once per side: `EmailPolicy` in Java is authoritative, `emailPolicy.ts`
> mirrors it for the forms. An address must have exactly one `@`, a non-empty local part within
> RFC 5321's limits, and a domain of dot-separated labels ending in a **top-level domain of at
> least two letters**. It is applied by a `@ValidEmail` constraint wherever a *new* address is
> accepted, and never where an existing one is presented.

### Key Choices

- **A real top-level domain is the rule that matters.** It is what rejects `qqq@qqq`,
  `person@localhost` and `person@192.168.1.1`. Everything else here is detail; this is the check
  that was missing.
- **Deliberately no stricter than that.** Plus-addressing, dots, hyphens, long TLDs and uppercase
  all pass. **The expensive failure is rejecting a real address** — somebody cannot argue with a
  form and has no way to discover which character it objected to. Delivery is the real test; this
  only rules out what certainly cannot be delivered.
- **Quoted local parts are not supported.** `"odd name"@example.com` is valid in RFC 5322 and
  refused here: vanishingly rare, refused by many providers anyway, and supporting it widens what
  reaches the rest of the system for no practical gain.
- **Each message names the specific problem.** "Invalid email" tells somebody staring at an
  address that looks right to them nothing about where to look.
- **Surrounding spaces are reported, not trimmed away.** A pasted address often carries a trailing
  space; accepting it silently stores an address that will not match on the next lookup.
- **Not applied to sign-in.** `PasswordLoginRequest` keeps plain `@Email`, exactly as
  `StrongPassword` is kept off it: an account created under the looser rule must still be able to
  log in. `ClaudeUsageIngestRequest` keeps it too — that address identifies an existing account
  from the reporter tool rather than being a new one offered by a person.

## 3. Considered Alternatives

| | Option | Pros | Cons | Chosen |
|---|---|---|---|---|
| A | **Keep `@Email`** | Nothing to maintain | Accepts `qqq@qqq`; that is the bug | No |
| B | **A full RFC 5322 regex** | Grammatically complete | Famously unreadable, and still accepts `person@localhost` — completeness is not the property wanted | No |
| C | **Shape + a real TLD** (this ADR) | Rejects what cannot receive mail; readable; identical on both sides | Will not accept quoted local parts or IP literals | **Yes** |
| D | **Verify by sending** | The only true test of deliverability | Registration already does this with its code; it cannot be the *form's* check | No — complementary, not a substitute |

## 4. Consequences

### 4.1 Positive Impacts

- `qqq@qqq` is refused at the form and at the server.
- Four forms now agree with each other and with the backend, instead of three patterns and a gap.
- A person is told what is wrong with the address rather than that it is "invalid".

### 4.2 Negative Impacts / Costs to Accept

- **A valid-but-unusual address will be refused**: quoted local parts, IP literals, and
  single-label domains such as an intranet host. None are plausible for this deployment, and all
  are a deliberate trade against the gain in §4.1 — but somebody turned away by this has no
  recourse, which is the part worth remembering if it is ever reported.
- **Two implementations of one rule.** Mitigated by shared case lists in both test suites, not
  eliminated.
- **Passing this says nothing about deliverability.** `nobody@example.com` is well-formed and
  undeliverable. The registration code remains the only real proof, and this policy must not be
  mistaken for one.

### 4.3 Follow-up Work

- Consider rejecting known disposable-address domains at registration, if that ever becomes a
  problem worth the maintenance of a list.
- `ClaudeUsageIngestRequest` and `PasswordLoginRequest` keep `@Email` by design; revisit only if
  an address is ever *created* through either.

## 5. Verification / Monitoring

- Tests assert `qqq@qqq` is rejected, with the message naming the missing domain ending.
- Tests assert each malformed shape gets its own specific message.
- Tests assert the real addresses this deployment holds are accepted.
- Parity tests on both sides run the same accepted and rejected case lists.

## 6. References

- `backend/src/main/java/com/coc/docs/auth/EmailPolicy.java` — authoritative
- `frontend/lib/auth/emailPolicy.ts` — advisory mirror
- RFC 5321 §4.5.3.1 (length limits), RFC 5322 §3.4.1 (address grammar)
- `ADR-087` — the password policy this is shaped after
- NFR-SEC-AUTH, FR-AUTH-002, CONST-TECH-07

## Change History

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-10-02 | 1.0 | Initial draft, replacing Jakarta's `@Email` and three hand-written frontend patterns. | AI |
