// req: FR-USAGE-002, ADR-099
//
// Every real scan leaves one scan-log record on the server: which steps ran,
// how each ended, and the counts. "No new usage" is a success. A record that
// cannot be delivered (server down) waits in a local queue for the next scan.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { redact, STEPS } from '../src/scan-log.js';
import { cleanEnv, fakeBackend, runCli, saveLogin, TOKEN, tmpDir, usageLine, writeTranscript } from './helpers.js';

let projects;
let configHome;
let backend;
/** 'up' | 'down' (503 everywhere) | 'old' (no /api/ingest/scan-log route) */
let mode;

const HOUR = 3600_000;
const ago = (hours) => new Date(Date.now() - hours * HOUR).toISOString();
const env = (extra = {}) => cleanEnv({ CLAUDE_PROJECTS_DIR: projects, CLAUDE_TEAM_USAGE_CONFIG_DIR: configHome, ...extra });
const scan = (...args) => runCli(['scan', ...args], { env: env() });
/** Records the server accepted — a 503/404 answer is recorded by fakeBackend but not kept here. */
const logs = () => backend.scanLogs.filter((r) => r.accepted).map((r) => r.body);
const pending = () => {
  const file = path.join(configHome, 'scan-logs-pending.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
};
const stepOf = (record, key) => record.steps.find((s) => s.key === key);
// The server's two tracking refusals (ADR-105), as ApiExceptionHandler writes them.
const DISABLED_403 = {
  status: 403,
  body: { detail: 'Claude usage tracking is disabled for this account by an administrator. This report was not recorded', code: 'tracking-disabled' },
};
const GAP_409 = {
  status: 409,
  body: { detail: 'This report is from a period when Claude usage tracking was disabled for this account. It will not be recorded', code: 'disabled-period' },
};
const usageUploads = () => backend.requests.filter((r) => r.url === '/api/ingest');
const ledgerDays = () => {
  const file = path.join(configHome, 'reported.json');
  if (!fs.existsSync(file)) return {};
  const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Object.values(ledger.accounts)[0]?.days ?? {};
};
const line = (id, output, hours = 2) => usageLine({ id, requestId: `req_${id}`, model: 'claude-opus-5-5', input: 0, output, timestamp: ago(hours) });

beforeEach(async () => {
  projects = tmpDir('ctu-projects-');
  configHome = tmpDir('ctu-config-');
  mode = 'up';
  backend = await fakeBackend(
    (req) => {
      if (mode === 'down') return { status: 503, body: { detail: 'down' } };
      if (mode === 'disabled') return DISABLED_403;
      if (req.url === '/api/ingest/scan') return { status: 200, body: { action: 'scan-recorded' } };
      if (mode === 'gap') return GAP_409;
      return { status: 200, body: { action: 'updated' } };
    },
    {
      scanLog: () => {
        if (mode === 'down') return { status: 503, body: { detail: 'down' } };
        if (mode === 'old') return null;
        if (mode === 'disabled') return DISABLED_403;
        if (mode === 'auth403') return { status: 403, body: { detail: 'this token may only report usage for its own account' } };
        backend.scanLogs.at(-1).accepted = true;
        return { status: 200, body: { action: 'recorded' } };
      },
    },
  );
  saveLogin(configHome, { ingestUrl: backend.url });
});

afterEach(async () => {
  await backend?.close();
  fs.rmSync(projects, { recursive: true, force: true });
  fs.rmSync(configHome, { recursive: true, force: true });
});

describe('scan log (ADR-099)', () => {
  it('an upload: one record, every step successful, the new tokens counted, no credential in it', async () => {
    // The same response on two lines: one counted, one duplicate merged.
    writeTranscript(projects, 'proj/a.jsonl', [line('m1', 1_000), line('m1', 1_000), line('m2', 500)]);
    const run = await scan();
    assert.equal(run.code, 0, run.stderr);

    const [record] = logs();
    assert.equal(logs().length, 1);
    assert.deepEqual(record.steps.map((s) => s.key), STEPS);
    assert.ok(record.steps.every((s) => s.status === 'success'), JSON.stringify(record.steps));
    assert.equal(record.email, 'dana@example.com');
    assert.equal(record.trigger, 'manual');
    assert.equal(record.cliVersion, JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url))).version);
    assert.equal(record.transcriptFiles, 1);
    assert.equal(record.responses, 2);
    assert.equal(record.duplicates, 1);
    assert.equal(record.newTokens, 1_500);
    assert.equal(record.daysUploaded, 1);
    assert.equal(record.uploadStatus, 'uploaded');
    assert.equal(record.errorStep, null);
    assert.match(record.scanId, /^[0-9a-f-]{36}$/);
    assert.ok(Date.parse(record.finishedAt) >= Date.parse(record.startedAt));
    assert.ok(!JSON.stringify(record).includes(TOKEN), 'the token never goes into a log record');
    assert.equal(pending().length, 0, 'delivered, so nothing queued');
  });

  it('no new usage: still a successful scan, upload "not needed", 0 new tokens', async () => {
    writeTranscript(projects, 'proj/a.jsonl', [line('m1', 1_000)]);
    await scan();
    const second = await scan();
    assert.equal(second.code, 0, second.stderr);

    const record = logs()[1];
    assert.ok(record.steps.every((s) => s.status === 'success'), JSON.stringify(record.steps));
    assert.match(stepOf(record, 'check-new-usage').detail, /No new usage/);
    assert.match(stepOf(record, 'upload').detail, /Nothing to upload/);
    assert.equal(record.uploadStatus, 'not-needed');
    assert.equal(record.newTokens, 0);
    assert.equal(record.errorStep, null);
  });

  it('a failed upload is recorded at the upload step, queued while the server is down, and sent by the next scan', async () => {
    writeTranscript(projects, 'proj/a.jsonl', [line('m1', 1_000)]);
    mode = 'down';
    const failed = await scan();
    assert.equal(failed.code, 1);
    assert.equal(logs().length, 0, 'nothing accepted while the server is down');
    const [queued] = pending();
    assert.equal(queued.errorStep, 'upload');
    assert.match(queued.errorMessage, /upload failed/);
    assert.equal(queued.uploadStatus, 'failed');
    assert.equal(stepOf(queued, 'upload').status, 'failed');
    assert.equal(stepOf(queued, 'complete').status, 'skipped', 'steps after the failure did not run');

    mode = 'up';
    const next = await scan();
    assert.equal(next.code, 0, next.stderr);
    assert.deepEqual(logs().map((r) => r.errorStep), ['upload', null], 'the earlier failure first, then this scan');
    assert.equal(pending().length, 0);
  });

  it('no transcript directory: failed at "find transcripts"', async () => {
    const missing = path.join(projects, 'nope');
    const run = await runCli(['scan'], { env: env({ CLAUDE_PROJECTS_DIR: missing }) });
    assert.equal(run.code, 1);
    const [record] = logs();
    assert.equal(record.errorStep, 'find-transcripts');
    assert.equal(stepOf(record, 'start').status, 'success');
    assert.equal(stepOf(record, 'find-transcripts').status, 'failed');
    assert.equal(stepOf(record, 'parse-usage').status, 'skipped');
  });

  it('a server older than the scan log: the scan is unaffected and nothing piles up locally', async () => {
    mode = 'old';
    writeTranscript(projects, 'proj/a.jsonl', [line('m1', 1_000)]);
    const run = await scan();
    assert.equal(run.code, 0, run.stderr);
    assert.equal(pending().length, 0, 'a 404 is final — the record is dropped, not retried forever');
  });

  it('--dry-run keeps no log', async () => {
    writeTranscript(projects, 'proj/a.jsonl', [line('m1', 1_000)]);
    await scan('--dry-run');
    assert.equal(logs().length, 0);
    assert.equal(pending().length, 0);
  });
});

