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
import { accountEntry, hasReportedBefore, isDue, loadLedger, prune, recordSent, recordSkipped, saveLedger } from './ledger.js';
import { login } from './login.js';
import { ensureScheduled } from './schedule.js';
import { announceScanStart, deliverScanLogs, ScanRecorder } from './scan-log.js';
import { DISABLED_PERIOD, send, TRACKING_DISABLED } from './upload.js';
import { buildPayloads, candidateProjectDirs, collectDays, existingDirs, lastDays } from './usage-parser.js';

export class CliError extends Error {}

/** The transcripts were read and totalled, but sending them failed — told apart from a CLI failure in the scheduled log. */
export class UploadFailedError extends CliError {}

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

/** `POST /api/ingest/scan` — the scan-only sibling of the ingest URL the login saved. */
export const scanUrl = (ingestUrl) => `${String(ingestUrl).replace(/\/+$/, '')}/scan`;

/**
 * A scan that uploaded nothing (no usage, or every day already reported) still
 * tells Coc Docs it ran, so the dashboard's "Last scan" moves while "Last
 * reported" keeps meaning the last upload (ADR-097). Sends only the email — no
 * usage, so nothing is duplicated. An upload records the scan time itself, so
 * this is never sent after one. Never fails the scan: the usage is already
 * correct on the server, and this is only the check-in time.
 *
 * Returns whether the check-in landed, and why not, for the scan log (ADR-099).
 * `notTracked`: the server has no roster row for this email. Only a usage
 * report adds someone to the roster (ADR-035), so for an account that has
 * never had usage to report this is the expected answer, not a fault — the
 * caller decides which it is.
 */
