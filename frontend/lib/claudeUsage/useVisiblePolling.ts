"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `poll` every `intervalMs` while the tab is visible, and stops while it
 * is hidden — a backgrounded admin tab should not keep hitting the API.
 * Coming back to the tab polls once straight away (whatever arrived while it
 * was hidden), then resumes the interval.
 *
 * One timer per mount: `poll` is read through a ref, so a new callback each
 * render (e.g. a changed date range) is picked up without restarting it.
 * Everything is cleared on unmount or when `enabled` turns false.
 *
 * Unlike `useUsageAutoRefresh`, which re-reads on focus and polls only
 * briefly after the CLI's sign-in, this polls for as long as the page is open.
 *
 * // req: FR-USAGE-002, ADR-099
 */
export function useVisiblePolling(poll: () => unknown, intervalMs: number, enabled = true): void {
  const pollRef = useRef(poll);
  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;
    const tick = () => void pollRef.current();
    const start = () => {
      if (timer === undefined) timer = window.setInterval(tick, intervalMs);
    };
    const stop = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
