/**
 * Opens a URL in the default browser, cross-platform, without a shell — the URL
 * is passed as one argv entry, so `&` and `?` in it can never be interpreted as
 * shell syntax. Best-effort: the caller always prints the URL too, for machines
 * where nothing opens (SSH sessions, WSL without a browser bridge, locked-down
 * desktops).
 *
 * `CLAUDE_TEAM_USAGE_BROWSER=none` skips launching entirely (print-only).
 */

import { spawn } from 'node:child_process';

export function browserCommand(url, platform = process.platform) {
  if (platform === 'win32') return ['rundll32', ['url.dll,FileProtocolHandler', url]];
  if (platform === 'darwin') return ['open', [url]];
  return ['xdg-open', [url]];
}

export function openBrowser(url, { platform = process.platform, env = process.env, spawnImpl = spawn } = {}) {
  if (String(env.CLAUDE_TEAM_USAGE_BROWSER ?? '').toLowerCase() === 'none') return false;
  const [cmd, args] = browserCommand(url, platform);
  try {
    const child = spawnImpl(cmd, args, { stdio: 'ignore', detached: true, windowsHide: true });
    child.on('error', () => {}); // no opener installed — the printed URL still works
    child.unref();
    return true;
  } catch {
    return false;
  }
}
