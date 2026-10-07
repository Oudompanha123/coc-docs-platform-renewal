// req: FR-USAGE-002, ADR-060
//
// The whole user workflow is `npm install -g claude-team-usage` then
// `claude-team-usage scan`: the first scan from a terminal signs in through the
// browser, sets up the daily 11:00/16:00 task, and uploads — in that order.
//
// Task Scheduler is replaced by an in-memory fake `schtasks` runner, so these
// tests never create or delete a real task on the machine running them.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, afterEach, beforeEach, describe, it } from 'node:test';
import { login, logout } from '../src/login.js';
import { scan } from '../src/scan.js';
import { ensureScheduled, install, installTest, parseTask, remove, ScheduleError, status, TASK_NAME } from '../src/schedule.js';
import { closeConnections } from '../src/upload.js';
import { actAsBrowser, fakeBackend, saveLogin, TOKEN, tmpDir, usageLine, writeTranscript } from './helpers.js';

/** In-memory Task Scheduler: /Query fails for a missing task, /Create /F replaces, /Delete removes. */
function fakeScheduler() {
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
      const raw = fs.readFileSync(args[args.indexOf('/XML') + 1]);
      tasks.set(name, raw.subarray(2).toString('utf16le')); // skip the UTF-16 BOM
      return '';
    }
    if (args[0] === '/Delete') {
      tasks.delete(name);
      return '';
    }
    throw new Error(`unexpected schtasks ${args[0]}`);
  };
  // Export-ScheduledTask: the registered XML, or null when there is no task.
  const read = () => tasks.get(TASK_NAME) ?? null;
  return { run, read, tasks, calls, creates: () => calls.filter((c) => c === '/Create').length };
}

/**
 * A stable install on disk — `<root>/npm/node_modules/claude-team-usage/bin/cli.js`
 * and its own node.exe — standing in for `npm install -g`. (The tests themselves
 * run from a git checkout, which ensureScheduled rightly refuses.)
 */
function fakeInstall(root, name = 'npm') {
  const node = path.join(root, `${name}-nodejs`, 'node.exe');
  const cli = path.join(root, name, 'node_modules', 'claude-team-usage', 'bin', 'cli.js');
  for (const file of [node, cli]) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '');
  }
  return { node, cli, unstable: null };
}

const lines = () => {
  const out = [];
  const push = (l) => out.push(String(l));
  return { io: { out: push, info: push, err: push }, text: () => out.join('\n') };
};

const SAVED = [
  'CLAUDE_TEAM_USAGE_CONFIG_DIR',
  'CLAUDE_TEAM_USAGE_AUTO_SCHEDULE',
  'CLAUDE_PROJECTS_DIR',
  'COC_DOCS_URL',
  'USER_EMAIL',
  'INGEST_URL',
  'INGEST_SECRET',
  'USERNAME',
  'USERDOMAIN',
];
const original = Object.fromEntries(SAVED.map((k) => [k, process.env[k]]));

let configHome;
let projects;
let installs;
let current;
let backend;
let sched;

beforeEach(async () => {
  configHome = tmpDir('ctu-config-');
  projects = tmpDir('ctu-projects-');
  installs = tmpDir('ctu-installs-');
  current = fakeInstall(installs);
  sched = fakeScheduler();
  // A stand-in Coc Docs: the CLI token exchange, and /api/ingest.
  backend = await fakeBackend((req) => {
    if (req.url === '/api/cli/token') {
      return { status: 200, body: { token: TOKEN, email: 'dana@example.com', displayName: 'Dana', ingestUrl: `${backend.origin}/api/ingest` } };
    }
    if (req.url === '/api/ingest') return { status: 200, body: { action: 'created' } };
    return null;
  });
  for (const k of SAVED) delete process.env[k];
  Object.assign(process.env, {
    CLAUDE_TEAM_USAGE_CONFIG_DIR: configHome,
    CLAUDE_PROJECTS_DIR: projects,
    COC_DOCS_URL: backend.origin,
    USERNAME: 'dana',
    USERDOMAIN: 'CORP',
  });
  writeTranscript(projects, 'proj/session.jsonl', [usageLine({ id: 'm1', requestId: 'r1', model: 'claude-sonnet-5', input: 10, output: 200 })]);
});

