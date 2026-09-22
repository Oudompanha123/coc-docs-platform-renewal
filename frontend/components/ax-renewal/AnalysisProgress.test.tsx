import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisProgress } from "./AnalysisProgress";

/**
 * The panel shown while Run analysis is in flight.
 *
 * What is pinned here is the honesty, not the styling: the engine label must
 * say what is actually doing the work, and the elapsed clock must be real.
 * The prototype this replaces shows seven stages advancing on a timer with
 * subtitles like "342 files indexed" — constants in its source, describing
 * nobody's project — and this must not drift back towards that.
 *
 * // req: ADR-043
 */
describe("AnalysisProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("says what is doing the analysis, in the slot the prototype uses to admit sample data", () => {
    render(<AnalysisProgress engineLabel="keyword match — no model connected" />);

    expect(screen.getByText("keyword match — no model connected")).toBeInTheDocument();
  });

  it("counts real elapsed time", () => {
    render(<AnalysisProgress engineLabel="local model — reading your source" />);

    expect(screen.getByText("0:00 elapsed")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(65_000);
    });

    // Minutes roll over, and the seconds keep their leading zero.
    expect(screen.getByText("1:05 elapsed")).toBeInTheDocument();
  });

  it("moves from sending to waiting, and says why waiting takes a while", () => {
    render(<AnalysisProgress engineLabel="local model — reading your source" />);

    expect(screen.getByText("Sending the project to the analyser")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.getByText("Waiting for the analyser")).toBeInTheDocument();
    expect(screen.getByText("A model reading real source takes a minute or two.")).toBeInTheDocument();
  });

  it("offers Stop, and calls back so the request is actually aborted", () => {
    // The point of the callback: a Stop that only hid this panel would leave
    // the request running and claim otherwise.
    const onStop = vi.fn();
    render(<AnalysisProgress engineLabel="local model — manifest only" onStop={onStop} />);

    screen.getByRole("button", { name: "Stop" }).click();

    expect(onStop).toHaveBeenCalledOnce();
  });

  it("omits Stop when there is nothing to abort", () => {
    render(<AnalysisProgress engineLabel="keyword match — no model connected" />);

    expect(screen.queryByRole("button", { name: "Stop" })).not.toBeInTheDocument();
  });

  it("shows no percentage, because one backend call reports none", () => {
    // A number here would be a guess dressed as a measurement. The bar is
    // deliberately indeterminate; if a percentage ever appears it must come
    // from real progress, not a timer.
    const { container } = render(<AnalysisProgress engineLabel="local model — reading your source" />);

    expect(container.textContent).not.toMatch(/\d+%/);
  });
});
