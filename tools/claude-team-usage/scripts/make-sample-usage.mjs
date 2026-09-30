#!/usr/bin/env node
/**
 * Writes sample Claude Code transcripts for trying `claude-team-usage scan`
 * against a LOCAL Coc Docs without using real usage. Point the CLI at the
 * folder with CLAUDE_PROJECTS_DIR. Not part of the published package.
 *
 *   node scripts/make-sample-usage.mjs <dir> before   100K output, yesterday ("before the reset")
 *   node scripts/make-sample-usage.mjs <dir> after    +50K output, now ("after the reset")
 *   node scripts/make-sample-usage.mjs <dir> clean    delete the sample folder
 *
 * Each response is written on two lines with the same message.id + requestId,
 * the way Claude Code logs it, so the dashboard should show 100K, not 200K.
 *
 * // req: FR-USAGE-002
 */

import fs from 'node:fs';
import path from 'node:path';

const [dir, step] = process.argv.slice(2);
if (!dir || !['before', 'after', 'clean'].includes(step)) {
  console.error('usage: node make-sample-usage.mjs <dir> before|after|clean');
  process.exit(2);
}

if (step === 'clean') {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`removed ${dir}`);
  process.exit(0);
}

const line = (id, output, at) =>
  JSON.stringify({
    type: 'assistant',
    timestamp: at.toISOString(),
    requestId: `req_${id}`,
    message: { id: `msg_${id}`, model: 'claude-sonnet-5', usage: { input_tokens: 0, output_tokens: output } },
  });

const file = path.join(dir, 'sample-project', 'session.jsonl');
fs.mkdirSync(path.dirname(file), { recursive: true });

if (step === 'before') {
  const yesterday = new Date(Date.now() - 30 * 3600_000);
  fs.writeFileSync(file, `${line('before', 100_000, yesterday)}\n${line('before', 100_000, yesterday)}\n`);
  console.log(`wrote 100,000 output tokens at ${yesterday.toISOString()} to ${file}`);
} else {
  const now = new Date();
  fs.appendFileSync(file, `${line(`after_${now.getTime()}`, 50_000, now)}\n`);
  console.log(`appended 50,000 output tokens at ${now.toISOString()} to ${file}`);
}
