# ADR-060: The `claude-team-usage` CLI signs in through the browser — revision of ADR-059

## Status

Proposed. Implemented on developer instruction in-session; formal PM sign-off recommended, not yet recorded. Supersedes ADR-059 §3–4 (setup-code login). ADR-059's package structure, parity test, env-var precedence and retry policy stand.

## Context

ADR-059 had users copy a `cocsetup_…` code from My Claude Usage and paste it into the CLI. The developer asked to remove every manual step:

- `npm install -g claude-team-usage && claude-team-usage scan` opens the browser;
- the user signs in and clicks Authorize;
- the CLI receives its personal `coc_` credential and carries on scanning.

It had to reuse the existing token system (ADR-047/053) and not weaken production authentication.

## Decision

OAuth 2.0 for native apps (RFC 8252): an authorization code delivered to a loopback redirect, bound with PKCE S256 (RFC 7636).

1. **CLI** (`src/browser-login.js`):
   - Listens on `127.0.0.1:<random port>/callback`.
   - Generates `state` and a verifier (32 random bytes each) and computes `code_challenge = S256(verifier)`.
   - Opens `<server>/cli/authorize?port&state&code_challenge&device` without a shell: `rundll32` on Windows, `open` on macOS, `xdg-open` on Linux.
   - Prints the URL as a fallback.
2. **Frontend `/cli/authorize`**:
   - Outside the `(member)` group, so a signed-out visitor goes to `/login?next=…` and comes back.
   - `safeNextPath` allows only `/cli/authorize[?…]` on the same origin, so `next` is not an open redirect.
   - Nothing happens on page load. **Authorize** posts `{codeChallenge, device}` to `POST /api/v1/me/usage-tokens/cli-authorizations`. The route is session-authenticated under the existing USER floor, JSON-only, so the existing CSRF reasoning holds.
   - The browser then goes to `http://127.0.0.1:<port>/callback?code&state&api`. The host is fixed in code. `api` is the backend origin (it differs from the page's origin in development).
3. **Backend** (`ClaudeUsageCliAuthService`, V51 `claude_usage_cli_authorization`):
   - `approve` stores the SHA-256 of a 256-bit code, bound to the account and challenge, expiring in 2 minutes.
   - `POST /api/cli/token` (permitAll, like `/api/ingest`) runs `exchange`:
     - consume the code atomically, which makes it single-use;
     - check S256(verifier) against the stored challenge in constant time;
     - recheck that the account can sign in and is at least USER;
     - mint through `ClaudeUsageIngestTokenService.createFor`, the same insert and audit as the manual path.
   - Every failure returns the same `400 invalid_grant`.
   - `noRollbackFor = ApiException.class`, so a wrong verifier still burns the code.
   - The response is `Cache-Control: no-store` and carries `{token, email, displayName, ingestUrl}`. `ingestUrl` comes from `PublicIngestUrl`.
4. **CLI** checks `state` in constant time, accepts `api` only if it is https or loopback http, then exchanges. It refuses a localhost ingest URL from a non-local server (missing `APP_PUBLIC_URL`) and saves the result to the ADR-059 credentials file.
5. **Headless**: auto-login happens only when stderr is a terminal. A scheduled run never opens a browser.
6. **Server default**: `package.json` → `cocDocs.server`, overridable by `COC_DOCS_URL`. It must be set before publishing.
7. **Setup code removed**: the "Connect the CLI" panel keeps only the install instructions and Connected machines / Revoke.

## Security properties

- The token only travels in the HTTPS response body to the CLI. It never appears in a URL, browser history, the terminal or logs.
- A code seen in browser history is useless: it works once, expires in 2 minutes, and needs a verifier that never left the CLI process.
- A crafted link can at most show the consent screen, and any resulting code lands on the victim's own `127.0.0.1`. A callback with the wrong `state` is refused.
- Minting always needs an explicit click by a signed-in member. Existing sign-in (Keycloak/Google, password + TOTP) is unchanged.

## Alternatives Considered

| Option | Rejected because |
|---|---|
| Token directly in the loopback redirect | Puts the credential in browser history. |
| Device-code flow (type a short code on a web page) | Adds a manual step the requirement forbids. It remains a future option for SSH-only machines. |
| Keep setup code as a fallback | PM chose removal; env vars cover no-browser machines. |

## Consequences

- New V51 table, two endpoints and one `SecurityConfig` rule. No change to `/api/ingest` or to existing token semantics.
- Blocking before publish: `cocDocs.server` must hold the production domain, which the repository does not record.

// req: FR-USAGE-002, NFR-SEC-CHANNEL
