import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClaudeUsageMember } from "@/lib/admin/claudeUsage";
import { UsageTable } from "./UsageTable";

// req: FR-USAGE-002, ADR-097 -- the list shows one time: the last scan.

const NOW = new Date(2026, 9, 7, 12, 0);

function member(overrides: Partial<ClaudeUsageMember> = {}): ClaudeUsageMember {
  return {
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
    lastActiveAt: new Date(2026, 9, 6, 16, 55).toISOString(),
    lastScanAt: new Date(2026, 9, 7, 8, 15).toISOString(),
    inputTokens: 1_500,
    outputTokens: 60_000,
    totalTokens: 61_500,
    costUsd: 3.2,
    avatarUrl: null,
    ...overrides,
  };
}

const time = (h: number, m: number) =>
  new Date(2026, 9, 7, h, m).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

describe("UsageTable last-scan column", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("shows only the scan time, not the last-reported time or a 'Scanned' line", () => {
    render(<UsageTable members={[member()]} />);

    expect(screen.getByRole("columnheader", { name: "Last Scan" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Last Reported" })).not.toBeInTheDocument();
    expect(screen.getByText(`Today, ${time(8, 15)}`)).toBeInTheDocument();
    expect(screen.queryByText(/Yesterday/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Scanned/)).not.toBeInTheDocument();
  });

  it("shows a clean placeholder when no scan is recorded", () => {
    render(<UsageTable members={[member({ lastScanAt: null })]} />);
    expect(screen.getByText("No scan recorded")).toBeInTheDocument();
    expect(screen.queryByText(/Yesterday/)).not.toBeInTheDocument();
  });

  it("shows the same placeholder against a backend that predates scan times", () => {
    render(<UsageTable members={[member({ lastScanAt: undefined })]} />);
    expect(screen.getByText("No scan recorded")).toBeInTheDocument();
  });
});
