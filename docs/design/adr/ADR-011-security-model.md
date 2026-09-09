# ADR-011: Security Model (Authentication, Session, Role Enforcement, Sanitisation, Upload Validation, Cross-Service Trust)

> **Status**: PROPOSED — **REVISED**
> **Date**: 2026-09-08 (v1.0) · **Revised**: 2026-09-09 (v1.1)
> **Author**: security-auditor
> **Approver**: PM (Socheat-Hun), design-gate (G2) review
> **Related ADR**: ADR-005 (PII), ADR-006 (Audit Logging), ADR-008 (Channel Authentication), **ADR-012 (two-service architecture, Google Cloud hosting — triggers this revision)**

---

> **Revision note (2026-09-09)**: ADR-012 splits the single Next.js application into a presentation-only Next.js **frontend** and a Java 21 / Spring Boot 3.4 **backend** that owns all persistence and authorisation (`CONST-TECH-05`, `CONST-TECH-06`, `CONST-TECH-07`), hosted on Google Cloud (`ADR-012 §2.1`). This ADR is the CONST-SEC-01 umbrella and therefore must be revised before G2 re-approval. Existing decisions are **kept where still valid** and marked **AMENDED** or **SUPERSEDED IN PART** inline where the boundary split changes them — nothing below is silently rewritten. The main addition is a new pillar, §2.5 **Cross-service security**, covering how the session credential travels between two origins, CORS policy, cookie attributes, and why the frontend is never trusted to enforce authorisation.

## 1. Context

CONST-SEC-01 mandates a separate security ADR in Skill 3 covering authentication, session management, role enforcement, sanitisation, upload validation and PII handling as one coherent model — not five disconnected decisions. This ADR is that document. It sits above ADR-005 (PII specifics), ADR-006 (audit specifics) and ADR-008 (channel specifics), which it references rather than repeats, and additionally settles: the session TTL contradiction (AMB-006), server-side role enforcement, content sanitisation, and — **as of this revision** — how that whole model survives being split across two services on different origins.

- **Background summary**: The AS-IS system has no user identity, no role concept, and a single shared password. This project builds identity, roles, sessions, sanitisation and upload handling from scratch simultaneously with moving content authorship from one trusted developer to multiple non-technical `admin`s — the two changes compound, because the sanitisation gap that was safe under one trusted author is not safe under many. **As of 2026-09-09, a third change compounds with the first two**: the system is no longer one deployable. Authentication, session issuance, role resolution, sanitisation and upload validation all now live exclusively in the backend (`CONST-TECH-07`), and every one of those checks must hold when the backend is called directly, not only when reached through the frontend UI.
- **Related requirements**: NFR-SEC-AUTH, NFR-SEC-SESSION, NFR-SEC-SANITIZE, NFR-SEC-UPLOAD, NFR-SEC-PII (delegated to ADR-005), NFR-SEC-CHANNEL (delegated to ADR-008), FR-AUTH-001..008, FR-MEDIA-004, **CONST-TECH-05, CONST-TECH-06, CONST-TECH-07, CONST-TECH-08 (new)**
- **Related risks**: RISK-005 (XSS surface), RISK-006 (upload surface), AMB-006 (session TTL contradiction), **RISK-001 (project stalls — the two-service split roughly doubles build surface per ADR-012, which is why this revision keeps controls proportionate rather than adding new machinery wherever avoidable)**
- **Decision pressure**: This is a G2 blocking item (CONST-SEC-01) — implementation cannot proceed without it, and several threat-model items (TM-001..003, 005, 007, 010, 011, 018, 019, and the new TM-023..027) cite this ADR as their mitigation.

## 2. Decision

The security model rests on **five** pillars (was four in v1.0; §2.5 is new in this revision), each with one clear owner mechanism:

