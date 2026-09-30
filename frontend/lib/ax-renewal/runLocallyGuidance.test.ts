import { describe, expect, it } from "vitest";
import { hasRuntimeErrorEvidence, runLocallyGuidance } from "./runLocallyGuidance";
import type { AxRenewalRunLocallyStatus } from "./api";

function statusOf(overrides: Partial<AxRenewalRunLocallyStatus>): AxRenewalRunLocallyStatus {
  return { status: "stopped", log: [], url: null, startedAt: null, ...overrides };
}

describe("runLocallyGuidance", () => {
  it("says success and reminds Stop ends the real process, once a URL is announced", () => {
    const guidance = runLocallyGuidance(statusOf({ status: "running", url: "http://localhost:3000" }));
    expect(guidance.tone).toBe("success");
    expect(guidance.message).toContain("open the link above");
    expect(guidance.message).toContain("ends the real process");
  });

  it("stays honest about not having a URL yet, rather than claiming success early", () => {
    const guidance = runLocallyGuidance(statusOf({ status: "running", url: null }));
    expect(guidance.tone).toBe("info");
    expect(guidance.message).toContain("nothing has announced a URL yet");
  });

  it("explains what starting actually does, for the first, often-slow run", () => {
    const guidance = runLocallyGuidance(statusOf({ status: "starting" }));
    expect(guidance.tone).toBe("info");
    expect(guidance.message).toContain("npm install");
  });

  it("tells a stopped run how to run it again", () => {
    const guidance = runLocallyGuidance(statusOf({ status: "stopped" }));
    expect(guidance.tone).toBe("info");
    expect(guidance.message).toBe("Stopped. Press Start to run it again.");
  });

  // A dev server rendering an unhandled error for one request never exits
  // the process (Next.js catches it, answers 500, keeps serving) -- it
  // stays "running" or moves to "stopped" once someone presses Stop, never
  // "failed". The real signal is the log itself, not the bare status word.
  describe("a real runtime error that never crashed the process", () => {
    const realLog = ["TypeError: Cannot read properties of undefined (reading 'role')", "GET / 500 in 4248ms"];

    it("flags it while the server is still running, even with a URL already announced", () => {
      const guidance = runLocallyGuidance(statusOf({ status: "running", url: "http://localhost:3000", log: realLog }));
      expect(guidance.tone).toBe("error");
      expect(guidance.message).toContain("a request just failed");
    });

    it("flags it once the run has been stopped, rather than only saying it can be started again", () => {
      const guidance = runLocallyGuidance(statusOf({ status: "stopped", log: realLog }));
      expect(guidance.tone).toBe("error");
      expect(guidance.message).toContain("shows a real error");
    });

    it("does not flag a running server with a clean log", () => {
      const guidance = runLocallyGuidance(
        statusOf({ status: "running", url: "http://localhost:3000", log: ["ready on http://localhost:3000"] }),
      );
      expect(guidance.tone).toBe("success");
    });

    it("does not flag a stopped run with a clean log", () => {
      const guidance = runLocallyGuidance(statusOf({ status: "stopped", log: ["ready on http://localhost:3000"] }));
      expect(guidance.tone).toBe("info");
    });
  });

  describe("hasRuntimeErrorEvidence", () => {
    it("recognizes a real JS error headline", () => {
      expect(hasRuntimeErrorEvidence(["TypeError: Cannot read properties of undefined (reading 'role')"])).toBe(true);
    });

    it("recognizes a real 5xx request-log line", () => {
      expect(hasRuntimeErrorEvidence(["GET / 500 in 4248ms"])).toBe(true);
    });

    it("does not flag a clean log", () => {
      expect(hasRuntimeErrorEvidence(["ready on http://localhost:3000", "GET / 200 in 12ms"])).toBe(false);
    });

    it("does not flag an empty log", () => {
      expect(hasRuntimeErrorEvidence([])).toBe(false);
    });
  });

  describe("a failed run", () => {
    it("recognizes a real EADDRINUSE port conflict", () => {
      const guidance = runLocallyGuidance(
        statusOf({ status: "failed", log: ["Error: listen EADDRINUSE: address already in use :::3000"] }),
      );
      expect(guidance.tone).toBe("error");
      expect(guidance.message).toContain("already using that port");
    });

    it("recognizes a missing \"dev\" script", () => {
      const guidance = runLocallyGuidance(
        statusOf({ status: "failed", log: ['npm error missing script: "dev"'] }),
      );
      expect(guidance.message).toContain('no "dev" script');
    });

    it("recognizes a missing package.json", () => {
      const guidance = runLocallyGuidance(
        statusOf({ status: "failed", log: ["npm error code ENOENT", "npm error path /dest/package.json"] }),
      );
      expect(guidance.message).toContain('no "dev" script');
    });

    it("recognizes an npm registry/network failure", () => {
      const guidance = runLocallyGuidance(
        statusOf({ status: "failed", log: ["npm error code ENOTFOUND", "npm error network request to https://registry.npmjs.org failed"] }),
      );
      expect(guidance.message).toContain("couldn't reach its registry");
    });

    it("recognizes a permissions failure", () => {
      const guidance = runLocallyGuidance(statusOf({ status: "failed", log: ["Error: EACCES: permission denied"] }));
      expect(guidance.message).toContain("permissions error");
    });

    it("falls back to a generic, still-honest message rather than guessing a cause it cannot support", () => {
      const guidance = runLocallyGuidance(statusOf({ status: "failed", log: ["something totally unrecognized blew up"] }));
      expect(guidance.tone).toBe("error");
      expect(guidance.message).toContain("exited with an error");
      expect(guidance.message).toContain("Scroll through the log below");
    });
  });
});
