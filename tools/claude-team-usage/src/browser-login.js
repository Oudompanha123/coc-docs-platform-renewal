/**
 * Browser sign-in for the CLI (ADR-060): OAuth 2.0 for native apps (RFC 8252)
 * with PKCE S256 (RFC 7636), against the Coc Docs backend's own endpoints.
 *
 *   1. Listen on http://127.0.0.1:<random port>/callback.
 *   2. Open <server>/cli/authorize?port&state&code_challenge&device.
 *      The member signs in as usual and clicks Authorize.
 *   3. The browser comes back to the listener with ?code&state&api.
 *      A request whose state is not ours is refused and ignored.
 *   4. POST <api>/api/cli/token {code, codeVerifier} — only this process ever
 *      held the verifier — and receive the personal `coc_` token, email,
 *      display name and ingest URL in the HTTPS response body.
 *
 * The token never appears in a URL, a log line, or the terminal. The code does
 * pass through the browser, but it is single-use, lives two minutes, and is
 * worthless without the verifier.
 *
 * // req: FR-USAGE-002, NFR-SEC-CHANNEL, ADR-060
 */

import crypto from 'node:crypto';
import http from 'node:http';
import os from 'node:os';
import { CredentialsError, INGEST_URL_PATTERN } from './config.js';
import { openBrowser } from './open-browser.js';

export const LOGIN_TIMEOUT_MS = 5 * 60_000;
const EXCHANGE_TIMEOUT_MS = 10_000;
const B64URL_43 = /^[A-Za-z0-9_-]{43}$/;

const b64url = (buf) => buf.toString('base64url');

/** state, PKCE verifier and its S256 challenge — 256 bits each. */
export function newPkce() {
  const verifier = b64url(crypto.randomBytes(32));
  return {
    state: b64url(crypto.randomBytes(32)),
    verifier,
    challenge: b64url(crypto.createHash('sha256').update(verifier, 'ascii').digest()),
  };
}

function sameSecret(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** The backend origin the page reported: https anywhere, plain http only on this machine. */
function acceptableApiOrigin(raw) {
  try {
    const url = new URL(raw);
    if (url.origin !== raw.replace(/\/$/, '')) return null;
    if (url.protocol === 'https:') return url.origin;
    if (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return url.origin;
  } catch {
    // fall through
  }
  return null;
}

// Static pages only — nothing from the request is ever reflected back.
const page = (title, text) =>
  `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
  '<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;color:#16141f">' +
  `<div style="max-width:28rem;text-align:center"><h1 style="font-size:1.25rem">${title}</h1><p>${text}</p></div>`;

const PAGES = {
  ok: page('claude-team-usage is signed in', 'Return to your terminal. You can close this tab.'),
  cancelled: page('Sign-in cancelled', 'Nothing was authorized. You can close this tab.'),
  mismatch: page('This sign-in link is not for this terminal', 'Run <code>claude-team-usage scan</code> again and use the page it opens.'),
  notFound: page('Not found', ''),
};

/**
 * Starts the loopback listener. `result` settles once with {code, api}, or
 * rejects on cancel/timeout. Only GET /callback carrying our own state counts.
 */
export function listenForCallback(state, { timeoutMs = LOGIN_TIMEOUT_MS } = {}) {
  return new Promise((resolveListen, rejectListen) => {
    let settle;
    const result = new Promise((resolve, reject) => {
      settle = { resolve, reject };
    });

    const server = http.createServer((req, res) => {
      const reply = (status, html) => {
        res.writeHead(status, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Referrer-Policy': 'no-referrer',
          Connection: 'close',
        });
        res.end(html);
      };

      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (req.method !== 'GET' || url.pathname !== '/callback') return reply(404, PAGES.notFound);
      if (!sameSecret(url.searchParams.get('state') ?? '', state)) return reply(400, PAGES.mismatch);

      if (url.searchParams.get('error')) {
        reply(200, PAGES.cancelled);
        return settle.reject(new CredentialsError('sign-in was cancelled in the browser.'));
      }
      const code = url.searchParams.get('code') ?? '';
      const api = acceptableApiOrigin(url.searchParams.get('api') ?? '');
      if (!B64URL_43.test(code) || !api) return reply(400, PAGES.mismatch);
      reply(200, PAGES.ok);
      settle.resolve({ code, api });
    });

    const timer = setTimeout(
      () => settle.reject(new CredentialsError(`no browser sign-in within ${Math.round(timeoutMs / 60_000)} minutes — run the command again.`)),
      timeoutMs,
    );
    const close = () => {
      clearTimeout(timer);
      server.closeAllConnections?.();
      server.close();
    };
    result.then(close, close);

    server.on('error', rejectListen);
    server.listen(0, '127.0.0.1', () => resolveListen({ port: server.address().port, result }));
  });
}

async function exchange(api, code, verifier, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXCHANGE_TIMEOUT_MS);
  let res;
  try {
    res = await fetchImpl(`${api}/api/cli/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, codeVerifier: verifier }),
      signal: controller.signal,
    });
  } catch (error) {
    const why = error?.name === 'AbortError' ? `no response within ${EXCHANGE_TIMEOUT_MS / 1000}s` : error?.cause?.code ?? error.message;
    throw new CredentialsError(`could not reach Coc Docs to finish signing in (${why}).`);
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 400) {
    throw new CredentialsError('Coc Docs refused the sign-in code (expired or already used) — run the command again.');
  }
  if (!res.ok) throw new CredentialsError(`Coc Docs could not finish signing in (HTTP ${res.status}).`);

  const body = await res.json().catch(() => ({}));
  const creds = {
    email: String(body.email ?? '').trim().toLowerCase(),
    displayName: String(body.displayName ?? '').trim(),
    ingestUrl: String(body.ingestUrl ?? '').trim(),
    token: String(body.token ?? ''),
  };
  if (!creds.token.startsWith('coc_') || !creds.email.includes('@') || !INGEST_URL_PATTERN.test(creds.ingestUrl)) {
    throw new CredentialsError('Coc Docs sent an unexpected sign-in response — is the server up to date?');
  }
  if (!creds.displayName) creds.displayName = creds.email.split('@')[0];
  return creds;
}

/**
 * The whole flow. Resolves the credentials to save; never prints the token or code.
 */
export async function browserLogin({
  server,
  io,
  open = openBrowser,
  fetchImpl = globalThis.fetch,
  device = os.hostname(),
  timeoutMs = LOGIN_TIMEOUT_MS,
}) {
  const { state, verifier, challenge } = newPkce();
  const { port, result } = await listenForCallback(state, { timeoutMs });

  const url = new URL('/cli/authorize', server);
  url.searchParams.set('port', String(port));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('device', String(device).slice(0, 60));

  io.info('Opening your browser to sign in to Coc Docs…');
  open(url.toString());
  io.info(`If it did not open, visit this address on this computer:\n  ${url}`);
  io.info('Waiting for you to approve in the browser…');

  const { code, api } = await result;
  const creds = await exchange(api, code, verifier, fetchImpl);
  // Same guard as the dashboard's script download: a backend without
  // APP_PUBLIC_URL, reached as localhost, would point every upload at the
  // user's own PC. Refuse instead of saving a login that can never report.
  const isLoopback = (host) => host === 'localhost' || host === '[::1]' || /^127\./.test(host);
  if (isLoopback(new URL(creds.ingestUrl).hostname) && !isLoopback(new URL(server).hostname)) {
    throw new CredentialsError('Coc Docs reported a localhost ingest URL — ask an admin to set APP_PUBLIC_URL on the backend.');
  }
  return { ...creds, dashboardUrl: `${server}/my-claude-usage` };
}
