/**
 * `claude-team-usage schedule` — registers a Windows Task Scheduler task that
 * runs `scan` every day at 11:00 and 16:00 local time, as the signed-in
 * Windows user, so it reads the same %APPDATA% credentials a manual scan does.
 *
 * What the task runs, and why each part is there:
 *   - `node.exe <this package>/bin/cli.js scan` by absolute path, so it does
 *     not depend on PATH inside the task. A plain scan already sends every
 *     day not yet reported (including anything after the previous 16:00 run,
 *     or a day the PC was off), so no `--days` is needed.
 *   - wrapped in `cmd /c ... >> scheduled-scan.log 2>&1`: the log is how a
 *     run is checked afterwards, and with stderr redirected `scan` sees no
 *     terminal, so it can never open a browser and wait on a sign-in.
 *   - LogonType InteractiveToken: runs as this user, only while they are
 *     logged on, and needs no stored password or admin rights. The trigger
 *     lives in Task Scheduler itself, so it survives restarts;
 *     StartWhenAvailable runs a slot missed while the PC was off or logged
 *     out as soon as it can.
 *
 * Nobody normally runs `schedule`: the first `scan` from a terminal calls
 * `ensureScheduled` right after the browser sign-in has saved a login, and
 * creates the task if it is missing. Nothing here signs in or touches
 * credentials; registration refuses until a login has been saved.
 *
 * // req: FR-USAGE-002, ADR-060
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configDir, resolveCredentials } from './config.js';

export const TASK_NAME = 'claude-team-usage';
/** Local wall-clock times, 24h. */
export const SCHEDULE_TIMES = ['11:00', '16:00'];
export const SCAN_ARGS = ['scan'];
export const EXECUTION_LIMIT = 'PT15M';
const SCHTASKS_TIMEOUT_MS = 30_000;

export class ScheduleError extends Error {}

const CLI_PATH = fileURLToPath(new URL('../bin/cli.js', import.meta.url));

export function logPath(env = process.env) {
  return path.join(configDir(env), 'scheduled-scan.log');
}

const escapeXml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

