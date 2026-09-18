"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * A slim indeterminate progress bar across the top of the viewport,
 * distinct from the button-level `Spinner` — for a full page load/route
 * transition rather than one control's own async call. Next.js has no
 * `loading.tsx`/Suspense fallback wired up anywhere in this app yet (every
 * route's data already arrives resolved before render), so this is the one
 * mechanism that covers navigation broadly: it watches every same-origin
 * `<a>` click on the page and shows the bar until `usePathname()` reports
 * the route actually changed.
 *
 * A hard page reload or a `target="_blank"`/download link never fires the
 * pathname-change effect, so the timeout is what clears the bar in those
 * cases rather than leaving it stuck.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisible(false);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  }, [pathname]);

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

      setVisible(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => setVisible(false), 4000);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-transparent">
      <div className="top-progress-bar-fill h-full w-1/3 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" />
    </div>
  );
}
