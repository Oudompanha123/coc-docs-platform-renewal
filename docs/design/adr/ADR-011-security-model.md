# ADR-011: Security Model (Authentication, Session, Role Enforcement, Sanitisation, Upload Validation)

> **Status**: PROPOSED
> **Date**: 2026-09-08
> **Author**: security-auditor
> **Approver**: PM (Socheat-Hun), design-gate (G2) review
> **Related ADR**: ADR-005 (PII), ADR-006 (Audit Logging), ADR-008 (Channel Authentication)

---

## 1. Context

CONST-SEC-01 mandates a separate security ADR in Skill 3 covering authentication, session management, role enforcement, sanitisation, upload validation and PII handling as one coherent model — not five disconnected decisions. This ADR is that document. It sits above ADR-005 (PII specifics), ADR-006 (audit specifics) and ADR-008 (channel specifics), which it references rather than repeats, and additionally settles three things none of those three cover: the session TTL contradiction (AMB-006), server-side role enforcement, and content sanitisation.

- **Background summary**: The AS-IS system has no user identity, no role concept, and a single shared password. This project builds identity, roles, sessions, sanitisation and upload handling from scratch simultaneously with moving content authorship from one trusted developer to multiple non-technical `admin`s — the two changes compound, because the sanitisation gap that was safe under one trusted author is not safe under many.
- **Related requirements**: NFR-SEC-AUTH, NFR-SEC-SESSION, NFR-SEC-SANITIZE, NFR-SEC-UPLOAD, NFR-SEC-PII (delegated to ADR-005), NFR-SEC-CHANNEL (delegated to ADR-008), FR-AUTH-001..008, FR-MEDIA-004
- **Related risks**: RISK-005 (XSS surface), RISK-006 (upload surface), AMB-006 (session TTL contradiction)
- **Decision pressure**: This is a G2 blocking item (CONST-SEC-01) — implementation cannot proceed without it, and several threat-model items (TM-001..003, 005, 007, 010, 011, 018, 019) cite this ADR as their mitigation.

## 2. Decision

The security model rests on four pillars, each with one clear owner mechanism:

1. **Authentication**: Google OIDC only, no passwords (detailed in ADR-008; restated here for coherence).
2. **Session management**: a single, signed, server-issued session with a **1-day TTL**, settling AMB-006 in favour of the code (`lib/auth.ts:9`) over the stale documentation (`CLAUDE.md:172`).
3. **Role enforcement**: a default-deny middleware gate checking a server-side-resolved role against each route's declared minimum role, on every request, with no client-trusted role claims.
4. **Content safety**: mandatory server-side sanitisation of all rich-content fields plus type/content/size-validated uploads, both enforced independently of author trust level.

> Authentication, session, and authorization form one chain of custody: Google verifies identity → the app issues its own session bound to a role looked up server-side → every subsequent request is authorized against that server-side role, never against anything the client asserts. Content safety is a second, independent chain: every rich-content field is sanitised against an allowlist at write time and render time regardless of who authored it, and every upload is validated on three independent signals (declared type, sniffed type, size) before acceptance.

### Key Choices

**Authentication**
- Google OIDC (authorization-code flow), server-side ID token verification (signature, issuer, audience, nonce). No passwords stored anywhere (FR-AUTH-002).
- `/api/ingest`'s pre-existing bearer-secret channel is out of scope for this model — see ADR-008 — and is explicitly not a precedent for any route this model governs.

