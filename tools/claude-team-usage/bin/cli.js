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

const { version, engines } = createRequire(import.meta.url)('../package.json');

// `engines` only makes npm warn. Checked here, before anything else loads,
// so an old Node says what to do instead of failing on a missing fetch().
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 18 || (major === 18 && minor < 18)) {
  process.stderr.write(
    `claude-team-usage needs Node.js ${engines.node.replace('>=', '')} or newer; this is ${process.version}. ` +
      'Install the current LTS from https://nodejs.org and try again.\n',
  );
  process.exit(1);
}

const { login, logout } = await import('../src/login.js');
const { scan } = await import('../src/scan.js');
const { closeConnections } = await import('../src/upload.js');

const HELP = `claude-team-usage ${version}

Usage:
  claude-team-usage scan [--days N] [--dry-run] [--verbose]
      Scan this machine's Claude Code transcripts and send the totals to Coc Docs.
      --days N    report the last N days (1-400), for a one-off backfill. Default 1 (today).
      --dry-run   print the payloads that would be sent; send nothing.
  claude-team-usage login     Sign in through your browser (done automatically by the first scan).
  claude-team-usage logout    Remove the saved credentials from this machine.

The first \`scan\` in a terminal opens your browser to sign in to Coc Docs, once.
Later runs, including scheduled ones, use the saved sign-in.
`;

class UsageError extends Error {}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = { command, dryRun: false, verbose: false, days: 1, help: false };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--verbose') opts.verbose = true;
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

  const opts = parseArgs(argv);
  if (opts.help) {
    io.out(HELP);
    return;
  }

  switch (opts.command) {
    case 'scan':
      await scan({
        dryRun: opts.dryRun,
        days: opts.days,
        verbose: opts.verbose,
        io,
        // A person at a terminal can finish a browser sign-in; a scheduled run
        // (output redirected to a log) must never wait on one.
        interactive: Boolean(process.stderr.isTTY),
      });
      return;
    case 'login':
      await login({ io });
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
  .catch((error) => {
    io.err(`claude-team-usage: ${error.message}`);
    if (error instanceof UsageError) io.err('Run `claude-team-usage --help` for usage.');
    process.exitCode = error instanceof UsageError ? 2 : 1;
  })
  .finally(closeConnections);
