// req: FR-USAGE-002, ADR-035, ADR-060
//
// A plain `scan` reports every day with unreported usage — not only today —
// and never re-sends a day that has not changed. Claude's own usage-limit
// reset is invisible to the CLI: it only ever sees transcript lines and
// their timestamps, so "before the reset" is simply an earlier timestamp.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { LOOKBACK_DAYS, scanWindow } from '../src/scan.js';
import { lastDays, ymd } from '../src/usage-parser.js';
import { cleanEnv, fakeBackend, runCli, saveLogin, tmpDir, usageLine, writeTranscript } from './helpers.js';

let projects;
let configHome;
let backend;
/** The dashboard as the backend keeps it: one whole-day total per date, overwritten by each upsert. */
let dashboard;
/** When set, the stand-in backend answers 503 and records nothing. */
let failing;

const HOUR = 3600_000;
const ago = (hours) => new Date(Date.now() - hours * HOUR).toISOString();
const env = () => cleanEnv({ CLAUDE_PROJECTS_DIR: projects, CLAUDE_TEAM_USAGE_CONFIG_DIR: configHome });
const scan = (...args) => runCli(['scan', ...args], { env: env() });
const onDashboard = () => Object.values(dashboard).reduce((n, v) => n + v, 0);
const ledger = () => JSON.parse(fs.readFileSync(path.join(configHome, 'reported.json'), 'utf8'));

/** 100K output tokens in one response, `hours` ago — "the morning, before the reset". */
const morning = (hours = 30) => usageLine({ id: 'msg_am', requestId: 'req_am', model: 'claude-opus-5-5', input: 0, output: 100_000, timestamp: ago(hours) });

beforeEach(async () => {
  projects = tmpDir('ctu-projects-');
  configHome = tmpDir('ctu-config-');
  dashboard = {};
  failing = false;
  backend = await fakeBackend((req, body) => {
    if (failing) return { status: 503, body: { detail: 'down' } };
    dashboard[body.date] = body.input + body.output;
    return { status: 200, body: { action: 'updated' } };
  });
  saveLogin(configHome, { ingestUrl: backend.url });
});

afterEach(async () => {
  await backend?.close();
  fs.rmSync(projects, { recursive: true, force: true });
  fs.rmSync(configHome, { recursive: true, force: true });
});

