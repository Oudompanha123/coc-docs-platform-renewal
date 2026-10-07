/**
 * `claude-team-usage schedule` — registers a Windows Task Scheduler task that
 * runs `scan` every day at 11:00 and 16:00 local time, as the signed-in
 * Windows user, so it reads the same %APPDATA% credentials a manual scan does.
 *
 * What the task runs, and why each part is there:
 *   - `node.exe <this package>/bin/cli.js scan --scheduled` by absolute path, so
 *     it does not depend on PATH inside the task. A plain scan already sends
 *     every day not yet reported (including anything after the previous 16:00
 *     run, or a day the PC was off), so no `--days` is needed. `--scheduled`
 *     tells the CLI Task Scheduler started it: it never opens a browser, never
 *     re-registers the task it is running from, and logs a header and a result.
 *   - wrapped in `cmd /c ... >> scheduled-scan.log 2>&1`: the log is how a
 *     run is checked afterwards. The `====` line is written by cmd before Node
 *     starts, so it proves Task Scheduler fired even when Node cannot start.
 *   - started through `wscript.exe bin/run-hidden.jscript`, which runs that cmd
 *     line with its window hidden. Task Scheduler starting cmd.exe (a console
 *     program) in the user's session opens a console window every run;
 *     wscript.exe is windowless, and passes the exit code back as Last Result.
 *     (`conhost --headless` hides it too but always reports 0; "run whether
 *     logged on or not" needs admin rights.)
 *   - LogonType InteractiveToken: runs as this user, only while they are
 *     logged on, and needs no stored password or admin rights. The trigger
 *     lives in Task Scheduler itself, so it survives restarts;
 *     StartWhenAvailable runs a slot missed while the PC was off or logged
 *     out as soon as it can.
 *
 * The task stores absolute paths, so it must point at a copy that stays put:
 * a global npm install, never a git checkout, `npm link`, or the npx cache
 * (`unstableReason`). An interactive `scan` and every `login` call
 * `ensureScheduled`, which creates the task if it is missing and re-registers
 * it in place (`/Create /F`, same name, never a second task) when its Node.js
 * or CLI path no longer matches this installation or no longer exists.
 *
 * `schedule test [MINUTES]` adds a temporary every-N-minutes trigger on top of
 * the normal 11:00/16:00 ones, for checking the setup end to end. It expires
 * by itself after TEST_HOURS, and `schedule` alone restores the normal task.
 *
 * Nothing here signs in or touches credentials; registration refuses until a
 * login has been saved.
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
export const SCAN_ARGS = ['scan', '--scheduled'];
export const EXECUTION_LIMIT = 'PT15M';
/** `schedule test`: default interval, allowed range, and how long it lasts before only the daily triggers remain. */
export const DEFAULT_TEST_MINUTES = 5;
export const TEST_MINUTES_RANGE = [1, 60];
export const TEST_HOURS = 24;
const SCHTASKS_TIMEOUT_MS = 30_000;

export class ScheduleError extends Error {}

const CLI_PATH = fileURLToPath(new URL('../bin/cli.js', import.meta.url));

/** The Node.js and CLI this process is running from — what a task registered now would run. */
export function currentInstall() {
  const install = { node: process.execPath, cli: CLI_PATH };
  return { ...install, unstable: unstableReason(install) };
}

export function logPath(env = process.env) {
  return path.join(configDir(env), 'scheduled-scan.log');
}

const escapeXml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

const unescapeXml = (s) =>
  String(s).replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[e]);

/** Windows paths compare without case. */
const samePath = (a, b) => path.win32.normalize(String(a)).toLowerCase() === path.win32.normalize(String(b)).toLowerCase();

