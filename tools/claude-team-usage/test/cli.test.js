// req: FR-USAGE-002, ADR-058, ADR-059, ADR-060
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  actAsBrowser,
  cleanEnv,
  CODE,
  dryRunPayloads,
  fakeBackend,
  runCli,
  s256,
  saveLogin,
  startCli,
  TOKEN,
  tmpDir,
  usageLine,
  writeTranscript,
} from './helpers.js';

let projects;
let configHome;
let backend;

beforeEach(() => {
  projects = tmpDir('ctu-projects-');
  configHome = tmpDir('ctu-config-');
});

afterEach(async () => {
  await backend?.close();
  backend = undefined;
  fs.rmSync(projects, { recursive: true, force: true });
  fs.rmSync(configHome, { recursive: true, force: true });
});

const env = (extra = {}) => cleanEnv({ CLAUDE_PROJECTS_DIR: projects, CLAUDE_TEAM_USAGE_CONFIG_DIR: configHome, ...extra });

const AUTHORIZE_URL = /visit this address on this computer:\r?\n\s+(\S+)/;

/**
 * A stand-in Coc Docs: /api/cli/token checks the PKCE verifier against the
 * challenge the CLI put in the authorize URL (captured by the test), the way
 * ClaudeUsageCliAuthService#exchange does.
 */
async function cocDocs({ exchange } = {}) {
  const state = { challenge: null };
  const server = await fakeBackend((req, body) => {
    if (req.url !== '/api/cli/token') return null;
    if (exchange) return exchange(body);
    const ok = body.code === CODE && s256(body.codeVerifier) === state.challenge;
    return ok
      ? { status: 200, body: { token: TOKEN, email: 'dana@example.com', displayName: 'Dana', ingestUrl: `${server.origin}/api/ingest` } }
      : { status: 400, body: { detail: 'invalid_grant' } };
  });
  server.state = state;
  return server;
}

function oneResponse() {
  writeTranscript(projects, 'proj/session.jsonl', [
    usageLine({ id: 'msg_1', requestId: 'req_1', model: 'claude-sonnet-5', input: 10, output: 200, cacheRead: 5_000, cache1h: 300 }),
  ]);
}

