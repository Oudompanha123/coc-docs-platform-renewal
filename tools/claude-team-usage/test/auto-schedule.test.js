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
import { logout } from '../src/login.js';
import { scan } from '../src/scan.js';
import { ensureScheduled, install, remove, status, TASK_NAME } from '../src/schedule.js';
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
  return { run, tasks, calls, creates: () => calls.filter((c) => c === '/Create').length };
}

const lines = () => {
  const out = [];
  const push = (l) => out.push(String(l));
  return { io: { out: push, info: push, err: push }, text: () => out.join('\n') };
};

const SAVED = ['CLAUDE_TEAM_USAGE_CONFIG_DIR', 'CLAUDE_PROJECTS_DIR', 'COC_DOCS_URL', 'USER_EMAIL', 'INGEST_URL', 'INGEST_SECRET', 'USERNAME', 'USERDOMAIN'];
const original = Object.fromEntries(SAVED.map((k) => [k, process.env[k]]));

let configHome;
let projects;
let backend;
let sched;

beforeEach(async () => {
  configHome = tmpDir('ctu-config-');
  projects = tmpDir('ctu-projects-');
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
});

after(async () => {
  for (const [k, v] of Object.entries(original)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
  await closeConnections();
});

const ingests = () => backend.requests.filter((r) => r.url === '/api/ingest');
const useFake = (o) => ensureScheduled({ ...o, run: sched.run, platform: 'win32' });

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
    assert.match(xml, /cli\.js&quot; scan\)/);
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
        ensureScheduled({ ...o, platform: 'win32', run: (args) => (args[0] === '/Query' ? sched.run(args) : (() => { throw new Error('access denied'); })()) }),
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

    install({ io: lines().io, run: sched.run, platform: 'win32' });
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

  it('says so when there is no task', () => {
    const out = lines();
    status({ io: out.io, platform: 'win32', query: () => null });
    assert.match(out.text(), /no scheduled task "claude-team-usage"/);
  });
});
