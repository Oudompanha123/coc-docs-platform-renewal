import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClaudeUsageActivityDay, ClaudeUsageMember, ClaudeUsageMemberActivity } from "@/lib/admin/claudeUsage";
import { minusDays, reportDate } from "@/lib/claudeUsage/activity";
import { UserActivityModal } from "./UserActivityModal";

const { fetchMemberActivity } = vi.hoisted(() => ({ fetchMemberActivity: vi.fn() }));
vi.mock("@/lib/admin/claudeUsage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/claudeUsage")>()),
  fetchMemberActivity,
}));

const MEMBER: ClaudeUsageMember = {
  id: "m-1",
  email: "dev@cocdocs.example",
  displayName: "Dev Person",
  teamRole: "member",
  status: "active",
  budgetOverrideTokens: null,
  effectiveBudgetTokens: 1_200_000,
  budgetPct: 5,
  budgetStatus: "green",
  modelsUsed: ["claude-opus-5-5"],
  lastActiveAt: "2026-09-16T09:42:00Z",
  inputTokens: 1_500,
  outputTokens: 60_000,
  totalTokens: 61_500,
  costUsd: 3.2,
  avatarUrl: null,
};

const docs = {
  name: "coc-docs-platform",
  requestCount: 35,
  apiCallCount: 300,
  conversationCount: 3,
  sessionCount: 2,
  activeSeconds: 72 * 60,
  inputTokens: 12_400,
  outputTokens: 48_200,
  cacheReadTokens: 900_000,
  cacheWriteTokens: 20_000,
  totalTokens: 60_600,
  firstAt: "2026-09-16T02:15:00Z", // 09:15 Phnom Penh
  lastAt: "2026-09-16T09:42:00Z", // 16:42
};
const harness = {
  ...docs,
  name: "AX Harness",
  requestCount: 12,
  sessionCount: 1,
  activeSeconds: 26 * 60,
  inputTokens: 4_200,
  outputTokens: 20_100,
  totalTokens: 24_300,
  firstAt: "2026-09-16T03:20:00Z",
  lastAt: "2026-09-16T07:20:00Z",
};
const sessions = [
  { date: "2026-09-16", startedAt: "2026-09-16T06:20:00Z", endedAt: "2026-09-16T07:05:00Z", durationSeconds: 45 * 60, requestCount: 20, projects: ["coc-docs-platform"] },
  { date: "2026-09-16", startedAt: "2026-09-16T02:15:00Z", endedAt: "2026-09-16T02:42:00Z", durationSeconds: 27 * 60, requestCount: 15, projects: ["AX Harness", "coc-docs-platform"] },
];

const DAY: ClaudeUsageActivityDay = {
  date: "2026-09-16",
  reportedAt: "2026-09-16T09:45:00Z",
  inputTokens: 16_600,
  outputTokens: 68_300,
  cacheReadTokens: 1_800_000,
  cacheWriteTokens: 40_000,
  totalTokens: 84_900,
  costUsd: 3,
  models: [
    { model: "claude-opus-5-5", inputTokens: 16_600, outputTokens: 68_300, cacheReadTokens: 1_800_000, cacheWriteTokens: 40_000, totalTokens: 84_900, costUsd: 3 },
  ],
  requestCount: 47,
  apiCallCount: 600,
  conversationCount: 4,
  sessionCount: 2,
  activeSeconds: 72 * 60,
  projects: [docs, harness],
  sessions,
};

const OLD_DAY: ClaudeUsageActivityDay = {
  ...DAY,
  date: "2026-09-14",
  requestCount: null,
  apiCallCount: null,
  conversationCount: null,
  sessionCount: null,
  activeSeconds: null,
  projects: null,
  sessions: null,
};

const ACTIVITY: ClaudeUsageMemberActivity = {
  memberId: "m-1",
  from: "2026-09-16",
  to: "2026-09-16",
  project: null,
  summary: {
    requestCount: 47,
    apiCallCount: 600,
    conversationCount: 4,
    sessionCount: 2,
    activeSeconds: 72 * 60,
    inputTokens: 16_600,
    outputTokens: 68_300,
    cacheReadTokens: 1_800_000,
    cacheWriteTokens: 40_000,
    totalTokens: 84_900,
  },
  daysWithoutActivity: 0,
  projects: [docs, harness],
  sessions,
  days: [DAY],
};

function renderModal(onClose = vi.fn()) {
  render(<UserActivityModal member={MEMBER} avatarColor="#4c6ff0" onClose={onClose} />);
  return onClose;
}

const metric = (label: string) => screen.getByText(label).nextSibling;

