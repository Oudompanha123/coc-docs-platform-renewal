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

That is all. **First run:** your browser opens Coc Docs. Sign in as usual and click **Authorize**.
The terminal then finishes by itself: it saves your personal token on this machine, on
Windows sets up automatic scans every day at 11:00 and 16:00, then scans and uploads.
**Later runs** need no browser and no input, and you don't need to run them yourself.

```
claude-team-usage scan [--days N] [--dry-run] [--verbose]
claude-team-usage login     # sign in again (e.g. after revoking this machine)
claude-team-usage logout    # forget the saved sign-in on this machine
```

- By default `scan` sends **every day with usage not yet reported from this machine**, up to
  30 days back. That includes usage from before a Claude usage-limit reset, a day the PC was
  off, or anything after the last scheduled run. Days already sent and unchanged are skipped.
  What was sent is recorded in `reported.json`, next to the saved sign-in.
- `--days N` re-sends the last N days (1–400) regardless, for a one-off backfill.
- `--dry-run` prints the payloads that would be sent and sends nothing. It needs no sign-in.

Days are calendar days in **Asia/Phnom_Penh**, the same zone the dashboard uses.
Re-running is safe: each day is an upsert, so the latest total replaces the earlier one.

Exit codes: `0` success (including "no usage found"), `1` failure, `2` bad arguments.

## What is sent

For each day, and nothing else:

- **Tokens**: input, output, cache read and cache write, in total and per model.
- **Activity** (since 0.3.0): how many requests (prompts you sent), sessions (continuous
  activity, split after 30 minutes with none) and minutes of active time. Also, per
  project: the same counts, its tokens, and the first and last time you used it.

A project is the **name** of the git repository folder you worked in, e.g.
`coc-docs-platform`. Outside a repository, it is the name of the folder the conversation started in.
**Never sent**: paths, prompts, replies, file names, tool names or session IDs.
`claude-team-usage scan --dry-run` prints exactly what would be sent.

After upgrading from 0.2.x, days already reported are re-sent once to add their
activity. `claude-team-usage scan --days 30` fills in the last 30 days.

## Scheduled runs

After the first sign-in, a scheduled run works unattended. A run with no terminal
never opens a browser. If it isn't signed in, it exits 1 and tells you to run
`claude-team-usage login` once.

**Windows** — set up automatically by your first `claude-team-usage scan` in a terminal,
right after sign-in. Each later terminal `scan` checks the task is still there and adds it
back if it is missing; it never creates a second one. For troubleshooting:

```bat
claude-team-usage schedule status    :: last run, its result, next run, and the latest log
claude-team-usage schedule remove    :: stop the automatic scans (scan won't re-add them)
claude-team-usage schedule           :: turn them back on / refresh after moving Node.js
```

The task is a Task Scheduler task named `claude-team-usage`:

- It runs as **you**, only while you are logged on, so it uses your saved sign-in in
  `%APPDATA%\claude-team-usage`. It needs no admin rights and stores no password.
- It lives in Task Scheduler, so it survives restarts. If the PC was off or you were
  logged out at 11:00 or 16:00, the missed run happens as soon as possible afterwards.
- Each run is a plain `scan`, so it catches up on anything not yet reported, including
  usage after the previous 16:00 run.
- Each run is limited to 15 minutes and appends to
  `%APPDATA%\claude-team-usage\scheduled-scan.log`.
- A small console window may appear for a few seconds while it runs.

Run it now to test: `schtasks /Run /TN claude-team-usage`, then `claude-team-usage schedule status`.
A last result of `0` plus a `sent … tokens` line in the log means the upload worked;
**Last reported** on My Claude Usage shows the same time.

**macOS / Linux** — `crontab -e`:

```bash
0 11 * * * claude-team-usage scan
0 16 * * * claude-team-usage scan
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