/** cmd.exe gives `"` and `%` meaning even inside quotes; a path holding either can't be passed safely. */
function assertCmdSafe(label, value) {
  if (/["%\r\n]/.test(value)) throw new ScheduleError(`${label} contains a character cmd.exe cannot quote safely: ${value}`);
}

/**
 * The `cmd /c` argument string. The whole command is wrapped in one extra
 * pair of quotes, which cmd strips (`cmd /?`, "more than two quote characters").
 */
export function commandLine({ node, cli, args, log }) {
  for (const [label, value] of [['Node.js path', node], ['CLI path', cli], ['log path', log]]) assertCmdSafe(label, value);
  const run = [`"${node}"`, `"${cli}"`, ...args].join(' ');
  return `/d /c "(echo ==== %DATE% %TIME% & ${run}) >> "${log}" 2>&1"`;
}

/** Task Scheduler 1.2 XML for the two daily triggers. `today` is YYYY-MM-DD, the first day it applies. */
export function buildTaskXml({ userId, command, args, times = SCHEDULE_TIMES, today }) {
  const triggers = times
    .map(
      (hhmm) => `    <CalendarTrigger>
      <StartBoundary>${today}T${hhmm}:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
    </CalendarTrigger>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Reports this machine's Claude Code usage to Coc Docs (claude-team-usage scan) at ${times.join(' and ')}.</Description>
  </RegistrationInfo>
  <Triggers>
${triggers}
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>${escapeXml(userId)}</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>${EXECUTION_LIMIT}</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${escapeXml(command)}</Command>
      <Arguments>${escapeXml(args)}</Arguments>
    </Exec>
  </Actions>
</Task>
`;
}

function schtasks(args) {
  try {
    return execFileSync('schtasks.exe', args, { encoding: 'utf8', timeout: SCHTASKS_TIMEOUT_MS, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const why = error.code === 'ETIMEDOUT' ? `no answer within ${SCHTASKS_TIMEOUT_MS / 1000}s` : String(error.stderr || error.message).trim();
    throw new ScheduleError(`schtasks ${args[0]} failed: ${why}`);
  }
}

function requireWindows(platform = process.platform) {
  if (platform === 'win32') return;
  throw new ScheduleError(
    'scheduling is built in on Windows only. Elsewhere, add these to `crontab -e`:\n' +
      SCHEDULE_TIMES.map((t) => `  ${Number(t.slice(3))} ${Number(t.slice(0, 2))} * * * claude-team-usage ${SCAN_ARGS.join(' ')}`).join('\n'),
  );
}

const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** `schedule remove` leaves this, so a later `scan` does not quietly put the task back. */
function optOutPath(env) {
  return path.join(configDir(env), 'schedule-disabled');
}

/**
 * Creates the task, or replaces it (`/F`) — one task per name, so running this
 * again never adds a second one. Throws ScheduleError when this setup cannot
 * support an unattended run (no saved login, env-var credentials, npx cache).
 */
function register({ env, run }) {
  const creds = resolveCredentials(env);
  if (!creds) throw new ScheduleError('not signed in. Run `claude-team-usage login` once first, then `claude-team-usage schedule` again.');
  if (creds.source === 'environment') {
    throw new ScheduleError(
      'this shell signs in through USER_EMAIL / INGEST_URL / INGEST_SECRET, which a scheduled task does not see. ' +
        'Run `claude-team-usage login` once so the task can use the saved sign-in.',
    );
  }
  if (/[\\/]_npx[\\/]/.test(CLI_PATH)) {
    throw new ScheduleError('this copy is running from the npx cache, which npm may delete. Install it first: npm install -g claude-team-usage');
  }

  const log = logPath(env);
  fs.mkdirSync(path.dirname(log), { recursive: true });
  const userId = `${env.USERDOMAIN ? `${env.USERDOMAIN}\\` : ''}${env.USERNAME || os.userInfo().username}`;
  const xml = buildTaskXml({
    userId,
    command: env.ComSpec || path.join(env.SystemRoot || 'C:\\Windows', 'System32', 'cmd.exe'),
    args: commandLine({ node: process.execPath, cli: CLI_PATH, args: SCAN_ARGS, log }),
    today: localDate(),
  });

  // schtasks reads task XML as UTF-16; written to a private temp file, removed right after.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ctu-task-'));
  const file = path.join(tmp, 'task.xml');
  try {
    fs.writeFileSync(file, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(xml, 'utf16le')]));
    run(['/Create', '/F', '/TN', TASK_NAME, '/XML', file]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return { userId, log };
}

/** Whether Task Scheduler has the task. Uses only the exit status — schtasks' text is localized. */
export function isRegistered(run = schtasks) {
  try {
    run(['/Query', '/TN', TASK_NAME]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Called by an interactive `scan` once it has a saved login (right after the
 * first browser sign-in, or any later terminal run): registers the daily task
 * if it is not there yet, so nobody has to run `schedule` or `schtasks`.
 * Never fails the scan — a problem is one warning line, and the scan goes on.
 *
 * @returns 'created' | 'exists' | 'opted-out' | 'unsupported' | 'failed'
 */
export function ensureScheduled({ io, env = process.env, run = schtasks, platform = process.platform }) {
  if (platform !== 'win32') return 'unsupported';
  if (fs.existsSync(optOutPath(env))) return 'opted-out';
  if (isRegistered(run)) return 'exists';
  try {
    register({ env, run });
  } catch (error) {
    io.err(`warning: could not set up automatic scans (${error.message}). This scan continues.`);
    return 'failed';
  }
  io.info(`Automatic scans set up: every day at ${SCHEDULE_TIMES.join(' and ')}. Check them with \`claude-team-usage schedule status\`.`);
  return 'created';
}

export function install({ io, env = process.env, run = schtasks, platform = process.platform }) {
  requireWindows(platform);
  const { userId, log } = register({ env, run });
  fs.rmSync(optOutPath(env), { force: true });

  io.out(`scheduled "${TASK_NAME}": claude-team-usage ${SCAN_ARGS.join(' ')} every day at ${SCHEDULE_TIMES.join(' and ')}, as ${userId}`);
  io.out(`  log:      ${log}`);
  io.out(`  run now:  schtasks /Run /TN ${TASK_NAME}`);
  io.out('  check:    claude-team-usage schedule status');
  for (const name of ['CLAUDE_PROJECTS_DIR', 'CLAUDE_CONFIG_DIR', 'CLAUDE_TEAM_USAGE_CONFIG_DIR', 'COC_DOCS_URL']) {
    if (env[name]) io.err(`warning: ${name} is set in this shell; the task only sees it if it is also a user environment variable.`);
  }
  io.err('Runs only while you are logged on. Re-run `claude-team-usage schedule` after moving or reinstalling Node.js.');
}

export function remove({ io, env = process.env, run = schtasks, platform = process.platform }) {
  requireWindows(platform);
  run(['/Delete', '/F', '/TN', TASK_NAME]);
  fs.mkdirSync(path.dirname(optOutPath(env)), { recursive: true });
  fs.writeFileSync(optOutPath(env), 'Automatic scans were turned off with `claude-team-usage schedule remove`.\n');
  io.out(`removed scheduled task "${TASK_NAME}". The log at ${logPath(env)} was kept.`);
  io.out('`scan` will not set it up again; run `claude-team-usage schedule` to turn automatic scans back on.');
}

// schtasks' own /Query output is localized (labels and dates follow the
// Windows display language), so status reads the task through PowerShell as
// JSON with ISO dates instead.
const QUERY_PS =
  `$t = Get-ScheduledTask -TaskName '${TASK_NAME}' -ErrorAction Stop; $i = $t | Get-ScheduledTaskInfo; ` +
  "$d = { param($x) if ($x -and $x.Year -gt 2000) { $x.ToString('yyyy-MM-dd HH:mm') } else { $null } }; " +
  '[pscustomobject]@{ state = [string]$t.State; user = $t.Principal.UserId; ' +
  'lastRun = (& $d $i.LastRunTime); lastResult = $i.LastTaskResult; nextRun = (& $d $i.NextRunTime) } | ConvertTo-Json -Compress';
const NOT_YET_RUN = 0x41303;

export function describeResult(code) {
  if (code === 0) return '0 (success)';
  if (code === 1) return '1 (scan failed — see the log)';
  if (code === NOT_YET_RUN) return 'not run yet';
  if (code === 0x41301) return 'running now';
  return `${code} (0x${(code >>> 0).toString(16)})`;
}

function queryTask() {
  try {
    const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', QUERY_PS], {
      encoding: 'utf8',
      timeout: SCHTASKS_TIMEOUT_MS,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

/** Task Scheduler's own view of the task (next/last run, last result), then the log's latest run. */
export function status({ io, env = process.env, query = queryTask, platform = process.platform }) {
  requireWindows(platform);
  const task = query();
  if (!task) {
    io.out(`no scheduled task "${TASK_NAME}" — run \`claude-team-usage schedule\` to create it.`);
    return;
  }
  io.out(`task "${TASK_NAME}" (${task.state}, runs as ${task.user})`);
  io.out(`  last run:    ${task.lastRun ?? 'never'}  → ${describeResult(task.lastResult)}`);
  io.out(`  next run:    ${task.nextRun ?? 'none scheduled'}`);

  const log = logPath(env);
  let text = '';
  try {
    text = fs.readFileSync(log, 'utf8');
  } catch {
    io.out(`\nno runs logged yet (${log}).`);
    return;
  }
  const lastRun = text.slice(text.lastIndexOf('===='));
  io.out(`\nlatest run, from ${log}:\n${lastRun.trimEnd()}`);
}
