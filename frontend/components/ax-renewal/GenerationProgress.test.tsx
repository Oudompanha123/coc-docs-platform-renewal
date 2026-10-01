import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ax-renewal/api", () => ({
  fetchImplementationProgress: vi.fn(),
}));

import { fetchImplementationProgress, type AxRenewalGenerationProgress } from "@/lib/ax-renewal/api";
import { GenerationProgress, PROGRESS_POLL_MS, formatStepDuration } from "./GenerationProgress";

/** The live "what the AI is doing" view of a generating run (ADR-082). */
describe("GenerationProgress", () => {
  function progress(overrides: Partial<AxRenewalGenerationProgress> = {}): AxRenewalGenerationProgress {
    return {
      available: true,
      step: "working",
      stepStartedAt: new Date(Date.now() - 75_000).toISOString(),
      filesRead: 8,
      filesChanged: 3,
      actions: 14,
      activity: [
        { at: "2026-10-01T09:00:01Z", kind: "note", text: "Connected to the local model — starting work", path: null },
        { at: "2026-10-01T09:00:05Z", kind: "read", text: "Reading src/App.tsx", path: "src/App.tsx" },
        { at: "2026-10-01T09:00:09Z", kind: "edit", text: "Editing src/pages/Home.tsx", path: "src/pages/Home.tsx" },
      ],
      earlierActivityDropped: false,
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the step the run is on, the steps before it as done, and the ones after as waiting", async () => {
    vi.mocked(fetchImplementationProgress).mockResolvedValue(progress());

    render(<GenerationProgress projectId="p1" runId="r1" />);

    const bar = await screen.findByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuetext", "Step 2 of 4: The AI is working");
    const steps = within(screen.getByRole("list", { name: "Steps" })).getAllByRole("listitem");
    expect(steps[0]).toHaveTextContent("Preparing a copy of the source (done)");
    expect(steps[1]).toHaveAttribute("aria-current", "step");
    expect(steps[1]).toHaveTextContent("The AI is working");
    expect(steps[1]).toHaveTextContent("for 1m 15s");
    expect(steps[2]).toHaveTextContent("Comparing the result");
    expect(steps[2]).not.toHaveTextContent("(done)");
    expect(steps[3]).toHaveTextContent("Ready for review");
  });

  it("shows the real counts", async () => {
    vi.mocked(fetchImplementationProgress).mockResolvedValue(progress());

    render(<GenerationProgress projectId="p1" runId="r1" />);

    expect(await screen.findByLabelText("Counts")).toHaveTextContent("14 actions · 8 files read · 3 files changed so far");
  });

  it("lists what the AI is doing, as the backend reported it", async () => {
    vi.mocked(fetchImplementationProgress).mockResolvedValue(progress());

    render(<GenerationProgress projectId="p1" runId="r1" />);

    const feed = await screen.findByRole("list", { name: "Live activity" });
    const rows = within(feed).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("Read");
    expect(rows[1]).toHaveTextContent("Reading src/App.tsx");
    expect(rows[2]).toHaveTextContent("Editing src/pages/Home.tsx");
    expect(feed).toHaveAttribute("aria-live", "polite");
  });

  it("re-reads while it is shown", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(fetchImplementationProgress)
      .mockResolvedValueOnce(progress({ step: "preparing", activity: [], actions: 0, filesRead: 0, filesChanged: 0 }))
      .mockResolvedValue(progress({ step: "comparing" }));

    render(<GenerationProgress projectId="p1" runId="r1" />);
    expect(await screen.findByText(/Copying the source/)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PROGRESS_POLL_MS);
    });

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
    expect(fetchImplementationProgress).toHaveBeenCalledTimes(2);
    expect(fetchImplementationProgress).toHaveBeenCalledWith("p1", "r1");
  });

  it("says so when another computer is running the build, instead of showing nothing", async () => {
    vi.mocked(fetchImplementationProgress).mockResolvedValue(
      progress({ available: false, step: null, stepStartedAt: null, activity: [], actions: 0, filesRead: 0, filesChanged: 0 }),
    );

    render(<GenerationProgress projectId="p1" runId="r1" />);

    expect(await screen.findByText(/Live activity is shown on the computer running this build/)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("keeps the last update when a read fails, and says it is behind", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(fetchImplementationProgress)
      .mockResolvedValueOnce(progress())
      .mockRejectedValue(new Error("network"));

    render(<GenerationProgress projectId="p1" runId="r1" />);
    await screen.findByRole("list", { name: "Live activity" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PROGRESS_POLL_MS);
    });

    expect(screen.getByText("Editing src/pages/Home.tsx")).toBeInTheDocument();
    expect(screen.getByText(/Lost touch with the build for a moment/)).toBeInTheDocument();
  });

  it("says when earlier activity has been dropped", async () => {
    vi.mocked(fetchImplementationProgress).mockResolvedValue(progress({ earlierActivityDropped: true }));

    render(<GenerationProgress projectId="p1" runId="r1" />);

    expect(await screen.findByText(/Earlier activity not shown/)).toBeInTheDocument();
  });

  it("shows no percentage anywhere — the model's remaining work is unknown", async () => {
    vi.mocked(fetchImplementationProgress).mockResolvedValue(progress());

    const { container } = render(<GenerationProgress projectId="p1" runId="r1" />);
    await screen.findByRole("progressbar");

    expect(container.textContent).not.toMatch(/\d+\s*%/);
  });
});

describe("formatStepDuration", () => {
  it.each([
    [0, "0s"],
    [45, "45s"],
    [75, "1m 15s"],
    [600, "10m 00s"],
  ])("%s seconds reads as %s", (secs, expected) => {
    expect(formatStepDuration(secs)).toBe(expected);
  });
});
