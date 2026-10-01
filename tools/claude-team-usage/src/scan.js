/**
 * `claude-team-usage scan` — the CLI form of `node push-usage.mjs`: find this
 * machine's transcripts, total the wanted days, and report them to Coc Docs.
 *
 * Which days: a plain `scan` reports every day with unreported usage — each
 * day since the day before the last scan that finished cleanly, at most
 * LOOKBACK_DAYS back, sending only the days that were never sent or have
 * grown since (`ledger.js`). The boundary is the calendar and the local
 * record, never Claude's own session or usage-limit window. `--days N` is the
 * explicit backfill: it sends every day in its window, as it always has.
 *
 * Progress goes to stderr and the result (the "sent" line, or the --dry-run
 * JSON) to stdout, so `--dry-run > preview.json` captures only the payloads.
 *
 * // req: FR-USAGE-002, ADR-035, ADR-058, ADR-059, ADR-060
 */

import { resolveCredentials } from './config.js';
import { accountEntry, isDue, loadLedger, prune, recordSent, saveLedger } from './ledger.js';
import { login } from './login.js';
import { ensureScheduled } from './schedule.js';
import { send } from './upload.js';
import { buildPayloads, candidateProjectDirs, collectDays, existingDirs, lastDays } from './usage-parser.js';

export class CliError extends Error {}

/** Claude Code's own default transcript retention (`cleanupPeriodDays`) — older days are usually gone locally. */
export const LOOKBACK_DAYS = 30;

const fmt = (n) => Math.round(n).toLocaleString('en-US');

/** YYYY-MM-DD → the calendar day before it. */
function dayBefore(date) {
  return new Date(Date.parse(`${date}T12:00:00Z`) - 86400000).toISOString().slice(0, 10);
}

/**
 * The saved login (or env vars). With neither, a terminal session signs in
 * through the browser right here and carries on; a scheduled/headless run
 * never opens a browser — it fails with a message saying what to run once.
 */
async function credentialsFor({ dryRun, io, interactive, loginOptions }) {
  const creds = resolveCredentials();
  if (creds) return creds;
  if (dryRun) return null; // a local preview needs no account
  if (!interactive) {
    throw new CliError('not signed in. Run `claude-team-usage login` once in a terminal (it opens your browser).');
  }
  io.info('Not signed in yet — this is a one-time step.');
  return login({ io, ...loginOptions });
}

/**
 * `days` given: exactly the last N days. Otherwise: from the day before the
 * last clean scan (one day of overlap covers a session running past midnight),
 * or all of LOOKBACK_DAYS when there is none. `now` is for tests.
 */
export function scanWindow({ days, lastCompleteScan, now = Date.now() }) {
  if (days) return lastDays(days, now);
  const all = lastDays(LOOKBACK_DAYS, now);
  if (!lastCompleteScan) return all;
  const from = dayBefore(lastCompleteScan);
  const window = all.filter((d) => d >= from);
  return window.length ? window : all.slice(-1);
}

