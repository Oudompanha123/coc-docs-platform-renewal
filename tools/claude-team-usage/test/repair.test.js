// req: FR-USAGE-002, ADR-060
//
// `npm install -g` repairs an existing scheduled task (bin/postinstall.js →
// repairExisting) and `schedule status` says what the task starts. Task
// Scheduler and whoami are replaced by fakes, so no real task is created,
// changed or deleted; the postinstall child runs opted out for the same reason.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildTaskXml,
  commandLine,
  currentIdentity,
  hiddenLauncher,
  isNoTask,
  launcherPath,
  logPath,
  ownedBy,
  parseTask,
  recordRepair,
  repairExisting,
  SCAN_ARGS,
  status,
  TASK_NAME,
} from '../src/schedule.js';
import { cleanEnv, saveLogin, tmpDir } from './helpers.js';

const ME = { name: 'CORP\\dana', sid: 'S-1-5-21-111-222-333-1001' };
const OTHER = { name: 'CORP\\admin', sid: 'S-1-5-21-111-222-333-500' };

/** In-memory Task Scheduler, as in auto-schedule.test.js; `failCreate` makes /Create fail like a locked-down or busy scheduler. */
function fakeScheduler({ failCreate = null } = {}) {
  const tasks = new Map();
  const calls = [];
  const run = (args) => {
    calls.push(args[0]);
    const name = args[args.indexOf('/TN') + 1];
    if (args[0] === '/Query') {
      if (!tasks.has(name)) throw new Error('ERROR: The system cannot find the file specified.');
      return '';
    }
    if (args[0] === '/Create') {
      if (failCreate) throw new Error(failCreate);
      tasks.set(name, fs.readFileSync(args[args.indexOf('/XML') + 1]).subarray(2).toString('utf16le'));
      return '';
    }
    throw new Error(`unexpected schtasks ${args[0]}`);
  };
  return { run, read: () => tasks.get(TASK_NAME) ?? null, tasks, creates: () => calls.filter((c) => c === '/Create').length };
}

function fakeInstall(root, name) {
  const node = path.join(root, `${name}-nodejs`, 'node.exe');
  const cli = path.join(root, name, 'node_modules', 'claude-team-usage', 'bin', 'cli.js');
  for (const file of [node, cli, launcherPath(cli)]) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '');
  }
  return { node, cli, unstable: null };
}

/** The task 0.2.0/0.3.0 registered: cmd.exe itself, `scan` without --scheduled, no schedule marker. */
function taskFrom030({ node, cli, log, userId = ME.sid }) {
  const args = `/d /c "(echo ==== %DATE% %TIME% & "${node}" "${cli}" scan) >> "${log}" 2>&1"`;
  return buildTaskXml({ userId, command: 'C:\\Windows\\System32\\cmd.exe', args, today: '2026-10-01' }).replace(/ \[schedule: [^\]]*\]/, '');
}

/** The task 0.4.0/0.5.0 registered — what a repair writes too. */
function taskFrom050({ node, cli, log, userId = ME.sid }) {
  const args = commandLine({ node, cli, args: SCAN_ARGS, log });
  return buildTaskXml({ userId, command: 'C:\\Windows\\System32\\wscript.exe', args, today: '2026-10-09' });
}