afterEach(async () => {
  await backend.close();
  fs.rmSync(configHome, { recursive: true, force: true });
  fs.rmSync(projects, { recursive: true, force: true });
  fs.rmSync(installs, { recursive: true, force: true });
});

after(async () => {
  for (const [k, v] of Object.entries(original)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
  await closeConnections();
});

const ingests = () => backend.requests.filter((r) => r.url === '/api/ingest');
const useFake = (o) => ensureScheduled({ current, ...o, run: sched.run, read: sched.read, platform: 'win32' });

/** An interactive first run: the "browser" approves as soon as the CLI opens it. */
function terminalScan(extra = {}) {
  const out = lines();
  let opened = 0;
  const run = scan({
    io: out.io,
    interactive: true,
    ensureSchedule: useFake,
    loginOptions: {
      open: (url) => {
        opened++;
        void actAsBrowser(url, { api: backend.origin });
      },
      device: 'test-pc',
    },
    ...extra,
  });
  return { run, out, opened: () => opened };
}

describe('first `claude-team-usage scan`: sign in, schedule, upload', () => {
  it('1+2 — signs in through the browser, then registers the 11:00/16:00 task, then uploads this scan', async () => {
    const order = [];
    const { run, out, opened } = terminalScan({
      ensureSchedule: (o) => {
        // Registered only after authentication, and before the upload.
        order.push('schedule');
        assert.ok(fs.existsSync(path.join(configHome, 'credentials.json')), 'credentials saved before scheduling');
        assert.equal(ingests().length, 0, 'scheduled before uploading');
        return useFake(o);
      },
    });

    const result = await run;

    assert.equal(opened(), 1, 'browser opened once');
    assert.deepEqual(order, ['schedule']);
    assert.equal(sched.creates(), 1);
    const xml = sched.tasks.get(TASK_NAME);
    assert.match(xml, /T11:00:00</);
    assert.match(xml, /T16:00:00</);
    assert.match(xml, /<UserId>CORP\\dana<\/UserId>/);
    assert.match(xml, /<Command>[^<]*wscript\.exe<\/Command>/);
    assert.match(xml, /run-hidden\.jscript&quot; &quot;[^<]*cli\.js&quot; &quot;[^<]*scheduled-scan\.log&quot; scan --scheduled<\/Arguments>/);
    assert.equal(result.sent, 1);
    assert.equal(ingests().length, 1);
    assert.equal(ingests()[0].headers.authorization, `Bearer ${TOKEN}`);
    assert.match(out.text(), /Automatic scans set up: every day at 11:00 and 16:00/);
    assert.match(out.text(), /sent 210 tokens/);
  });

  it('3 — a second scan finds the task and creates no duplicate', async () => {
    await terminalScan().run;
    writeTranscript(projects, 'proj/more.jsonl', [usageLine({ id: 'm2', requestId: 'r2', model: 'claude-sonnet-5', input: 1, output: 50 })]);

    const second = terminalScan();
    await second.run;

    assert.equal(second.opened(), 0, 'already signed in — no browser');
    assert.equal(sched.creates(), 1, 'still exactly one /Create');
    assert.equal(sched.tasks.size, 1);
    assert.doesNotMatch(second.out.text(), /Automatic scans set up/);
    assert.equal(ingests().length, 2, 'the second scan still uploads its new usage');
  });

  it('an already-signed-in user gets the task on their next terminal scan (no browser)', async () => {
    saveLogin(configHome, { ingestUrl: `${backend.origin}/api/ingest` });
    const { run, opened } = terminalScan();
    await run;
    assert.equal(opened(), 0);
    assert.equal(sched.creates(), 1);
  });

  it('a scheduling problem is a warning; the scan still uploads', async () => {
    const { run, out } = terminalScan({
      ensureSchedule: (o) =>
        ensureScheduled({
          ...o,
          current,
          read: sched.read,
          platform: 'win32',
          run: (args) => (args[0] === '/Query' ? sched.run(args) : (() => { throw new Error('access denied'); })()),
        }),
    });
    const result = await run;
    assert.equal(result.sent, 1);
    assert.match(out.text(), /warning: could not set up automatic scans .*access denied.*This scan continues/);
  });
});

describe('scheduled (non-interactive) runs', () => {
  it('4 — never open a browser and never register anything, even when not signed in', async () => {
    const out = lines();
    let opened = 0;
    let scheduled = 0;
    await assert.rejects(
      scan({ io: out.io, interactive: false, ensureSchedule: () => scheduled++, loginOptions: { open: () => opened++ } }),
      /not signed in/,
    );
    assert.equal(opened, 0);
    assert.equal(scheduled, 0);
  });

  it('4 — signed in: uploads without touching Task Scheduler', async () => {
    saveLogin(configHome, { ingestUrl: `${backend.origin}/api/ingest` });
    let scheduled = 0;
    const result = await scan({ io: lines().io, interactive: false, ensureSchedule: () => scheduled++ });
    assert.equal(result.sent, 1);
    assert.equal(scheduled, 0);
  });

  it('--dry-run and USER_EMAIL/INGEST_URL/INGEST_SECRET runs do not register a task', async () => {
    let scheduled = 0;
    await scan({ io: lines().io, interactive: true, dryRun: true, ensureSchedule: () => scheduled++ });
    Object.assign(process.env, { USER_EMAIL: 'ci@example.com', INGEST_URL: `${backend.origin}/api/ingest`, INGEST_SECRET: 'coc_ci' });
    await scan({ io: lines().io, interactive: true, ensureSchedule: () => scheduled++ });
    assert.equal(scheduled, 0);
  });
});

describe('logout and revoke', () => {
  it('5 — after logout the scheduled run fails cleanly (exit path, no browser); the next terminal scan signs in again', async () => {
    await terminalScan().run;
    logout({ io: lines().io });
    assert.equal(fs.existsSync(path.join(configHome, 'credentials.json')), false);

    let opened = 0;
    await assert.rejects(scan({ io: lines().io, interactive: false, loginOptions: { open: () => opened++ } }), /not signed in/);
    assert.equal(opened, 0);

    const again = terminalScan();
    await again.run;
    assert.equal(again.opened(), 1, 'signs in again from the terminal');
    assert.equal(sched.creates(), 1, 'the existing task is reused, not duplicated');
  });

  it('5 — a revoked token (401) fails the scheduled run without opening a browser', async () => {
    saveLogin(configHome, { ingestUrl: `${backend.origin}/api/ingest` });
    await backend.close();
    backend = await fakeBackend(() => ({ status: 401, body: { detail: 'invalid ingest credential' } }));
    saveLogin(configHome, { ingestUrl: backend.url });
    let opened = 0;
    await assert.rejects(
      scan({ io: lines().io, interactive: false, loginOptions: { open: () => opened++ } }),
      /invalid or has been revoked/,
    );
    assert.equal(opened, 0);
  });

  it('`schedule remove` is respected: a later scan does not put the task back until `schedule` is run', async () => {
    await terminalScan().run;
    remove({ io: lines().io, run: sched.run, env: process.env, platform: 'win32' });
    assert.equal(sched.tasks.size, 0);

    await terminalScan().run;
    assert.equal(sched.tasks.size, 0, 'opted out');

    install({ io: lines().io, run: sched.run, platform: 'win32', current });
    assert.equal(sched.tasks.size, 1);
    await terminalScan().run;
    assert.equal(sched.creates(), 2, 'first scan + explicit schedule; no extra from the later scan');
  });
});

describe('ensureScheduled', () => {
  it('is idempotent: created, then exists, never a second task', () => {
    saveLogin(configHome, { ingestUrl: `${backend.origin}/api/ingest` });
    const { io } = lines();
    assert.equal(useFake({ io }), 'created');
    assert.equal(useFake({ io }), 'exists');
    assert.equal(useFake({ io }), 'exists');
    assert.equal(sched.creates(), 1);
  });

  it('does nothing off Windows', () => {
    saveLogin(configHome);
    assert.equal(ensureScheduled({ io: lines().io, run: sched.run, platform: 'linux' }), 'unsupported');
    assert.equal(sched.calls.length, 0);
  });
});

describe('ensureScheduled repairs a task that no longer runs this installation', () => {
  const registered = () => parseTask(sched.tasks.get(TASK_NAME));
  /** Registers the task as an older/other install had it, then makes `current` the one now running. */
  function registeredBy(other) {
    assert.equal(useFake({ io: lines().io, current: other }), 'created');
  }
  beforeEach(() => saveLogin(configHome, { ingestUrl: `${backend.origin}/api/ingest` }));

  it('task exists with the right paths: kept, not re-registered', () => {
    registeredBy(current);
    const out = lines();
    assert.equal(useFake({ io: out.io }), 'exists');
    assert.equal(useFake({ io: out.io }), 'exists');
    assert.equal(sched.creates(), 1);
    assert.equal(out.text(), '', 'says nothing when nothing changed');
  });

  it('Node.js path changed (Node reinstalled or upgraded elsewhere): repaired in place', () => {
    registeredBy({ ...current, node: fakeInstall(installs, 'old').node });
    const out = lines();
    assert.equal(useFake({ io: out.io }), 'repaired');
    assert.equal(registered().node, current.node);
    assert.equal(sched.tasks.size, 1);
    assert.match(out.text(), /Automatic scans repaired — Node\.js moved from .*old-nodejs.* to /);
  });

  it('CLI path changed (another install, or an old git checkout): repaired to this installation', () => {
    registeredBy(fakeInstall(installs, 'checkout'));
    const out = lines();
    assert.equal(useFake({ io: out.io }), 'repaired');
    assert.equal(registered().cli, current.cli);
    assert.match(out.text(), /ran the CLI at .*checkout.*not this installation/);
  });

  it('CLI file deleted: repaired', () => {
    const gone = fakeInstall(installs, 'gone');
    registeredBy(gone);
    fs.rmSync(path.join(installs, 'gone'), { recursive: true });
    const out = lines();
    assert.equal(useFake({ io: out.io }), 'repaired');
    assert.equal(registered().cli, current.cli);
    assert.match(out.text(), /the CLI is no longer at /);
  });

  it('a 0.3.0 task (plain `scan`, no schedule marker) is migrated once, then left alone', () => {
    registeredBy(current);
    const old = sched.tasks
      .get(TASK_NAME)
      .replace(' --scheduled', '')
      .replace(/ \[schedule: [^\]]*\]/, '');
    sched.tasks.set(TASK_NAME, old);
    assert.equal(useFake({ io: lines().io }), 'repaired');
    assert.match(sched.tasks.get(TASK_NAME), /scan --scheduled<\/Arguments>/);
    assert.equal(useFake({ io: lines().io }), 'exists');
    assert.equal(sched.creates(), 2);
  });

  it('a task that starts cmd.exe directly (the console window flashed) is moved to the hidden launcher', () => {
    registeredBy(current);
    const log = path.join(configHome, 'scheduled-scan.log');
    const cmdForm = `/d /c &quot;(echo ==== %DATE% %TIME% &amp; &quot;${current.node}&quot; &quot;${current.cli}&quot; scan --scheduled) &gt;&gt; &quot;${log}&quot; 2&gt;&amp;1&quot;`;
    sched.tasks.set(
      TASK_NAME,
      sched.tasks
        .get(TASK_NAME)
        .replace(/<Command>[^<]*<\/Command>/, '<Command>C:\\WINDOWS\\system32\\cmd.exe</Command>')
        .replace(/<Arguments>[^<]*<\/Arguments>/, `<Arguments>${cmdForm}</Arguments>`),
    );
    const out = lines();
    assert.equal(useFake({ io: out.io }), 'repaired');
    assert.match(out.text(), /command line is from an older version/);
    const task = parseTask(sched.tasks.get(TASK_NAME));
    assert.match(task.command, /System32\\wscript\.exe$/);
    assert.match(task.args, /^\/\/B \/\/NoLogo \/\/E:JScript ".*run-hidden\.jscript" /);
    assert.equal(task.cli, current.cli);
    assert.equal(sched.tasks.size, 1);
  });

  it('a task Task Scheduler has but will not export is re-registered, never duplicated', () => {
    registeredBy(current);
    const out = lines();
    assert.equal(ensureScheduled({ io: out.io, current, run: sched.run, read: () => null, platform: 'win32' }), 'repaired');
    assert.equal(sched.tasks.size, 1);
  });

  it('repairing many times is idempotent: one task, current paths', () => {
    registeredBy(fakeInstall(installs, 'old'));
    for (let i = 0; i < 3; i++) useFake({ io: lines().io });
    assert.equal(sched.tasks.size, 1);
    assert.equal(sched.creates(), 2, 'the first registration and one repair');
    assert.equal(registered().cli, current.cli);
  });
});

