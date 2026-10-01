/**
 * Reads this machine's own Claude Code transcripts and turns them into the
 * per-day payloads POST /api/ingest accepts.
 *
 * Ported from `frontend/public/downloads/push-usage.mjs` (the copy teammates
 * actually download — newer than `tools/claude-usage-reporter/`'s). The
 * collection and payload rules are deliberately identical; `test/parity.test.js`
 * runs both against the same fixtures so the two cannot drift apart.
 *
 * // req: FR-USAGE-002, ADR-035, ADR-058, ADR-059
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ActivityCollector } from './activity.js';

// Must agree with the backend's own reporting zone (ClaudeUsageService.
// REPORT_ZONE, ADR-035) — otherwise a report made near midnight lands under
// the wrong calendar date on one side of the gap between the two zones.
export const REPORT_TZ = 'Asia/Phnom_Penh';

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: REPORT_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar date of an instant, as seen in the team's fixed reporting timezone. */
export function ymd(at) {
  return ymdFormatter.format(at);
}

/**
 * The last `count` reporting days, oldest first, ending today. Walks back in whole
 * days from now and formats each in the reporting timezone, so a DST or offset
 * change cannot drop or duplicate a date.
 */
export function lastDays(count, now = Date.now()) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(ymd(new Date(now - i * 86400000)));
  }
  return [...new Set(out)];
}

/**
 * Where Claude Code keeps its transcripts on this machine, most specific first.
 *
 * `CLAUDE_PROJECTS_DIR` is push-usage.mjs's own override and still wins outright.
 * Otherwise `CLAUDE_CONFIG_DIR` (Claude Code's own setting, comma-separated), else
 * both locations Claude Code has used by default — `~/.claude` and the XDG
 * `~/.config/claude`. Scanning both is safe: a response logged in each is still
 * one response, because deduplication is global across every file scanned.
 */
export function candidateProjectDirs(env = process.env, home = os.homedir()) {
  const override = String(env.CLAUDE_PROJECTS_DIR ?? '').trim();
  if (override) return [override];

  const configDirs = String(env.CLAUDE_CONFIG_DIR ?? '')
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
  if (configDirs.length) return configDirs.map((d) => path.join(d, 'projects'));

  const xdg = String(env.XDG_CONFIG_HOME ?? '').trim() || path.join(home, '.config');
  return [path.join(home, '.claude', 'projects'), path.join(xdg, 'claude', 'projects')];
}

/** The candidates that actually exist as directories. */
export function existingDirs(dirs) {
  return dirs.filter((dir) => {
    try {
      return fs.statSync(dir).isDirectory();
    } catch {
      return false;
    }
  });
}

function findTranscripts(dir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // unreadable directory - treated as "no usage"
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findTranscripts(full));
    else if (entry.isFile() && entry.name.endsWith('.jsonl')) out.push(full);
  }
  return out;
}

/**
 * A file not written to since before the oldest wanted day started cannot contain
 * that day's entries, so it can be skipped outright. mtime only moves forward as
 * Claude Code appends, which makes this safe rather than merely fast.
 */
