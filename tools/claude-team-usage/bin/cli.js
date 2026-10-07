#!/usr/bin/env node
/**
 * claude-team-usage — reports this machine's own Claude Code usage to the Coc
 * Docs team dashboard. Reads only ~/.claude transcripts on this machine; never
 * talks to Anthropic, never reads anyone else's usage.
 *
 * Exit codes: 0 success (including "no usage found"), 1 failure, 2 bad usage.
 *
 * // req: FR-USAGE-002, ADR-059, ADR-060
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const { version, engines } = createRequire(import.meta.url)('../package.json');

// Started by Task Scheduler (`scan --scheduled`, see schedule.js): the output
// goes to scheduled-scan.log, so the run is bracketed by a header saying which
// Node.js and CLI ran, and a `---- result:` line saying how it ended. A run
// with only the `====` line cmd writes first means Node.js itself never started.
const scheduledRun = process.argv[2] === 'scan' && process.argv.includes('--scheduled');
const pad = (n) => String(n).padStart(2, '0');
const stamp = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
/** uploaded | no-usage | up-to-date | upload-failed | cli-failed */
function logResult(result, code) {
  if (scheduledRun) process.stderr.write(`---- result: ${result} | exit ${code} | finished ${stamp()}\n`);
}
if (scheduledRun) {
  process.stderr.write(`claude-team-usage ${version} | started ${stamp()} | node ${process.execPath} | cli ${fileURLToPath(import.meta.url)}\n`);
}

// `engines` only makes npm warn. Checked here, before anything else loads,
// so an old Node says what to do instead of failing on a missing fetch().
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 18 || (major === 18 && minor < 18)) {
  process.stderr.write(
    `claude-team-usage needs Node.js ${engines.node.replace('>=', '')} or newer; this is ${process.version}. ` +
      'Install the current LTS from https://nodejs.org and try again.\n',
  );
  logResult('cli-failed', 1);
  process.exit(1);
}

// A broken install (a half-updated checkout, a missing file) fails here; caught
// so the scheduled log says so in one line instead of ending on a stack trace.
let modules;
try {
  modules = await Promise.all([import('../src/login.js'), import('../src/scan.js'), import('../src/upload.js'), import('../src/schedule.js')]);
} catch (error) {
  process.stderr.write(`claude-team-usage: this installation is broken and cannot start: ${error.stack ?? error}\n`);
  logResult('cli-failed', 1);
  process.exit(1);
}
const [{ login, logout }, { scan, UploadFailedError }, { closeConnections }, schedule] = modules;

const HELP = `claude-team-usage ${version}

Usage:
  claude-team-usage scan [--days N] [--dry-run] [--verbose]
      Scan this machine's Claude Code transcripts and send the totals to Coc Docs.
      By default, sends every day (up to 30 back) with usage not yet reported from here.
      --days N    re-send the last N days (1-400) regardless, for a one-off backfill.
      --dry-run   print the payloads that would be sent; send nothing.
  claude-team-usage login     Sign in through your browser (done automatically by the first scan),
                              then set up or repair the daily scans on Windows.
  claude-team-usage logout    Remove the saved credentials from this machine.
  claude-team-usage schedule [status|remove|test [MINUTES]]
      Windows: the daily 11:00 and 16:00 scans. \`login\` and \`scan\` set them up and repair
      them for you; use \`status\` to check them, \`remove\` to stop them, no argument to turn
      them back on. \`test\` adds a scan every MINUTES (default 5) for 24 hours, for testing;
      \`schedule\` with no argument ends it.

The first \`scan\` in a terminal opens your browser to sign in to Coc Docs, once, and on
Windows sets up the daily scans. Later runs, including scheduled ones, use the saved sign-in.
`;

class UsageError extends Error {}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = { command, dryRun: false, verbose: false, days: null, help: false, scheduled: false };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--verbose') opts.verbose = true;
    // Internal: only the scheduled task passes it (schedule.js SCAN_ARGS).
    else if (a === '--scheduled' && command === 'scan') opts.scheduled = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--days' || a.startsWith('--days=')) {
      const raw = a.includes('=') ? a.split('=')[1] : rest[++i];
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 400) throw new UsageError(`--days must be a whole number from 1 to 400, got "${raw ?? ''}"`);
      opts.days = n;
    } else throw new UsageError(`unknown option: ${a}`);
  }
  return opts;
}

const io = {
  out: (line) => process.stdout.write(`${line}\n`),
  info: (line) => process.stderr.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
};

async function main(argv) {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h' || argv[0] === 'help') {
    io.out(HELP);
    return;
  }
  if (argv[0] === '--version' || argv[0] === '-v') {
    io.out(version);
    return;
  }

  if (argv[0] === 'schedule') {
    const [, action = 'install', ...extra] = argv;
    if (action === 'test' && extra.length <= 1) {
      schedule.installTest({ io, minutes: extra.length ? Number(extra[0]) : schedule.DEFAULT_TEST_MINUTES });
      return;
    }
    const run = { install: schedule.install, status: schedule.status, remove: schedule.remove }[action];
    if (!run || extra.length) throw new UsageError('usage: claude-team-usage schedule [status|remove|test [MINUTES]]');
    run({ io });
    return;
  }

  const opts = parseArgs(argv);
  if (opts.help) {
    io.out(HELP);
    return;
  }

  switch (opts.command) {
    case 'scan': {
      const result = await scan({
        dryRun: opts.dryRun,
        days: opts.days,
        verbose: opts.verbose,
        io,
        // A person at a terminal can finish a browser sign-in; a scheduled run
        // (output redirected to a log) must never wait on one.
        interactive: Boolean(process.stderr.isTTY) && !opts.scheduled,
        // Anything but the scheduled task itself — Git Bash too, where stderr
        // is no TTY — checks the task exists and runs this installation.
        scheduled: opts.scheduled,
        cliVersion: version,
      });
      return result.outcome;
    }
    case 'login':
      await login({ io, ensureSchedule: schedule.ensureScheduled });
      return;
    case 'logout':
      logout({ io });
      return;
    default:
      throw new UsageError(`unknown command: ${opts.command}`);
  }
}

// Sets exitCode rather than calling process.exit(): exiting hard while a fetch
// socket is still open trips a libuv assertion on Windows and reports 127
// instead of 1, which would hide real failures from Task Scheduler.
main(process.argv.slice(2))
  .then((outcome) => logResult(outcome, 0))
  .catch((error) => {
    io.err(`claude-team-usage: ${error.message}`);
    if (error instanceof UsageError) io.err('Run `claude-team-usage --help` for usage.');
    process.exitCode = error instanceof UsageError ? 2 : 1;
    logResult(error instanceof UploadFailedError ? 'upload-failed' : 'cli-failed', process.exitCode);
  })
  .finally(closeConnections);