describe('an unstable installation never becomes the task', () => {
  const checkout = { node: process.execPath, cli: '/src/coc-docs-platform/tools/claude-team-usage/bin/cli.js', unstable: 'it is running from a git working tree (/src/coc-docs-platform) — a development checkout or `npm link`' };
  beforeEach(() => saveLogin(configHome, { ingestUrl: `${backend.origin}/api/ingest` }));

  it('no task yet: refuses, says to install globally, and the scan goes on', async () => {
    const out = lines();
    const result = await scan({ io: out.io, interactive: true, ensureSchedule: (o) => useFake({ ...o, current: checkout }) });
    assert.equal(result.sent, 1);
    assert.equal(sched.tasks.size, 0);
    assert.match(out.text(), /warning: could not set up automatic scans .*git working tree.*npm install -g claude-team-usage.*This scan continues/);
  });

  it('a working task from the global install is left alone', () => {
    useFake({ io: lines().io });
    const out = lines();
    assert.equal(useFake({ io: out.io, current: checkout }), 'exists');
    assert.equal(registered(), current.cli);
    assert.equal(out.text(), '');
    function registered() {
      return parseTask(sched.tasks.get(TASK_NAME)).cli;
    }
  });

  it('a broken task is not repointed at the checkout', () => {
    useFake({ io: lines().io, current: fakeInstall(installs, 'gone') });
    fs.rmSync(path.join(installs, 'gone'), { recursive: true });
    const out = lines();
    assert.equal(useFake({ io: out.io, current: checkout }), 'failed');
    assert.equal(sched.creates(), 1);
    assert.match(out.text(), /could not repair automatic scans .*npm install -g claude-team-usage/);
  });

  it('`schedule` and `schedule test` refuse it outright', () => {
    assert.throws(() => install({ io: lines().io, run: sched.run, platform: 'win32', current: checkout }), (e) => e instanceof ScheduleError && /npm install -g/.test(e.message));
    assert.throws(() => installTest({ io: lines().io, run: sched.run, platform: 'win32', current: checkout }), /npm install -g/);
    assert.equal(sched.tasks.size, 0);
  });
});

