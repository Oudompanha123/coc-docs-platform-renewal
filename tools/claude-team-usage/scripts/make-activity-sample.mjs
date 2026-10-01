#!/usr/bin/env node
/**
 * Writes sample Claude Code transcripts for trying the activity detail
 * (requests, sessions, active time, projects — ADR-074) against a LOCAL
 * Coc Docs without using real usage. Point the CLI at the folder with
 * CLAUDE_PROJECTS_DIR. Not part of the published package.
 *
 *   node scripts/make-activity-sample.mjs <dir>         write two sample days (yesterday and today)
 *   node scripts/make-activity-sample.mjs <dir> clean   delete the sample folder
 *
 * The timings are chosen so every figure can be checked by hand; the
 * expected results are printed after writing. Two fake git repositories
 * (`sample-docs`, `sample-harness`) are created inside <dir> so project
 * detection has something real to find.
 *
 * // req: FR-USAGE-001, ADR-074
 */

import fs from 'node:fs';
import path from 'node:path';

const [dir, step] = process.argv.slice(2);
if (!dir || (step && step !== 'clean')) {
  console.error('usage: node make-activity-sample.mjs <dir> [clean]');
  process.exit(2);
}
const root = path.resolve(dir);

if (step === 'clean') {
  fs.rmSync(root, { recursive: true, force: true });
  console.log(`removed ${root}`);
  process.exit(0);
}

fs.rmSync(root, { recursive: true, force: true });
const docs = path.join(root, 'work', 'sample-docs');
const harness = path.join(root, 'work', 'sample-harness');
for (const repo of [docs, harness]) fs.mkdirSync(path.join(repo, '.git'), { recursive: true });
fs.mkdirSync(path.join(docs, 'backend'), { recursive: true });

const ymd = (d) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Phnom_Penh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const today = ymd(new Date());
const yesterday = ymd(new Date(Date.now() - 86400000));
/** HH:MM in Asia/Phnom_Penh (UTC+7) on `date`, as an ISO UTC instant. */
const at = (date, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(Date.parse(`${date}T00:00:00Z`) + ((h - 7) * 60 + m) * 60000).toISOString();
};

let n = 0;
const base = (session, cwd, ts) => ({ uuid: `sample-${++n}`, sessionId: session, cwd, timestamp: ts });
const prompt = (session, cwd, ts, promptId, extra = {}) =>
  JSON.stringify({
    ...base(session, cwd, ts),
    type: 'user',
    promptId,
    origin: { kind: 'human' },
    message: { role: 'user', content: 'sample prompt' },
    ...extra,
  });
const toolResult = (session, cwd, ts, promptId) =>
  JSON.stringify({
    ...base(session, cwd, ts),
    type: 'user',
    promptId,
    message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: 'ok' }] },
  });
const reply = (session, cwd, ts, id, input, output) =>
  JSON.stringify({
    ...base(session, cwd, ts),
    type: 'assistant',
    requestId: `req-sample-${id}`,
    message: {
      id: `msg-sample-${id}`,
      model: 'claude-opus-5-5',
      usage: { input_tokens: input, output_tokens: output, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    },
  });

const transcripts = path.join(root, 'projects', 'sample');
fs.mkdirSync(transcripts, { recursive: true });
const write = (name, lines) => fs.writeFileSync(path.join(transcripts, name), lines.join('\n') + '\n');

const Y = yesterday;
write('c1.jsonl', [
  prompt('c1', docs, at(Y, '09:15'), 'p1'),
  reply('c1', docs, at(Y, '09:16'), 'a1', 100, 400), // streamed: partial line first...
  reply('c1', docs, at(Y, '09:16'), 'a1', 100, 1000), // ...the final line wins, counted once
  toolResult('c1', docs, at(Y, '09:20'), 'p1'), // same turn: not a new request
  reply('c1', docs, at(Y, '09:42'), 'a2', 50, 500),
  prompt('c1', path.join(docs, 'backend'), at(Y, '13:20'), 'p3'), // subfolder: still sample-docs
  reply('c1', path.join(docs, 'backend'), at(Y, '13:30'), 'a4', 10, 100),
  prompt('c1', docs, at(Y, '13:50'), 'p4'),
  reply('c1', docs, at(Y, '14:05'), 'a5', 10, 200),
  prompt('c1', docs, at(Y, '13:51'), 'p-subagent', { isSidechain: true }), // subagent: not a request
]);
write('c2.jsonl', [
  prompt('c2', harness, at(Y, '10:05'), 'p2'), // 23 min after 09:42: same session
  reply('c2', harness, at(Y, '10:31'), 'a3', 20, 300),
]);
write('c3.jsonl', [prompt('c3', docs, at(today, '08:00'), 'p5'), reply('c3', docs, at(today, '08:05'), 'a6', 5, 50)]);

console.log(`wrote sample transcripts to ${path.join(root, 'projects')}

Expected (times are Asia/Phnom_Penh):

  ${yesterday}   tokens: input 190, output 2,100 (total 2,290)
    4 requests · 5 API calls · 2 conversations · 2 sessions · 2h 1m active
    sessions   09:15 – 10:31  1h 16m  sample-docs, sample-harness  2 requests
               13:20 – 14:05     45m  sample-docs                  2 requests
    projects   sample-docs     3 requests · 1,970 tokens (170 in / 1,800 out) · 1h 12m · 09:15 – 14:05
               sample-harness  1 request  ·   320 tokens (20 in / 300 out)    ·    26m · 10:05 – 10:31

  ${today}   tokens: input 5, output 50 (total 55)
    1 request · 1 API call · 1 conversation · 1 session · 5m active
    projects   sample-docs     1 request  ·    55 tokens · 5m · 08:00 – 08:05
`);
