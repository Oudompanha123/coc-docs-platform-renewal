import { describe, expect, it } from "vitest";
import { describeCommand, parseCommand } from "./commands";

describe("parseCommand", () => {
  it("recognizes confirming a section by its full name", () => {
    expect(parseCommand("confirm database")).toEqual({ type: "confirm", section: "database" });
    expect(parseCommand("confirm architecture")).toEqual({ type: "confirm", section: "architecture" });
    expect(parseCommand("confirm pages")).toEqual({ type: "confirm", section: "pages" });
  });

  it("recognizes stack move under any of its aliases", () => {
    expect(parseCommand("confirm stack move")).toEqual({ type: "confirm", section: "stack_move" });
    expect(parseCommand("confirm stack")).toEqual({ type: "confirm", section: "stack_move" });
    expect(parseCommand("confirm move")).toEqual({ type: "confirm", section: "stack_move" });
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(parseCommand("  Confirm DATABASE  ")).toEqual({ type: "confirm", section: "database" });
  });

  it("recognizes confirm all / everything", () => {
    expect(parseCommand("confirm all")).toEqual({ type: "confirm-all" });
    expect(parseCommand("confirm everything")).toEqual({ type: "confirm-all" });
  });

  it("recognizes reopening a section", () => {
    expect(parseCommand("reopen database")).toEqual({ type: "reopen", section: "database" });
  });

  it("recognizes run analysis and start implementation", () => {
    expect(parseCommand("run analysis")).toEqual({ type: "run-analysis" });
    expect(parseCommand("start implementation")).toEqual({ type: "start-implementation" });
  });

  it("recognizes opening a tab", () => {
    expect(parseCommand("open findings")).toEqual({ type: "open", tab: "findings" });
    expect(parseCommand("open ai engine")).toEqual({ type: "open", tab: "ai-engine" });
  });

  it("returns null for free text that isn't a recognized command, so callers can fall back to a comment", () => {
    expect(parseCommand("use React 19 for the frontend")).toBeNull();
    expect(parseCommand("remove the checkout page")).toBeNull();
    expect(parseCommand("what do you think about this plan?")).toBeNull();
    expect(parseCommand("")).toBeNull();
  });

  it("does not confirm an unrecognized section name", () => {
    expect(parseCommand("confirm the vibes")).toBeNull();
  });
});

describe("describeCommand", () => {
  it("describes each command type in plain terms", () => {
    expect(describeCommand({ type: "confirm", section: "database" })).toBe("Database confirmed");
    expect(describeCommand({ type: "confirm-all" })).toBe("all four sections confirmed");
    expect(describeCommand({ type: "run-analysis" })).toBe("analysis started");
    expect(describeCommand({ type: "start-implementation" })).toBe("implementation started");
    expect(describeCommand({ type: "open", tab: "findings" })).toBe("opened findings");
  });
});