describe('`login` sets up (or repairs) the task — no `schedule` needed', () => {
  function signIn() {
    const out = lines();
    const done = login({
      io: out.io,
      ensureSchedule: useFake,
      open: (url) => void actAsBrowser(url, { api: backend.origin }),
      device: 'test-pc',
    });
    return done.then(() => out);
  }

  it('creates the task right after the sign-in is saved', async () => {
    const out = await signIn();
    assert.ok(fs.existsSync(path.join(configHome, 'credentials.json')));
    assert.equal(sched.creates(), 1);
    assert.equal(parseTask(sched.tasks.get(TASK_NAME)).cli, current.cli);
    assert.match(out.text(), /signed in as Dana[\s\S]*Automatic scans set up: every day at 11:00 and 16:00/);
  });

  it('logging in again creates no duplicate', async () => {
    await signIn();
    const out = await signIn();
    assert.equal(sched.creates(), 1);
    assert.equal(sched.tasks.size, 1);
    assert.match(out.text(), /already set up for this installation/);
  });

  it('logging in from a new install repairs the old task', async () => {
    await signIn();
    current = fakeInstall(installs, 'new');
    const out = await signIn();
    assert.equal(sched.tasks.size, 1);
    assert.equal(parseTask(sched.tasks.get(TASK_NAME)).cli, current.cli);
    assert.match(out.text(), /Automatic scans repaired/);
  });

  it('respects `schedule remove`, and says how to turn it back on', async () => {
    remove({ io: lines().io, run: sched.run, platform: 'win32' });
    const out = await signIn();
    assert.equal(sched.tasks.size, 0);
    assert.match(out.text(), /Automatic scans are off/);
  });

  it('a scheduling failure never fails the sign-in', async () => {
    const out = lines();
    const creds = await login({
      io: out.io,
      ensureSchedule: (o) => useFake({ ...o, current: { ...current, unstable: 'it is running from the npx cache, which npm clears' } }),
      open: (url) => void actAsBrowser(url, { api: backend.origin }),
      device: 'test-pc',
    });
    assert.equal(creds.email, 'dana@example.com');
    assert.match(out.text(), /could not set up automatic scans .*npx cache.*You are signed in anyway/);
  });
});

