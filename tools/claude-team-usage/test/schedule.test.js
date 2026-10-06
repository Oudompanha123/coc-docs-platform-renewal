// req: FR-USAGE-002, ADR-060
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildTaskXml,
  commandLine,
  describeResult,
  launcherPath,
  parseTask,
  SCAN_ARGS,
  SCHEDULE_TIMES,
  scheduleMarker,
  staleReasons,
  unstableReason,
} from '../src/schedule.js';

const NODE = 'C:\\Program Files\\nodejs\\node.exe';
const CLI = 'C:\\Users\\dana\\AppData\\Roaming\\npm\\node_modules\\claude-team-usage\\bin\\cli.js';
const LOG = 'C:\\Users\\dana\\AppData\\Roaming\\claude-team-usage\\scheduled-scan.log';
/** This package's own bin/cli.js — its launcher is the real file. */
const CLI_IN_PACKAGE = fileURLToPath(new URL('../bin/cli.js', import.meta.url));

describe('schedule (Windows Task Scheduler)', () => {
  it('runs a plain scan every day at 11:00 and 16:00 (it finds unreported days itself)', () => {
    assert.deepEqual(SCHEDULE_TIMES, ['11:00', '16:00']);
    assert.deepEqual(SCAN_ARGS, ['scan', '--scheduled']);

    const xml = buildTaskXml({ userId: 'CORP\\dana', command: 'C:\\Windows\\System32\\cmd.exe', args: '/c x', today: '2026-09-30' });
    assert.match(xml, /<StartBoundary>2026-09-30T11:00:00<\/StartBoundary>/);
    assert.match(xml, /<StartBoundary>2026-09-30T16:00:00<\/StartBoundary>/);
    assert.equal((xml.match(/<DaysInterval>1<\/DaysInterval>/g) ?? []).length, 2);
  });

  it('runs as this user without a stored password, catches up missed runs, and cannot hang', () => {
    const xml = buildTaskXml({ userId: 'CORP\\dana', command: 'cmd.exe', args: '/c x', today: '2026-09-30' });
    assert.match(xml, /<UserId>CORP\\dana<\/UserId>/);
    assert.match(xml, /<LogonType>InteractiveToken<\/LogonType>/);
    assert.match(xml, /<RunLevel>LeastPrivilege<\/RunLevel>/);
    assert.match(xml, /<StartWhenAvailable>true<\/StartWhenAvailable>/);
    assert.match(xml, /<ExecutionTimeLimit>PT15M<\/ExecutionTimeLimit>/);
    assert.match(xml, /<MultipleInstancesPolicy>IgnoreNew<\/MultipleInstancesPolicy>/);
  });

  it('starts through the windowless launcher next to cli.js, quoting each path, with the command XML-escaped', () => {
    const launcher = 'C:\\Users\\dana\\AppData\\Roaming\\npm\\node_modules\\claude-team-usage\\bin\\run-hidden.jscript';
    assert.equal(launcherPath(CLI), launcher);
    const args = commandLine({ node: NODE, cli: CLI, args: SCAN_ARGS, log: LOG });
    assert.equal(args, `//B //NoLogo //E:JScript "${launcher}" "${NODE}" "${CLI}" "${LOG}" scan --scheduled`);

    const xml = buildTaskXml({ userId: 'u', command: 'C:\\Windows\\System32\\wscript.exe', args, today: '2026-09-30' });
    assert.ok(xml.includes('<Command>C:\\Windows\\System32\\wscript.exe</Command>'));
    assert.ok(xml.includes('//E:JScript &quot;C:\\Users\\dana'));
    assert.ok(!/credentials|coc_/.test(xml), 'no secret ever goes into the task');
  });

  it('the launcher is shipped, hides the window, and keeps the logged cmd line', () => {
    const src = fs.readFileSync(launcherPath(CLI_IN_PACKAGE), 'utf8');
    assert.match(src, /shell\.Run\(line, 0, true\)/, 'hidden window, waits for the exit code');
    assert.match(src, /WScript\.Quit\(/);
    assert.ok(src.includes(`' /d /c "(echo ==== %DATE% %TIME% & '`), 'the same ==== line as before');
    assert.ok(src.includes(`') >> ' + quote(args(2)) + ' 2>&1"'`), 'appends stdout and stderr to the log');
    const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    assert.ok(pkg.files.includes('bin/'), 'published with the package');
  });

  it('on Windows, the launcher passes the exit code back and writes the log', { skip: process.platform !== 'win32' }, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctu-launcher-'));
    const log = path.join(dir, 'with space', 'scheduled-scan.log');
    fs.mkdirSync(path.dirname(log));
    const script = path.join(dir, 'exit3.js');
    fs.writeFileSync(script, "console.log('ran'); process.exitCode = 3;\n");
    try {
      const res = spawnSync(path.join(process.env.SystemRoot, 'System32', 'wscript.exe'), ['//B', '//NoLogo', '//E:JScript', launcherPath(CLI_IN_PACKAGE), process.execPath, script, log, '--x'], { timeout: 30_000 });
      assert.equal(res.status, 3, 'Task Scheduler sees the CLI exit code');
      const text = fs.readFileSync(log, 'utf8');
      assert.match(text, /^==== .+\r?\nran\r?\n$/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a path cmd.exe cannot quote safely', () => {
    assert.throws(() => commandLine({ node: NODE, cli: 'C:\\100%\\cli.js', args: SCAN_ARGS, log: LOG }), /cannot quote safely/);
    assert.throws(() => commandLine({ node: NODE, cli: CLI, args: SCAN_ARGS, log: 'C:\\a"b.log' }), /cannot quote safely/);
  });

  it('the production task has only the daily triggers; a test task adds a repeating one and keeps them', () => {
    const prod = buildTaskXml({ userId: 'u', command: 'cmd.exe', args: '/c x', today: '2026-10-06' });
    assert.doesNotMatch(prod, /TimeTrigger|<Interval>/);
    assert.ok(prod.includes(scheduleMarker()));
    assert.equal(scheduleMarker(), '[schedule: daily 11:00,16:00]');

    const test = { minutes: 5, start: '2026-10-06T10:05', until: '2026-10-07T10:05' };
    const xml = buildTaskXml({ userId: 'u', command: 'cmd.exe', args: '/c x', today: '2026-10-06', test });
    assert.equal((xml.match(/<CalendarTrigger>/g) ?? []).length, 2, 'the daily triggers stay');
    assert.match(xml, /<TimeTrigger>\s*<Repetition>\s*<Interval>PT5M<\/Interval>\s*<Duration>PT24H<\/Duration>/);
    assert.match(xml, /<StartBoundary>2026-10-06T10:05:00<\/StartBoundary>\s*<EndBoundary>2026-10-07T10:05:00<\/EndBoundary>/);
    assert.ok(xml.includes('[schedule: daily 11:00,16:00 + every 5 min until 2026-10-07T10:05]'));
  });

  it('reads back the paths, command and schedule of a registered task', () => {
    const args = commandLine({ node: NODE, cli: CLI, args: SCAN_ARGS, log: LOG });
    const task = parseTask(buildTaskXml({ userId: 'u', command: 'C:\\Windows\\System32\\cmd.exe', args, today: '2026-10-06' }));
    assert.deepEqual(task, { command: 'C:\\Windows\\System32\\cmd.exe', args, node: NODE, cli: CLI, marker: '[schedule: daily 11:00,16:00]' });

    // The 0.3.0 task: no --scheduled, no marker.
    const old = parseTask(`<Description>Reports … at 11:00 and 16:00.</Description><Command>cmd.exe</Command>
      <Arguments>/d /c "(echo ==== %DATE% %TIME% &amp; "C:\\nodejs\\node.exe" "D:\\CLAUDE\\x\\bin\\cli.js" scan) &gt;&gt; "L" 2&gt;&amp;1"</Arguments>`);
    assert.equal(old.node, 'C:\\nodejs\\node.exe');
    assert.equal(old.cli, 'D:\\CLAUDE\\x\\bin\\cli.js');
    assert.equal(old.marker, null);
  });

  it('says why a registered task is stale, and nothing when it is current', () => {
    const current = { node: NODE, cli: CLI };
    const command = 'C:\\Windows\\System32\\cmd.exe';
    const planned = { command, args: commandLine({ node: NODE, cli: CLI, args: SCAN_ARGS, log: LOG }), marker: scheduleMarker() };
    const registered = (o = {}) => ({ command, args: planned.args, node: NODE, cli: CLI, marker: planned.marker, ...o });
    const all = () => true;

    assert.deepEqual(staleReasons(registered(), planned, current, all), []);
    assert.deepEqual(staleReasons(registered({ command: command.toUpperCase() }), planned, current, all), [], 'paths ignore case');
    assert.match(staleReasons(registered({ node: 'C:\\old\\node.exe' }), planned, current, all).join(), /Node\.js moved from C:\\old\\node\.exe/);
    assert.match(staleReasons(registered({ cli: 'D:\\CLAUDE\\x\\bin\\cli.js' }), planned, current, all).join(), /ran the CLI at D:\\CLAUDE/);
    assert.match(staleReasons(registered({ cli: 'D:\\gone\\cli.js' }), planned, current, (p) => p !== 'D:\\gone\\cli.js').join(), /CLI is no longer at D:\\gone/);
    assert.match(staleReasons(registered({ node: 'C:\\gone\\node.exe' }), planned, current, (p) => p !== 'C:\\gone\\node.exe').join(), /Node\.js is no longer at/);
    assert.match(staleReasons(registered({ args: planned.args.replace(' --scheduled', '') }), planned, current, all).join(), /older version/);
    assert.match(staleReasons(registered({ marker: null }), planned, current, all).join(), /schedule was set by an older version/);
    assert.match(staleReasons(registered({ node: null, cli: null }), planned, current, all).join(), /not written by this version/);
  });

  it('explains Task Scheduler result codes', () => {
    assert.equal(describeResult(0), '0 (success)');
    assert.match(describeResult(1), /see the log/);
    assert.equal(describeResult(0x41303), 'not run yet');
  });
});

describe('which installations a scheduled task may point at', () => {
  const root = path.resolve('/ctu-fake');
  const at = (...p) => path.join(root, ...p);
  const node = at('Program Files', 'nodejs', 'node.exe');
  const tmp = at('Temp');
  const noGit = () => false;

  it('a global npm install is stable', () => {
    const cli = at('Users', 'dana', 'AppData', 'Roaming', 'npm', 'node_modules', 'claude-team-usage', 'bin', 'cli.js');
    assert.equal(unstableReason({ node, cli }, { tmp, exists: noGit }), null);
  });

  it('a git checkout (or `npm link`, which Node resolves to the checkout) is not', () => {
    const cli = at('CLAUDE', 'coc-docs-platform', 'tools', 'claude-team-usage', 'bin', 'cli.js');
    const exists = (p) => p === at('CLAUDE', 'coc-docs-platform', '.git');
    assert.match(unstableReason({ node, cli }, { tmp, exists }), /git working tree .*CLAUDE.*coc-docs-platform/);
  });

  it('a copied folder outside node_modules is not', () => {
    const cli = at('Downloads', 'claude-team-usage', 'bin', 'cli.js');
    assert.match(unstableReason({ node, cli }, { tmp, exists: noGit }), /not an npm installation/);
  });

  it('the npx cache, a temp folder, or a per-shell Node.js is not', () => {
    const npx = at('Users', 'dana', 'AppData', 'Local', 'npm-cache', '_npx', 'abc', 'node_modules', 'claude-team-usage', 'bin', 'cli.js');
    assert.match(unstableReason({ node, cli: npx }, { tmp, exists: noGit }), /npx cache/);
    const inTemp = at('Temp', 'x', 'node_modules', 'claude-team-usage', 'bin', 'cli.js');
    assert.match(unstableReason({ node, cli: inTemp }, { tmp, exists: noGit }), /temporary folder/);
    const cli = at('npm', 'node_modules', 'claude-team-usage', 'bin', 'cli.js');
    const fnm = at('Users', 'dana', 'AppData', 'Local', 'fnm_multishells', '123_456', 'node.exe');
    assert.match(unstableReason({ node: fnm, cli }, { tmp, exists: noGit }), /per-shell path/);
  });
});
