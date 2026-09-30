import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MyClaudeUsageDashboard } from "@/lib/claudeUsage/myUsage";
import { CLI_POLL_INTERVAL_MS } from "@/lib/claudeUsage/useUsageAutoRefresh";
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
  week: {
    from: "2026-09-28",
    to: "2026-09-28",
    inputTokens: 1_000,
    outputTokens: 619_000,
    totalTokens: 620_000,
    budgetTokens: 1_200_000,
    pctUsed: 52,
    remainingTokens: 580_000,
  },
  subscriptionUsdPerMonth: 25,
};

describe("MyClaudeUsageSection (ADR-058, ADR-065)", () => {
  beforeEach(() => {
    fetchMyUsage.mockReset();
    fetchMyUsage.mockResolvedValue(DASHBOARD);
  });

  it("leads with today's tokens, not dollars, split into input and output", async () => {
    render(<MyClaudeUsageSection />);

    expect(await screen.findByTestId("my-usage-today-tokens")).toHaveTextContent("41.6K tokens");
    const today = screen.getByRole("heading", { name: "Today's Usage" }).closest("section") as HTMLElement;
    expect(within(today).getByText("3.3K")).toBeInTheDocument();
    expect(within(today).getByText("38.3K")).toBeInTheDocument();
    expect(within(today).queryByText(/\$/)).toBeNull();
  });

  it("shows the week against the weekly budget with a progress bar and what is left", async () => {
    render(<MyClaudeUsageSection />);

    expect(await screen.findByTestId("my-usage-week-tokens")).toHaveTextContent("620K / 1.2M tokens");
    expect(screen.getByText("52% used")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Weekly usage" })).toHaveAttribute("aria-valuenow", "52");
    expect(screen.getByText(/580K remaining/)).toBeInTheDocument();
  });

  it("caps the bar at 100% when the week is over budget", async () => {
    fetchMyUsage.mockResolvedValue({
      ...DASHBOARD,
      week: { ...DASHBOARD.week, totalTokens: 1_500_000, pctUsed: 125, remainingTokens: 0 },
    });
    render(<MyClaudeUsageSection />);

    expect(await screen.findByRole("progressbar", { name: "Weekly usage" })).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("125% used")).toBeInTheDocument();
  });

  it("lists each model's input, output and total tokens", async () => {
    render(<MyClaudeUsageSection />);

    const table = await screen.findByRole("table", { name: "Model usage" });
    const opus = within(table).getByText("Claude Opus 5.5").closest("tr") as HTMLElement;
    expect(within(opus).getAllByRole("cell").map((c) => c.textContent)).toEqual(["Claude Opus 5.5", "1.4K", "38.3K", "39.7K"]);
    const haiku = within(table).getByText("Claude Haiku 4.5").closest("tr") as HTMLElement;
    expect(within(haiku).getAllByRole("cell").map((c) => c.textContent)).toEqual(["Claude Haiku 4.5", "1.9K", "16", "1.9K"]);
  });

  it("labels the dollar figure Reference API Cost, with the not-a-charge note and per-model lines", async () => {
    render(<MyClaudeUsageSection />);

    expect(await screen.findByTestId("my-usage-total-cost")).toHaveTextContent("$2.74");
    expect(screen.getByRole("heading", { name: "Reference API Cost" })).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(
      "API-equivalent estimate only. This is not an additional Claude subscription charge.",
    );
    const lines = within(screen.getByTestId("my-usage-cost-models")).getAllByRole("listitem").map((li) => li.textContent);
    expect(lines).toEqual(["Opus · 39.7K tokens · $2.73", "Haiku · 1.9K tokens · $0.0020"]);
    expect(screen.getByText("↑ 12% from previous 7 days")).toBeInTheDocument();
    for (const banned of [/Claude Bill/i, /Amount Paid/i, /Subscription Cost/i, /Additional Cost/i]) {
      expect(screen.queryByText(banned)).toBeNull();
    }
  });

  it("shows the subscription on its own, never reduced by the API cost", async () => {
    render(<MyClaudeUsageSection />);

    expect(await screen.findByTestId("my-usage-subscription")).toHaveTextContent("$25 / month");
    // $25 - $2.74 must not appear anywhere as a "remaining balance".
    expect(screen.queryByText(/\$22\.26/)).toBeNull();
  });

  it("re-reads the chosen window from the backend", async () => {
    render(<MyClaudeUsageSection />);
    await screen.findByTestId("my-usage-today-tokens");
    expect(fetchMyUsage).toHaveBeenLastCalledWith(7);

    await userEvent.selectOptions(screen.getByLabelText("Period"), "30");

    expect(fetchMyUsage).toHaveBeenLastCalledWith(30);
  });
});

describe("MyClaudeUsageSection — refresh after claude-team-usage (ADR-060)", () => {
  beforeEach(() => {
    fetchMyUsage.mockReset();
    fetchMyUsage.mockResolvedValue(DASHBOARD);
    window.history.replaceState(null, "", "/my-claude-usage");
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("re-reads the usage when the window regains focus", async () => {
    render(<MyClaudeUsageSection />);
    await screen.findByTestId("my-usage-today-tokens");
    expect(fetchMyUsage).toHaveBeenCalledTimes(1);

    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.advanceTimersByTime(3_000); // past the double-event guard
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => expect(fetchMyUsage).toHaveBeenCalledTimes(2));
  });

  it("returning from the CLI sign-in: drops the marker, polls, and stops once the upload lands", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.history.replaceState(null, "", "/my-claude-usage?cli=signed-in");
    render(<MyClaudeUsageSection />);

    expect(await screen.findByRole("status")).toHaveTextContent(/finishes uploading/);
    expect(window.location.search).toBe("");

    fetchMyUsage.mockResolvedValue({ ...DASHBOARD, lastUpdated: "2026-09-30T09:00:00Z" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CLI_POLL_INTERVAL_MS);
    });

    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    const calls = fetchMyUsage.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CLI_POLL_INTERVAL_MS * 3);
    });
    expect(fetchMyUsage).toHaveBeenCalledTimes(calls); // polling stopped
  });

  it("does not poll on an ordinary visit", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MyClaudeUsageSection />);
    await screen.findByTestId("my-usage-today-tokens");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CLI_POLL_INTERVAL_MS * 3);
    });
    expect(fetchMyUsage).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
