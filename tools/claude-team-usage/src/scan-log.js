/**
 * One scan-log record per `scan` (ADR-099): which steps ran, how each ended,
 * and the counts an admin needs to troubleshoot a teammate's reporter from the
 * Coc Docs "View Logs" page without asking for their scheduled-scan.log.
 *
 * The record goes to `POST /api/ingest/scan-log` at the end of the scan. A
 * scan that failed BECAUSE the server was unreachable cannot report that at
 * the time, so every record is first written to a small local outbox and the
 * outbox is sent oldest-first; whatever cannot be delivered now is delivered
 * by the next scan that reaches the server. The overall Success / Warning /
 * Failed status is derived by the backend from the steps, never sent.
 *
 * Holds counts, step names and redacted messages only — never the token, a
 * transcript line, or a prompt.
 *
 * // req: FR-USAGE-002, ADR-099
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { configDir } from './config.js';
import { send } from './upload.js';

/** The fixed step catalogue, in order. The backend accepts exactly these keys. */
export const STEPS = [
  'start',
  'find-transcripts',
  'parse-usage',
  'deduplicate',
  'calculate-usage',
  'check-new-usage',
  'upload',
  'complete',
];

const PENDING_FILE = 'scan-logs-pending.json';
/** A machine offline for weeks keeps its newest records, not an ever-growing file. */
export const MAX_PENDING = 50;
const MAX_DETAIL = 300;
const MAX_ERROR = 500;

/**
 * Strips what must never leave the machine inside an error text: a `coc_`
 * token, an Authorization value, and the user's home directory (replaced by
 * `~`, so a path still says where without saying whose machine).
 */
export function redact(text, home = os.homedir()) {
  let out = String(text ?? '');
  out = out.replace(/coc_[A-Za-z0-9_-]+/g, 'coc_***');
  out = out.replace(/Bearer\s+\S+/gi, 'Bearer ***');
  if (home) out = out.split(home).join('~');
  return out;
}

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export class ScanRecorder {
  constructor({ cliVersion = null, scheduled = false, clock = () => new Date() } = {}) {
    this.clock = clock;
    this.scanId = crypto.randomUUID();
    this.startedAt = clock();
    this.trigger = scheduled ? 'scheduled' : 'manual';
    this.cliVersion = cliVersion;
    this.steps = new Map();
    this.counts = { transcriptFiles: null, responses: null, duplicates: null, newTokens: null, daysUploaded: null };
    this.uploadStatus = 'not-attempted';
    this.error = null;
  }

  /** `status`: success | warning | failed. A step recorded twice keeps the later result. */
  step(key, status, detail = '') {
    if (!STEPS.includes(key)) throw new Error(`unknown scan step: ${key}`);
    this.steps.set(key, { key, status, at: this.clock().toISOString(), detail: clip(redact(detail), MAX_DETAIL) });
  }

  /** The step that was running when `error` was thrown. Steps after it are reported as not run. */
  fail(key, error) {
    const message = clip(redact(error?.message ?? error), MAX_ERROR);
    this.step(key, 'failed', message);
    this.error = { step: key, message };
  }

  setCounts(counts) {
    Object.assign(this.counts, counts);
  }

  /** The wire record. Steps never reached are `skipped`, so the timeline still lists all of them. */
  toRecord(email) {
    const finishedAt = this.clock();
    if (!this.error && !this.steps.has('complete')) {
      const seconds = Math.max(0, (finishedAt - this.startedAt) / 1000);
      this.step('complete', 'success', `Scan completed in ${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`);
    }
    return {
      scanId: this.scanId,
      email,
      trigger: this.trigger,
      cliVersion: this.cliVersion,
      startedAt: this.startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      ...this.counts,
      uploadStatus: this.uploadStatus,
      steps: STEPS.map((key) => this.steps.get(key) ?? { key, status: 'skipped', at: null, detail: '' }),
      errorStep: this.error?.step ?? null,
      errorMessage: this.error?.message ?? null,
    };
  }
}

/** `POST /api/ingest/scan-log` — the scan-log sibling of the ingest URL the login saved. */
export const scanLogUrl = (ingestUrl) => `${String(ingestUrl).replace(/\/+$/, '')}/scan-log`;

export function pendingPath(env = process.env) {
  return path.join(configDir(env), PENDING_FILE);
}

export function loadPending(env = process.env) {
  try {
    const parsed = JSON.parse(fs.readFileSync(pendingPath(env), 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePending(records, env = process.env) {
  const file = pendingPath(env);
  if (records.length === 0) {
    fs.rmSync(file, { force: true });
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(records.slice(-MAX_PENDING), null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, file);
}

/**
 * Queues `record` (when given) and sends every queued record for this account,
 * oldest first. Stops at the first transient failure (network, timeout, 5xx)
 * and keeps the rest for the next scan. A definite refusal (400, or 404 from a
 * server older than ADR-099) drops that record — resending it cannot succeed —
 * except 401/403, which a fresh `login` fixes, so those are kept.
 *
 * Never throws and never changes the scan's own result: the log is about the
 * scan, not part of it.
 */
export async function deliverScanLogs({ creds, record, io, fetchImpl, verbose = false, env = process.env }) {
  let queue;
  try {
    queue = loadPending(env);
    if (record) {
      queue.push(record);
      savePending(queue, env);
      queue = queue.slice(-MAX_PENDING);
    }
  } catch (error) {
    if (verbose) io.err(`[debug] scan log: could not write the local queue: ${error.message}`);
    queue = record ? [record] : [];
  }

  const keep = [];
  let stopped = false;
  let sent = 0;
  for (const entry of queue) {
    // Another account's records (a different login on this machine) wait for that login.
    if (stopped || String(entry.email).toLowerCase() !== String(creds.email).toLowerCase()) {
      keep.push(entry);
      continue;
    }
    try {
      await send(scanLogUrl(creds.ingestUrl), creds.token, entry, {
        bypassToken: String(env.VERCEL_AUTOMATION_BYPASS_SECRET ?? '').trim() || undefined,
        fetchImpl,
        retry: false,
      });
      sent++;
    } catch (error) {
      if (error?.transient) {
        stopped = true;
        keep.push(entry);
      } else if (error?.status === 401 || error?.status === 403) {
        keep.push(entry);
      } else if (verbose) {
        io.err(`[debug] scan log ${entry.scanId} not accepted: ${error.message}`);
      }
    }
  }

  try {
    savePending(keep, env);
  } catch {
    // The queue file is a convenience; failing to rewrite it at worst resends, which the backend ignores.
  }
  if (sent) io.info(`  scan log sent${sent > 1 ? ` (${sent} record(s), including earlier scans)` : ''}`);
  if (stopped) io.info(`  scan log queued — it will be sent with the next scan (${keep.length} waiting)`);
  return { sent, pending: keep.length };
}
