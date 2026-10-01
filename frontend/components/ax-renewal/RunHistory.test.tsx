import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ax-renewal/api", () => ({
  listImplementationRuns: vi.fn(),
  fetchGeneratedChanges: vi.fn(),
}));

import { fetchGeneratedChanges, listImplementationRuns, type AxRenewalRunSummary } from "@/lib/ax-renewal/api";
import { RunHistory, formatDuration } from "./RunHistory";

/** The Build → Implementation run history (ADR-078). */
describe("RunHistory", () => {
  function run(overrides: Partial<AxRenewalRunSummary> = {}): AxRenewalRunSummary {
    return {
      id: "r1",
      runKind: "plan",
      status: "applied",
      startedAt: "2026-10-01T09:00:00Z",
      startedBy: "u1",
      startedByName: "Dara",
      completedAt: "2026-10-01T09:12:00Z",
      failureReason: null,
      instruction: null,
      changedFiles: 2,
      ...overrides,
    };
  }

  beforeEach(() => vi.clearAllMocks());

  it("lists every run newest first, with what it was, how it ended and who started it", async () => {
    vi.mocked(listImplementationRuns).mockResolvedValue([
      run({ id: "r3", runKind: "ui_change", status: "awaiting_review", instruction: "Make the header blue", completedAt: null, changedFiles: 1 }),
      run({ id: "r2", runKind: "error_fix", status: "failed", startedByName: "Sokha", failureReason: "the local model could not be reached", changedFiles: 0 }),
      run({ id: "r1" }),
    ]);

    render(<RunHistory projectId="p1" refreshKey="r3:awaiting_review" />);

    const rows = await screen.findAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("UI change");
    expect(rows[0]).toHaveTextContent("awaiting review");
    expect(rows[0]).toHaveTextContent("Requested: Make the header blue");
    expect(rows[0]).toHaveTextContent("in progress");
    expect(rows[1]).toHaveTextContent("Error fix");
    expect(rows[1]).toHaveTextContent("Started by Sokha");
    expect(rows[1]).toHaveTextContent("the local model could not be reached");
    expect(rows[2]).toHaveTextContent("Plan build");
    expect(rows[2]).toHaveTextContent("took 12 min");
    expect(rows[2]).toHaveTextContent("2 files");
  });

  it("says so when the project has no runs yet", async () => {
    vi.mocked(listImplementationRuns).mockResolvedValue([]);

    render(<RunHistory projectId="p1" refreshKey="none:" />);

    expect(await screen.findByText(/No runs yet/)).toBeInTheDocument();
  });

  it("shows a run's changed files on opening it — fetched then, not with the list", async () => {
    vi.mocked(listImplementationRuns).mockResolvedValue([run()]);
    vi.mocked(fetchGeneratedChanges).mockResolvedValue([
      { path: "src/App.tsx", changeKind: "modify", beforeContent: "a", afterContent: "b" },
      { path: "src/new.ts", changeKind: "create", beforeContent: null, afterContent: "c" },
    ]);
    render(<RunHistory projectId="p1" refreshKey="r1:applied" />);
    await screen.findByText("Plan build");
    expect(fetchGeneratedChanges).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { expanded: false }));

    const files = await screen.findByRole("list", { name: "Changed files" });
    expect(within(files).getByText("src/App.tsx")).toBeInTheDocument();
    expect(within(files).getByText("src/new.ts")).toBeInTheDocument();
    expect(fetchGeneratedChanges).toHaveBeenCalledWith("p1", "r1");
  });

  it("does not ask for files a run never proposed", async () => {
    vi.mocked(listImplementationRuns).mockResolvedValue([run({ status: "failed", changedFiles: 0 })]);
    render(<RunHistory projectId="p1" refreshKey="r1:failed" />);
    await screen.findByText("Plan build");

    fireEvent.click(screen.getByRole("button", { expanded: false }));

    expect(screen.getByText("This run proposed no file changes.")).toBeInTheDocument();
    expect(fetchGeneratedChanges).not.toHaveBeenCalled();
  });

  it("offers nothing to act on — history is read-only", async () => {
    vi.mocked(listImplementationRuns).mockResolvedValue([run()]);
    render(<RunHistory projectId="p1" refreshKey="r1:applied" />);
    await screen.findByText("Plan build");

    // The only control per row is the expand toggle; revert/approve stay on
    // the current run, where the backend's latest-run rules apply.
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /revert|approve|reject/i })).not.toBeInTheDocument();
  });

  it("re-reads when the latest run changes", async () => {
    vi.mocked(listImplementationRuns).mockResolvedValue([run()]);
    const { rerender } = render(<RunHistory projectId="p1" refreshKey="r1:generating" />);
    await waitFor(() => expect(listImplementationRuns).toHaveBeenCalledTimes(1));

    rerender(<RunHistory projectId="p1" refreshKey="r1:awaiting_review" />);

    await waitFor(() => expect(listImplementationRuns).toHaveBeenCalledTimes(2));
  });

  it("shows why the history could not load", async () => {
    vi.mocked(listImplementationRuns).mockRejectedValue(new Error("Couldn't reach the server."));

    render(<RunHistory projectId="p1" refreshKey="none:" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't reach the server.");
  });
});

describe("formatDuration", () => {
  it.each([
    ["2026-10-01T09:00:00Z", "2026-10-01T09:00:45Z", "45s"],
    ["2026-10-01T09:00:00Z", "2026-10-01T09:12:00Z", "12 min"],
    ["2026-10-01T09:00:00Z", "2026-10-01T10:05:00Z", "1h 5m"],
  ])("%s → %s reads as %s", (start, end, expected) => {
    expect(formatDuration(start, end)).toBe(expected);
  });

  it("is null while the run has not finished", () => {
    expect(formatDuration("2026-10-01T09:00:00Z", null)).toBeNull();
  });
});
