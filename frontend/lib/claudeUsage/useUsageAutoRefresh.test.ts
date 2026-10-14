import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLI_POLL_INTERVAL_MS,
  CLI_POLL_MAX_MS,
  DASHBOARD_POLL_INTERVAL_MS,
  useUsageAutoRefresh,
} from "./useUsageAutoRefresh";

// req: FR-USAGE-002, FR-USAGE-005 — the dashboards' own refresh: a scan check-in shows without a reload.

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

describe("useUsageAutoRefresh — the once-a-minute refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/claude-usage");
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("re-reads every DASHBOARD_POLL_INTERVAL_MS while the tab is visible", () => {
    const reload = vi.fn();
    renderHook(() => useUsageAutoRefresh(reload, "a"));

    act(() => {
      vi.advanceTimersByTime(DASHBOARD_POLL_INTERVAL_MS - 1);
    });
    expect(reload).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(reload).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(DASHBOARD_POLL_INTERVAL_MS);
    });
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("does not poll while the tab is hidden", () => {
    const reload = vi.fn();
    renderHook(() => useUsageAutoRefresh(reload, "a"));
    setVisibility("hidden");

    act(() => {
      vi.advanceTimersByTime(DASHBOARD_POLL_INTERVAL_MS * 5);
    });
    expect(reload).not.toHaveBeenCalled();
  });

  it("stops for good on unmount", () => {
    const reload = vi.fn();
    const { unmount } = renderHook(() => useUsageAutoRefresh(reload, "a"));
    unmount();

    act(() => {
      vi.advanceTimersByTime(DASHBOARD_POLL_INTERVAL_MS * 5);
    });
    expect(reload).not.toHaveBeenCalled();
  });

  it("stands down while the fast post-sign-in poll runs, then resumes — never both at once", () => {
    window.history.replaceState(null, "", "/claude-usage?cli=signed-in");
    const reload = vi.fn();
    const { result } = renderHook(() => useUsageAutoRefresh(reload, "a"));
    expect(result.current.awaitingCliUpload).toBe(true);

    act(() => {
      vi.advanceTimersByTime(DASHBOARD_POLL_INTERVAL_MS);
    });
    // Only the fast poll's reads: one every CLI_POLL_INTERVAL_MS.
    expect(reload).toHaveBeenCalledTimes(DASHBOARD_POLL_INTERVAL_MS / CLI_POLL_INTERVAL_MS);

    act(() => {
      vi.advanceTimersByTime(CLI_POLL_MAX_MS - DASHBOARD_POLL_INTERVAL_MS);
    });
    expect(result.current.awaitingCliUpload).toBe(false);
    reload.mockClear();
    act(() => {
      vi.advanceTimersByTime(DASHBOARD_POLL_INTERVAL_MS);
    });
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