function touchedRecently(file, cutoffMs) {
  try {
    return fs.statSync(file).mtimeMs >= cutoffMs;
  } catch {
    return false;
  }
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Sum the wanted days' tokens across this machine's transcripts.
 *
 * The critical detail: Claude Code writes ONE LINE PER CONTENT BLOCK, and every line
 * of the same assistant response repeats that response's full usage object. Summing
 * every line double-counts badly - measured 2.36x against a real transcript set. So
 * dedupe on message.id + requestId, one charge per API response, the way ccusage does.
 *
 * Which line of a response counts matters too: a response streamed across several
 * content blocks can log an early line with a partial output_tokens before the final
 * one, so each response keeps the largest value seen per category (ADR-058).
 */
export function collectDays(projectsDirs, dates, { activity = new ActivityCollector() } = {}) {
  const wanted = new Set(dates);
  const cutoffMs = Date.parse(`${dates[0]}T00:00:00Z`) - 36 * 3600 * 1000;
  const allFiles = projectsDirs.flatMap((dir) => findTranscripts(dir));
  const files = allFiles.filter((file) => touchedRecently(file, cutoffMs));

  // One entry per API response (message.id|requestId), merged across all its
  // lines before anything is summed. Global rather than per-day or per-file: the
  // same response logged again in a subagent transcript is still one response.
  // Lines with neither id can't be matched to each other and each count once.
  const responses = new Map();
  const unkeyed = [];
  const days = new Map();
  const bucketFor = (date) => {
    if (!days.has(date)) {
      days.set(date, {
        totals: { input: 0, output: 0, cache_read: 0, cache_creation: 0, cache_creation_1h: 0 },
        byModel: {},
        counted: 0,
      });
    }
    return days.get(date);
  };
  let counted = 0;
  let skipped = 0;
  let duplicates = 0;
  let lines = 0;

  for (const file of files) {
    let contents;
    try {
      contents = fs.readFileSync(file, 'utf8');
    } catch {
      skipped++; // a session being written right now, or a permissions hiccup
      continue;
    }

    for (const line of contents.split('\n')) {
      if (!line.trim()) continue;

      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        skipped++; // half-flushed final line - never fatal
        continue;
      }

      if (!entry?.timestamp || !Number.isFinite(Date.parse(entry.timestamp))) continue;
      const day = ymd(new Date(entry.timestamp));
      if (!wanted.has(day)) continue;
      // Every line of the day is activity (ADR-074); only usage lines go on to
      // the token sums below, exactly as before.
      const project = activity.observe(entry, day);

      const usage = entry.message?.usage;
      if (!usage || typeof usage !== 'object') continue;
      lines++;

      const model = String(entry.message?.model ?? 'unknown');
      const add = {
        input: num(usage.input_tokens),
        output: num(usage.output_tokens),
        cache_read: num(usage.cache_read_input_tokens),
        cache_creation: num(usage.cache_creation_input_tokens),
        // The 1-hour-TTL part of cache_creation (priced at 2x input, ADR-058).
        // Already inside cache_creation, never added on top of it.
        cache_creation_1h: num(usage.cache_creation?.ephemeral_1h_input_tokens),
      };

      const key = `${entry.message?.id ?? ''}|${entry.requestId ?? ''}`;
      const at = { day, model, add, project: project ?? activity.projectOf(entry) };
      if (key === '|') {
        unkeyed.push(at);
        continue;
      }
      const prior = responses.get(key);
      if (!prior) {
        responses.set(key, at);
      } else {
        duplicates++;
        for (const k of Object.keys(add)) prior.add[k] = Math.max(prior.add[k], add[k]);
      }
    }
  }

  // day -> project -> tokens and API calls: the same responses, filed by the
  // project of the line that first carried them, so a day's projects always
  // sum to its totals.
  const projectTokens = new Map();
  for (const { day, model, add, project } of [...responses.values(), ...unkeyed]) {
    if (!projectTokens.has(day)) projectTokens.set(day, new Map());
    const byProject = projectTokens.get(day);
    const p = byProject.get(project) ?? { input: 0, output: 0, cache_read: 0, cache_creation: 0, calls: 0 };
    p.input += add.input;
    p.output += add.output;
    p.cache_read += add.cache_read;
    p.cache_creation += add.cache_creation;
    p.calls++;
    byProject.set(project, p);

    const slot = bucketFor(day);
    const bucket = (slot.byModel[model] ??= {
      input: 0,
      output: 0,
      cache_read: 0,
      cache_creation: 0,
      cache_creation_1h: 0,
    });
    for (const k of Object.keys(add)) {
      slot.totals[k] += add[k];
      bucket[k] += add[k];
    }
    slot.counted++;
    counted++;
  }

  for (const [day, detail] of activity.build(projectTokens)) {
    if (days.has(day)) days.get(day).activity = detail;
  }

  return { days, counted, skipped, duplicates, lines, files: files.length, totalFiles: allFiles.length };
}

/**
 * One ingest payload per day that has usage, oldest first. Field names match
 * ClaudeUsageIngestRequest / ClaudeUsageModelTokensRequest (ApiDtos.java) exactly.
 */
export function buildPayloads(days, dates, identity) {
  return dates
    .map((date) => {
      const slot = days.get(date);
      if (!slot) return null; // nothing was logged that day
      const { totals, byModel, counted, activity } = slot;
      const total = Math.round(totals.input + totals.output);
      if (total <= 0) return null;

      // Only models that actually consumed tokens — drops Claude Code's
      // all-zero <synthetic> pseudo-model from both byModel and models.
      const activeModels = Object.entries(byModel).filter(
        ([, t]) => t.input + t.output + t.cache_read + t.cache_creation > 0,
      );

      const byModelPayload = Object.fromEntries(
        activeModels.map(([model, t]) => [
          model,
          {
            input: Math.round(t.input),
            output: Math.round(t.output),
            cacheRead: Math.round(t.cache_read),
            cacheCreation: Math.round(t.cache_creation),
            cacheCreation1h: Math.round(Math.min(t.cache_creation_1h, t.cache_creation)),
          },
        ]),
      );

      const models = activeModels.map(([model]) => model).sort();

      return {
        payload: {
          email: identity.email,
          displayName: identity.displayName,
          date,
          input: Math.round(totals.input),
          output: Math.round(totals.output),
          cacheRead: Math.round(totals.cache_read),
          cacheCreation: Math.round(totals.cache_creation),
          models,
          byModel: byModelPayload,
          // Requests, sessions, active time and projects (ADR-074). Optional on
          // the wire: a backend or reporter that predates it simply omits it.
          ...(activity ? { activity } : {}),
        },
        total,
        counted,
      };
    })
    .filter(Boolean);
}
