/**
 * Where the CLI keeps the signed-in teammate's credentials, and how it gets them.
 *
 * Nobody edits this file by hand: the browser login (`browser-login.js`,
 * ADR-060) writes it, and `logout` deletes it. It holds exactly the four values
 * the personalized push-usage.mjs used to embed (ADR-050) — email, display name,
 * the backend's own public ingest URL (PublicIngestUrl), and a personal `coc_`
 * token minted for this machine.
 *
 * // req: FR-USAGE-002, NFR-SEC-CHANNEL, ADR-047, ADR-050, ADR-060
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const CONFIG_FILE = 'credentials.json';
const { cocDocs = {} } = createRequire(import.meta.url)('../package.json');

/** Same shape check the browser applies before embedding a URL (reporterConfig.ts). */
export const INGEST_URL_PATTERN = /^https?:\/\/[^/]+(\/.*)?\/api\/ingest$/;

export class CredentialsError extends Error {}

/**
 * The Coc Docs deployment to sign in to: `COC_DOCS_URL` (local development, or
 * another deployment), else the default this package was published with
 * (`package.json` → `cocDocs.server`). Never typed by an end user.
 */
export function resolveServer(env = process.env, published = cocDocs.server) {
  const raw = String(env.COC_DOCS_URL ?? '').trim() || String(published ?? '').trim();
  if (!raw) {
    throw new CredentialsError(
      'this build of claude-team-usage has no Coc Docs server configured. ' +
        'Set COC_DOCS_URL to your Coc Docs address, e.g. COC_DOCS_URL=https://docs.example.com',
    );
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new CredentialsError(`COC_DOCS_URL "${raw}" is not a URL.`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new CredentialsError(`COC_DOCS_URL must be an http(s) address, got "${raw}".`);
  }
  return url.origin;
}

/**
 * Per-user config directory, following each platform's own convention:
 * `%APPDATA%\claude-team-usage` on Windows (per-user ACL), otherwise
 * `$XDG_CONFIG_HOME/claude-team-usage`, defaulting to `~/.config/claude-team-usage`.
 */
export function configDir(env = process.env, platform = process.platform, home = os.homedir()) {
  const override = String(env.CLAUDE_TEAM_USAGE_CONFIG_DIR ?? '').trim();
  if (override) return override;
  if (platform === 'win32') {
    return path.join(String(env.APPDATA ?? '').trim() || path.join(home, 'AppData', 'Roaming'), 'claude-team-usage');
  }
  return path.join(String(env.XDG_CONFIG_HOME ?? '').trim() || path.join(home, '.config'), 'claude-team-usage');
}

export function configPath(env = process.env) {
  return path.join(configDir(env), CONFIG_FILE);
}

/**
 * Writes the credentials readable by this OS user only. Written to a temp file
 * and renamed, so an interrupted write never leaves a half-written file behind.
 * `mode` is ignored on Windows, where %APPDATA% is already per-user.
 */
export function saveCredentials(creds, env = process.env) {
  const file = configPath(env);
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.${process.pid}.tmp`;
  const body = {
    email: creds.email,
    displayName: creds.displayName,
    ingestUrl: creds.ingestUrl,
    token: creds.token,
    ...(creds.dashboardUrl ? { dashboardUrl: creds.dashboardUrl } : {}),
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(tmp, JSON.stringify(body, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmp, file);
  if (process.platform !== 'win32') fs.chmodSync(file, 0o600);
  return file;
}

/** The saved credentials, or null when not signed in. A damaged file is reported, not ignored. */
export function loadSavedCredentials(env = process.env) {
  const file = configPath(env);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new CredentialsError(`${file} is damaged. Run \`claude-team-usage login\` again.`);
  }
  if (!parsed?.token || !parsed?.ingestUrl || !parsed?.email) {
    throw new CredentialsError(`${file} is incomplete. Run \`claude-team-usage login\` again.`);
  }
  return {
    email: String(parsed.email).toLowerCase(),
    displayName: String(parsed.displayName ?? '') || String(parsed.email).split('@')[0],
    ingestUrl: String(parsed.ingestUrl),
    token: String(parsed.token),
    ...(parsed.dashboardUrl ? { dashboardUrl: String(parsed.dashboardUrl) } : {}),
  };
}

export function clearCredentials(env = process.env) {
  const file = configPath(env);
  try {
    fs.unlinkSync(file);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

/**
 * Environment variables first, so CI, Docker, and scheduled tasks that already
 * set push-usage.mjs's own names keep working unchanged — then the saved login.
 * All three of USER_EMAIL / INGEST_URL / INGEST_SECRET must be set for the
 * environment to count; a partial set is almost always a mistake, so it is an
 * error rather than being silently mixed with the saved login.
 */
export function resolveCredentials(env = process.env) {
  const fromEnv = {
    email: String(env.USER_EMAIL ?? '').trim().toLowerCase(),
    displayName: String(env.USER_NAME ?? '').trim(),
    ingestUrl: String(env.INGEST_URL ?? '').trim(),
    token: String(env.INGEST_SECRET ?? '').trim(),
  };
  const setCount = [fromEnv.email, fromEnv.ingestUrl, fromEnv.token].filter(Boolean).length;
  if (setCount === 3) {
    if (!fromEnv.email.includes('@')) {
      throw new CredentialsError(`USER_EMAIL "${fromEnv.email}" does not look like an email address.`);
    }
    return { ...fromEnv, displayName: fromEnv.displayName || fromEnv.email.split('@')[0], source: 'environment' };
  }
  if (setCount > 0) {
    throw new CredentialsError(
      'USER_EMAIL, INGEST_URL and INGEST_SECRET must be set together (or not at all, to use `claude-team-usage login`).',
    );
  }
  const saved = loadSavedCredentials(env);
  return saved ? { ...saved, source: configPath(env) } : null;
}
