"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** How long the bar stays at 100% before it is removed, once the page has arrived. */
export const TOP_PROGRESS_DONE_MS = 400;
/** Gives up waiting for a route change that is never coming (a reload, a link the router does not handle). */
export const TOP_PROGRESS_GIVE_UP_MS = 4000;

type Phase = "idle" | "loading" | "done";

/**
 * A slim progress bar across the full top of the viewport, distinct from the
 * button-level `Spinner` — for a full page load/route transition rather than
 * one control's own async call. Next.js has no `loading.tsx`/Suspense
 * fallback wired up anywhere in this app yet (every route's data already
 * arrives resolved before render), so this is the one mechanism that covers
 * navigation broadly: it watches every same-origin `<a>` click on the page.
 *
 * <p>The fill runs the full width of the screen: it grows from the left edge
 * towards 90% while the next page loads (fast at first, then slower — there is
 * no real percentage to show, so it never claims to be finished), jumps to
 * 100% the moment `usePathname()` reports the route changed, and fades out.
 * It used to be a one-third-width segment sliding back and forth, which never
 * reached the right-hand side — and under reduced motion froze part-way
 * across. Under reduced motion now, the global rule in `globals.css` ends the
 * grow at once, so the bar simply shows at its full extent.
 *
 * <p>A hard page reload or a `target="_blank"`/download link never fires the
 * pathname-change effect, so {@link TOP_PROGRESS_GIVE_UP_MS} is what clears
 * the bar in those cases rather than leaving it stuck.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  // The page arrived: finish the bar, then remove it.
  useEffect(() => {
    setPhase((current) => (current === "loading" ? "done" : current));
  }, [pathname]);

  useEffect(() => {
    if (phase !== "done") return;
    clearTimer();
    timerRef.current = setTimeout(() => setPhase("idle"), TOP_PROGRESS_DONE_MS);
    return clearTimer;
  }, [phase]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname === pathname) return;

      setPhase("loading");
      clearTimer();
      timerRef.current = setTimeout(() => setPhase("done"), TOP_PROGRESS_GIVE_UP_MS);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  useEffect(() => clearTimer, []);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden="true"
      data-phase={phase}
      className="fixed inset-x-0 top-0 z-[100] h-1 w-full overflow-hidden bg-transparent"
    >
      <div
        className={`h-full rounded-r-full bg-gradient-to-r from-brand-purple to-brand-blue ${
          phase === "loading" ? "top-progress-bar-grow" : "top-progress-bar-done"
        }`}
      />
    </div>
  );
}
