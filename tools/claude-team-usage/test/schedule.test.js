// req: FR-USAGE-002, ADR-060
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTaskXml, commandLine, describeResult, SCAN_ARGS, SCHEDULE_TIMES } from '../src/schedule.js';

const NODE = 'C:\\Program Files\\nodejs\\node.exe';
const CLI = 'C:\\Users\\dana\\AppData\\Roaming\\npm\\node_modules\\claude-team-usage\\bin\\cli.js';
const LOG = 'C:\\Users\\dana\\AppData\\Roaming\\claude-team-usage\\scheduled-scan.log';

describe('schedule (Windows Task Scheduler)', () => {
  it('runs a plain scan every day at 11:00 and 16:00 (it finds unreported days itself)', () => {
    assert.deepEqual(SCHEDULE_TIMES, ['11:00', '16:00']);
    assert.deepEqual(SCAN_ARGS, ['scan']);

    const xml = buildTaskXml({ userId: 'CORP\\dana', command: 'C:\\Windows\\System32\\cmd.exe', args: '/c x', today: '2026-09-30' });
    assert.match(xml, /<StartBoundary>2026-09-30T11:00:00<\/StartBoundary>/);
    assert.match(xml, /<StartBoundary>2026-09-30T16:00:00<\/StartBoundary>/);
    assert.equal((xml.match(/<DaysInterval>1<\/DaysInterval>/g) ?? []).length, 2);
  });

  it('runs as this user without a stored password, catches up missed runs, and cannot hang', () => {
    const xml = buildTaskXml({ userId: 'CORP\\dana', command: 'cmd.exe', args: '/c x', today: '2026-09-30' });
    assert.match(xml, /<UserId>CORP\\dana<\/UserId>/);
    assert.match(xml, /<LogonType>InteractiveToken<\/LogonType>/);
    assert.match(xml, /<RunLevel>LeastPrivilege<\/RunLevel>/);
    assert.match(xml, /<StartWhenAvailable>true<\/StartWhenAvailable>/);
    assert.match(xml, /<ExecutionTimeLimit>PT15M<\/ExecutionTimeLimit>/);
    assert.match(xml, /<MultipleInstancesPolicy>IgnoreNew<\/MultipleInstancesPolicy>/);
  });

  it('logs every run and quotes each path, with the command XML-escaped', () => {
    const args = commandLine({ node: NODE, cli: CLI, args: SCAN_ARGS, log: LOG });
    assert.equal(args, `/d /c "(echo ==== %DATE% %TIME% & "${NODE}" "${CLI}" scan) >> "${LOG}" 2>&1"`);

    const xml = buildTaskXml({ userId: 'u', command: 'cmd.exe', args, today: '2026-09-30' });
    assert.ok(xml.includes('(echo ==== %DATE% %TIME% &amp; &quot;C:\\Program Files\\nodejs\\node.exe&quot;'));
    assert.ok(xml.includes('&gt;&gt; &quot;'));
    assert.ok(!/credentials|coc_/.test(xml), 'no secret ever goes into the task');
  });

  it('refuses a path cmd.exe cannot quote safely', () => {
    assert.throws(() => commandLine({ node: NODE, cli: 'C:\\100%\\cli.js', args: SCAN_ARGS, log: LOG }), /cannot quote safely/);
    assert.throws(() => commandLine({ node: NODE, cli: CLI, args: SCAN_ARGS, log: 'C:\\a"b.log' }), /cannot quote safely/);
  });

  it('explains Task Scheduler result codes', () => {
    assert.equal(describeResult(0), '0 (success)');
    assert.match(describeResult(1), /see the log/);
    assert.equal(describeResult(0x41303), 'not run yet');
  });
});
