// req: FR-USAGE-002, ADR-059, ADR-060
import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { configDir, CredentialsError, resolveServer } from '../src/config.js';
import { browserCommand } from '../src/open-browser.js';
import { candidateProjectDirs } from '../src/usage-parser.js';

describe('resolveServer', () => {
  it('uses COC_DOCS_URL, normalised to its origin', () => {
    assert.equal(resolveServer({ COC_DOCS_URL: 'https://docs.example.com/some/path/' }), 'https://docs.example.com');
  });

  it('defaults to the production server this package is published with — no COC_DOCS_URL needed', () => {
    assert.equal(resolveServer({}), 'https://docs.lovedev.me');
  });

  it('fails clearly when a build has no server and none is set', () => {
    assert.throws(() => resolveServer({}, ''), CredentialsError);
  });

  it('refuses a non-http address', () => {
    assert.throws(() => resolveServer({ COC_DOCS_URL: 'file:///etc/passwd' }), CredentialsError);
  });
});

describe('browserCommand', () => {
  const url = 'https://docs.example.com/cli/authorize?port=5000&state=abc';
  it('passes the URL as one argument, never through a shell', () => {
    assert.deepEqual(browserCommand(url, 'win32'), ['rundll32', ['url.dll,FileProtocolHandler', url]]);
    assert.deepEqual(browserCommand(url, 'darwin'), ['open', [url]]);
    assert.deepEqual(browserCommand(url, 'linux'), ['xdg-open', [url]]);
  });
});

describe('platform paths', () => {
  it('stores credentials under %APPDATA% on Windows and XDG elsewhere', () => {
    assert.equal(configDir({ APPDATA: 'C:\\Users\\d\\AppData\\Roaming' }, 'win32', 'C:\\Users\\d'), path.join('C:\\Users\\d\\AppData\\Roaming', 'claude-team-usage'));
    assert.equal(configDir({}, 'linux', '/home/d'), path.join('/home/d', '.config', 'claude-team-usage'));
    assert.equal(configDir({ XDG_CONFIG_HOME: '/x' }, 'darwin', '/home/d'), path.join('/x', 'claude-team-usage'));
  });

  it('finds transcripts where Claude Code keeps them, with overrides first', () => {
    assert.deepEqual(candidateProjectDirs({ CLAUDE_PROJECTS_DIR: '/p' }, '/home/d'), ['/p']);
    assert.deepEqual(candidateProjectDirs({ CLAUDE_CONFIG_DIR: '/a, /b' }, '/home/d'), [path.join('/a', 'projects'), path.join('/b', 'projects')]);
    assert.deepEqual(candidateProjectDirs({}, '/home/d'), [
      path.join('/home/d', '.claude', 'projects'),
      path.join('/home/d', '.config', 'claude', 'projects'),
    ]);
  });
});