describe('login (browser, ADR-060)', () => {
  it('signs in through the browser and saves the personal token, never printing it', async () => {
    backend = await cocDocs();
    const cli = startCli(['login'], { env: env({ COC_DOCS_URL: backend.origin }) });

    const [, authorizeUrl] = await cli.waitFor(AUTHORIZE_URL);
    const u = new URL(authorizeUrl);
    assert.equal(u.origin + u.pathname, `${backend.origin}/cli/authorize`);
    assert.match(u.searchParams.get('state'), /^[A-Za-z0-9_-]{43}$/);
    assert.match(u.searchParams.get('code_challenge'), /^[A-Za-z0-9_-]{43}$/);
    assert.ok(Number(u.searchParams.get('port')) >= 1024);
    backend.state.challenge = u.searchParams.get('code_challenge');

    const page = await actAsBrowser(authorizeUrl, { api: backend.origin });
    assert.equal(page.status, 200);
    assert.match(page.body, /Authorization successful/);
    // Returns the tab to Coc Docs' /cli/signed-in, which picks the dashboard by
    // role — and never echoes the one-time code or state back into the page.
    assert.ok(page.body.includes(`${backend.origin}/cli/signed-in`));
    assert.ok(!page.body.includes(CODE));
    assert.ok(!page.body.includes(u.searchParams.get('state')));

    const res = await cli.done;
    assert.equal(res.code, 0, res.stderr);
    assert.match(res.stderr, /signed in as Dana <dana@example\.com>/);
    const saved = JSON.parse(fs.readFileSync(path.join(configHome, 'credentials.json'), 'utf8'));
    assert.equal(saved.token, TOKEN);
    assert.equal(saved.ingestUrl, `${backend.origin}/api/ingest`);
    assert.equal(saved.dashboardUrl, `${backend.origin}/my-claude-usage`);
    // Neither the token nor the one-time code is ever shown.
    assert.doesNotMatch(res.stdout + res.stderr, /coc_a{8}/);
    assert.ok(!(res.stdout + res.stderr).includes(CODE));
    if (process.platform !== 'win32') {
      assert.equal(fs.statSync(path.join(configHome, 'credentials.json')).mode & 0o777, 0o600);
    }
  });

  it('ignores a callback that does not carry its own state, and keeps waiting for the real one', async () => {
    backend = await cocDocs();
    const cli = startCli(['login'], { env: env({ COC_DOCS_URL: backend.origin }) });
    const [, authorizeUrl] = await cli.waitFor(AUTHORIZE_URL);
    backend.state.challenge = new URL(authorizeUrl).searchParams.get('code_challenge');

    const forged = await actAsBrowser(authorizeUrl, { api: backend.origin, override: { state: 'x'.repeat(43) } });
    assert.equal(forged.status, 400);
    assert.equal(backend.requests.length, 0);

    await actAsBrowser(authorizeUrl, { api: backend.origin });
    const res = await cli.done;
    assert.equal(res.code, 0, res.stderr);
  });

  it('refuses a callback pointing the exchange at a remote plain-http host', async () => {
    backend = await cocDocs();
    const cli = startCli(['login'], { env: env({ COC_DOCS_URL: backend.origin }) });
    const [, authorizeUrl] = await cli.waitFor(AUTHORIZE_URL);

    const bad = await actAsBrowser(authorizeUrl, { api: 'http://evil.example.com' });
    assert.equal(bad.status, 400);

    await actAsBrowser(authorizeUrl, { cancel: true });
    assert.equal((await cli.done).code, 1);
  });

  it('stops with exit 1 when the member cancels in the browser', async () => {
    backend = await cocDocs();
    const cli = startCli(['login'], { env: env({ COC_DOCS_URL: backend.origin }) });
    const [, authorizeUrl] = await cli.waitFor(AUTHORIZE_URL);

    await actAsBrowser(authorizeUrl, { cancel: true });

    const res = await cli.done;
    assert.equal(res.code, 1);
    assert.match(res.stderr, /cancelled in the browser/);
    assert.equal(fs.existsSync(path.join(configHome, 'credentials.json')), false);
  });

  it('reports an exchange the backend refuses (a wrong verifier, or an expired code)', async () => {
    backend = await cocDocs({ exchange: () => ({ status: 400, body: { detail: 'invalid_grant' } }) });
    const cli = startCli(['login'], { env: env({ COC_DOCS_URL: backend.origin }) });
    const [, authorizeUrl] = await cli.waitFor(AUTHORIZE_URL);

    await actAsBrowser(authorizeUrl, { api: backend.origin });

    const res = await cli.done;
    assert.equal(res.code, 1);
    assert.match(res.stderr, /refused the sign-in code/);
    assert.equal(fs.existsSync(path.join(configHome, 'credentials.json')), false);
  });

  it('refuses a production server that reports a localhost ingest URL (APP_PUBLIC_URL unset)', async () => {
    backend = await cocDocs();
    const cli = startCli(['login'], { env: env({ COC_DOCS_URL: 'https://docs.example.com' }) });
    const [, authorizeUrl] = await cli.waitFor(AUTHORIZE_URL);
    backend.state.challenge = new URL(authorizeUrl).searchParams.get('code_challenge');

    await actAsBrowser(authorizeUrl, { api: backend.origin });

    const res = await cli.done;
    assert.equal(res.code, 1);
    assert.match(res.stderr, /localhost ingest URL.*APP_PUBLIC_URL/);
    assert.equal(fs.existsSync(path.join(configHome, 'credentials.json')), false);
  });

  it('with no COC_DOCS_URL, opens the built-in production server', async () => {
    const cli = startCli(['login'], { env: env() });
    const [, authorizeUrl] = await cli.waitFor(AUTHORIZE_URL);
    cli.kill();
    await cli.done;
    const u = new URL(authorizeUrl);
    assert.equal(u.origin + u.pathname, 'https://docs.lovedev.me/cli/authorize');
  });

  it('logout removes the saved credentials', async () => {
    saveLogin(configHome);
    const res = await runCli(['logout'], { env: env() });
    assert.equal(res.code, 0);
    assert.equal(fs.existsSync(path.join(configHome, 'credentials.json')), false);
  });
});

