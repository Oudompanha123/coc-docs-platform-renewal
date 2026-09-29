/**
 * `login` / `logout` — browser sign-in to saved credentials, and back.
 *
 * // req: FR-USAGE-002, NFR-SEC-CHANNEL, ADR-060
 */

import { browserLogin } from './browser-login.js';
import { clearCredentials, configPath, resolveServer, saveCredentials } from './config.js';

/** Signs in through the browser and saves the result. Returns the credentials. */
export async function login({ io, ...opts }) {
  const server = resolveServer();
  const creds = await browserLogin({ server, io, ...opts });
  const file = saveCredentials(creds);
  io.info(`signed in as ${creds.displayName} <${creds.email}>`);
  io.info(`  reporting to ${creds.ingestUrl}`);
  io.info(`  saved to ${file}`);
  if (/^http:\/\//.test(creds.ingestUrl) && !/^http:\/\/(localhost|127\.|\[::1\])/.test(creds.ingestUrl)) {
    io.err('warning: this server uses plain http — your token will be sent unencrypted.');
  }
  return creds;
}

export function logout({ io }) {
  const removed = clearCredentials();
  io.out(removed ? `signed out — removed ${configPath()}` : 'not signed in — nothing to remove.');
  if (removed) {
    io.out('To stop the token working entirely, revoke it under My Claude Usage → Connected machines.');
  }
}
