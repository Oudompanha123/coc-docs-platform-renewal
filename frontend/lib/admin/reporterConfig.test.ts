import { describe, expect, it } from "vitest";
import { buildReporterConfig, reporterConfigFileName } from "./reporterConfig";

describe("reporterConfigFileName", () => {
  it("is the fixed name push-usage.mjs looks for next to itself", () => {
    expect(reporterConfigFileName()).toBe("claude-usage.config.json");
  });
});

describe("buildReporterConfig", () => {
  it("carries the caller's own email/name, the ingest URL, and the freshly minted token", () => {
    const config = buildReporterConfig("dana@example.com", "Dana Lee", "coc_abc123");

    expect(config).toEqual({
      USER_EMAIL: "dana@example.com",
      USER_NAME: "Dana Lee",
      INGEST_URL: expect.stringContaining("/api/ingest"),
      INGEST_SECRET: "coc_abc123",
    });
  });

  it("never invents a secret of its own -- INGEST_SECRET is exactly the token passed in", () => {
    const config = buildReporterConfig("a@example.com", "A", "coc_xyz");
    expect(config.INGEST_SECRET).toBe("coc_xyz");
  });
});
