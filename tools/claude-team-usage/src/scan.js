/**
 * `claude-team-usage scan` — the CLI form of `node push-usage.mjs`: find this
 * machine's transcripts, total the wanted days, and report them to Coc Docs.
 *
 * Progress goes to stderr and the result (the "sent" line, or the --dry-run
 * JSON) to stdout, so `--dry-run > preview.json` captures only the payloads.
 *
 * // req: FR-USAGE-002, ADR-035, ADR-058, ADR-059, ADR-060
 */

import { resolveCredentials } from './config.js';
import { login } from './login.js';
import { send } from './upload.js';
import { buildPayloads, candidateProjectDirs, collectDays, existingDirs, lastDays } from './usage-parser.js';

export class CliError extends Error {}

const fmt = (n) => Math.round(n).toLocaleString('en-US');

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

export async function scan({ dryRun = false, days = 1, verbose = false, io, interactive = false, fetchImpl, loginOptions = {} }) {
  const creds = await credentialsFor({ dryRun, io, interactive, loginOptions });

  const candidates = candidateProjectDirs();
  const dirs = existingDirs(candidates);
  if (dirs.length === 0) {
    throw new CliError(
      `Claude Code usage directory not found (looked in: ${candidates.join(', ')}). ` +
        'Has Claude Code been used on this machine? Set CLAUDE_PROJECTS_DIR if it keeps transcripts elsewhere.',
    );
  }

  const dates = lastDays(days);
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

  if (payloads.length === 0) {
    io.out(`no usage found for ${range}`);
    return { sent: 0, payloads };
  }

  for (const { payload, total } of payloads) {
    io.info(
      `  ${payload.date}  ${fmt(total)} tokens  (input ${fmt(payload.input)}, output ${fmt(payload.output)}, ` +
        `cache read ${fmt(payload.cacheRead)}, cache write ${fmt(payload.cacheCreation)})  ${payload.models.join(', ')}`,
    );
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

  io.info(`uploading to ${creds.ingestUrl} as ${creds.displayName} <${creds.email}>`);

  // Oldest first, one request per day. Each is an independent upsert, so a failure
  // part-way through leaves the days already sent correctly recorded.
  let sent = 0;
  for (const { payload, total } of payloads) {
    try {
      const res = await send(creds.ingestUrl, creds.token, payload, {
        bypassToken: String(process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? '').trim() || undefined,
        fetchImpl,
        onRetry: (e) => verbose && io.err(`[debug] first attempt failed: ${e.message} — retrying once`),
      });
      sent++;
      io.info(`  ${payload.date}  ${fmt(total)} tokens  ✓ ${res.action ?? 'accepted'}`);
    } catch (error) {
      const done = sent ? ` (${sent} of ${payloads.length} day(s) were sent before this)` : '';
      throw new CliError(`upload failed for ${payload.date}: ${error.message}${done}`, { cause: error });
    }
  }

  const totalTokens = payloads.reduce((n, { total }) => n + total, 0);
  io.out(`sent ${fmt(totalTokens)} tokens for ${range} (${creds.displayName} <${creds.email}>)`);
  if (creds.dashboardUrl) io.out(`view it at ${creds.dashboardUrl}`);
  return { sent, payloads };
}