1. **Authentication**: Google OIDC only, no passwords (detailed in ADR-008; restated here for coherence). **Verification now happens in the backend** (`ADR-012` Decision 4), not the Next.js app.
2. **Session management**: a single, signed, backend-issued session with a **1-day TTL**, settling AMB-006 in favour of the code (`lib/auth.ts:9`) over the stale documentation (`CLAUDE.md:172`).
3. **Role enforcement**: a default-deny checkpoint — **now the Spring Security filter chain in the backend**, since there is no longer a single Next.js app to put a middleware in — checking a server-side-resolved role against each route's declared minimum role, on every request, with no client-trusted role claims.
4. **Content safety**: mandatory server-side (backend-only) sanitisation of all rich-content fields plus type/content/size-validated uploads, both enforced independently of author trust level and independent of any client-side check.
5. **Cross-service trust (NEW)**: the session/authentication credential crosses an origin boundary (frontend ↔ backend, TB-8 in the threat model) on every request; CORS policy, cookie attributes, and API-level authorization are designed explicitly for that, and the frontend is treated as **incapable of enforcing anything**, not merely untrusted.

> Authentication, session, and authorization form one chain of custody: Google verifies identity → the **backend** issues its own session bound to a role looked up server-side → every subsequent request is authorized against that server-side role, never against anything the client asserts — **and this chain must hold identically whether the caller is the legitimate frontend, a direct API client, or an attacker, because the backend cannot distinguish them by network position alone (§2.5)**. Content safety is a second, independent chain: every rich-content field is sanitised against an allowlist at write time and render time regardless of who authored it, and every upload is validated on three independent signals (declared type, sniffed type, size) before acceptance — **both chains now execute exclusively in the backend; the frontend has no code path that can substitute for either (`CONST-TECH-07`)**.

### Key Choices