describe('scan', () => {
  it('fails clearly when not signed in and there is no terminal to ask in (missing token)', async () => {
    oneResponse();
    const res = await runCli(['scan'], { env: env() });
    assert.equal(res.code, 1);
    assert.match(res.stderr, /not signed in.*claude-team-usage login.*once in a terminal/);
    // A headless run never waits on a browser.
    assert.doesNotMatch(res.stderr, /Opening your browser/);
  });

  it('fails clearly when the Claude usage directory does not exist', async () => {
    backend = await fakeBackend(() => ({ status: 200, body: { action: 'created' } }));
    saveLogin(configHome, { ingestUrl: backend.url });
    const res = await runCli(['scan'], { env: env({ CLAUDE_PROJECTS_DIR: path.join(projects, 'nope') }) });
    assert.equal(res.code, 1);
    assert.match(res.stderr, /usage directory not found/);
    assert.equal(backend.requests.length, 0);
  });

  it('sends no usage when there is none today — only the scan check-in (ADR-097)', async () => {
    backend = await fakeBackend(() => ({ status: 200, body: { action: 'scan-recorded' } }));
    saveLogin(configHome, { ingestUrl: backend.url });
    writeTranscript(projects, 'proj/old.jsonl', [
      usageLine({ id: 'm', requestId: 'r', model: 'claude-sonnet-5', input: 1, output: 1, timestamp: '2020-01-01T00:00:00Z' }),
    ]);
    const res = await runCli(['scan'], { env: env() });
    assert.equal(res.code, 0, res.stderr);
    assert.match(res.stdout, /no usage found/);
    assert.deepEqual(backend.requests.map((r) => [r.url, r.body]), [['/api/ingest/scan', { email: 'dana@example.com' }]]);
  });

  it('--dry-run never checks in', async () => {
    backend = await fakeBackend(() => ({ status: 200, body: {} }));
    saveLogin(configHome, { ingestUrl: backend.url });
    const res = await runCli(['scan', '--dry-run'], { env: env() });
    assert.equal(res.code, 0, res.stderr);
    assert.equal(backend.requests.length, 0);
  });

  it('uploads with the personal token and reports what the server did', async () => {
    backend = await fakeBackend(() => ({ status: 200, body: { action: 'created' } }));
    saveLogin(configHome, { ingestUrl: backend.url, dashboardUrl: 'https://docs.example.com/my-claude-usage' });
    oneResponse();

    const res = await runCli(['scan'], { env: env() });

    assert.equal(res.code, 0, res.stderr);
    assert.equal(backend.requests.length, 1);
    const [req] = backend.requests;
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/api/ingest');
    assert.equal(req.headers.authorization, `Bearer ${TOKEN}`);
    assert.equal(req.body.email, 'dana@example.com');
    assert.equal(req.body.displayName, 'Dana');
    assert.deepEqual(req.body.models, ['claude-sonnet-5']);
    assert.match(res.stderr, /1 response\(s\) counted/);
    assert.match(res.stderr, /✓ created/);
    assert.match(res.stdout, /sent 210 tokens/);
    assert.match(res.stdout, /view it at https:\/\/docs\.example\.com\/my-claude-usage/);
  });

  it('stops at once on an invalid or revoked token, without retrying', async () => {
    backend = await fakeBackend(() => ({ status: 401, body: { detail: 'invalid ingest credential' } }));
    saveLogin(configHome, { ingestUrl: backend.url });
    oneResponse();

    const res = await runCli(['scan'], { env: env() });

    assert.equal(res.code, 1);
    assert.match(res.stderr, /invalid or has been revoked/);
    assert.equal(backend.requests.length, 1);
  });

  it('explains a token that belongs to another account (403)', async () => {
    backend = await fakeBackend(() => ({ status: 403, body: { detail: 'this token may only report usage for its own account' } }));
    saveLogin(configHome, { ingestUrl: backend.url });
    oneResponse();

    const res = await runCli(['scan'], { env: env() });

    assert.equal(res.code, 1);
    assert.match(res.stderr, /403.*its own account/);
  });

  it('retries a server error once, then fails with a non-zero exit', async () => {
    backend = await fakeBackend(() => ({ status: 500, body: { detail: 'boom' } }));
    saveLogin(configHome, { ingestUrl: backend.url });
    oneResponse();

    const res = await runCli(['scan'], { env: env() });

    assert.equal(res.code, 1);
    assert.match(res.stderr, /upload failed for \d{4}-\d{2}-\d{2}: HTTP 500 boom/);
    assert.equal(backend.requests.length, 2);
  });

  describe('a run started by Task Scheduler (`scan --scheduled`) brackets its log entry', () => {
    // What scheduled-scan.log tells apart: Task Scheduler did not fire (no `====`
    // line, written by cmd), the CLI failed, no usage, upload failed, uploaded.
    const HEADER = /^claude-team-usage \d+\.\d+\.\d+ \| started \d{4}-\d\d-\d\d \d\d:\d\d:\d\d \| node .+ \| cli .+bin[\\/]cli\.js$/m;

    it('uploaded: header with version, Node.js and CLI paths, then result and exit code', async () => {
      backend = await fakeBackend(() => ({ status: 200, body: { action: 'created' } }));
      saveLogin(configHome, { ingestUrl: backend.url });
      oneResponse();
      const res = await runCli(['scan', '--scheduled'], { env: env() });
      assert.equal(res.code, 0, res.stderr);
      assert.match(res.stderr, HEADER);
      assert.ok(res.stderr.includes(`| node ${process.execPath} |`));
      assert.match(res.stderr, /^---- result: uploaded \| exit 0 \| finished /m);
      assert.ok(!res.stderr.includes(TOKEN), 'never logs the token');
    });

    it('no-usage, upload-failed and cli-failed are each their own result', async () => {
      backend = await fakeBackend(() => ({ status: 500, body: { detail: 'boom' } }));
      saveLogin(configHome, { ingestUrl: backend.url });
      let res = await runCli(['scan', '--scheduled'], { env: env() });
      assert.match(res.stderr, /^---- result: no-usage \| exit 0/m);

      oneResponse();
      res = await runCli(['scan', '--scheduled'], { env: env() });
      assert.equal(res.code, 1);
      assert.match(res.stderr, /^---- result: upload-failed \| exit 1/m);

      res = await runCli(['scan', '--scheduled'], { env: env({ CLAUDE_PROJECTS_DIR: path.join(projects, 'nope') }) });
      assert.equal(res.code, 1);
      assert.match(res.stderr, /^---- result: cli-failed \| exit 1/m);
    });

    it('a manual scan writes neither line', async () => {
      backend = await fakeBackend(() => ({ status: 200, body: { action: 'created' } }));
      saveLogin(configHome, { ingestUrl: backend.url });
      const res = await runCli(['scan'], { env: env() });
      assert.doesNotMatch(res.stderr, /---- result:|\| started /);
    });
  });

  it('fails when the server is unreachable', async () => {
    saveLogin(configHome);
    oneResponse();
    const res = await runCli(['scan'], { env: env() });
    assert.equal(res.code, 1);
    assert.match(res.stderr, /upload failed/);
  });

  it('still honours push-usage.mjs environment variables, ahead of the saved login', async () => {
    backend = await fakeBackend(() => ({ status: 200, body: { action: 'updated' } }));
    saveLogin(configHome);
    oneResponse();

    const res = await runCli(['scan'], {
      env: env({ USER_EMAIL: 'ci@example.com', INGEST_URL: backend.url, INGEST_SECRET: 'coc_ci' }),
    });

    assert.equal(res.code, 0, res.stderr);
    assert.equal(backend.requests[0].body.email, 'ci@example.com');
    assert.equal(backend.requests[0].headers.authorization, 'Bearer coc_ci');
  });

  it('rejects a partial set of environment variables instead of mixing them with the saved login', async () => {
    oneResponse();
    const res = await runCli(['scan'], { env: env({ INGEST_URL: 'http://127.0.0.1:9/api/ingest' }) });
    assert.equal(res.code, 1);
    assert.match(res.stderr, /must be set together/);
  });

  it('rejects a bad --days value with the usage exit code', async () => {
    const res = await runCli(['scan', '--days', '0'], { env: env() });
    assert.equal(res.code, 2);
    assert.match(res.stderr, /--days/);
  });
});