describe('Git Bash (no TTY) is not mistaken for the scheduled run', () => {
  it('a non-TTY scan with a saved login still sets up the task', async () => {
    saveLogin(configHome, { ingestUrl: `${backend.origin}/api/ingest` });
    const result = await scan({ io: lines().io, interactive: false, scheduled: false, ensureSchedule: useFake });
    assert.equal(result.sent, 1);
    assert.equal(sched.creates(), 1);
  });

  it('the run Task Scheduler started (`--scheduled`) never touches the task', async () => {
    saveLogin(configHome, { ingestUrl: `${backend.origin}/api/ingest` });
    let calls = 0;
    await scan({ io: lines().io, interactive: false, scheduled: true, ensureSchedule: () => calls++ });
    assert.equal(calls, 0);
  });

  it('CLAUDE_TEAM_USAGE_AUTO_SCHEDULE=off keeps a machine (CI) from ever getting the task', () => {
    saveLogin(configHome);
    process.env.CLAUDE_TEAM_USAGE_AUTO_SCHEDULE = 'off';
    assert.equal(useFake({ io: lines().io }), 'opted-out');
    assert.equal(sched.calls.length, 0);
  });
});

describe('`schedule test` — a temporary every-5-minutes run, for checking the setup', () => {
  // 10:02:30 local → the first test run at 10:05, the last a day later.
  const now = new Date(2026, 9, 6, 10, 2, 30);
  beforeEach(() => saveLogin(configHome, { ingestUrl: `${backend.origin}/api/ingest` }));

  it('adds a 5-minute trigger from the next whole 5 minutes, for 24 hours, keeping 11:00/16:00', () => {
    const out = lines();
    installTest({ io: out.io, run: sched.run, platform: 'win32', current, now });
    const xml = sched.tasks.get(TASK_NAME);
    assert.match(xml, /<Interval>PT5M<\/Interval>/);
    assert.match(xml, /<StartBoundary>2026-10-06T10:05:00<\/StartBoundary>/);
    assert.match(xml, /<EndBoundary>2026-10-07T10:05:00<\/EndBoundary>/);
    assert.match(xml, /T11:00:00<[\s\S]*T16:00:00</);
    assert.match(out.text(), /TEST schedule .* every 5 min from 10:05 until 2026-10-07 10:05/);
    assert.match(out.text(), /end it: +claude-team-usage schedule/);
  });

  it('a scan or login during the test keeps it — the test trigger is not "repaired" away', () => {
    installTest({ io: lines().io, run: sched.run, platform: 'win32', current, now });
    assert.equal(useFake({ io: lines().io, now: new Date(2026, 9, 6, 12, 0) }), 'exists');
    assert.equal(sched.creates(), 1);
  });

  it('once it has expired, the next check puts back the production task', () => {
    installTest({ io: lines().io, run: sched.run, platform: 'win32', current, now });
    assert.equal(useFake({ io: lines().io, now: new Date(2026, 9, 7, 11, 0) }), 'repaired');
    assert.doesNotMatch(sched.tasks.get(TASK_NAME), /TimeTrigger|PT5M/);
    assert.equal(fs.existsSync(path.join(configHome, 'schedule-test.json')), false);
  });

  it('`schedule` ends it at once; `schedule remove` clears it too', () => {
    installTest({ io: lines().io, run: sched.run, platform: 'win32', current, now });
    install({ io: lines().io, run: sched.run, platform: 'win32', current, now });
    assert.doesNotMatch(sched.tasks.get(TASK_NAME), /TimeTrigger/);
    assert.equal(useFake({ io: lines().io, now }), 'exists', 'and stays production');

    installTest({ io: lines().io, run: sched.run, platform: 'win32', current, now });
    remove({ io: lines().io, run: sched.run, platform: 'win32' });
    assert.equal(fs.existsSync(path.join(configHome, 'schedule-test.json')), false);
  });

  it('takes another interval, within 1–60 minutes', () => {
    installTest({ io: lines().io, minutes: 2, run: sched.run, platform: 'win32', current, now });
    assert.match(sched.tasks.get(TASK_NAME), /<Interval>PT2M<\/Interval>[\s\S]*T10:04:00</);
    for (const bad of [0, 61, 2.5, Number.NaN]) {
      assert.throws(() => installTest({ io: lines().io, minutes: bad, run: sched.run, platform: 'win32', current, now }), /1 to 60/);
    }
  });
});