**Authentication**
- Google OIDC (authorization-code flow), **backend-side** ID token verification (signature, issuer, audience, nonce). No passwords stored anywhere (FR-AUTH-002).
- `/api/ingest`'s pre-existing bearer-secret channel is out of scope for this model — see ADR-008 — and is explicitly not a precedent for any route this model governs. **Confirmed by `architect`, 2026-09-09: it stays in the frontend, unmoved** — `FR-USAGE-001` is `Won't`, so `lib/usage/*` is untouched Next.js code (see `threat-model.md` §1 for the documented, bounded exception to `CONST-TECH-05` this represents: a frontend route holding a Google Sheets credential, scoped to write-only-to-Sheets, forbidden as a pattern for editorial writes, and out of MVP work entirely).

**Session management**
- **TTL = 1 day**, resolving AMB-006. Rationale unchanged: `lib/auth.ts:9`'s `SESSION_DAYS = 1` is the operative code today; `CLAUDE.md:172`'s "30 days" is documentation drift, not a deliberate decision anyone made. A 1-day TTL is also the more defensible default for an admin console that can publish content and manage accounts.
- Session cookie is `httpOnly` (not readable by JS, closing the main XSS-to-session-theft path — **this holds regardless of which origin issued the cookie, since it is a browser-enforced property, not a same-origin one**), `secure` (TLS-only). **`sameSite` attribute: AMENDED by §2.5 below** — `sameSite=lax` remains the default and preferred value, but it is now conditioned on frontend and backend sharing a registrable parent domain; if that condition cannot be met, §2.5 specifies the fallback.
- Session is regenerated on login (prevents fixation) and invalidated server-side on sign-out (FR-AUTH-007) — invalidation is a real server-side revocation, not just clearing the client cookie. **This logic lives in the backend**, the only component with a session store.
- No "remember me" / extended-TTL option in MVP; one TTL value, one behaviour, matching NFR-SEC-SESSION's "single defined value" requirement exactly.

**Role enforcement**
- Role ladder `guest < user < admin < super admin` (FR-AUTH-005) resolved server-side from the session-linked user record on every request — never accepted as a client-supplied header, query parameter, or cookie value. **This is stated more strongly than in v1.0: "server-side" now specifically means "in the backend's Spring Security filter chain / service layer," because the frontend is architecturally unable to resolve or check a role at all (`CONST-TECH-07`) — there is no fallback path to reason about.**
- **AMENDED**: Enforcement point was described in v1.0 as "middleware" without specifying which service, since there was only one. It is now **the Spring Security filter chain in the backend**, checked before any controller method runs, comparing the resolved role against each route's declared minimum role (FR-AUTH-006 for content pages; a fixed `super admin` floor for account-management routes per FR-AUTH-008).
- **Default-deny**: a route with no explicit minimum-role declaration is treated as requiring the highest role, not the lowest — inverting the risk of a route accidentally shipping unprotected. This directly closes TM-019 and its backend-specific instance **TM-027** (the class of bug is now: an endpoint left off the Spring Security matcher, rather than a Next.js route left off `middleware.ts` — same shape, different implementation).
- MVP does not enforce `guest` reading (FR-PUBLIC-001 is `Won't`); the entire site's effective minimum role floor is `user` until phase 2 explicitly lowers specific pages, per BR-026's disclosure-decision requirement.

**Sanitisation**
- Every content-block type that can carry rich/HTML-shaped content (the `.tree`-equivalent diagram block, the copyable-code block, and any `footerHtml`-equivalent block) is passed through an **allowlist HTML sanitiser** at both write time (defence) and render time (defence in depth), **executed exclusively in the backend**. The frontend's TypeScript validator (`lib/content/validate.ts`) is **repurposed, per ADR-012 Decision 3, as an advisory client-side pre-check only** — it gives editors immediate feedback but is never a security boundary, and no write path may depend on it (`CONST-TECH-07`). The Java port in the backend is authoritative and must match `validate.ts`'s rules exactly; the block model (ADR-010) remains language-neutral.
- The block schema itself is the first control: only a small, fixed set of block types is permitted to carry any markup at all (CONST-TECH-04's 8–10 block vocabulary), each with its own narrow allowlist rather than one generic "raw HTML" block escape hatch.
- Embed blocks (Tier B — `HarnessDemo`, `OwnerTree`, `ideaData`-bound tables) resolve to a fixed, developer-maintained component identifier with typed props; an editor can select *which* embed and configure its props, never inject arbitrary markup or code through it (BR-007).
- This applies uniformly to every author regardless of role — TM-007 in the threat model is precisely a compromised-but-legitimately-authenticated admin account, and sanitisation is the only control that still holds in that case.

**Upload validation**
- Three independent checks before an upload is accepted (FR-MEDIA-004): declared MIME type, sniffed/actual content type (magic-byte inspection), and size ceiling — **all performed in the backend before the object is persisted to object storage (Google Cloud Storage, S3-compatible interface, `ADR-012 §2.4`)**.
- SVG is either rejected outright or run through a dedicated SVG sanitiser.
- Accepted files are stored outside any executable path, under unpredictable keys, in object storage.
- Served media responses set `X-Content-Type-Options: nosniff` and a restrictive `Content-Security-Policy`.
- Rejected uploads are logged with the reason (FR-OPS-003 / ADR-006), **now emitted by the backend**.

### 2.5 Cross-service security (NEW — frontend ↔ backend)

This section exists because the frontend and backend now sit on different origins (`ADR-012` Decision 1), which is a genuinely new problem the single-service design did not have. It settles four things plainly, proportionate to a 6-person team building an internal documentation platform, not a payment system.

**Why the frontend is never trusted to enforce authorisation**

The frontend has no database credentials and no role-resolution logic (`CONST-TECH-05`). Even before this revision, "the frontend checks this" was never an acceptable mitigation in this ADR — but in the single-service design it was at least *physically true* that requests passed through the same process as the authorisation logic. That is no longer true. An attacker can call the backend directly, over the network, and skip the frontend entirely (this is the literal scenario in TM-003, TM-005, TM-018, TM-025, TM-026, TM-027). **The design therefore treats every backend request as if it came from an untrusted direct client, always** — the frontend being the "normal" caller is an operational fact, not a security assumption anything relies on.

**How the session credential travels between the two origins**

- The backend issues the session credential (a signed cookie, per the session-management pillar above). The browser attaches it automatically to backend requests **only if the browser considers the request same-site** relative to the cookie's domain — this is governed by `SameSite`, not by which service "owns" the frontend or backend conceptually.
- **Decision (default, ACCEPTED)**: deploy the frontend and backend as subdomains of one registrable parent domain (e.g. `app.<domain>` and `api.<domain>`), and scope the session cookie with `Domain=.<parent-domain>`. This makes the two services **same-site** to the browser even though they are different origins, which means:
  - `SameSite=Lax` continues to work exactly as in the single-service design — no CSRF-token framework needs to be built for a 6-person internal tool.
  - `httpOnly` and `secure` are unaffected either way; they do not depend on same-site status.
  - This is the proportionate choice: it costs a DNS/domain decision made once, against building and maintaining a bespoke CSRF-defence layer.
- **Fallback (ACCEPTED, conditional)**: if Google Cloud / Vercel deployment constraints genuinely prevent a shared parent domain before go-live, the session cookie is set `SameSite=None; Secure`, and every state-changing endpoint **must** additionally validate the `Origin` (or `Referer`) header against the exact expected frontend origin before acting. This is strictly a fallback, not an equally-weighted alternative — see §3 for why it is not the default (TM-024 in the threat model models exactly the risk of adopting `SameSite=None` without this companion check).
- **This is an open item for the architect/DevOps to confirm against the actual Google Cloud + Vercel domain plan before deployment** — architecturally decided now (same pattern ADR-012 used for the database provider: settle the shape at the design gate, confirm the exact value before deploy). Non-blocking for G2, blocking before go-live.

**CORS policy**

- `Access-Control-Allow-Origin` is set to the **exact** frontend origin(s) — never `*`, never a reflected or regex-matched `Origin` header. There is exactly one legitimate frontend origin per environment (dev/staging/prod), so the allowlist is a short, explicit, version-controlled list, not a pattern.
- `Access-Control-Allow-Credentials: true` is paired only with that exact allowlist — the two together are what make credentialed cross-origin calls work for the legitimate frontend and fail for everyone else (TM-023 in the threat model is exactly the failure mode of getting this pairing wrong).
- Allowed methods and headers are the minimum the API actually needs; preflight responses are cached for a reasonable interval (consistent with NFR-PERF's latency targets) but the allowlist itself is never computed at request time from client-supplied data.

**API authentication on every request**

- Every backend endpoint requires authentication by default (`anyRequest().authenticated()` in Spring Security terms), with an explicit, small, reviewed allowlist for the few endpoints that must be public (the OIDC callback, a health check). This is the backend-specific instance of the "default-deny middleware" principle from v1.0 — same principle, now implemented as a Spring Security filter chain instead of Next.js middleware, because that is the component that now exists (TM-019, TM-027).
- Role is resolved from the backend's own session/user table on **every** request, never from a header, query parameter, or any value the caller supplies — restated here because the boundary split is precisely the scenario where an engineer under time pressure might be tempted to trust an `X-User-Role` or similar header "just from the frontend, which we control." **This is explicitly rejected**: nothing distinguishes such a header from one an attacker sets directly, since the backend is directly reachable (TM-003).

**Contract-level attacks — mass assignment and object-level authorization**

Splitting into a REST API introduces a class of bug the single-service design's server-rendered pages never surfaced as cleanly: the request body is now an explicit, attacker-editable JSON contract, not a set of form fields a page happened to render.

- **Mass assignment / over-posting defence**: every write endpoint has its own narrow request DTO, hand-declared field by field — **never** a DTO that mirrors a JPA entity 1:1, and never direct binding of a JSON body onto an entity. Fields like `role`, `published`, or `ownerId` are only ever accepted by the one endpoint whose job is specifically to change them (e.g. `role` only via the `super admin` role-assignment endpoint, FR-AUTH-004), never incidentally through a generic "update profile" or "create account" endpoint. TM-025 in the threat model — self-escalating to `super_admin` via the account auto-provisioning payload — is the concrete illustration of what this defends against.
- **Object-level authorization (BOLA/IDOR) defence**: a role-floor check (does this principal have role ≥ X) is necessary but not sufficient. Every endpoint that takes a resource ID (`pageId`, `mediaId`, `userId` for a usage row, etc.) additionally checks that the resolved principal is entitled to *that specific object*, not merely to objects of that type in general. This generalises the row-level PII check already required by ADR-005/NFR-SEC-PII (previously scoped to ai-usage rows) to every resource type the API exposes, since the API is now the literal, direct integration point (TM-026).
- Both defences are implemented in the backend service/controller layer as ordinary code review and test-suite items — no new library or framework is introduced for this; it is a design discipline (narrow DTOs, explicit ID-ownership checks), which is the proportionate choice for a 6-person team.

**Team-scale note: secrets across six developers**

The team grew from one part-time developer to six over the course of this ADR's revision (ADR-012 context). This does not change any control above, but it changes how the existing ones must be operated:

- `INGEST_SECRET`, the database connection string, and any GCP service-account keys are stored in **GCP Secret Manager** (a natural fit now that hosting is decided, ADR-012 §2.1) rather than distributed as local `.env` files copied between developers. This is a low-cost, GCP-native control, not a new system to stand up.
- Each of the six developers gets their own scoped GCP IAM identity for anything that needs cloud access, rather than one shared service-account key file circulating by chat or shared drive — this is the least-privilege, per-person-revocable pattern, and it costs nothing extra to set up correctly from day one versus retrofitting it later.
- The existing 90-day rotation runbook (`security/runbook-key-rotation.md`) is unchanged in cadence but now needs a named owner/process so rotation does not depend on one person's memory (TM-004, TM-028).
- **What this deliberately does not do**: it does not introduce a secrets-management platform beyond what GCP already provides, does not mandate hardware security keys or a formal PAM system, and does not treat this as a compliance program. Six developers on an internal documentation tool warrants "use the cloud provider's secret manager and stop passing `.env` files around," not more.

## 3. Considered Alternatives

Authentication and channel alternatives are argued in ADR-008 and not repeated here. Session TTL, role-enforcement placement, and sanitisation strategy (A/B/C below) are unchanged from v1.0 and remain valid under the two-service split — only their implementation location moved (Next.js → Spring), not their logic. **New in this revision**: D (cross-origin credential strategy) and E (API request-body/DTO strategy), both specific to the frontend↔backend boundary.

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A1 | Session TTL = 1 day (code-authoritative) | Matches the operative code today; shorter exposure window for a console with publish and account-management authority | Daily re-authentication, though low-friction via Google SSO | **Adopted** |
| A2 | Session TTL = 30 days (docs-authoritative) | Fewer re-logins | Documentation, not code, is the source of this number; materially longer window for a stolen session cookie | Not adopted |
| A3 | Configurable/role-dependent TTL | Tunable risk/convenience trade-off | Violates NFR-SEC-SESSION's "single defined value"; adds config surface with no evidence of need | Not adopted |
| B1 | Role enforcement in a default-deny gate, resolved server-side per request (Next.js middleware in v1.0; **Spring Security filter chain now**) | Single enforcement point, hard to bypass by adding a route without remembering a check | Requires disciplined route-to-minimum-role mapping, now maintained in the backend's own config | **Adopted** |
| B2 | Role enforcement scattered per-route/per-controller-method | Flexible, no central chokepoint to get wrong | Exactly the failure shape behind TM-019/TM-027 — a forgotten check on one new route is a silent hole | Not adopted |
| B3 | Role enforcement client-side only (hide UI for insufficient roles) | Simplest to build | No actual security — trivially bypassed by calling the backend API directly, which is now the literal, documented way to reach the system (TM-005/TM-018/TM-025/TM-026) | Not adopted |
| C1 | Allowlist HTML sanitiser per narrow block type, write- and render-time, **backend-authoritative** | Matches NFR-SEC-SANITIZE precisely; narrow allowlists limit blast radius | Requires maintaining a small allowlist config per block type; **now also requires the frontend's `validate.ts` and the backend's Java port to be kept in sync** (ADR-012 Decision 3) | **Adopted** |
| C2 | Denylist/regex-based stripping | Faster to write initially | Well-documented to be bypassable | Not adopted |
| C3 | One generic "raw HTML" block type | Maximum authoring flexibility | Directly reproduces RISK-005/TM-010 | Not adopted |
| **D1** | **Shared parent domain, `SameSite=Lax` cookie (e.g. `app.<domain>` / `api.<domain>`)** | Keeps the browser's free CSRF protection; no new framework/library; identical cookie behaviour to the single-service design | Requires a DNS/domain decision coordinated with hosting setup before go-live | **Adopted (default)** |
| D2 | `SameSite=None; Secure` cookie + mandatory Origin-header check on state-changing endpoints | Works regardless of domain structure; unblocks a frontend/backend on genuinely unrelated domains | Removes the browser's built-in CSRF protection, so the Origin-header check becomes load-bearing and must never be skipped on a new endpoint — a discipline requirement, not a one-time setup | **Adopted as fallback only**, if D1 proves infeasible before go-live |
| D3 | No cookie at all — bearer token held in frontend JS memory, attached manually to each API call | Sidesteps SameSite/CORS-credential questions entirely | Token must live somewhere JS can read it, which is strictly worse under XSS (TM-010) than an `httpOnly` cookie, and adds token-refresh plumbing for a 6-person team with no evidence this complexity is needed | Not adopted |
| **E1** | **Narrow, hand-declared request DTO per write endpoint; entity fields like `role`/`published`/`ownerId` bindable only from their one dedicated endpoint** | Closes mass assignment (TM-025) by construction; forces an explicit decision about what each endpoint can change | More boilerplate DTO classes than binding directly to entities | **Adopted** |
| E2 | Bind request JSON directly onto JPA entities (or a DTO shaped identically to one) | Least code to write initially | Textbook mass-assignment/over-posting vulnerability (TM-025) — any field that exists on the entity is settable by any caller who can reach the endpoint at all | Not adopted |

### Scoring (Optional)

| Dimension | Weight | Adopted set (A1+B1+C1+D1+E1) | Weaker set (A2+B2/B3+C2/C3+D3+E2) |
|------|-----|---|---|
| Requirement fit (NFR-SEC-*, CONST-TECH-07) | 35% | 10 | 3 |
| Team proficiency / buildability (6-person team) | 25% | 8 | 8 |
| Security depth | 25% | 9 | 2 |
| Operational cost | 15% | 8 | 7 |
| **Weighted total** | | **8.75** | 4.60 |

## 4. Consequences

### 4.1 Positive Impacts
- Settles AMB-006 with a clear, defensible rationale, removing an open contradiction before session design proceeds.
- Closes the specific failure mode that made `/api/ingest`'s exemption safe (deliberate + documented) into a general pattern: default-deny with explicit, reviewed allowlisting, rather than default-allow with per-route memory — **now restated for the Spring Security filter chain specifically, since that is the component that must actually implement it**.
- Directly addresses RISK-005 by replacing "one trusted author" with "every author, uniformly sanitised, backend-only" as the safety argument.
- **New**: closes the cross-service gap that ADR-012 opened — CORS, cookie/CSRF, mass assignment, and object-level authorization all now have a designed, buildable control, not an aspirational one (TM-023..027 in the revised threat model).
- **New**: the default cross-origin strategy (shared parent domain) is chosen specifically so the team does **not** have to build a CSRF-token framework — proportionate to a 6-person team and an internal tool, per RISK-001's concern about build surface roughly doubling.
- Every CVSS ≥ 7.0 threat in the threat model that names this ADR — now eleven: TM-001, TM-003, TM-005, TM-007, TM-010, TM-011, TM-018, TM-019, TM-025, TM-026, TM-027 — has a concrete, buildable mitigation here.

### 4.2 Negative Impacts / Costs to Accept
- 1-day session TTL means daily re-authentication — unchanged from v1.0, acceptable friction given Google SSO.
- Narrow per-block-type sanitisation allowlists mean a genuinely new formatting need requires a schema change rather than "just write more HTML" — unchanged from v1.0.
- Upload validation adds real implementation work with no existing pattern to crib from — unchanged from v1.0.
- **New**: the shared-parent-domain decision (D1) has to be coordinated with actual DNS/hosting setup on Vercel (frontend) and Google Cloud (backend) before go-live — this is genuinely new coordination work the single-service design never needed, and it is a G3 (not G2) blocking item.
- **New**: narrow per-endpoint request DTOs (E1) mean more boilerplate classes than binding directly to entities — a real, ongoing cost accepted deliberately because the alternative (E2) is a textbook vulnerability class, not a style preference.
- **New**: object-level authorization checks (BOLA defence) must be written and tested per ID-bearing endpoint, not once centrally — this is real test-suite growth, budgeted into the backend workstream, not assumed free.
- **New**: secrets now need to live in GCP Secret Manager and be provisioned per-developer rather than in one person's `.env` file — a one-time setup cost that is cheaper now than retrofitted later with six people already used to ad hoc sharing.

### 4.3 Follow-up Work
- [ ] Finalize the exact block-type-to-allowlist mapping during Skill 4 implementation of the block schema (CONST-TECH-04).
- [ ] Choose and pin a specific sanitisation library and SVG-handling approach during Skill 3/4 backend tech-stack work.
- [ ] Add the route-to-minimum-role mapping as a reviewed artifact so "is every route covered" is checkable at a glance — **now specifically the Spring Security configuration**, referenced from the architecture overview.
- [ ] Confirm `CLAUDE.md:172`'s stale 30-day reference is corrected to match this ADR's 1-day decision.
- [ ] **New**: confirm with DevOps/architect whether frontend (Vercel) and backend (Google Cloud) can share a registrable parent domain before go-live; if not, implement the `SameSite=None` + Origin-header-check fallback (D2) instead of D1, and update this ADR's §2.5 accordingly rather than silently deploying the fallback.
- [ ] **New**: pin the exact CORS allowlist (frontend origin per environment) as a reviewed, version-controlled config before first deployment.
- [ ] **New**: provision GCP Secret Manager and migrate `INGEST_SECRET` plus DB credentials into it before granting the full 6-person team direct access to any environment holding them.
- [ ] **New**: add the object-level authorization (BOLA) test suite and the mass-assignment/DTO test suite to TEST-PLAN.md's backend security section (coordinated with the concurrent TEST-PLAN.md revision).

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| Session TTL enforced at 1 day | Integration test: session issued, asserted expired after 24h | Per release | Exactly 1 day, single value system-wide |
| Session cookie flags (`httpOnly`, `secure`, `sameSite`) | Security audit of `Set-Cookie` header, from the backend | Per release | All three flags present; `sameSite` value matches the decided strategy (Lax under D1, or None+Secure under the D2 fallback) |
| Role enforced server-side on every request | Integration test + security audit (FR-AUTH-005 verification method) | Per release | 100% of backend routes covered by the Spring Security filter chain; negative test confirms client-supplied role claims are ignored |
| `admin` blocked from account management | Security test, negative (FR-AUTH-008) | Per release | Blocked in all cases |
| Sanitisation blocks script injection | Security test: attempt script/event-handler injection through every rich-content block type, against the backend directly | Per release | Zero successful injections across all block types |
| Upload validation rejects mismatched/oversized/SVG-script files | Security test (FR-MEDIA-004 verification method) | Per release | 100% rejection of crafted malicious samples |
| **CORS allowlist is exact, not wildcard/reflected** | Security audit: send requests with an attacker-controlled `Origin`; assert no `Access-Control-Allow-Origin` echo | Per release | Only the configured frontend origin(s) ever receive a credentialed CORS grant |
| **Cross-origin cookie behaviour matches the decided strategy** | Integration test: frontend→backend call across the actual deployed origins succeeds; a simulated third-party origin's equivalent call does not carry the cookie (D1) or is rejected by Origin-header check (D2) | Per release | No cross-site credentialed request from an unlisted origin succeeds |
| **Mass-assignment defence** | Security test: submit extra fields (`role`, `published`, `ownerId`, etc.) on every write endpoint's DTO; assert they are rejected or ignored, never bound | Per release | Zero endpoints accept an out-of-contract privileged field |
| **Object-level authorization (BOLA/IDOR)** | Security test: for every ID-bearing endpoint, attempt access with an ID belonging to a different account/role; assert denial | Per release | 100% denial for cross-account access attempts |
| **Backend route coverage is default-deny** | Automated test: enumerate the OpenAPI contract; assert every endpoint requires authentication except the documented public allowlist | Per PR touching the API surface | Zero undocumented public endpoints |

## 6. References

- Related code: `lib/auth.ts`, `app/api/login/route.ts`, `middleware.ts` (AS-IS, superseded by the backend's Spring Security configuration per ADR-012)
- Related requirements: NFR-SEC-AUTH, NFR-SEC-SESSION, NFR-SEC-SANITIZE, NFR-SEC-UPLOAD, FR-AUTH-001..008, FR-MEDIA-004, CONST-SEC-01, CONST-TECH-04, **CONST-TECH-05, CONST-TECH-06, CONST-TECH-07, CONST-TECH-08**
- Related ADR: ADR-005 (PII specifics), ADR-006 (audit specifics), ADR-008 (channel/authentication specifics), **ADR-012 (two-service architecture, Google Cloud hosting — triggers this revision)**
- Threat model: `docs/design/threat-model.md` — this ADR is the cited mitigation for TM-001, TM-002, TM-003, TM-005, TM-006 (partially), TM-007, TM-010, TM-011, TM-012, TM-018, TM-019, and — **new in this revision** — TM-023, TM-024, TM-025, TM-026, TM-027, TM-028
- Ambiguity resolved: AMB-006 (REQUIREMENTS-SPEC.md §6)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-08 | 1.0 | Initial draft; resolves AMB-006; umbrella security model per CONST-SEC-01 | security-auditor |
| 2026-09-09 | **1.1** | **Revised per ADR-012** (two-service architecture, Google Cloud hosting). Added **§2.5 Cross-service security** (new pillar 5): session-credential transport across origins with a shared-parent-domain default and a `SameSite=None`+Origin-check fallback, CORS allowlist policy, mandatory per-request backend authentication, mass-assignment/DTO defence, object-level authorization (BOLA) defence, and a team-scale secrets-management note (GCP Secret Manager, per-developer IAM, for the team's growth from 1 to 6 developers). Marked the session-cookie `sameSite` decision and the "middleware" enforcement-location language as **AMENDED** rather than silently rewritten. Added Considered Alternatives D (cross-origin credential strategy) and E (DTO strategy). Updated Verification/Monitoring, Follow-up Work, and References for the new controls and for TM-023…028 | security-auditor |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-08 | PM (Socheat-Hun) | Pending G2 design-gate review — this ADR is a G2 blocking item per CONST-SEC-01 | **PENDING** |
| 2026-09-09 | — | v1.1 supersedes v1.0's decisions where marked AMENDED above; re-review requested alongside the other Skill 3 documents revised for ADR-012 before G2 re-approval | **PENDING RE-REVIEW** |
