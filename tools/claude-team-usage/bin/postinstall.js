// npm runs this after installing the package (`postinstall`). On a global
// install on Windows it repairs an existing claude-team-usage scheduled task
// in place, so a task left by an older version — 0.2.0/0.3.0 started cmd.exe,
// a console window at every 11:00/16:00 run — moves onto the hidden launcher
// as soon as someone updates (`repairExisting` in src/schedule.js). It never
// creates a task and never touches the login or usage data.
//
// It must never fail an install: every path ends with exit code 0, and the
// outcome goes to scheduled-scan.log (npm hides lifecycle output), where
// `claude-team-usage schedule status` shows it.
//
// req: FR-USAGE-002, ADR-060

const env = process.env;
// `npm install -g` / `npm update -g` set npm_config_global; newer npm also sets location.
const globalInstall = env.npm_config_global === 'true' || env.npm_config_location === 'global';

if (process.platform === 'win32' && globalInstall) {
  try {
    const [{ repairExisting, recordRepair, isNoTask }, { createRequire }] = await Promise.all([import('../src/schedule.js'), import('node:module')]);
    const { version } = createRequire(import.meta.url)('../package.json');
    const result = repairExisting({ env });
    if (!isNoTask(result)) recordRepair({ env, source: `npm install ${version}`, outcome: result.outcome, reason: result.reason });
    if (result.outcome === 'repaired') console.log(`claude-team-usage: automatic scans repaired (${result.reason}).`);
    else if (result.outcome === 'failed') console.log(`claude-team-usage: could not repair automatic scans (${result.reason}); run \`claude-team-usage login\` to retry.`);
  } catch {
    // An install that cannot load the scheduler still installs; `login` repairs later.
  }
}
process.exitCode = 0;