describe('6 — `schedule status` still works', () => {
  it('shows Task Scheduler’s view and the latest logged run', () => {
    fs.writeFileSync(
      path.join(configHome, 'scheduled-scan.log'),
      '==== 30/09/2026 11:00:02\nscanning ...\nsent 1,234 tokens for 2026-09-30\n==== 30/09/2026 16:00:03\nscanning ...\nnothing new to report for 2026-09-29..2026-09-30\n',
    );
    const out = lines();
    status({
      io: out.io,
      platform: 'win32',
      query: () => ({ state: 'Ready', user: 'CORP\\dana', lastRun: '2026-09-30 16:00', lastResult: 0, nextRun: '2026-10-01 11:00' }),
    });
    const text = out.text();
    assert.match(text, /task "claude-team-usage" \(Ready, runs as CORP\\dana\)/);
    assert.match(text, /last run: +2026-09-30 16:00 +→ 0 \(success\)/);
    assert.match(text, /next run: +2026-10-01 11:00/);
    assert.match(text, /16:00:03[\s\S]*nothing new to report/);
    assert.doesNotMatch(text, /11:00:02/, 'only the latest run');
  });

  it('shows the schedule and the Node.js / CLI the task runs, flagging a missing one', () => {
    const args = `/d /c "(echo ==== %DATE% %TIME% & "${current.node}" "C:\\gone\\bin\\cli.js" scan --scheduled) >> "L" 2>&1"`;
    const out = lines();
    status({
      io: out.io,
      platform: 'win32',
      query: () => ({ state: 'Ready', user: 'CORP\\dana', lastRun: null, lastResult: 0x41303, nextRun: '2026-10-06 10:05', args, description: 'x [schedule: daily 11:00,16:00 + every 5 min until 2026-10-07T10:05]' }),
    });
    const text = out.text();
    assert.match(text, /schedule: +daily 11:00,16:00 \+ every 5 min until 2026-10-07T10:05 +← TEST/);
    assert.ok(text.includes(`node:        ${current.node}\n`), 'an existing path is shown plainly');
    assert.match(text, /cli: +C:\\gone\\bin\\cli\.js +← MISSING/);
    assert.match(text, /last run: +never +→ not run yet/);
  });

  it('says so when there is no task', () => {
    const out = lines();
    status({ io: out.io, platform: 'win32', query: () => null });
    assert.match(out.text(), /no scheduled task "claude-team-usage"/);
  });
});
