// req: FR-USAGE-002, ADR-058, ADR-059
//
// The npm CLI and the downloadable push-usage.mjs must produce byte-identical
// payloads from the same transcripts — otherwise the dashboard would show a
// different total depending on which reporter a teammate happens to use.
// Runs only inside this repository (the script is not shipped in the package).
//
// One deliberate exception: `activity` (requests, sessions, projects — ADR-074)
// is reported by the CLI only, so it is set aside before comparing. Every token
// field must still match byte for byte.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { after, it } from 'node:test';
import { cleanEnv, CLI, dryRunPayloads, tmpDir, usageLine, writeTranscript } from './helpers.js';

const PUSH_USAGE = fileURLToPath(new URL('../../../frontend/public/downloads/push-usage.mjs', import.meta.url));

const projects = tmpDir('ctu-parity-');
after(() => fs.rmSync(projects, { recursive: true, force: true }));

it('matches push-usage.mjs --dry-run exactly', { skip: !fs.existsSync(PUSH_USAGE) && 'push-usage.mjs not present' }, () => {
  const now = Date.now();
  const at = (minsAgo) => new Date(now - minsAgo * 60_000).toISOString();
  writeTranscript(projects, 'a/one.jsonl', [
    usageLine({ id: 'm1', requestId: 'r1', model: 'claude-opus-5-5', input: 4, output: 10, cacheRead: 700, cache5m: 3, cache1h: 90, timestamp: at(30) }),
    usageLine({ id: 'm1', requestId: 'r1', model: 'claude-opus-5-5', input: 4, output: 450, cacheRead: 700, cache5m: 3, cache1h: 90, timestamp: at(30) }),
    usageLine({ id: 'm2', requestId: 'r2', model: 'claude-haiku-4-5-20251001', input: 20, output: 80, timestamp: at(10) }),
    usageLine({ model: 'claude-sonnet-5', input: 1, output: 2, timestamp: at(5) }), // no ids: counted as-is
    usageLine({ model: 'claude-sonnet-5', input: 1, output: 2, timestamp: at(5) }),
  ]);
  writeTranscript(projects, 'b/nested/two.jsonl', [
    usageLine({ id: 'm2', requestId: 'r2', model: 'claude-haiku-4-5-20251001', input: 20, output: 80, timestamp: at(10) }),
    usageLine({ id: 'm3', requestId: 'r3', model: '<synthetic>', input: 0, output: 0, timestamp: at(1) }),
  ]);

  const env = cleanEnv({ CLAUDE_PROJECTS_DIR: projects, USER_EMAIL: 'dana@example.com', USER_NAME: 'Dana' });
  const opts = { env, encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] };

  const legacy = dryRunPayloads(execFileSync(process.execPath, [PUSH_USAGE, '--dry-run', '--days', '2'], opts));
  // USER_EMAIL alone is not a login for the CLI; give it the full env trio.
  const cliEnv = { ...env, INGEST_URL: 'http://127.0.0.1:9/api/ingest', INGEST_SECRET: 'coc_x' };
  const cli = dryRunPayloads(execFileSync(process.execPath, [CLI, 'scan', '--dry-run', '--days', '2'], { ...opts, env: cliEnv }))
    .map(({ activity, ...tokens }) => {
      assert.ok(activity, 'the CLI reports activity');
      return tokens;
    });

  assert.ok(legacy.length >= 1);
  assert.deepEqual(cli, legacy);
});
