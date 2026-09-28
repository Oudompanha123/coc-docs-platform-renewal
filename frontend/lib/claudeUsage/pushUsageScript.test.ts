// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Runs the real downloadable reporter (`public/downloads/push-usage.mjs`) in
 * `--dry-run` against fixture Claude Code transcripts, and checks the payload
 * it would send — the one place usage is collected, so the one place the
 * dashboard can drift from Claude Code's own /usage (ADR-054).
 *
 * // req: FR-USAGE-002, ADR-035, ADR-054
 */

const SCRIPT = path.resolve(__dirname, "../../public/downloads/push-usage.mjs");

interface Payload {
  date: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
  models: string[];
  byModel: Record<string, { input: number; output: number; cacheRead: number; cacheCreation: number; cacheCreation1h: number }>;
  _responses: number;
}

function usageLine(opts: {
  id: string;
  requestId: string;
  model: string;
  input: number;
  output: number;
  cacheRead?: number;
  cache5m?: number;
  cache1h?: number;
  stop?: string | null;
}): string {
  const cache5m = opts.cache5m ?? 0;
  const cache1h = opts.cache1h ?? 0;
  return JSON.stringify({
    type: "assistant",
    timestamp: new Date().toISOString(),
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

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "push-usage-test-"));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function run(): Payload[] {
  const env: NodeJS.ProcessEnv = { ...process.env, CLAUDE_PROJECTS_DIR: dir, USER_EMAIL: "dana@example.com", USER_NAME: "Dana" };
  delete env.INGEST_URL;
  delete env.INGEST_SECRET;
  const out = execFileSync(process.execPath, [SCRIPT, "--dry-run"], { env, encoding: "utf8", timeout: 30_000 });
  return JSON.parse(out.slice(out.indexOf("["), out.lastIndexOf("]") + 1)) as Payload[];
}

describe("push-usage.mjs collection", () => {
  it("counts a streamed response once, at its final output count — not the first, partial line", () => {
    fs.mkdirSync(path.join(dir, "proj"));
    fs.writeFileSync(
      path.join(dir, "proj", "session.jsonl"),
      [
        usageLine({ id: "msg_1", requestId: "req_1", model: "claude-sonnet-5", input: 5, output: 40, cacheRead: 1000, cache1h: 200 }),
        usageLine({ id: "msg_1", requestId: "req_1", model: "claude-sonnet-5", input: 5, output: 900, cacheRead: 1000, cache1h: 200, stop: "tool_use" }),
      ].join("\n"),
    );

    const [day] = run();

    expect(day!._responses).toBe(1);
    expect(day!.output).toBe(900);
    expect(day!.input).toBe(5);
    expect(day!.cacheRead).toBe(1000);
    expect(day!.cacheCreation).toBe(200);
  });

  it("keeps all four categories separate per model, with the 1-hour cache split, and never folds cache into output", () => {
    fs.mkdirSync(path.join(dir, "proj", "sess", "subagents"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "proj", "sess.jsonl"),
      [
        usageLine({ id: "msg_a", requestId: "req_a", model: "claude-opus-5-5", input: 3, output: 300, cacheRead: 50_000, cache5m: 100, cache1h: 20_000, stop: "end_turn" }),
        usageLine({ id: "msg_b", requestId: "req_b", model: "claude-sonnet-5", input: 7, output: 700, cacheRead: 9_000, cache1h: 1_000, stop: "end_turn" }),
        // Claude Code's locally generated pseudo-model, always all zeros.
        usageLine({ id: "msg_s", requestId: "req_s", model: "<synthetic>", input: 0, output: 0 }),
      ].join("\n"),
    );
    // The same response logged again in a subagent transcript is still one response.
    fs.writeFileSync(
      path.join(dir, "proj", "sess", "subagents", "agent-1.jsonl"),
      usageLine({ id: "msg_b", requestId: "req_b", model: "claude-sonnet-5", input: 7, output: 700, cacheRead: 9_000, cache1h: 1_000, stop: "end_turn" }),
    );

    const [day] = run();

    expect(day!.byModel).toEqual({
      "claude-opus-5-5": { input: 3, output: 300, cacheRead: 50_000, cacheCreation: 20_100, cacheCreation1h: 20_000 },
      "claude-sonnet-5": { input: 7, output: 700, cacheRead: 9_000, cacheCreation: 1_000, cacheCreation1h: 1_000 },
    });
    expect(day!.models).toEqual(["claude-opus-5-5", "claude-sonnet-5"]);
    expect(day!.input).toBe(10);
    expect(day!.output).toBe(1_000);
    expect(day!.cacheRead).toBe(59_000);
    expect(day!.cacheCreation).toBe(21_100);
  });
});
