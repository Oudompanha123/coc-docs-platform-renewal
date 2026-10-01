// req: FR-USAGE-001, FR-USAGE-002, ADR-074
//
// Requests, sessions, active duration and projects, end to end through
// collectDays → buildPayloads over real files on disk (so project detection
// walks a real directory tree), plus the session-grouping primitives alone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { activeSeconds, groupSessions, IDLE_GAP_MS, OTHER_PROJECT } from '../src/activity.js';
import { isDue, recordSent } from '../src/ledger.js';
import { buildPayloads, collectDays } from '../src/usage-parser.js';
import { tmpDir, writeTranscript } from './helpers.js';

const DAY = '2026-09-30';
// 09:00 in Asia/Phnom_Penh (UTC+7) on DAY, plus `min` minutes.
const at = (min) => new Date(Date.parse(`${DAY}T02:00:00Z`) + min * 60_000).toISOString();

const root = tmpDir('ctu-activity-');
after(() => fs.rmSync(root, { recursive: true, force: true }));

/** A git repository on disk (a `.git` directory is all detection looks for). */
function repo(name) {
  const dir = path.join(root, 'work', name);
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'backend', 'src'), { recursive: true });
  return dir;
}
const docs = repo('coc-docs-platform');
const harness = repo('ax-harness');
const scratch = path.join(root, 'work', 'scratch-notes');
fs.mkdirSync(path.join(scratch, 'sub'), { recursive: true });

let uuid = 0;
const base = (o) => ({ uuid: `u${++uuid}`, sessionId: o.session ?? 's1', cwd: o.cwd ?? docs, timestamp: o.t });
const prompt = (o) =>
  JSON.stringify({
    ...base(o),
    type: 'user',
    promptId: o.promptId,
    isSidechain: o.sidechain ?? false,
    ...(o.meta ? { isMeta: true } : {}),
    ...(o.origin ? { origin: { kind: o.origin } } : {}),
    message: { role: 'user', content: o.content ?? 'do the thing' },
  });
const toolResult = (o) =>
  JSON.stringify({
    ...base(o),
    type: 'user',
    promptId: o.promptId,
    message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't', content: 'ok' }] },
  });
const reply = (o) =>
  JSON.stringify({
    ...base(o),
    type: 'assistant',
    requestId: o.requestId,
    message: {
      id: o.id,
      model: 'claude-opus-5-5',
      usage: {
        input_tokens: o.input ?? 0,
        output_tokens: o.output ?? 0,
        cache_read_input_tokens: o.cacheRead ?? 0,
        cache_creation_input_tokens: 0,
      },
    },
  });

