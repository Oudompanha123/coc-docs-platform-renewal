/**
 * What this machine has already reported, so a plain `scan` can find every
 * day with unreported usage — not only today — without re-sending days that
 * have not changed.
 *
 * `/api/ingest` upserts a day's WHOLE total (ClaudeUsageDailyRepository.upsert),
 * so the unit of "reported" is a day and its totals, not individual responses:
 * a day is due when it was never sent, or its local total has grown since.
 * A smaller local total is never sent — transcripts only grow, so a shrink
 * means Claude Code's own cleanup deleted old files, and sending it would
 * lower a correct figure on the dashboard.
 *
 * Holds token counts and dates only — no token, no transcript content.
 * Keyed by account (email + ingest URL), so signing in to another deployment
 * starts fresh rather than suppressing its first reports.
 *
 * // req: FR-USAGE-002, ADR-035, ADR-060
 */

import fs from 'node:fs';
import path from 'node:path';
import { configDir } from './config.js';

const LEDGER_FILE = 'reported.json';

export function ledgerPath(env = process.env) {
  return path.join(configDir(env), LEDGER_FILE);
}

export function accountKey(creds) {
  return `${String(creds.email).toLowerCase()}|${creds.ingestUrl}`;
}

/** The whole file; a missing or unreadable one is an empty ledger (the worst case is re-sending, which upserts). */
export function loadLedger(env = process.env) {
  try {
    const parsed = JSON.parse(fs.readFileSync(ledgerPath(env), 'utf8'));
    if (parsed && typeof parsed === 'object' && parsed.accounts && typeof parsed.accounts === 'object') return parsed;
  } catch {
    // fall through
  }
  return { version: 1, accounts: {} };
}

export function accountEntry(ledger, creds) {
  const key = accountKey(creds);
  const entry = (ledger.accounts[key] ??= { days: {}, lastCompleteScan: null });
  entry.days ??= {};
  return entry;
}

/** Written to a temp file and renamed, so an interrupted write never leaves half a file. */
export function saveLedger(ledger, env = process.env) {
  const file = ledgerPath(env);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, file);
}

const sum = (t) => (t.input ?? 0) + (t.output ?? 0) + (t.cacheRead ?? 0) + (t.cacheCreation ?? 0);

const activityOf = (a) => (a ? { requests: a.requestCount, activeSeconds: a.activeSeconds } : null);

/**
 * Never sent, or grown since it was. Activity counts as growth too (ADR-074):
 * a new prompt or more active time is worth re-sending, and so is a day first
 * sent by a reporter that predated activity, so an upgrade fills it in once.
 */
export function isDue(entry, payload) {
  const prior = entry.days[payload.date];
  if (!prior || sum(payload) > sum(prior)) return true;
  const now = activityOf(payload.activity);
  if (!now) return false;
  const was = prior.activity;
  return !was || now.requests > was.requests || now.activeSeconds > was.activeSeconds;
}

export function recordSent(entry, payload) {
  const { input, output, cacheRead, cacheCreation } = payload;
  const activity = activityOf(payload.activity);
  entry.days[payload.date] = { input, output, cacheRead, cacheCreation, ...(activity ? { activity } : {}) };
}

/** Drops days older than `oldest` (YYYY-MM-DD) — they can no longer be scanned anyway. */
export function prune(entry, oldest) {
  for (const date of Object.keys(entry.days)) if (date < oldest) delete entry.days[date];
}