/** Every file in the config folder except the log, hashed — the login and usage data a repair must not touch. */
function snapshot(dir) {
  return Object.fromEntries(
    fs
      .readdirSync(dir)
      .filter((f) => f !== 'scheduled-scan.log')
      .map((f) => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex')]),
  );
}

let configHome;
let installs;
let current;
let env;
let sched;

beforeEach(() => {
  configHome = tmpDir('ctu-repair-config-');
  installs = tmpDir('ctu-repair-installs-');
  current = fakeInstall(installs, 'npm');
  env = { CLAUDE_TEAM_USAGE_CONFIG_DIR: configHome, USERNAME: 'dana', USERDOMAIN: 'CORP', SystemRoot: 'C:\\Windows' };
  sched = fakeScheduler();
  saveLogin(configHome);
  fs.writeFileSync(path.join(configHome, 'ledger.json'), '{"2026-10-12":{"tokens":1234}}\n');
});

afterEach(() => {
  fs.rmSync(configHome, { recursive: true, force: true });
  fs.rmSync(installs, { recursive: true, force: true });
});

const repair = (o = {}) => repairExisting({ env, run: sched.run, read: sched.read, identity: () => ME, platform: 'win32', current, ...o });
const log = () => logPath(env);

describe('repairExisting (npm install -g → postinstall)', () => {
  it('1 — a 0.3.0 cmd.exe task at the same install path moves onto the hidden launcher, in place', () => {
    sched.tasks.set(TASK_NAME, taskFrom030({ ...current, log: log() }));
    const before = snapshot(configHome);

    const result = repair();

    assert.equal(result.outcome, 'repaired');
    assert.match(result.reason, /starts cmd\.exe, which opens a console window/);
    assert.equal(sched.creates(), 1);
    assert.equal(sched.tasks.size, 1, 'still one task, same name');
    const xml = sched.tasks.get(TASK_NAME);
    const task = parseTask(xml);
    assert.match(task.command, /\\wscript\.exe$/);
    assert.equal(hiddenLauncher(task.args), launcherPath(current.cli));
    assert.equal(task.cli, current.cli);
    assert.match(task.args, / scan --scheduled$/);
    // 7 — still 11:00 and 16:00, every day, as this user only while logged on.
    assert.equal((xml.match(/<CalendarTrigger>/g) ?? []).length, 2);
    assert.match(xml, /T11:00:00<\/StartBoundary>/);
    assert.match(xml, /T16:00:00<\/StartBoundary>/);
    assert.match(xml, /<LogonType>InteractiveToken<\/LogonType>/);
    assert.deepEqual(snapshot(configHome), before, 'login and usage data unchanged');
  });

  it('1b — a 0.3.0 task still pointing at an older copy elsewhere is repointed at this install', () => {
    const old = fakeInstall(installs, 'old-prefix');
    sched.tasks.set(TASK_NAME, taskFrom030({ ...old, log: log() }));
    const result = repair();
    assert.equal(result.outcome, 'repaired');
    assert.match(result.reason, /Node\.js moved .*; it ran the CLI at .*old-prefix/);
    assert.equal(parseTask(sched.tasks.get(TASK_NAME)).cli, current.cli);
  });

  it('2 — a correct 0.5.0 task is left exactly as it is', () => {
    const xml = taskFrom050({ ...current, log: log() });
    sched.tasks.set(TASK_NAME, xml);
    const result = repair();
    assert.equal(result.outcome, 'current');
    assert.equal(sched.creates(), 0, 'no /Create at all');
    assert.equal(sched.tasks.get(TASK_NAME), xml);
  });

  it('3 — no task: nothing is created', () => {
    const result = repair();
    assert.equal(result.outcome, 'skipped');
    assert.ok(isNoTask(result));
    assert.equal(sched.creates(), 0);
    assert.equal(sched.tasks.size, 0);
  });

  it('4 — opted out (schedule remove, or CLAUDE_TEAM_USAGE_AUTO_SCHEDULE=off): nothing is read or changed', () => {
    sched.tasks.set(TASK_NAME, taskFrom030({ ...current, log: log() }));
    const read = () => assert.fail('must not read the task');
    for (const o of [{ env: { ...env, CLAUDE_TEAM_USAGE_AUTO_SCHEDULE: 'OFF' } }, {}]) {
      if (!o.env) fs.writeFileSync(path.join(configHome, 'schedule-disabled'), 'off\n');
      const result = repair({ ...o, read });
      assert.equal(result.outcome, 'skipped');
      assert.match(result.reason, /turned off/);
    }
    assert.equal(sched.creates(), 0);
  });

  it('5 — a task registered for another Windows account is not touched', () => {
    sched.tasks.set(TASK_NAME, taskFrom030({ ...current, log: log(), userId: OTHER.sid }));
    const result = repair();
    assert.equal(result.outcome, 'skipped');
    assert.match(result.reason, /another Windows account \(S-1-5-21-111-222-333-500\)/);
    assert.equal(sched.creates(), 0);
  });

  it('5b — when this account cannot be identified, the task is left alone', () => {
    sched.tasks.set(TASK_NAME, taskFrom030({ ...current, log: log() }));
    const result = repair({ identity: () => null });
    assert.equal(result.outcome, 'skipped');
    assert.equal(sched.creates(), 0);
  });

  it('6 — Task Scheduler refuses the change: reported as failed, never thrown', () => {
    sched = fakeScheduler({ failCreate: 'ERROR: Access is denied.' });
    sched.tasks.set(TASK_NAME, taskFrom030({ ...current, log: log() }));
    const result = repair();
    assert.equal(result.outcome, 'failed');
    assert.match(result.reason, /Access is denied/);
    assert.match(parseTask(sched.tasks.get(TASK_NAME)).command, /cmd\.exe$/, 'old task kept as it was');
  });

  it('6b — Task Scheduler unavailable: a failure to read is reported, not thrown', () => {
    const result = repair({ read: () => { throw new Error('Task Scheduler service is not running'); } });
    assert.equal(result.outcome, 'failed');
    assert.match(result.reason, /not running/);
  });

  it('6c — a task that exists but cannot be read is not overwritten blind', () => {
    sched.tasks.set(TASK_NAME, 'x');
    const result = repair({ read: () => null });
    assert.equal(result.outcome, 'skipped');
    assert.match(result.reason, /owner could not be checked/);
    assert.equal(sched.creates(), 0);
  });

  it('skips an unstable copy, a missing login, and env-var credentials — same rules as ensureScheduled', () => {
    sched.tasks.set(TASK_NAME, taskFrom030({ ...current, log: log() }));
    assert.match(repair({ current: { ...current, unstable: 'it is running from a temporary folder' } }).reason, /temporary folder/);
    assert.match(repair({ env: { ...env, USER_EMAIL: 'a@b.c', INGEST_URL: 'https://x/api/ingest', INGEST_SECRET: 's' } }).reason, /USER_EMAIL/);
    fs.rmSync(path.join(configHome, 'credentials.json'));
    assert.match(repair().reason, /not signed in/);
    assert.equal(sched.creates(), 0);
  });

  it('copes with a lifecycle environment missing USERNAME, USERDOMAIN and SystemRoot', () => {
    sched.tasks.set(TASK_NAME, taskFrom030({ ...current, log: log() }));
    const result = repair({ env: { CLAUDE_TEAM_USAGE_CONFIG_DIR: configHome } });
    assert.equal(result.outcome, 'repaired');
    assert.match(parseTask(sched.tasks.get(TASK_NAME)).command, /^C:\\Windows\\System32\\wscript\.exe$/);
  });

  it('does nothing off Windows', () => {
    assert.deepEqual(repair({ platform: 'linux', read: () => assert.fail('no read') }), { outcome: 'skipped', reason: 'not Windows' });
  });
});

describe('currentIdentity', () => {
  it('reads this account from the Windows whoami, even with a GNU whoami first on PATH (Git Bash)', { skip: process.platform !== 'win32' }, () => {
    const me = currentIdentity({ SystemRoot: process.env.SystemRoot });
    assert.match(me?.sid ?? '', /^S-1-5-\d+(-\d+)*$/);
    assert.ok(me.name.includes('\\'));
    assert.deepEqual(currentIdentity({}), me, 'no SystemRoot in the environment: falls back to C:\\Windows');
  });
});

describe('ownedBy', () => {
  it('matches the SID Task Scheduler stores, or the account name with or without domain', () => {
    assert.ok(ownedBy(ME.sid, ME, {}));
    assert.ok(ownedBy(ME.sid.toLowerCase(), ME, {}));
    assert.ok(ownedBy('corp\\DANA', ME, {}));
    assert.ok(ownedBy('dana', ME, {}));
    assert.ok(ownedBy('CORP\\dana', { name: '???', sid: ME.sid }, { USERNAME: 'dana', USERDOMAIN: 'CORP' }), 'a mangled whoami name falls back to the environment');
    assert.ok(!ownedBy(OTHER.sid, ME, {}));
    assert.ok(!ownedBy('CORP\\admin', ME, {}));
    assert.ok(!ownedBy('OTHER\\dana', ME, {}), 'same user name, other domain');
    assert.ok(!ownedBy(null, ME, {}));
    assert.ok(!ownedBy(ME.sid, null, {}));
  });
});

describe('recordRepair and `schedule status`', () => {
  it('logs one [repair] line and status shows it apart from the latest run', () => {
    fs.writeFileSync(log(), '==== 12/10/2026 16:00:02\nclaude-team-usage 0.5.0 | started\nsent 10 tokens\n');
    assert.ok(recordRepair({ env, source: 'npm install 0.5.1', outcome: 'repaired', reason: 'its command line\nis from an older version', now: new Date(2026, 9, 13, 9, 5, 7) }));
    assert.match(fs.readFileSync(log(), 'utf8'), /\n\[repair\] 2026-10-13 09:05:07 \| npm install 0\.5\.1 \| repaired \| its command line is from an older version\n$/);

    const out = [];
    const io = { out: (l) => out.push(l), info: () => {}, err: () => {} };
    status({ io, env, platform: 'win32', exists: () => true, query: () => ({ state: 'Ready', user: ME.sid, lastResult: 0, program: 'C:\\Windows\\System32\\wscript.exe', args: commandLine({ ...current, args: SCAN_ARGS, log: log() }) }) });
    const text = out.join('\n');
    assert.match(text, /program: +C:\\Windows\\System32\\wscript\.exe\n/);
    assert.match(text, /launcher: +.*run-hidden\.jscript \(hidden window\)/);
    assert.match(text, /last repair: 2026-10-13 09:05:07 \(npm install 0\.5\.1\) → repaired: its command line is from an older version/);
    assert.match(text, /latest run[^\n]*\n==== 12\/10\/2026 16:00:02[\s\S]*sent 10 tokens$/);
    assert.doesNotMatch(text.slice(text.indexOf('latest run')), /\[repair\]/);
  });

  it('flags a cmd.exe task as opening a console window, with no hidden launcher', () => {
    const out = [];
    const io = { out: (l) => out.push(l), info: () => {}, err: () => {} };
    const args = `/d /c "(echo ==== %DATE% %TIME% & "${current.node}" "${current.cli}" scan) >> "L" 2>&1"`;
    status({ io, env, platform: 'win32', exists: () => true, query: () => ({ state: 'Ready', user: ME.sid, lastResult: 0, program: 'C:\\WINDOWS\\system32\\cmd.exe', args }) });
    const text = out.join('\n');
    assert.match(text, /program: +C:\\WINDOWS\\system32\\cmd\.exe +← opens a console window every run; run `claude-team-usage login`/);
    assert.match(text, /launcher: +none — not the hidden run-hidden\.jscript launcher/);
  });

  it('never writes into a config folder that does not exist yet', () => {
    const missing = path.join(configHome, 'nope');
    assert.equal(recordRepair({ env: { CLAUDE_TEAM_USAGE_CONFIG_DIR: missing }, source: 's', outcome: 'skipped', reason: 'r' }), false);
    assert.ok(!fs.existsSync(missing));
  });
});

describe('bin/postinstall.js', () => {
  const POSTINSTALL = fileURLToPath(new URL('../bin/postinstall.js', import.meta.url));
  const { version } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  // cleanEnv sets CLAUDE_TEAM_USAGE_AUTO_SCHEDULE=off: this machine's real task is never read or changed.
  const runPostinstall = (extra) =>
    spawnSync(process.execPath, [POSTINSTALL], { env: cleanEnv({ CLAUDE_TEAM_USAGE_CONFIG_DIR: configHome, npm_config_global: '', npm_config_location: '', ...extra }), encoding: 'utf8', timeout: 60_000 });

  it('exits 0 and does nothing for a local (non-global) install', () => {
    assert.equal(runPostinstall({}).status, 0);
    assert.ok(!fs.existsSync(log()));
  });

  it('exits 0 on a global install and records why it skipped', () => {
    assert.equal(runPostinstall({ npm_config_global: 'true' }).status, 0);
    if (process.platform === 'win32') {
      assert.match(fs.readFileSync(log(), 'utf8'), new RegExp(`^\\[repair\\] .* \\| npm install ${version.replace(/\./g, '\\.')} \\| skipped \\| automatic scans are turned off`));
    }
  });

  it('exits 0 even when the scheduler module cannot load', () => {
    const broken = tmpDir('ctu-broken-');
    try {
      fs.mkdirSync(path.join(broken, 'bin'));
      fs.copyFileSync(POSTINSTALL, path.join(broken, 'bin', 'postinstall.js'));
      fs.writeFileSync(path.join(broken, 'package.json'), '{"type":"module"}');
      const r = spawnSync(process.execPath, [path.join(broken, 'bin', 'postinstall.js')], { env: cleanEnv({ npm_config_global: 'true' }), encoding: 'utf8', timeout: 60_000 });
      assert.equal(r.status, 0);
    } finally {
      fs.rmSync(broken, { recursive: true, force: true });
    }
  });
});
