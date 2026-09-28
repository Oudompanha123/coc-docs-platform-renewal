import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeResponse } from "@/lib/auth/api";
import { UsageSnapshotPanel } from "./UsageSnapshotPanel";

const { fetchMyUsage } = vi.hoisted(() => ({ fetchMyUsage: vi.fn() }));
vi.mock("@/lib/claudeUsage/myUsage", () => ({ fetchMyUsage }));

const { fetchDashboard } = vi.hoisted(() => ({ fetchDashboard: vi.fn() }));
vi.mock("@/lib/admin/claudeUsage", () => ({ fetchDashboard }));

const sessionUser: Partial<MeResponse> = {
  email: "dana@example.com",
  role: "user",
  roles: ["user"],
};
const { session } = vi.hoisted(() => ({ session: { current: {} as { user: Partial<MeResponse> } } }));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ status: "authenticated", ...session.current }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  session.current = { user: sessionUser };
});

describe("UsageSnapshotPanel — non-admin (ADR-052)", () => {
  it("calls the personal endpoint, never the admin team dashboard", async () => {
    fetchMyUsage.mockResolvedValue({
      email: "dana@example.com",
      displayName: "Dana",
      today: "2026-09-25",
      todayInputTokens: 100,
      todayOutputTokens: 50,
      todayTotalTokens: 150,
      daily: [],
      lastUpdated: "2026-09-25T08:00:00Z",
    });

    render(<UsageSnapshotPanel />);

    await screen.findByText("150");
    expect(fetchDashboard).not.toHaveBeenCalled();
  });

  it("shows a call to action linking to /claude-usage for someone who has never reported", async () => {
    fetchMyUsage.mockResolvedValue({
      email: "dana@example.com",
      displayName: "Dana",
      today: "2026-09-25",
      todayInputTokens: 0,
      todayOutputTokens: 0,
      todayTotalTokens: 0,
      daily: [],
      lastUpdated: null,
    });

    render(<UsageSnapshotPanel />);

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "/claude-usage");
  });

  it("shows today's real token total and still links to /claude-usage", async () => {
    fetchMyUsage.mockResolvedValue({
      email: "dana@example.com",
      displayName: "Dana",
      today: "2026-09-25",
      todayInputTokens: 900,
      todayOutputTokens: 100,
      todayTotalTokens: 1_000,
      daily: [],
      lastUpdated: "2026-09-25T08:00:00Z",
    });

    render(<UsageSnapshotPanel />);

    expect(await screen.findByText("1k")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open my usage/i })).toHaveAttribute("href", "/claude-usage");
  });

  it("shows an error state linking to /claude-usage rather than crashing", async () => {
    fetchMyUsage.mockRejectedValue(new Error("nope"));

    render(<UsageSnapshotPanel />);

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "/claude-usage");
  });
});

describe("UsageSnapshotPanel — admin", () => {
  it("still reads the team dashboard, never the personal endpoint", async () => {
    session.current = { user: { email: "admin@example.com", role: "admin", roles: ["admin"] } };
    fetchDashboard.mockResolvedValue({
      period: "week",
      from: "2026-09-14",
      to: "2026-09-20",
      members: [],
      daily: [],
      totals: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, totalTokens: 0, costUsd: 0 },
      activeUsers: 0,
      nearLimit: 0,
      lastUpdated: null,
    });

    render(<UsageSnapshotPanel />);

    await screen.findByRole("link", { name: /open claude usage/i });
    expect(fetchMyUsage).not.toHaveBeenCalled();
  });
});