export async function scan({
  dryRun = false,
  days = null,
  verbose = false,
  io,
  interactive = false,
  fetchImpl,
  loginOptions = {},
  now,
  ensureSchedule = ensureScheduled,
}) {
  const creds = await credentialsFor({ dryRun, io, interactive, loginOptions });

  // A person at a terminal with a saved login (just signed in, or any later
  // run): make sure the daily 11:00/16:00 task exists, then carry on with this
  // scan. Only ever from a terminal — the scheduled run itself has none, so it
  // never registers anything and never reaches the browser sign-in above.
  if (interactive && !dryRun && creds && creds.source !== 'environment') ensureSchedule({ io });

  const candidates = candidateProjectDirs();
  const dirs = existingDirs(candidates);
  if (dirs.length === 0) {
    throw new CliError(
      `Claude Code usage directory not found (looked in: ${candidates.join(', ')}). ` +
        'Has Claude Code been used on this machine? Set CLAUDE_PROJECTS_DIR if it keeps transcripts elsewhere.',
    );
  }

  // The local record of what was already sent — only for a real upload; a dry
  // run neither reads nor writes it.
  const ledger = dryRun ? null : loadLedger();
  const account = ledger ? accountEntry(ledger, creds) : null;

  const dates = scanWindow({ days, lastCompleteScan: account?.lastCompleteScan ?? null, now });
  const range = dates.length === 1 ? dates[0] : `${dates[0]}..${dates[dates.length - 1]}`;
  io.info(`scanning ${dirs.join(', ')} for ${range} (Asia/Phnom_Penh)`);

  const result = collectDays(dirs, dates);
  io.info(
    `  ${fmt(result.files)} transcript file(s) touched recently, of ${fmt(result.totalFiles)} — ` +
      `${fmt(result.counted)} response(s) counted, ${fmt(result.duplicates)} duplicate line(s) merged` +
      (result.skipped ? `, ${fmt(result.skipped)} unreadable line(s) skipped` : ''),
  );

  const identity = creds ?? { email: 'not-signed-in@localhost', displayName: '(not signed in)' };
  const payloads = buildPayloads(result.days, dates, identity);

  // Records a clean finish: the next plain scan starts from here.
  const finish = () => {
    if (!account) return;
    if (!days) account.lastCompleteScan = dates[dates.length - 1];
    prune(account, lastDays(LOOKBACK_DAYS, now)[0]);
    saveLedger(ledger);
  };

  if (payloads.length === 0) {
    finish();
    io.out(`no usage found for ${range}`);
    return { sent: 0, payloads };
  }

  for (const { payload, total } of payloads) {
    io.info(
      `  ${payload.date}  ${fmt(total)} tokens  (input ${fmt(payload.input)}, output ${fmt(payload.output)}, ` +
        `cache read ${fmt(payload.cacheRead)}, cache write ${fmt(payload.cacheCreation)})  ${payload.models.join(', ')}`,
    );
    const a = payload.activity;
    if (a) {
      io.info(
        `              ${fmt(a.requestCount)} request(s), ${fmt(a.sessionCount)} session(s), ` +
          `${Math.round(a.activeSeconds / 60)} min active, ${a.projects.length} project(s)`,
      );
    }
  }

  if (dryRun) {
    io.out(
      JSON.stringify(
        payloads.map(({ payload, total, counted }) => ({ ...payload, _total: total, _responses: counted })),
        null,
        2,
      ),
    );
    return { sent: 0, payloads };
  }

  // An explicit --days backfill sends its whole window; a plain scan only what is new.
  const due = days ? payloads : payloads.filter(({ payload }) => isDue(account, payload));
  if (due.length === 0) {
    finish();
    io.out(`nothing new to report for ${range} — ${payloads.length} day(s) already up to date`);
    return { sent: 0, payloads: due };
  }

  io.info(`uploading to ${creds.ingestUrl} as ${creds.displayName} <${creds.email}>`);

  // Oldest first, one request per day. Each is an independent upsert, so a failure
  // part-way through leaves the days already sent correctly recorded — locally too.
  let sent = 0;
  for (const { payload, total } of due) {
    try {
      const res = await send(creds.ingestUrl, creds.token, payload, {
        bypassToken: String(process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? '').trim() || undefined,
        fetchImpl,
        onRetry: (e) => verbose && io.err(`[debug] first attempt failed: ${e.message} — retrying once`),
      });
      sent++;
      recordSent(account, payload);
      saveLedger(ledger);
      io.info(`  ${payload.date}  ${fmt(total)} tokens  ✓ ${res.action ?? 'accepted'}`);
    } catch (error) {
      const done = sent ? ` (${sent} of ${due.length} day(s) were sent before this)` : '';
      throw new CliError(`upload failed for ${payload.date}: ${error.message}${done}`, { cause: error });
    }
  }
  finish();

  const totalTokens = due.reduce((n, { total }) => n + total, 0);
  const sentRange = due.length === 1 ? due[0].payload.date : `${due[0].payload.date}..${due[due.length - 1].payload.date}`;
  io.out(`sent ${fmt(totalTokens)} tokens for ${sentRange} (${creds.displayName} <${creds.email}>)`);
  if (creds.dashboardUrl) io.out(`view it at ${creds.dashboardUrl}`);
  return { sent, payloads: due };
}