/** Scans `lines` (written as one transcript per entry of `files`) for DAY. */
function activityFor(files) {
  const dir = tmpDir('ctu-act-projects-');
  try {
    for (const [rel, lines] of Object.entries(files)) writeTranscript(dir, rel, lines);
    const { days } = collectDays([dir], [DAY]);
    const [built] = buildPayloads(days, [DAY], { email: 'dana@example.com', displayName: 'Dana' });
    return built.payload;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('groupSessions / activeSeconds', () => {
  it('splits only where the gap exceeds the idle threshold', () => {
    const m = (min) => min * 60_000;
    const blocks = groupSessions([m(0), m(10), m(40), m(71), m(72), m(200)]);
    // 10→40 is exactly 30 min: same session. 40→71 is 31 min: new session.
    assert.deepEqual(blocks, [
      { start: m(0), end: m(40) },
      { start: m(71), end: m(72) },
      { start: m(200), end: m(200) },
    ]);
    assert.equal(IDLE_GAP_MS, 30 * 60_000);
  });

  it('sums each session last-minus-first, with no padding for a lone event', () => {
    const m = (min) => min * 60_000;
    assert.equal(activeSeconds(groupSessions([m(0), m(27), m(65), m(91), m(300)])), (27 + 26) * 60);
  });

  it('does not care about input order', () => {
    assert.deepEqual(groupSessions([5, 1, 3]), [{ start: 1, end: 5 }]);
  });
});

describe('request count', () => {
  it('counts one per human turn — tool results, subagents, meta and notifications excluded', () => {
    const p = activityFor({
      'a/s1.jsonl': [
        prompt({ promptId: 'p1', t: at(0) }),
        reply({ id: 'm1', requestId: 'r1', t: at(1), input: 10, output: 20 }),
        toolResult({ promptId: 'p1', t: at(2) }), // same turn
        reply({ id: 'm2', requestId: 'r2', t: at(3), input: 10, output: 20 }),
        toolResult({ promptId: 'p1', t: at(4) }),
        prompt({ promptId: 'p2', t: at(5), content: [{ type: 'text', text: 'next' }] }),
        prompt({ promptId: 'p2', t: at(6) }), // a queued follow-up inside the same turn
        prompt({ promptId: 'p3', t: at(7), sidechain: true }), // subagent
        prompt({ promptId: 'p4', t: at(8), meta: true }), // injected context
        prompt({ promptId: 'p5', t: at(9), origin: 'task-notification' }), // not the person
        prompt({ promptId: 'p6', t: at(10), origin: 'human' }),
        JSON.stringify({ ...base({ t: at(11) }), type: 'user', message: { content: '<command-name>/clear</command-name>' } }), // no promptId
        reply({ id: 'm3', requestId: 'r3', t: at(12), input: 1, output: 1 }),
      ],
    });
    assert.equal(p.activity.requestCount, 3); // p1, p2, p6
    assert.equal(p.activity.apiCallCount, 3); // m1, m2, m3 — the deduped responses
  });

  it('counts a turn logged in two files once', () => {
    const lines = [prompt({ promptId: 'same', t: at(0) }), reply({ id: 'm1', requestId: 'r1', t: at(1), input: 1, output: 1 })];
    const p = activityFor({ 'a/s1.jsonl': lines, 'a/s1/subagents/copy.jsonl': lines });
    assert.equal(p.activity.requestCount, 1);
    assert.equal(p.activity.apiCallCount, 1);
  });
});

describe('sessions and active duration', () => {
  it('merges every conversation into one timeline before splitting on idle gaps', () => {
    const p = activityFor({
      // 09:15–09:42 in one conversation, overlapping a second one 09:30–09:40.
      'a/one.jsonl': [
        prompt({ promptId: 'a1', t: at(15), session: 'one' }),
        reply({ id: 'a', requestId: 'ra', t: at(42), session: 'one', input: 1, output: 1 }),
        // 13:20–13:45, after a 2.8 h break.
        prompt({ promptId: 'a2', t: at(260), session: 'one' }),
        reply({ id: 'b', requestId: 'rb', t: at(285), session: 'one', input: 1, output: 1 }),
      ],
      'a/two.jsonl': [
        prompt({ promptId: 'b1', t: at(30), session: 'two' }),
        reply({ id: 'c', requestId: 'rc', t: at(40), session: 'two', input: 1, output: 1 }),
        // 10:05–10:31: 23 min after 09:42 — within the threshold, same session.
        prompt({ promptId: 'b2', t: at(65), session: 'two' }),
        reply({ id: 'd', requestId: 'rd', t: at(91), session: 'two', input: 1, output: 1 }),
      ],
    });
    const a = p.activity;
    assert.equal(a.conversationCount, 2);
    assert.equal(a.sessionCount, 2);
    assert.equal(a.activeSeconds, (91 - 15 + 285 - 260) * 60); // overlap counted once
    assert.deepEqual(
      a.sessions.map((s) => [s.startedAt, s.endedAt, s.requestCount]),
      [
        [at(15), at(91), 3],
        [at(260), at(285), 1],
      ],
    );
  });
});

describe('projects', () => {
  it('names the git repository, not the subfolder, and never sends a path', () => {
    const p = activityFor({
      'x/s1.jsonl': [
        prompt({ promptId: 'p1', t: at(0), cwd: docs }),
        reply({ id: 'm1', requestId: 'r1', t: at(1), cwd: path.join(docs, 'backend', 'src'), input: 5, output: 5 }),
      ],
    });
    assert.deepEqual(p.activity.projects.map((x) => x.name), ['coc-docs-platform']);
    assert.ok(!JSON.stringify(p.activity).includes(root), 'no local path leaves the machine');
  });

  it('outside a repository, files a subfolder under the folder the conversation started in', () => {
    const p = activityFor({
      'x/s1.jsonl': [
        prompt({ promptId: 'p1', t: at(0), cwd: scratch }),
        reply({ id: 'm1', requestId: 'r1', t: at(1), cwd: path.join(scratch, 'sub'), input: 5, output: 5 }),
      ],
    });
    assert.deepEqual(p.activity.projects.map((x) => x.name), ['scratch-notes']);
  });

  it('files a path that no longer exists under Other', () => {
    const p = activityFor({
      'x/s1.jsonl': [reply({ id: 'm1', requestId: 'r1', t: at(1), cwd: path.join(root, 'deleted'), input: 5, output: 5 })],
    });
    assert.deepEqual(p.activity.projects.map((x) => x.name), [OTHER_PROJECT]);
  });

  it('aggregates requests, sessions, duration and first/last use per project', () => {
    const p = activityFor({
      'x/docs.jsonl': [
        prompt({ promptId: 'd1', t: at(15), session: 'd', cwd: docs }),
        reply({ id: 'd1', requestId: 'rd1', t: at(42), session: 'd', cwd: docs, input: 1, output: 1 }),
        prompt({ promptId: 'd2', t: at(100), session: 'd', cwd: docs }),
        reply({ id: 'd2', requestId: 'rd2', t: at(120), session: 'd', cwd: docs, input: 1, output: 1 }),
      ],
      'x/harness.jsonl': [
        prompt({ promptId: 'h1', t: at(80), session: 'h', cwd: harness }),
        reply({ id: 'h1', requestId: 'rh1', t: at(90), session: 'h', cwd: harness, input: 1, output: 1 }),
      ],
    });
    const byName = Object.fromEntries(p.activity.projects.map((x) => [x.name, x]));
    assert.equal(byName['coc-docs-platform'].requestCount, 2);
    // 09:42 → 10:40 is 58 min apart in this project alone: two sessions of its own,
    // even though the merged day timeline (with ax-harness at 10:20) is one.
    assert.equal(byName['coc-docs-platform'].sessionCount, 2);
    assert.equal(byName['coc-docs-platform'].activeSeconds, (27 + 20) * 60);
    assert.equal(byName['coc-docs-platform'].firstAt, at(15));
    assert.equal(byName['coc-docs-platform'].lastAt, at(120));
    assert.equal(byName['coc-docs-platform'].conversationCount, 1);
    assert.equal(byName['ax-harness'].requestCount, 1);
    assert.equal(byName['ax-harness'].activeSeconds, 10 * 60);
    assert.equal(p.activity.sessionCount, 2); // 09:15–09:42, then 10:20–11:00
  });
});

describe('token usage by project', () => {
  it('splits the same deduped responses by project, summing exactly to the day', () => {
    const p = activityFor({
      'x/docs.jsonl': [
        prompt({ promptId: 'd1', t: at(0), session: 'd', cwd: docs }),
        // Streamed twice: the larger output wins, exactly as for the day totals.
        reply({ id: 'm1', requestId: 'r1', t: at(1), session: 'd', cwd: docs, input: 100, output: 10, cacheRead: 50 }),
        reply({ id: 'm1', requestId: 'r1', t: at(1), session: 'd', cwd: docs, input: 100, output: 400, cacheRead: 50 }),
        reply({ id: 'm2', requestId: 'r2', t: at(2), session: 'd', cwd: path.join(docs, 'backend'), input: 20, output: 30 }),
      ],
      'x/harness.jsonl': [
        prompt({ promptId: 'h1', t: at(5), session: 'h', cwd: harness }),
        reply({ id: 'm3', requestId: 'r3', t: at(6), session: 'h', cwd: harness, input: 7, output: 3 }),
      ],
    });
    const rows = p.activity.projects.map((x) => [x.name, x.input, x.output, x.cacheRead, x.apiCallCount]);
    assert.deepEqual(rows, [
      ['coc-docs-platform', 120, 430, 50, 2], // sorted by total tokens, largest first
      ['ax-harness', 7, 3, 0, 1],
    ]);
    const sum = (k) => p.activity.projects.reduce((n, x) => n + x[k], 0);
    assert.equal(sum('input'), p.input);
    assert.equal(sum('output'), p.output);
    assert.equal(sum('cacheRead'), p.cacheRead);
  });
});

describe('ledger', () => {
  const payload = (activity) => ({ date: DAY, input: 1, output: 1, cacheRead: 0, cacheCreation: 0, activity });
  const act = (requestCount, activeSeconds) => ({ requestCount, activeSeconds });

  it('re-sends a day first sent without activity, once', () => {
    const entry = { days: {} };
    recordSent(entry, payload(undefined));
    assert.equal(isDue(entry, payload(act(3, 60))), true);
    recordSent(entry, payload(act(3, 60)));
    assert.equal(isDue(entry, payload(act(3, 60))), false);
  });

  it('re-sends when requests or active time grew, even with unchanged tokens', () => {
    const entry = { days: {} };
    recordSent(entry, payload(act(3, 60)));
    assert.equal(isDue(entry, payload(act(4, 60))), true);
    assert.equal(isDue(entry, payload(act(3, 61))), true);
  });
});