describe('scan --dry-run: deduplication and token calculation', () => {
  it('counts a response logged on several lines once, at its final (largest) output', async () => {
    writeTranscript(projects, 'proj/session.jsonl', [
      usageLine({ id: 'msg_1', requestId: 'req_1', model: 'claude-sonnet-5', input: 5, output: 40, cacheRead: 1000, cache1h: 200 }),
      usageLine({ id: 'msg_1', requestId: 'req_1', model: 'claude-sonnet-5', input: 5, output: 900, cacheRead: 1000, cache1h: 200, stop: 'tool_use' }),
      usageLine({ id: 'msg_1', requestId: 'req_1', model: 'claude-sonnet-5', input: 5, output: 900, cacheRead: 1000, cache1h: 200, stop: 'tool_use' }),
    ]);

    const res = await runCli(['scan', '--dry-run'], { env: env() });

    assert.equal(res.code, 0, res.stderr);
    const [day] = dryRunPayloads(res.stdout);
    assert.equal(day._responses, 1);
    assert.equal(day.input, 5);
    assert.equal(day.output, 900);
    assert.equal(day.cacheRead, 1000);
    assert.equal(day.cacheCreation, 200);
    assert.match(res.stderr, /2 duplicate line\(s\) merged/);
  });

  it('counts the same response in a subagent transcript once, and keeps models and categories apart', async () => {
    writeTranscript(projects, 'proj/sess.jsonl', [
      usageLine({ id: 'msg_a', requestId: 'req_a', model: 'claude-opus-5-5', input: 3, output: 300, cacheRead: 50_000, cache5m: 100, cache1h: 20_000, stop: 'end_turn' }),
      usageLine({ id: 'msg_b', requestId: 'req_b', model: 'claude-sonnet-5', input: 7, output: 700, cacheRead: 9_000, cache1h: 1_000, stop: 'end_turn' }),
      usageLine({ id: 'msg_s', requestId: 'req_s', model: '<synthetic>', input: 0, output: 0 }),
      'not json — a half-flushed line',
    ]);
    writeTranscript(projects, 'proj/sess/subagents/agent-1.jsonl', [
      usageLine({ id: 'msg_b', requestId: 'req_b', model: 'claude-sonnet-5', input: 7, output: 700, cacheRead: 9_000, cache1h: 1_000, stop: 'end_turn' }),
    ]);

    const res = await runCli(['scan', '--dry-run'], { env: env() });

    assert.equal(res.code, 0, res.stderr);
    const [day] = dryRunPayloads(res.stdout);
    assert.deepEqual(day.byModel, {
      'claude-opus-5-5': { input: 3, output: 300, cacheRead: 50_000, cacheCreation: 20_100, cacheCreation1h: 20_000 },
      'claude-sonnet-5': { input: 7, output: 700, cacheRead: 9_000, cacheCreation: 1_000, cacheCreation1h: 1_000 },
    });
    assert.deepEqual(day.models, ['claude-opus-5-5', 'claude-sonnet-5']);
    assert.equal(day.input, 10);
    assert.equal(day.output, 1_000);
    assert.equal(day.cacheRead, 59_000);
    assert.equal(day.cacheCreation, 21_100);
    // Headline total is input + output only, as push-usage.mjs has always sent.
    assert.equal(day._total, 1_010);
    assert.match(res.stderr, /1 unreadable line\(s\) skipped/);
  });

  it('needs no login for a local preview', async () => {
    oneResponse();
    const res = await runCli(['scan', '--dry-run'], { env: env() });
    assert.equal(res.code, 0, res.stderr);
    assert.equal(dryRunPayloads(res.stdout).length, 1);
  });
});
