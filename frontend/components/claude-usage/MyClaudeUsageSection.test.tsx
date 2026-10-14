import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MyClaudeUsageDashboard } from "@/lib/claudeUsage/myUsage";
import { CLI_POLL_INTERVAL_MS } from "@/lib/claudeUsage/useUsageAutoRefresh";
import { MyClaudeUsageSection } from "./MyClaudeUsageSection";

const { fetchMyUsage } = vi.hoisted(() => ({ fetchMyUsage: vi.fn() }));
vi.mock("@/lib/claudeUsage/myUsage", () => ({ fetchMyUsage }));
vi.mock("@/components/claude-usage/MyUsageHistoryChart", () => ({ MyUsageHistoryChart: () => null }));
vi.mock("@/components/claude-usage/MyScanStatusSection", () => ({ MyScanStatusSection: () => null }));

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

  it("lists each day and model with its tokens, cache and reference cost in one table", async () => {
    render(<MyClaudeUsageSection />);

    const table = await screen.findByRole("table", { name: "Model usage" });
    const opus = within(table).getByText("Claude Opus 5.5").closest("tr") as HTMLElement;
    expect(within(opus).getAllByRole("cell").map((c) => c.textContent)).toEqual([
      new Date(2026, 8, 28).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      "Claude Opus 5.5",
      "1.4K",
      "38.3K",
      "39.7K",
      "5.5M",
      "107.9K",
      "$2.73",
    ]);
    expect(screen.queryByRole("heading", { name: "Recent Usage" })).toBeNull();
  });

  it("shows Last scan apart from Last usage update — a scan with nothing new moves only the first (ADR-097)", async () => {
    const uploaded = "2026-10-06T07:50:00Z"; // the 14:50 upload
    const scanned = "2026-10-06T09:00:00Z"; // the 16:00 scan that found nothing new
    fetchMyUsage.mockResolvedValue({ ...DASHBOARD, lastUpdated: uploaded, lastScanAt: scanned });
    const fmt = (iso: string) =>
      new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

    render(<MyClaudeUsageSection />);

    expect(await screen.findByText(`Last scan: ${fmt(scanned)}`)).toBeTruthy();
    expect(screen.getByText(`Last usage update: ${fmt(uploaded)}`)).toBeTruthy();
  });

  it("says Never for a scan time an older backend does not send", async () => {
    render(<MyClaudeUsageSection />);
    expect(await screen.findByText("Last scan: Never")).toBeTruthy();
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
    await screen.findByTestId("my-usage-total-cost");
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
    await screen.findByTestId("my-usage-total-cost");
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
    await screen.findByTestId("my-usage-total-cost");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CLI_POLL_INTERVAL_MS * 3);
    });
    expect(fetchMyUsage).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
