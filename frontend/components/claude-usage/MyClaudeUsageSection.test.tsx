import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MyClaudeUsageDashboard } from "@/lib/claudeUsage/myUsage";
import { MyClaudeUsageSection } from "./MyClaudeUsageSection";

const { fetchMyUsage } = vi.hoisted(() => ({ fetchMyUsage: vi.fn() }));
vi.mock("@/lib/claudeUsage/myUsage", () => ({ fetchMyUsage }));
vi.mock("@/components/claude-usage/MyUsageHistoryChart", () => ({ MyUsageHistoryChart: () => null }));

// Claude Code's usage page for one real session: Haiku 1.9k/16/0/0 $0.0020, Opus 5.5 1.4k/38.3k/5.5m/107.9k $2.73.
const DASHBOARD: MyClaudeUsageDashboard = {
  email: "me@cocdocs.example",
  displayName: "Me",
  today: "2026-09-28",
  todayInputTokens: 3_300,
  todayOutputTokens: 38_316,
  todayTotalTokens: 41_616,
  daily: [],
  lastUpdated: null,
  todayUsage: null,
  usage: {
    rangeDays: 7,
    from: "2026-09-22",
    to: "2026-09-28",
    inputTokens: 3_300,
    outputTokens: 38_316,
    cacheReadTokens: 5_500_000,
    cacheWriteTokens: 107_900,
    costUsd: 2.73678,
    previousCostUsd: 2.45,
    byModel: [
      { model: "claude-opus-5-5", inputTokens: 1_400, outputTokens: 38_300, cacheReadTokens: 5_500_000, cacheWriteTokens: 107_900, costUsd: 2.7348 },
      { model: "claude-haiku-4-5-20251001", inputTokens: 1_900, outputTokens: 16, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0.00198 },
    ],
    recent: [
      { date: "2026-09-28", model: "claude-opus-5-5", inputTokens: 1_400, outputTokens: 38_300, cacheReadTokens: 5_500_000, cacheWriteTokens: 107_900, costUsd: 2.7348 },
    ],
  },
};

describe("MyClaudeUsageSection (ADR-054)", () => {
  beforeEach(() => {
    fetchMyUsage.mockReset();
    fetchMyUsage.mockResolvedValue(DASHBOARD);
  });

  it("shows the backend's total cost and all four token categories, never input + output alone", async () => {
    render(<MyClaudeUsageSection />);

    expect(await screen.findByTestId("my-usage-total-cost")).toHaveTextContent("$2.74");
    // Once in the all-models totals, once on the Opus card (the table cell is a td).
    expect(screen.getAllByText("5.5M", { selector: "p" })).toHaveLength(2);
    expect(screen.getAllByText("107.9K", { selector: "p" })).toHaveLength(2);
    expect(screen.getByText("↑ 12% from previous 7 days")).toBeInTheDocument();
  });

  it("gives each model its own card with separate categories and its own cost", async () => {
    render(<MyClaudeUsageSection />);

    const opus = (await screen.findByRole("heading", { name: "Claude Opus 5.5" })).closest("div.rounded-\\[10px\\]") as HTMLElement;
    expect(within(opus).getByText("1.4K")).toBeInTheDocument();
    expect(within(opus).getByText("38.3K")).toBeInTheDocument();
    expect(within(opus).getByText("5.5M")).toBeInTheDocument();
    expect(within(opus).getByText("107.9K")).toBeInTheDocument();
    expect(within(opus).getByText("$2.73")).toBeInTheDocument();

    const haiku = screen.getByRole("heading", { name: "Claude Haiku 4.5" }).closest("div.rounded-\\[10px\\]") as HTMLElement;
    expect(within(haiku).getByText("1.9K")).toBeInTheDocument();
    expect(within(haiku).getByText("16")).toBeInTheDocument();
    expect(within(haiku).getByText("$0.0020")).toBeInTheDocument();
  });

  it("re-reads the chosen window from the backend", async () => {
    render(<MyClaudeUsageSection />);
    await screen.findByTestId("my-usage-total-cost");
    expect(fetchMyUsage).toHaveBeenLastCalledWith(7);

    await userEvent.selectOptions(screen.getByLabelText("Period"), "30");

    expect(fetchMyUsage).toHaveBeenLastCalledWith(30);
  });
});