function isUnder(file, dir) {
  const rel = path.relative(dir, file);
  return Boolean(rel) && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * Why a task pointing at this Node.js + CLI would break later, or null when it
 * is a stable install. A global (or any) npm install lives at
 * `…/node_modules/claude-team-usage/`; anything else is a source checkout,
 * `npm link` (Node resolves the link to the checkout), or a copied folder.
 */
export function unstableReason({ node, cli }, { tmp = os.tmpdir(), exists = fs.existsSync } = {}) {
  const pkg = path.dirname(path.dirname(cli));
  if (/[\\/]_npx[\\/]/.test(cli)) return 'it is running from the npx cache, which npm clears';
  if (path.basename(path.dirname(pkg)).toLowerCase() !== 'node_modules') {
    for (let dir = pkg; ; dir = path.dirname(dir)) {
      if (exists(path.join(dir, '.git'))) return `it is running from a git working tree (${dir}) — a development checkout or \`npm link\``;
      if (path.dirname(dir) === dir) break;
    }
    return `it is running from ${pkg}, which is not an npm installation`;
  }
  if (isUnder(cli, tmp)) return 'it is running from a temporary folder';
  if (/[\\/]fnm_multishells[\\/]/i.test(node) || isUnder(node, tmp)) return `Node.js is running from a temporary per-shell path (${node})`;
  return null;
}

const unstableMessage = (reason) =>
  `this copy of claude-team-usage cannot run the automatic scans: ${reason}, and a scheduled task pointing there ` +
  'breaks as soon as it moves or changes. Install the stable copy with `npm install -g claude-team-usage`, ' +
  'then run `claude-team-usage login` (or `claude-team-usage schedule`) from it';

/** cmd.exe gives `"` and `%` meaning even inside quotes; a path holding either can't be passed safely. */
function assertCmdSafe(label, value) {
  if (/["%\r\n]/.test(value)) throw new ScheduleError(`${label} contains a character cmd.exe cannot quote safely: ${value}`);
}

/** The windowless launcher shipped next to cli.js. */
export const launcherPath = (cli) => path.join(path.dirname(cli), 'run-hidden.jscript');

/**
 * The `wscript.exe` argument string: the launcher, then node, cli and log,
 * then the CLI's own arguments. run-hidden.jscript builds
 * `cmd /d /c "(echo ==== %DATE% %TIME% & "<node>" "<cli>" <args>) >> "<log>" 2>&1"`
 * from them, so each path still has to be safe inside cmd's quotes.
 */
export function commandLine({ node, cli, args, log }) {
  const launcher = launcherPath(cli);
  for (const [label, value] of [['Node.js path', node], ['CLI path', cli], ['log path', log], ['launcher path', launcher]]) assertCmdSafe(label, value);
  return ['//B', '//NoLogo', '//E:JScript', `"${launcher}"`, `"${node}"`, `"${cli}"`, `"${log}"`, ...args].join(' ');
}

/**
 * Written into the task's description, so `ensureScheduled` can tell which
 * schedule a registered task has without parsing its (reformatted) triggers.
 */
export function scheduleMarker({ times = SCHEDULE_TIMES, test = null } = {}) {
  return `[schedule: daily ${times.join(',')}${test ? ` + every ${test.minutes} min until ${test.until}` : ''}]`;
}

/**
 * Task Scheduler 1.2 XML for the two daily triggers. `today` is YYYY-MM-DD, the
 * first day it applies. `test` ({ minutes, start, until }, local YYYY-MM-DDTHH:MM)
 * adds the temporary repeating trigger; the daily ones stay, so the normal
 * schedule carries on when it expires.
 */
export function buildTaskXml({ userId, command, args, times = SCHEDULE_TIMES, today, test = null }) {
  const triggers = times.map(
    (hhmm) => `    <CalendarTrigger>
      <StartBoundary>${today}T${hhmm}:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
    </CalendarTrigger>`,
  );
  if (test) {
    triggers.push(`    <TimeTrigger>
      <Repetition>
        <Interval>PT${test.minutes}M</Interval>
        <Duration>PT${TEST_HOURS}H</Duration>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>${test.start}:00</StartBoundary>
      <EndBoundary>${test.until}:00</EndBoundary>
      <Enabled>true</Enabled>
    </TimeTrigger>`);
  }
  const when = `${times.join(' and ')}${test ? `, and every ${test.minutes} minutes until ${test.until.replace('T', ' ')} (TEST)` : ''}`;
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Reports this machine's Claude Code usage to Coc Docs (claude-team-usage scan) at ${when}. ${scheduleMarker({ times, test })}</Description>
  </RegistrationInfo>
  <Triggers>
${triggers.join('\n')}
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

/** The parts of a registered task's XML that `ensureScheduled` compares. Node and CLI are null for a command it did not write. */
export function parseTask(xml) {
  const tag = (name) => {
    const m = String(xml).match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
    return m ? unescapeXml(m[1]).trim() : null;
  };
  const command = tag('Command');
  const args = tag('Arguments');
  // run-hidden.jscript "<node>" "<cli>" …, or the cmd.exe form of 0.3.0 and earlier: & "<node>" "<cli>" …
  const paths = (args ?? '').match(/run-hidden\.jscript" "([^"]+)" "([^"]+)"/) ?? (args ?? '').match(/& "([^"]+)" "([^"]+)"/);
  return {
    command,
    args,
    node: paths?.[1] ?? null,
    cli: paths?.[2] ?? null,
    marker: (tag('Description') ?? '').match(/\[schedule: [^\]]*\]/)?.[0] ?? null,
  };
}

function schtasks(args) {
  try {
    return execFileSync('schtasks.exe', args, { encoding: 'utf8', timeout: SCHTASKS_TIMEOUT_MS, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const why = error.code === 'ETIMEDOUT' ? `no answer within ${SCHTASKS_TIMEOUT_MS / 1000}s` : String(error.stderr || error.message).trim();
    throw new ScheduleError(`schtasks ${args[0]} failed: ${why}`);
  }
}

// `schtasks /Query /XML` prints through the console code page, which mangles a
// non-ASCII profile path (a Korean or Khmer user name); PowerShell exports the
// same XML as UTF-8.
const EXPORT_PS = `[Console]::OutputEncoding = [Text.Encoding]::UTF8; Export-ScheduledTask -TaskName '${TASK_NAME}' -ErrorAction Stop`;

/** The registered task's XML, or null when there is none (or it cannot be read). */
function exportTask() {
  try {
    return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', EXPORT_PS], {
      encoding: 'utf8',
      timeout: SCHTASKS_TIMEOUT_MS,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

function requireWindows(platform = process.platform) {
  if (platform === 'win32') return;
  throw new ScheduleError(
    'scheduling is built in on Windows only. Elsewhere, add these to `crontab -e`:\n' +
      SCHEDULE_TIMES.map((t) => `  ${Number(t.slice(3))} ${Number(t.slice(0, 2))} * * * claude-team-usage ${SCAN_ARGS.join(' ')}`).join('\n'),
  );
}

const pad = (n) => String(n).padStart(2, '0');
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Local YYYY-MM-DDTHH:MM — Task Scheduler's own boundary format, minus seconds. */
const localMinute = (d) => `${localDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** `schedule remove` leaves this, so a later `scan` does not quietly put the task back. */
function optOutPath(env) {
  return path.join(configDir(env), 'schedule-disabled');
}

/** `schedule test` leaves this, so `ensureScheduled` keeps the test trigger instead of "repairing" it away. */
function testModePath(env) {
  return path.join(configDir(env), 'schedule-test.json');
}

/** The test trigger still wanted, or null. An expired one is forgotten, so the next check restores the normal task. */
function activeTestMode(env, now) {
  let test;
  try {
    test = JSON.parse(fs.readFileSync(testModePath(env), 'utf8'));
  } catch {
    return null;
  }
  if (Number.isInteger(test?.minutes) && /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(test.start) && test.until > localMinute(now)) return test;
  fs.rmSync(testModePath(env), { force: true });
  return null;
}

/** Everything a task registered right now would hold — compared against the registered one, or written as it. */
function plannedTask({ env, current, test, now }) {
  const log = logPath(env);
  const userId = `${env.USERDOMAIN ? `${env.USERDOMAIN}\\` : ''}${env.USERNAME || os.userInfo().username}`;
  const command = path.join(env.SystemRoot || 'C:\\Windows', 'System32', 'wscript.exe');
  const args = commandLine({ node: current.node, cli: current.cli, args: SCAN_ARGS, log });
  return { log, userId, command, args, marker: scheduleMarker({ test }), xml: buildTaskXml({ userId, command, args, today: localDate(now), test }) };
}

/**
 * Creates the task, or replaces it (`/F`) — one task per name, so running this
 * again never adds a second one. Throws ScheduleError when this setup cannot
 * support an unattended run (no saved login, env-var credentials, an unstable
 * install).
 */
function register({ env, run, current, test = null, now = new Date() }) {
  const creds = resolveCredentials(env);
  if (!creds) throw new ScheduleError('not signed in. Run `claude-team-usage login` once first, then `claude-team-usage schedule` again.');
  if (creds.source === 'environment') {
    throw new ScheduleError(
      'this shell signs in through USER_EMAIL / INGEST_URL / INGEST_SECRET, which a scheduled task does not see. ' +
        'Run `claude-team-usage login` once so the task can use the saved sign-in.',
    );
  }
  if (current.unstable) throw new ScheduleError(unstableMessage(current.unstable));

  const planned = plannedTask({ env, current, test, now });
  fs.mkdirSync(path.dirname(planned.log), { recursive: true });

  // schtasks reads task XML as UTF-16; written to a private temp file, removed right after.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ctu-task-'));
  const file = path.join(tmp, 'task.xml');
  try {
    fs.writeFileSync(file, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(planned.xml, 'utf16le')]));
    run(['/Create', '/F', '/TN', TASK_NAME, '/XML', file]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return planned;
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

/** Why the registered task no longer runs this installation on the wanted schedule; empty when it is current. */
export function staleReasons(task, planned, current, exists = fs.existsSync) {
  const reasons = [];
  if (!task.node || !task.cli) {
    reasons.push('its command was not written by this version');
  } else {
    if (!exists(task.node)) reasons.push(`Node.js is no longer at ${task.node}`);
    else if (!samePath(task.node, current.node)) reasons.push(`Node.js moved from ${task.node} to ${current.node}`);
    if (!exists(task.cli)) reasons.push(`the CLI is no longer at ${task.cli}`);
    else if (!samePath(task.cli, current.cli)) reasons.push(`it ran the CLI at ${task.cli}, not this installation (${current.cli})`);
  }
  if (!reasons.length && (!samePath(task.command ?? '', planned.command) || (task.args ?? '').toLowerCase() !== planned.args.toLowerCase())) {
    reasons.push('its command line is from an older version');
  }
  if (task.marker !== planned.marker) reasons.push(`its schedule was ${task.marker ?? 'set by an older version'}`);
  return reasons;
}

/**
 * Called by every `login` and by a `scan` not started by Task Scheduler, once
 * there is a saved login: registers the daily task if it is missing, and
 * re-registers it in place when it no longer runs this installation — Node.js
 * or CLI moved or gone, an old git checkout, an older command line. Repeated
 * calls change nothing once it is current, and never add a second task.
 * Never fails the caller — a problem is one warning line.
 *
 * @returns 'created' | 'repaired' | 'exists' | 'opted-out' | 'unsupported' | 'failed'
 */
export function ensureScheduled({
  io,
  env = process.env,
  run = schtasks,
  read = exportTask,
  platform = process.platform,
  current = currentInstall(),
  exists = fs.existsSync,
  now = new Date(),
  continues = 'This scan continues.',
}) {
  if (platform !== 'win32') return 'unsupported';
  // `schedule remove`, or a machine (CI, a shared runner) that should never get the task.
  if (fs.existsSync(optOutPath(env)) || String(env.CLAUDE_TEAM_USAGE_AUTO_SCHEDULE ?? '').trim().toLowerCase() === 'off') return 'opted-out';

  const xml = read();
  const task = xml ? parseTask(xml) : null;
  const registered = task !== null || isRegistered(run);
  const test = activeTestMode(env, now);
  let reasons = [];
  if (registered) {
    // From an unstable copy, a working task (e.g. the global install's) is left
    // alone; there is nothing stable to repoint it at.
    if (current.unstable && task?.node && task?.cli && exists(task.node) && exists(task.cli)) return 'exists';
    if (!current.unstable) {
      reasons = task ? staleReasons(task, plannedTask({ env, current, test, now }), current, exists) : ['Task Scheduler would not show its definition'];
      if (!reasons.length) return 'exists';
    }
  }

  try {
    register({ env, run, current, test, now });
  } catch (error) {
    io.err(`warning: could not ${registered ? 'repair' : 'set up'} automatic scans (${error.message}). ${continues}`);
    return 'failed';
  }
  const when = `every day at ${SCHEDULE_TIMES.join(' and ')}${test ? ` (plus the TEST run every ${test.minutes} min)` : ''}`;
  if (!registered) {
    io.info(`Automatic scans set up: ${when}. Check them with \`claude-team-usage schedule status\`.`);
    return 'created';
  }
  io.info(`Automatic scans repaired — ${reasons.join('; ')}. They run ${when} with ${current.cli}.`);
  return 'repaired';
}

function warnShellOnly(io, env) {
  for (const name of ['CLAUDE_PROJECTS_DIR', 'CLAUDE_CONFIG_DIR', 'CLAUDE_TEAM_USAGE_CONFIG_DIR', 'COC_DOCS_URL', 'NODE_EXTRA_CA_CERTS']) {
    if (env[name]) io.err(`warning: ${name} is set in this shell; the task only sees it if it is also a user environment variable.`);
  }
}

export function install({ io, env = process.env, run = schtasks, platform = process.platform, current = currentInstall(), now = new Date() }) {
  requireWindows(platform);
  const { userId, log } = register({ env, run, current, now });
  fs.rmSync(optOutPath(env), { force: true });
  fs.rmSync(testModePath(env), { force: true });

  io.out(`scheduled "${TASK_NAME}": claude-team-usage ${SCAN_ARGS[0]} every day at ${SCHEDULE_TIMES.join(' and ')}, as ${userId}`);
  io.out(`  node:     ${current.node}`);
  io.out(`  cli:      ${current.cli}`);
  io.out(`  log:      ${log}`);
  io.out(`  run now:  schtasks /Run /TN ${TASK_NAME}`);
  io.out('  check:    claude-team-usage schedule status');
  warnShellOnly(io, env);
  io.err('Runs only while you are logged on.');
}

/**
 * `schedule test [MINUTES]` — the normal task plus a scan every MINUTES minutes,
 * from the next whole interval, for TEST_HOURS. Never the default: only this
 * command turns it on, it expires by itself, and `schedule` turns it off.
 */
export function installTest({ io, minutes = DEFAULT_TEST_MINUTES, env = process.env, run = schtasks, platform = process.platform, current = currentInstall(), now = new Date() }) {
  requireWindows(platform);
  const [min, max] = TEST_MINUTES_RANGE;
  if (!Number.isInteger(minutes) || minutes < min || minutes > max) {
    throw new ScheduleError(`the test interval must be a whole number of minutes from ${min} to ${max}, got "${minutes}"`);
  }
  const start = new Date(now.getTime() + 60_000);
  start.setSeconds(0, 0);
  while (start.getMinutes() % minutes) start.setMinutes(start.getMinutes() + 1);
  const test = { minutes, start: localMinute(start), until: localMinute(new Date(start.getTime() + TEST_HOURS * 3_600_000)) };

  const { userId, log } = register({ env, run, current, test, now });
  fs.rmSync(optOutPath(env), { force: true });
  fs.writeFileSync(testModePath(env), `${JSON.stringify(test, null, 2)}\n`);

  io.out(`TEST schedule on "${TASK_NAME}", as ${userId}: a scan every ${minutes} min from ${test.start.slice(11)} until ${test.until.replace('T', ' ')},`);
  io.out(`  plus the normal ${SCHEDULE_TIMES.join(' and ')} (which stay after the test ends).`);
  io.out(`  node:     ${current.node}`);
  io.out(`  cli:      ${current.cli}`);
  io.out(`  log:      ${log}`);
  io.out('  check:    claude-team-usage schedule status');
  io.out('  end it:   claude-team-usage schedule      (back to only 11:00 and 16:00)');
  warnShellOnly(io, env);
}

export function remove({ io, env = process.env, run = schtasks, platform = process.platform }) {
  requireWindows(platform);
  run(['/Delete', '/F', '/TN', TASK_NAME]);
  fs.mkdirSync(path.dirname(optOutPath(env)), { recursive: true });
  fs.writeFileSync(optOutPath(env), 'Automatic scans were turned off with `claude-team-usage schedule remove`.\n');
  fs.rmSync(testModePath(env), { force: true });
  io.out(`removed scheduled task "${TASK_NAME}". The log at ${logPath(env)} was kept.`);
  io.out('`scan` and `login` will not set it up again; run `claude-team-usage schedule` to turn automatic scans back on.');
}

// schtasks' own /Query output is localized (labels and dates follow the
// Windows display language), so status reads the task through PowerShell as
// JSON with ISO dates instead.
const QUERY_PS =
  '[Console]::OutputEncoding = [Text.Encoding]::UTF8; ' +
  `$t = Get-ScheduledTask -TaskName '${TASK_NAME}' -ErrorAction Stop; $i = $t | Get-ScheduledTaskInfo; ` +
  "$d = { param($x) if ($x -and $x.Year -gt 2000) { $x.ToString('yyyy-MM-dd HH:mm') } else { $null } }; " +
  '[pscustomobject]@{ state = [string]$t.State; user = $t.Principal.UserId; ' +
  'lastRun = (& $d $i.LastRunTime); lastResult = $i.LastTaskResult; nextRun = (& $d $i.NextRunTime); ' +
  'description = $t.Description; args = $t.Actions[0].Arguments } | ConvertTo-Json -Compress';
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

/** Task Scheduler's own view of the task (paths, next/last run, last result), then the log's latest run. */
export function status({ io, env = process.env, query = queryTask, platform = process.platform, exists = fs.existsSync }) {
  requireWindows(platform);
  const task = query();
  if (!task) {
    io.out(`no scheduled task "${TASK_NAME}" — run \`claude-team-usage schedule\` to create it.`);
    return;
  }
  io.out(`task "${TASK_NAME}" (${task.state}, runs as ${task.user})`);
  const marker = String(task.description ?? '').match(/\[schedule: ([^\]]*)\]/)?.[1];
  if (marker) io.out(`  schedule:    ${marker}${marker.includes('every') ? '   ← TEST; `claude-team-usage schedule` ends it' : ''}`);
  if (task.args) {
    const { node, cli } = parseTask(`<Arguments>${task.args}</Arguments>`);
    const mark = (p) => (p ? `${p}${exists(p) ? '' : '   ← MISSING: run `claude-team-usage login` from a global install to repair'}` : 'not recognised');
    io.out(`  node:        ${mark(node)}`);
    io.out(`  cli:         ${mark(cli)}`);
  }
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
