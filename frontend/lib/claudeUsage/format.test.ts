import { describe, expect, it } from "vitest";
import {
  costChange,
  formatCost,
  formatPrice,
  formatTokens,
  modelDisplayName,
  modelFamilyName,
  modelShortId,
} from "./format";

describe("My Claude Usage formatting (ADR-058)", () => {
  it("compacts token counts the way Claude Code's usage page does", () => {
    expect(formatTokens(0)).toBe("0");
    expect(formatTokens(16)).toBe("16");
    expect(formatTokens(1_940)).toBe("1.9K");
    expect(formatTokens(38_300)).toBe("38.3K");
    expect(formatTokens(107_900)).toBe("107.9K");
    expect(formatTokens(5_512_300)).toBe("5.5M");
    expect(formatTokens(2_000_000)).toBe("2M");
  });

  it("shows four decimals under half a dollar, two above", () => {
    expect(formatCost(0.00198)).toBe("$0.0020");
    expect(formatCost(2.7348)).toBe("$2.73");
    expect(formatCost(2.73678)).toBe("$2.74");
    expect(formatCost(0)).toBe("$0.0000");
  });

  it("names models from their ids, dropping any date suffix", () => {
    expect(modelDisplayName("claude-opus-5-5")).toBe("Claude Opus 5.5");
    expect(modelDisplayName("claude-haiku-4-5-20251001")).toBe("Claude Haiku 4.5");
    expect(modelDisplayName("claude-sonnet-5")).toBe("Claude Sonnet 5");
    expect(modelDisplayName("claude-fable-5-1")).toBe("Claude Fable 5.1");
    expect(modelDisplayName("unattributed")).toBe("Unattributed");
    expect(modelDisplayName("something-else")).toBe("something-else");
    expect(modelShortId("claude-haiku-4-5-20251001")).toBe("claude-haiku-4-5");
  });

  it("shortens a model id to its family for the Reference API Cost card (ADR-065)", () => {
    expect(modelFamilyName("claude-sonnet-4-6")).toBe("Sonnet");
    expect(modelFamilyName("claude-opus-5-5")).toBe("Opus");
    expect(modelFamilyName("claude-haiku-4-5-20251001")).toBe("Haiku");
    expect(modelFamilyName("unattributed")).toBe("Unattributed");
  });

  it("formats a list price without the small-amount decimals", () => {
    expect(formatPrice(25)).toBe("$25");
    expect(formatPrice(22.5)).toBe("$22.50");
  });

  it("compares against the previous window, or not at all when it had no spend", () => {
    expect(costChange(2.74, 2.45)).toEqual({ pct: 12, up: true });
    expect(costChange(1, 2)).toEqual({ pct: 50, up: false });
    expect(costChange(1, 0)).toBeNull();
  });
});
