import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CLI = fileURLToPath(new URL('../bin/cli.js', import.meta.url));

/** Env stripped of anything that could leak a real login or real transcripts into a test. */
export function cleanEnv(extra = {}) {
  const env = { ...process.env };
  for (const key of [
    'USER_EMAIL',
    'USER_NAME',
    'INGEST_URL',
    'INGEST_SECRET',
    'CLAUDE_PROJECTS_DIR',
    'CLAUDE_CONFIG_DIR',
    'CLAUDE_TEAM_USAGE_CONFIG_DIR',
    'CLAUDE_TEAM_USAGE_BROWSER',
    'COC_DOCS_URL',
    'VERCEL_AUTOMATION_BYPASS_SECRET',
  ]) {
    delete env[key];
  }
  return { ...env, CLAUDE_TEAM_USAGE_BROWSER: 'none', ...extra };
}

export function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Runs the CLI as a real child process; resolves { code, stdout, stderr }. */
export function runCli(args, { env, stdin = '' } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`CLI timed out. stderr so far:\n${stderr}`));
    }, 30_000);
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.stdin.end(stdin);
  });
}

/**
 * Like runCli, but resolves `waitFor(regex)` as soon as stderr matches — for
 * acting on the authorize URL while the CLI is still waiting on the browser.
 */
export function startCli(args, { env } = {}) {
  const child = spawn(process.execPath, [CLI, ...args], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  const waiters = [];
  child.stdout.on('data', (d) => (stdout += d));
  child.stderr.on('data', (d) => {
    stderr += d;
    for (const w of waiters.splice(0)) (w.re.test(stderr) ? w.resolve(stderr.match(w.re)) : waiters.push(w));
  });
  const done = new Promise((resolve) => child.on('close', (code) => resolve({ code, stdout, stderr })));
  const timer = setTimeout(() => child.kill(), 30_000);
  done.then(() => clearTimeout(timer));
  return {
    done,
    kill: () => child.kill(),
    waitFor: (re) =>
      re.test(stderr) ? Promise.resolve(stderr.match(re)) : new Promise((resolve) => waiters.push({ re, resolve })),
  };
}

/**
 * A stand-in for POST /api/ingest. `respond(req, body)` returns { status, body };
 * every request is recorded in `requests`.
 */
export async function fakeBackend(respond) {
  const requests = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : null;
      requests.push({ method: req.method, url: req.url, headers: req.headers, body });
      const out = respond(req, body, requests.length) ?? { status: 404, body: {} };
      res.writeHead(out.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out.body ?? {}));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    url: `http://127.0.0.1:${port}/api/ingest`,
    requests,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** Writes a saved login directly, the way a completed browser sign-in would. */
export function saveLogin(configHome, fields = {}) {
  fs.mkdirSync(configHome, { recursive: true });
  fs.writeFileSync(
    path.join(configHome, 'credentials.json'),
    JSON.stringify({ email: 'dana@example.com', displayName: 'Dana', token: TOKEN, ingestUrl: 'http://127.0.0.1:9/api/ingest', ...fields }),
  );
}

export const TOKEN = 'coc_' + 'a'.repeat(64);
export const CODE = 'k'.repeat(43);

/**
 * Plays the /cli/authorize page: reads the URL the CLI printed, then sends the
 * browser back to the CLI's loopback listener. `override` swaps any query value
 * (e.g. a wrong state) to exercise the listener's checks.
 */
export async function actAsBrowser(authorizeUrl, { api, override = {}, cancel = false } = {}) {
  const u = new URL(authorizeUrl);
  const cb = new URL(`http://127.0.0.1:${u.searchParams.get('port')}/callback`);
  if (cancel) cb.searchParams.set('error', 'access_denied');
  else {
    cb.searchParams.set('code', CODE);
    cb.searchParams.set('api', api);
  }
  cb.searchParams.set('state', u.searchParams.get('state'));
  for (const [k, v] of Object.entries(override)) cb.searchParams.set(k, v);
  const res = await fetch(cb);
  return { status: res.status, body: await res.text() };
}

/** sha256 → base64url, the S256 transform the backend applies to a verifier. */
export function s256(verifier) {
  return crypto.createHash('sha256').update(verifier, 'ascii').digest('base64url');
}

/** One Claude Code transcript line carrying a usage object, timestamped now. */
export function usageLine(opts) {
  const cache5m = opts.cache5m ?? 0;
  const cache1h = opts.cache1h ?? 0;
  return JSON.stringify({
    type: 'assistant',
    timestamp: opts.timestamp ?? new Date().toISOString(),
    requestId: opts.requestId,
    message: {
      id: opts.id,
      model: opts.model,
      stop_reason: opts.stop ?? null,
      usage: {
        input_tokens: opts.input,
        output_tokens: opts.output,
        cache_read_input_tokens: opts.cacheRead ?? 0,
        cache_creation_input_tokens: cache5m + cache1h,
        cache_creation: { ephemeral_5m_input_tokens: cache5m, ephemeral_1h_input_tokens: cache1h },
      },
    },
  });
}

export function writeTranscript(projectsDir, rel, lines) {
  const file = path.join(projectsDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

/** The JSON array --dry-run prints on stdout. */
export function dryRunPayloads(stdout) {
  return JSON.parse(stdout.slice(stdout.indexOf('['), stdout.lastIndexOf(']') + 1));
}
