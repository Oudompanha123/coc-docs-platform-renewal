# claude-team-usage

Reports **your own** Claude Code token usage to your team's Coc Docs dashboard.
It reads only this machine's Claude Code transcripts (`~/.claude/projects/**/*.jsonl`),
never talks to Anthropic, and never reads anyone else's usage.

## Use

Requires **Node.js 18.18 or newer** (Claude Code already needs Node 18+). Windows, macOS and Linux.

```bash
npm install -g claude-team-usage
claude-team-usage scan
```

or, without installing: `npx claude-team-usage scan`

**First run:** your browser opens Coc Docs. Sign in as usual and click **Authorize**.
The terminal then finishes by itself: it saves your personal token on this machine,
scans, and uploads. **Later runs** need no browser and no input.

```
claude-team-usage scan [--days N] [--dry-run] [--verbose]
claude-team-usage login     # sign in again (e.g. after revoking this machine)
claude-team-usage logout    # forget the saved sign-in on this machine
```

- `--days N` reports the last N days (1–400), for a one-off backfill.
- `--dry-run` prints the payloads that would be sent and sends nothing. It needs no sign-in.

Days are calendar days in **Asia/Phnom_Penh**, the same zone the dashboard uses.
Re-running is safe: each day is an upsert, so the latest total replaces the earlier one.

Exit codes: `0` success (including "no usage found"), `1` failure, `2` bad arguments.

## Scheduled runs

After the first sign-in, a scheduled run works unattended. A run with no terminal
never opens a browser. If it isn't signed in, it exits 1 and tells you to run
`claude-team-usage login` once.

```bat
schtasks /Create /TN "Claude Usage Push" /SC DAILY /ST 23:30 /TR "cmd /c claude-team-usage scan"
```

```bash
30 23 * * * claude-team-usage scan    # crontab -e
```

## Where things live

| | |
|---|---|
| Transcripts read | `CLAUDE_PROJECTS_DIR` if set, else `$CLAUDE_CONFIG_DIR/projects`, else `~/.claude/projects` and `~/.config/claude/projects` |
| Saved sign-in | Windows: `%APPDATA%\claude-team-usage\credentials.json` · macOS/Linux: `~/.config/claude-team-usage/credentials.json` (mode 600) |

The saved token can only report usage for your own account. To disconnect a machine,
revoke it under **My Claude Usage → Connected machines**.

## How sign-in works

The CLI uses the OAuth pattern for native apps, the same shape as `gh auth login`:

1. It listens on `http://127.0.0.1:<random port>/callback` and opens `/cli/authorize`.
2. After you click Authorize, the browser returns a **one-time code** to that listener.
   The code is valid for 2 minutes and works once.
3. The CLI exchanges the code, plus a PKCE secret that never left this process, for your
   token over HTTPS.

The token itself never appears in a URL, the terminal, or a log.

## Automation without a browser (CI, Docker)

The `push-usage.mjs` environment variables still work, and take priority over the saved
sign-in. All three must be set together:

```
USER_EMAIL=you@company.com  INGEST_URL=https://<coc-docs>/api/ingest  INGEST_SECRET=coc_...
```

## Troubleshooting

- **Browser didn't open**: the CLI prints the address. Open it on this same computer.
- **`SELF_SIGNED_CERT_IN_CHAIN`**: a corporate proxy is intercepting HTTPS. Set
  `NODE_EXTRA_CA_CERTS` to its root CA. Don't disable certificate checks.
- **`rejected (401)`**: this machine was revoked. Run `claude-team-usage login`.
- **`usage directory not found`**: Claude Code hasn't run here, or keeps its transcripts
  elsewhere. Set `CLAUDE_PROJECTS_DIR`.

## Develop

```bash
npm test                                          # node:test, no dependencies; includes a parity test against push-usage.mjs
COC_DOCS_URL=http://localhost:3000 claude-team-usage scan   # against a local Coc Docs
```

The production server is set at publish time in `package.json` → `cocDocs.server`.
`COC_DOCS_URL` overrides it for development.
