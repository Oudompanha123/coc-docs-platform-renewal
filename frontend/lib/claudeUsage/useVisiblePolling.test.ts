import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVisiblePolling } from "./useVisiblePolling";

// req: FR-USAGE-002, ADR-096

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useVisiblePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });
  afterEach(() => {
    vi.useRealTimers();
    setVisibility("visible");
  });

  it("polls on the interval while the tab is visible", () => {
    const poll = vi.fn();
    renderHook(() => useVisiblePolling(poll, 1_000));
    expect(poll).not.toHaveBeenCalled(); // the page's own first load is not doubled
    vi.advanceTimersByTime(3_000);
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it("pauses while hidden, polls once on return, then resumes", () => {
    const poll = vi.fn();
    renderHook(() => useVisiblePolling(poll, 1_000));
    setVisibility("hidden");
    vi.advanceTimersByTime(5_000);
    expect(poll).not.toHaveBeenCalled();

    setVisibility("visible");
    expect(poll).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1_000);
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("keeps one timer across re-renders and uses the newest callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ poll }) => useVisiblePolling(poll, 1_000), { initialProps: { poll: first } });
    rerender({ poll: second });
    rerender({ poll: second });
    vi.advanceTimersByTime(1_000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("does nothing when disabled", () => {
    const poll = vi.fn();
    renderHook(() => useVisiblePolling(poll, 1_000, false));
    vi.advanceTimersByTime(5_000);
    expect(poll).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the timer and the listener on unmount", () => {
    const poll = vi.fn();
    const { unmount } = renderHook(() => useVisiblePolling(poll, 1_000));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    setVisibility("hidden");
    setVisibility("visible"); // no listener left to react
    vi.advanceTimersByTime(5_000);
    expect(poll).not.toHaveBeenCalled();
  });
});