describe("UserActivityModal", () => {
  beforeEach(() => {
    fetchMemberActivity.mockReset();
    fetchMemberActivity.mockResolvedValue(ACTIVITY);
  });

  it("opens on today and shows requests, sessions, active duration and total tokens", async () => {
    renderModal();

    const today = reportDate();
    expect(fetchMemberActivity).toHaveBeenCalledWith("m-1", { from: today, to: today, project: null });
    expect(screen.getByText("Dev Person")).toBeInTheDocument();
    expect(screen.getByText("dev@cocdocs.example")).toBeInTheDocument();
    await screen.findByRole("region", { name: "Summary" });
    expect(metric("Requests")).toHaveTextContent("47");
    expect(metric("Sessions")).toHaveTextContent("2");
    expect(metric("Active duration")).toHaveTextContent("1h 12m");
    expect(metric("Total tokens")).toHaveTextContent("84.9K");
  });

  it("lists projects with requests, tokens, active time and first/last use", async () => {
    renderModal();
    const projects = await screen.findByRole("region", { name: "Projects" });

    const row = within(projects).getByRole("button", { name: /coc-docs-platform/ });
    expect(row).toHaveTextContent("35 requests · 60.6K tokens · 1h 12m active");
    expect(row).toHaveTextContent("First used 09:15");
    expect(row).toHaveTextContent("Last used 16:42");
  });

  it("shows each session's span and duration", async () => {
    renderModal();
    const duration = await screen.findByRole("region", { name: "Duration" });

    expect(within(duration).getByText("1h 12m active across 2 sessions")).toBeInTheDocument();
    const rows = within(within(duration).getByRole("list", { name: "Sessions" })).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("13:20 – 14:05");
    expect(rows[0]).toHaveTextContent("45m");
    expect(rows[1]).toHaveTextContent("09:15 – 09:42");
    expect(rows[1]).toHaveTextContent("27m");
  });

  it("charts token usage by project", async () => {
    renderModal();
    const bars = await screen.findByRole("region", { name: "Token usage by project" });

    expect(within(bars).getByText("coc-docs-platform")).toBeInTheDocument();
    expect(within(bars).getByText("60.6K")).toBeInTheDocument();
    expect(within(bars).getByText("24.3K")).toBeInTheDocument();
  });

  it("re-reads the range when a preset is picked, and narrows to a project when one is clicked", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByRole("region", { name: "Projects" });

    await user.click(screen.getByRole("button", { name: "Last 7 days" }));
    const today = reportDate();
    expect(fetchMemberActivity).toHaveBeenLastCalledWith("m-1", { from: minusDays(today, 6), to: today, project: null });

    const projects = await screen.findByRole("region", { name: "Projects" });
    await user.click(within(projects).getByRole("button", { name: /AX Harness/ }));
    expect(fetchMemberActivity).toHaveBeenLastCalledWith("m-1", { from: minusDays(today, 6), to: today, project: "AX Harness" });
  });

  it("shows not-reported activity as a dash with an explanation, never as zero", async () => {
    fetchMemberActivity.mockResolvedValue({
      ...ACTIVITY,
      summary: { ...ACTIVITY.summary, requestCount: null, apiCallCount: null, conversationCount: null, sessionCount: null, activeSeconds: null },
      daysWithoutActivity: 1,
      projects: [],
      sessions: [],
      days: [OLD_DAY],
    });
    renderModal();
    await screen.findByRole("region", { name: "Summary" });

    expect(metric("Requests")).toHaveTextContent("—");
    expect(metric("Active duration")).toHaveTextContent("—");
    expect(metric("Total tokens")).toHaveTextContent("84.9K");
    expect(screen.getByText(/older version of the reporter/)).toBeInTheDocument();
    expect(screen.getByText("Activity not reported")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Projects" })).not.toBeInTheDocument();
  });

  it("opens a day's detail with its sessions, projects and models, and steps back", async () => {
    const user = userEvent.setup();
    renderModal();
    const daily = await screen.findByRole("list", { name: "Daily activity" });

    const row = within(daily).getAllByRole("button")[0]!;
    expect(row).toHaveTextContent("47 requests · 2 sessions · 1h 12m");
    await user.click(row);

    expect(screen.getByText("Day detail")).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "By project" })).getByText("AX Harness")).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "By model" })).getByText("Claude Opus 5.5")).toBeInTheDocument();
    expect(metric("API calls")).toHaveTextContent("600");

    await user.click(screen.getByRole("button", { name: /Back to activity/ }));
    expect(screen.getByText("User Activity")).toBeInTheDocument();
  });

  it("shows the server's error instead of an empty view when the read fails", async () => {
    fetchMemberActivity.mockRejectedValue(new Error("Only an admin or super admin can change Claude usage tracking."));
    renderModal();

    expect(await screen.findByRole("alert")).toHaveTextContent("Only an admin");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = renderModal();
    await screen.findByRole("region", { name: "Summary" });

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