**Session management**
- **TTL = 1 day**, resolving AMB-006. Rationale: `lib/auth.ts:9`'s `SESSION_DAYS = 1` is the operative code today; `CLAUDE.md:172`'s "30 days" is documentation drift, not a deliberate decision anyone made. A 1-day TTL is also the more defensible default for an admin console that can publish content and manage accounts — shorter exposure window if a session is stolen (TM-002), at the cost of daily re-authentication, which is a one-click Google sign-in, not a password re-entry.
- Session cookie is `httpOnly` (not readable by JS, closing the main XSS-to-session-theft path), `secure` (TLS-only), `sameSite=lax` (blocks cross-site request forgery via top-level navigation while still allowing the OIDC redirect flow to complete).
- Session is regenerated on login (prevents fixation) and invalidated server-side on sign-out (FR-AUTH-007) — invalidation is a real server-side revocation, not just clearing the client cookie.
- No "remember me" / extended-TTL option in MVP; one TTL value, one behaviour, matching NFR-SEC-SESSION's "single defined value" requirement exactly.

**Role enforcement**
- Role ladder `guest < user < admin < super admin` (FR-AUTH-005) resolved server-side from the session-linked user record on every request — never accepted as a client-supplied header, query parameter, or cookie value.
- Enforcement point is **middleware**, checked before any route handler runs, comparing the resolved role against each route's declared minimum role (FR-AUTH-006 for content pages; a fixed `super admin` floor for account-management routes per FR-AUTH-008).
- **Default-deny**: a route with no explicit minimum-role declaration is treated as requiring the highest role, not the lowest — inverting the risk of a route accidentally shipping unprotected (this directly closes TM-019, which is modelled on the exact failure shape `/api/ingest`'s deliberate, documented exemption avoids by being deliberate and documented rather than accidental).
- MVP does not enforce `guest` reading (FR-PUBLIC-001 is `Won't`); the entire site's effective minimum role floor is `user` until phase 2 explicitly lowers specific pages, per BR-026's disclosure-decision requirement.

**Sanitisation**
- Every content-block type that can carry rich/HTML-shaped content (the `.tree`-equivalent diagram block, the copyable-code block, and any `footerHtml`-equivalent block) is passed through an **allowlist HTML sanitiser** (e.g. a library such as `sanitize-html` / DOMPurify server-side, not a hand-rolled regex/denylist) at both write time (defence) and render time (defence in depth, in case a sanitiser bypass is later discovered and the library is upgraded — old rows re-sanitised on next render still benefit).
- The block schema itself is the first control: only a small, fixed set of block types is permitted to carry any markup at all (CONST-TECH-04's 8–10 block vocabulary), each with its own narrow allowlist (e.g. the code block allows `<pre>`/`<code>` structure only; the diagram block allows the specific tag/attribute set `.tree` rendering needs) rather than one generic "raw HTML" block escape hatch that any author could stuff anything into.
- Embed blocks (Tier B — `HarnessDemo`, `OwnerTree`, `ideaData`-bound tables) resolve to a fixed, developer-maintained component identifier with typed props; an editor can select *which* embed and configure its props, never inject arbitrary markup or code through it (BR-007).
- This applies uniformly to every author regardless of role — an `admin`'s content is sanitised exactly as a hypothetical lower-trust author's would be, because TM-007 in the threat model is precisely a compromised-but-legitimately-authenticated admin account, and sanitisation is the only control that still holds in that case.

**Upload validation**
- Three independent checks before an upload is accepted (FR-MEDIA-004): declared MIME type, sniffed/actual content type (magic-byte inspection, not trusting the `Content-Type` header or file extension), and size ceiling.
- SVG is either rejected outright or run through a dedicated SVG sanitiser (SVG can carry `<script>` and event-handler attributes) — treated as a special case, not lumped in with raster formats.
- Accepted files are stored outside any executable path, under unpredictable keys, in object storage (never in the Next.js app's own served static directory).
- Served media responses set `X-Content-Type-Options: nosniff` and an appropriately restrictive `Content-Security-Policy` so that even a validation gap does not translate into script execution when a file is later served back to a reader.
- Rejected uploads are logged with the reason (FR-OPS-003 / ADR-006).

## 3. Considered Alternatives

Authentication and channel alternatives are argued in ADR-008 and not repeated here. This section covers the three decisions specific to this ADR: session TTL, role-enforcement placement, and sanitisation strategy.

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A1 | Session TTL = 1 day (code-authoritative) | Matches the operative code today, no migration of existing session behaviour; shorter exposure window for a console with publish and account-management authority | Daily re-authentication, though low-friction via Google SSO | **Adopted** |
| A2 | Session TTL = 30 days (docs-authoritative) | Fewer re-logins, marginally more convenient | Documentation, not code, is the source of this number — adopting it would mean changing working code to match stale docs rather than the reverse; also a materially longer window for a stolen/leaked session cookie to remain valid, worse fit for an admin console with content-publish and account-management authority | Not adopted |
| A3 | Configurable/role-dependent TTL (e.g. longer for readers, shorter for admins) | Tunable risk/convenience trade-off per role | Violates NFR-SEC-SESSION's explicit requirement for "a single defined value"; adds config surface for a one-person team with no evidence of need | Not adopted |
| B1 | Role enforcement in middleware (default-deny), resolved server-side per request | Single enforcement point, hard to bypass by adding a new route without remembering a check; matches the "every request" language of FR-AUTH-005 exactly | Requires disciplined route-to-minimum-role mapping maintained as pages are added | **Adopted** |
| B2 | Role enforcement scattered per-route/per-component (each page checks its own role) | Flexible, no central chokepoint to get wrong | Exactly the failure shape that produces TM-019 — a forgotten check on one new route is a silent hole; harder to audit "is every route covered" without inspecting every route individually | Not adopted |
| B3 | Role enforcement client-side only (hide UI for insufficient roles) | Simplest to build, fine for UX | Provides no actual security — trivially bypassed by calling the API directly (this is exactly TM-005/TM-018's scenario); would fail FR-AUTH-005's "enforced on every request" and FR-AUTH-006's "enforced server-side" language outright | Not adopted |
| C1 | Allowlist HTML sanitiser applied per narrow block type, both write- and render-time | Matches NFR-SEC-SANITIZE precisely; defence in depth; narrow allowlists per block type limit blast radius of any single sanitiser gap | Requires maintaining a small allowlist config per rich-content block type as the block vocabulary evolves | **Adopted** |
| C2 | Denylist/regex-based stripping of "dangerous" tags | Faster to write initially | Denylists are well-documented to be bypassable (case variations, encoding tricks, mutation XSS); does not meet a reasonable security-audit bar for NFR-SEC-SANITIZE | Not adopted |
| C3 | One generic "raw HTML" block type available to all admins, sanitised once at render time only | Maximum authoring flexibility, closest to today's `dangerouslySetInnerHTML` freedom | Directly reproduces RISK-005/TM-010 — the entire reason `dangerouslySetInnerHTML` was safe before was a single trusted author, which this project is deliberately removing; a generic raw-HTML escape hatch defeats the purpose of narrow block-typed sanitisation | Not adopted |

### Scoring (Optional)

| Dimension | Weight | Adopted set (A1+B1+C1) | Weaker set (A2+B2/B3+C2/C3) |
|------|-----|---|---|
| Requirement fit (NFR-SEC-*) | 35% | 10 | 3 |
| Team proficiency / buildability | 25% | 8 | 9 |
| Security depth | 25% | 9 | 3 |
| Operational cost | 15% | 8 | 8 |
| **Weighted total** | | **8.90** | 5.00 |

## 4. Consequences

### 4.1 Positive Impacts
- Settles AMB-006 with a clear, defensible rationale (code-authoritative, and the more conservative choice for an admin-authority system), removing an open contradiction before session design proceeds.
- Closes the specific failure mode that made `/api/ingest`'s exemption safe (deliberate + documented) into a general pattern: default-deny with explicit, reviewed allowlisting, rather than default-allow with per-route memory.
- Directly addresses RISK-005 (the project's own pre-identified top content-safety risk) by replacing "one trusted author" with "every author, uniformly sanitised" as the safety argument — the correct fix given the trust model actually changes.
- Every CVSS ≥ 7.0 threat in the threat model that names this ADR (TM-001, TM-003, TM-005, TM-007, TM-010, TM-011, TM-018, TM-019) has a concrete, buildable mitigation here, not an aspirational one.

### 4.2 Negative Impacts / Costs to Accept
- 1-day session TTL means daily re-authentication for every user, including admins mid-edit across days — acceptable friction given Google SSO's low click-cost, but worth calling out explicitly since it is a behaviour change from whatever the 30-day documentation may have led anyone to expect.
- Narrow per-block-type sanitisation allowlists mean a genuinely new, unanticipated formatting need requires a schema change (new block type or allowlist extension) rather than "just write more HTML" — this is treated as a feature (keeps the surface bounded, consistent with CONST-TECH-04) not a bug, but it is a real authoring constraint non-technical editors will encounter.
- Upload validation (SVG rejection/sanitisation, magic-byte sniffing) adds implementation work to a "genuinely new capability" (proposal §5.2) that has no existing pattern to crib from — budgeted as real effort, not assumed free.

### 4.3 Follow-up Work
- [ ] Finalize the exact block-type-to-allowlist mapping during Skill 4 implementation of the block schema (CONST-TECH-04).
- [ ] Choose and pin a specific sanitisation library and SVG-handling approach (reject vs. sanitise) during Skill 3 architecture/tech-stack comparison (ADR-001-adjacent).
- [ ] Add the route-to-minimum-role mapping as a reviewed artifact (e.g. a table in the architecture overview) so "is every route covered" is checkable at a glance, not just enforced in code.
- [ ] Confirm `CLAUDE.md:172`'s stale 30-day reference is corrected to match this ADR's 1-day decision, to prevent the same drift recurring.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| Session TTL enforced at 1 day | Integration test: session issued, asserted expired after 24h | Per release | Exactly 1 day, single value system-wide |
| Session cookie flags (`httpOnly`, `secure`, `sameSite`) | Security audit of Set-Cookie header | Per release | All three flags present |
| Role enforced server-side on every request | Integration test + security audit (FR-AUTH-005 verification method) | Per release | 100% of routes covered by middleware; negative test confirms client-supplied role claims are ignored |
| `admin` blocked from account management | Security test, negative (FR-AUTH-008) | Per release | Blocked in all cases |
| Sanitisation blocks script injection | Security test: attempt script/event-handler injection through every rich-content block type | Per release | Zero successful injections across all block types |
| Upload validation rejects mismatched/oversized/SVG-script files | Security test (FR-MEDIA-004 verification method) | Per release | 100% rejection of crafted malicious samples |

## 6. References

- Related code: `lib/auth.ts`, `app/api/login/route.ts`, `middleware.ts` (AS-IS, to be extended)
- Related requirements: NFR-SEC-AUTH, NFR-SEC-SESSION, NFR-SEC-SANITIZE, NFR-SEC-UPLOAD, FR-AUTH-001..008, FR-MEDIA-004, CONST-SEC-01, CONST-TECH-04
- Related ADR: ADR-005 (PII specifics), ADR-006 (audit specifics), ADR-008 (channel/authentication specifics)
- Threat model: `docs/design/threat-model.md` — this ADR is the cited mitigation for TM-001, TM-002, TM-003, TM-005, TM-006 (partially), TM-007, TM-010, TM-011, TM-012, TM-018, TM-019
- Ambiguity resolved: AMB-006 (REQUIREMENTS-SPEC.md §6)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-08 | 1.0 | Initial draft; resolves AMB-006; umbrella security model per CONST-SEC-01 | security-auditor |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-08 | PM (Socheat-Hun) | Pending G2 design-gate review — this ADR is a G2 blocking item per CONST-SEC-01 | **PENDING** |