describe('scan: unreported usage, whatever Claude reset in between', () => {
  it('root cause: the old default window (today only) never looks at a previous day', async () => {
    writeTranscript(projects, 'proj/morning.jsonl', [morning(30)]);
    const res = await scan('--days', '1');
    assert.equal(res.code, 0, res.stderr);
    assert.match(res.stdout, /no usage found/);
    assert.equal(backend.requests.length, 0);
  });

  it('case 1 — usage before the reset, scanned after it: the 100K is reported', async () => {
    // A previous clean scan two days ago; the morning usage came after it.
    writeTranscript(projects, 'proj/morning.jsonl', [morning(30)]);
    fs.writeFileSync(
      path.join(configHome, 'reported.json'),
      JSON.stringify({ version: 1, accounts: { [`dana@example.com|${backend.url}`]: { days: {}, lastCompleteScan: lastDays(3)[0] } } }),
    );

    const res = await scan();

    assert.equal(res.code, 0, res.stderr);
    assert.equal(onDashboard(), 100_000);
    assert.match(res.stdout, /sent 100,000 tokens/);
  });

  it('case 2 — no new usage after the reset: the never-reported 100K is still sent', async () => {
    writeTranscript(projects, 'proj/morning.jsonl', [morning(5)]); // earlier today (or late yesterday)

    const res = await scan();

    assert.equal(res.code, 0, res.stderr);
    assert.equal(backend.requests.length, 1);
    assert.equal(onDashboard(), 100_000);
  });

  it('case 3 — scanning twice does not upload the same 100K again', async () => {
    writeTranscript(projects, 'proj/morning.jsonl', [morning(30)]);

    assert.equal((await scan()).code, 0);
    assert.equal(backend.requests.length, 1);

    const second = await scan();
    assert.equal(second.code, 0, second.stderr);
    assert.equal(backend.requests.length, 1, 'nothing re-sent');
    assert.match(second.stdout, /nothing new to report/);
    assert.equal(onDashboard(), 100_000);
  });

  it('case 4 — 100K before the reset and 50K after: the dashboard ends at 150K', async () => {
    const file = writeTranscript(projects, 'proj/today.jsonl', [morning(2)]);
    assert.equal((await scan()).code, 0);
    assert.equal(onDashboard(), 100_000);

    fs.appendFileSync(file, `${usageLine({ id: 'msg_pm', requestId: 'req_pm', model: 'claude-opus-5-5', input: 0, output: 50_000, timestamp: ago(1) })}\n`);
    const res = await scan();

    assert.equal(res.code, 0, res.stderr);
    assert.equal(backend.requests.length, 2);
    assert.equal(onDashboard(), 150_000, 'the day is re-sent as its whole new total, not +50K on top');
  });

  it('case 4b — 100K yesterday before the reset and 50K today after it, never reported: both days are sent', async () => {
    writeTranscript(projects, 'proj/two-days.jsonl', [
      morning(30),
      usageLine({ id: 'msg_pm', requestId: 'req_pm', model: 'claude-opus-5-5', input: 0, output: 50_000, timestamp: ago(0.1) }),
    ]);

    const res = await scan();

    assert.equal(res.code, 0, res.stderr);
    assert.equal(onDashboard(), 150_000);
  });

  it('case 5 — a day already reported is not sent again after the reset', async () => {
    writeTranscript(projects, 'proj/morning.jsonl', [morning(30)]);
    const day = ymd(new Date(Date.now() - 30 * HOUR));
    fs.writeFileSync(
      path.join(configHome, 'reported.json'),
      JSON.stringify({
        version: 1,
        accounts: {
          [`dana@example.com|${backend.url}`]: {
            days: { [day]: { input: 0, output: 100_000, cacheRead: 0, cacheCreation: 0 } },
            lastCompleteScan: lastDays(3)[0],
          },
        },
      }),
    );

    const res = await scan();

    assert.equal(res.code, 0, res.stderr);
    assert.equal(backend.requests.length, 0);
    assert.match(res.stdout, /nothing new to report/);
  });

  it('keeps message.id + requestId deduplication: a response on several lines is one 100K, not 300K', async () => {
    writeTranscript(projects, 'proj/morning.jsonl', [morning(30), morning(30), morning(30)]);
    writeTranscript(projects, 'proj/morning/subagents/agent-1.jsonl', [morning(30)]);

    assert.equal((await scan()).code, 0);
    assert.equal(onDashboard(), 100_000);
  });

  it('a failed upload is not recorded, so the next scan sends it again', async () => {
    writeTranscript(projects, 'proj/morning.jsonl', [morning(30)]);
    failing = true;
    const failed = await scan();
    assert.equal(failed.code, 1);
    assert.equal(onDashboard(), 0);
    if (fs.existsSync(path.join(configHome, 'reported.json'))) {
      const entry = Object.values(ledger().accounts)[0];
      assert.deepEqual(entry.days, {});
      assert.equal(entry.lastCompleteScan, null);
    }

    failing = false;
    const retry = await scan();
    assert.equal(retry.code, 0, retry.stderr);
    assert.equal(onDashboard(), 100_000);
  });

  it('never sends a day whose local total shrank (Claude Code deleted old transcripts)', async () => {
    const file = writeTranscript(projects, 'proj/today.jsonl', [
      morning(2),
      usageLine({ id: 'msg_pm', requestId: 'req_pm', model: 'claude-opus-5-5', input: 0, output: 50_000, timestamp: ago(1) }),
    ]);
    assert.equal((await scan()).code, 0);
    fs.writeFileSync(file, `${morning(2)}\n`); // 50K of it gone locally

    const res = await scan();
    assert.equal(res.code, 0, res.stderr);
    assert.equal(backend.requests.length, 1);
    assert.equal(onDashboard(), 150_000);
  });

  it('an explicit --days backfill still sends its whole window, as before', async () => {
    writeTranscript(projects, 'proj/morning.jsonl', [morning(30)]);
    assert.equal((await scan()).code, 0);
    assert.equal((await scan('--days', '3')).code, 0);
    assert.equal(backend.requests.length, 2);
  });

  it('--dry-run neither reads nor writes the record', async () => {
    writeTranscript(projects, 'proj/morning.jsonl', [morning(30)]);
    const res = await scan('--dry-run');
    assert.equal(res.code, 0, res.stderr);
    assert.equal(fs.existsSync(path.join(configHome, 'reported.json')), false);
    assert.equal(backend.requests.length, 0);
  });
});

describe('scanWindow', () => {
  const now = Date.parse('2026-09-30T05:00:00Z'); // 12:00 in Phnom Penh

  it('first run: the whole lookback', () => {
    const w = scanWindow({ days: null, lastCompleteScan: null, now });
    assert.equal(w.length, LOOKBACK_DAYS);
    assert.equal(w.at(-1), '2026-09-30');
  });

  it('later runs: from the day before the last clean scan, through today', () => {
    assert.deepEqual(scanWindow({ days: null, lastCompleteScan: '2026-09-28', now }), ['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30']);
    assert.deepEqual(scanWindow({ days: null, lastCompleteScan: '2026-09-30', now }), ['2026-09-29', '2026-09-30']);
  });

  it('never further back than the lookback, however long since the last scan', () => {
    assert.equal(scanWindow({ days: null, lastCompleteScan: '2025-01-01', now }).length, LOOKBACK_DAYS);
  });

  it('--days N is exactly the last N days', () => {
    assert.deepEqual(scanWindow({ days: 2, lastCompleteScan: '2026-09-01', now }), ['2026-09-29', '2026-09-30']);
  });
});