describe('redact', () => {
  it('masks tokens and bearer values, and hides the home directory', () => {
    const home = os.homedir();
    const out = redact(`401 for coc_${'a'.repeat(20)} with Bearer xyz.abc reading ${path.join(home, '.claude', 'x.jsonl')}`);
    assert.ok(!out.includes('a'.repeat(20)));
    assert.match(out, /coc_\*\*\*/);
    assert.match(out, /Bearer \*\*\*/);
    assert.ok(!out.includes(home));
    assert.match(out, /~/);
  });
});

describe('tracking disabled by an administrator (ADR-105)', () => {
  it('while disabled: says to contact the administrator, never to log in, and queues nothing to resend', async () => {
    writeTranscript(projects, 'proj/a.jsonl', [line('m1', 1_000)]);
    mode = 'disabled';

    const run = await scan();

    assert.equal(run.code, 1);
    assert.match(run.stderr, /disabled for your account by an administrator/);
    assert.match(run.stderr, /Contact your Coc Docs administrator/);
    assert.doesNotMatch(run.stderr, /login|sign in/i, 'signing in again cannot help, so it is not suggested');
    assert.equal(usageUploads().length, 1, 'a 403 is final — not retried within the scan');
    assert.equal(pending().length, 0, 'the server will never take a scan log from this time, so it is dropped');
    assert.equal(Object.keys(ledgerDays()).length, 0, 'nothing marked as sent');
  });

  it('a genuine credential 403 still keeps its login advice, and its scan log waits for a fresh login', async () => {
    writeTranscript(projects, 'proj/a.jsonl', [line('m1', 1_000)]);
    mode = 'auth403';

    const run = await scan();

    assert.equal(run.code, 0, run.stderr);
    assert.equal(pending().length, 1, 'kept — a fresh login fixes a credential problem');
  });

  it('after Enable: a day from the disabled period is skipped for good and never sent again', async () => {
    writeTranscript(projects, 'proj/a.jsonl', [line('m1', 1_000)]);
    mode = 'gap';

    const first = await scan();

    assert.equal(first.code, 0, first.stderr);
    assert.match(first.stdout, /not recorded — tracking was disabled for this account then/);
    assert.match(first.stderr, /skipped, not recorded: tracking was disabled for your account at that time/);
    assert.doesNotMatch(first.stderr, /login/);
    assert.equal(usageUploads().length, 1);
    const [day] = Object.values(ledgerDays());
    assert.equal(day.skipped, true);
    assert.equal(logs().at(-1).uploadStatus, 'not-needed');

    // More usage the same day, then another scan: the skipped day is not resent.
    writeTranscript(projects, 'proj/b.jsonl', [line('m2', 500)]);
    const second = await scan();

    assert.equal(second.code, 0, second.stderr);
    assert.equal(usageUploads().length, 1, 'the refused day was not sent again');
  });
});