async function recordScanTime({ creds, io, fetchImpl, verbose }) {
  try {
    const res = await send(scanUrl(creds.ingestUrl), creds.token, { email: creds.email }, {
      bypassToken: String(process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? '').trim() || undefined,
      fetchImpl,
      onRetry: (e) => verbose && io.err(`[debug] scan time: first attempt failed: ${e.message} — retrying once`),
    });
    const notTracked = res.action === 'not-tracked';
    io.info(notTracked ? '  scan time not recorded: this account has not reported any usage yet' : '  scan time recorded');
    return notTracked
      ? { ok: false, notTracked: true, why: 'this account has not reported any usage yet, so there is no scan time to record' }
      : { ok: true };
  } catch (error) {
    if (error?.code === TRACKING_DISABLED) {
      // An administrator's decision, not a fault here: say so, and nothing about logging in.
      io.err(error.message);
      return { ok: false, why: 'Claude usage tracking is disabled for this account by an administrator' };
    }
    const why = error?.status === 404 ? 'this Coc Docs server does not record scan times yet' : error.message;
    io.err(`warning: could not record the scan time (${why}). Your usage is unaffected.`);
    return { ok: false, why };
  }
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

const sumTokens = (t) => (t?.input ?? 0) + (t?.output ?? 0) + (t?.cacheRead ?? 0) + (t?.cacheCreation ?? 0);

/** A recorder that records nothing — a dry run keeps no log. */
const NO_LOG = { step() {}, fail() {}, setCounts() {}, uploadStatus: null };

export async function scan({
  dryRun = false,
  days = null,
  verbose = false,
  io,
  interactive = false,
  scheduled = !interactive,
  fetchImpl,
  loginOptions = {},
  now,
  ensureSchedule = ensureScheduled,
  cliVersion = null,
}) {
  const creds = await credentialsFor({ dryRun, io, interactive, loginOptions });

  // One scan-log record per real scan (ADR-099). Without a login there is
  // nowhere to send it, and a dry run is a preview, not a scan.
  const recorder = !dryRun && creds ? new ScanRecorder({ cliVersion, scheduled }) : null;
  const log = recorder ?? { ...NO_LOG };
  const state = { step: 'start' };
  log.step('start', 'success', scheduled ? 'Started by the daily schedule' : 'Started manually');
  // Runs alongside the scan (ADR-107); awaited only so the start reaches the
  // server before the record that completes it. Never rejects.
  const announced = recorder ? announceScanStart({ creds, recorder, io, fetchImpl, verbose }) : null;

  let result;
  try {
    result = await runScan({ creds, dryRun, days, verbose, io, scheduled, fetchImpl, now, ensureSchedule, log, state });
  } catch (error) {
    if (recorder) {
      recorder.fail(state.step, error);
      await announced;
      await deliverScanLogs({ creds, record: recorder.toRecord(creds.email), io, fetchImpl, verbose });
    }
    throw error;
  }
  if (recorder) {
    await announced;
    await deliverScanLogs({ creds, record: recorder.toRecord(creds.email), io, fetchImpl, verbose });
  }
  return result;
}

async function runScan({ creds, dryRun, days, verbose, io, scheduled, fetchImpl, now, ensureSchedule, log, state }) {
  // Any run a person started (a terminal, Git Bash included) with a saved
  // login: make sure the daily 11:00/16:00 task exists and still runs this
  // installation, then carry on with this scan. Never from the run Task
  // Scheduler started — it does not rewrite the task it is running from.
  if (!scheduled && !dryRun && creds && creds.source !== 'environment') ensureSchedule({ io });

  state.step = 'find-transcripts';
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

  state.step = 'parse-usage';
  const result = collectDays(dirs, dates);
  io.info(
    `  ${fmt(result.files)} transcript file(s) touched recently, of ${fmt(result.totalFiles)} — ` +
      `${fmt(result.counted)} response(s) counted, ${fmt(result.duplicates)} duplicate line(s) merged` +
      (result.skipped ? `, ${fmt(result.skipped)} unreadable line(s) skipped` : ''),
  );

  const unreadable = result.unreadableFiles ?? 0;
  log.step(
    'find-transcripts',
    unreadable ? 'warning' : 'success',
    `${fmt(result.files)} transcript file(s) found for ${range}, of ${fmt(result.totalFiles)} on this machine` +
      (unreadable ? ` — ${fmt(unreadable)} could not be read` : ''),
  );
  const brokenLines = result.skipped - unreadable;
  log.step(
    'parse-usage',
    'success',
    `${fmt(result.lines)} usage line(s) read` + (brokenLines > 0 ? `, ${fmt(brokenLines)} incomplete line(s) skipped` : ''),
  );
  log.step('deduplicate', 'success', `${fmt(result.duplicates)} duplicate record(s) merged — ${fmt(result.counted)} response(s) remain`);
  log.setCounts({ transcriptFiles: result.files, responses: result.counted, duplicates: result.duplicates });

  state.step = 'calculate-usage';
  const identity = creds ?? { email: 'not-signed-in@localhost', displayName: '(not signed in)' };
  const payloads = buildPayloads(result.days, dates, identity);
  const windowTokens = payloads.reduce((n, { total }) => n + total, 0);
  log.step('calculate-usage', 'success', `${fmt(windowTokens)} token(s) across ${payloads.length} day(s)`);

  // Records a clean finish: the next plain scan starts from here.
  const finish = () => {
    if (!account) return;
    if (!days) account.lastCompleteScan = dates[dates.length - 1];
    prune(account, lastDays(LOOKBACK_DAYS, now)[0]);
    saveLedger(ledger);
  };

  // "No new usage" is a successful scan, never a warning or an error (ADR-099).
  //
  // `neverReported`: this scan found no usage at all, so an account the
  // server doesn't track yet ("not-tracked") is simply one that has had
  // nothing to report — a new user's first scans. That is a successful scan.
  // Anywhere else "not-tracked" contradicts this PC's own record of days it
  // already sent (e.g. the roster row was deleted), so it stays a warning.
  const checkIn = async (nothing = 'Nothing to upload', { neverReported = false } = {}) => {
    state.step = 'upload';
    log.setCounts({ newTokens: 0, daysUploaded: 0 });
    log.uploadStatus = 'not-needed';
    const scanTime = await recordScanTime({ creds, io, fetchImpl, verbose });
    if (scanTime.ok) {
      log.step('upload', 'success', `${nothing} — scan check-in recorded`);
    } else if (scanTime.notTracked && neverReported) {
      log.step(
        'upload',
        'success',
        `${nothing} — this account has no usage on Coc Docs yet, so there is no scan time to record. It appears with its first usage.`,
      );
    } else if (scanTime.notTracked) {
      log.step(
        'upload',
        'warning',
        `${nothing}, but Coc Docs has no record of this account although this PC reported usage before. ` +
          'Run `claude-team-usage scan --days 30` to send it again.',
      );
    } else {
      log.step('upload', 'warning', `${nothing}, but the check-in was not recorded: ${scanTime.why}`);
    }
  };

  state.step = 'check-new-usage';
  if (payloads.length === 0) {
    finish();
    io.out(`no usage found for ${range}`);
    if (!dryRun && creds) {
      log.step('check-new-usage', 'success', 'No usage in the scanned days — no new usage found');
      await checkIn('Nothing to upload', { neverReported: !hasReportedBefore(account) });
    }
    return { sent: 0, payloads, outcome: 'no-usage' };
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
    return { sent: 0, payloads, outcome: 'dry-run' };
  }

  // An explicit --days backfill sends its whole window; a plain scan only what is new.
  const due = days ? payloads : payloads.filter(({ payload }) => isDue(account, payload));
  if (due.length === 0) {
    finish();
    io.out(`nothing new to report for ${range} — ${payloads.length} day(s) already up to date`);
    log.step('check-new-usage', 'success', `No new usage since the last report — ${payloads.length} day(s) already up to date`);
    await checkIn();
    return { sent: 0, payloads: due, outcome: 'up-to-date' };
  }
  // New tokens: growth over what this machine last sent for each day, so a
  // day re-sent only because it gained a prompt counts 0, not its whole total.
  const newTokens = due.reduce((n, { payload }) => n + Math.max(0, sumTokens(payload) - sumTokens(account.days[payload.date])), 0);
  log.step('check-new-usage', 'success', `${due.length} day(s) to report, ${fmt(newTokens)} new token(s)`);
  log.setCounts({ newTokens, daysUploaded: 0 });

  io.info(`uploading to ${creds.ingestUrl} as ${creds.displayName} <${creds.email}>`);
  state.step = 'upload';

  // Oldest first, one request per day. Each is an independent upsert, so a failure
  // part-way through leaves the days already sent correctly recorded — locally too.
  let sent = 0;
  let skipped = 0;
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
      log.setCounts({ daysUploaded: sent });
      io.info(`  ${payload.date}  ${fmt(total)} tokens  ✓ ${res.action ?? 'accepted'}`);
    } catch (error) {
      // A day from a time tracking was disabled (ADR-105): refused for good.
      // Remember that locally so it is never sent again, and carry on.
      if (error?.code === DISABLED_PERIOD) {
        skipped++;
        recordSkipped(account, payload);
        saveLedger(ledger);
        io.info(`  ${payload.date}  ${fmt(total)} tokens  — skipped, ${error.message}`);
        continue;
      }
      log.uploadStatus = 'failed';
      // Disabled now: the administrator's message alone — no date, no login advice.
      if (error?.code === TRACKING_DISABLED) throw new UploadFailedError(error.message, { cause: error });
      const done = sent ? ` (${sent} of ${due.length} day(s) were sent before this)` : '';
      throw new UploadFailedError(`upload failed for ${payload.date}: ${error.message}${done}`, { cause: error });
    }
  }
  const skippedNote = skipped
    ? `${skipped} day(s) not recorded — tracking was disabled for this account then`
    : '';

  if (sent === 0) {
    finish();
    io.out(`nothing uploaded: ${skippedNote}`);
    await checkIn(`Nothing uploaded: ${skippedNote}`);
    return { sent, skipped, payloads: due, outcome: 'skipped' };
  }

  finish();
  log.uploadStatus = 'uploaded';
  log.step(
    'upload',
    skipped ? 'warning' : 'success',
    `Uploaded ${sent} day(s) — usage and scan time recorded` + (skipped ? `; ${skippedNote}` : ''),
  );

  const sentDays = due.filter(({ payload }) => account.days[payload.date] && !account.days[payload.date].skipped);
  const totalTokens = sentDays.reduce((n, { total }) => n + total, 0);
  const sentRange =
    sentDays.length === 1 ? sentDays[0].payload.date : `${sentDays[0].payload.date}..${sentDays[sentDays.length - 1].payload.date}`;
  io.out(`sent ${fmt(totalTokens)} tokens for ${sentRange} (${creds.displayName} <${creds.email}>)`);
  if (skipped) io.out(skippedNote);
  if (creds.dashboardUrl) io.out(`view it at ${creds.dashboardUrl}`);
  return { sent, skipped, payloads: due, outcome: 'uploaded' };
}
