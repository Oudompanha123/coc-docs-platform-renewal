"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { hrefFor } from "@/lib/docs/nav-routing";
import type { NavItem } from "@/lib/docs/nav-api";

/**
 * The product page's horizontal sub-item tab bar — plain CSS scroll
 * (`overflow-x-auto`), no carousel library: wheel/drag/touch all work
 * natively. A right-edge fade hints that there's more to scroll to when the
 * tabs overflow the width, and the active tab scrolls itself into view on
 * mount/change so a direct link to a sub-item deep in the list isn't left
 * off-screen.
 *
 * The active background is one shared pill (absolutely positioned inside
 * the same scrolling row as the tabs, so it scrolls with them), not a class
 * toggled per tab — its `left`/`width` are measured off the active tab's
 * real `offsetLeft`/`offsetWidth` and transitioned, which is what makes it
 * slide and resize to the new tab instead of jumping or fading in place.
 *
 * Pinning uses `position: fixed` + a measured spacer, not `position: sticky`
 * — sticky visually failed to pin flush against the viewport here across
 * multiple checks despite compiling to the expected CSS, likely some
 * containing-block interaction specific to this route's nesting that wasn't
 * worth chasing further. `fixed` has no containing-block ambiguity: once
 * `pinned` (the sentinel above this bar has scrolled above the viewport
 * top), the bar is pulled out of flow and pinned at the true viewport top,
 * re-centered to the same content-column width via its own `mx-auto
 * max-w-5xl px-6` (matching `app/docs/[productKey]/layout.tsx`'s content
 * column). A spacer the bar's own measured height replaces the space it
 * vacates, so the page doesn't jump when it un-docks.
 */
export function ProductTabBar({
  productKey,
  items,
  activeSlug,
}: {
  productKey: string;
  items: NavItem[];
  activeSlug: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [pill, setPill] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [pinned, setPinned] = useState(false);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    function checkPinned() {
      if (!sentinel) return;
      setPinned(sentinel.getBoundingClientRect().top <= 0);
    }

    checkPinned();
    window.addEventListener("scroll", checkPinned, { passive: true });
    window.addEventListener("resize", checkPinned);
    return () => {
      window.removeEventListener("scroll", checkPinned);
      window.removeEventListener("resize", checkPinned);
    };
  }, []);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    setBarHeight(bar.offsetHeight);
    const observer = new ResizeObserver(() => setBarHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller) return;

    function measure() {
      if (scroller) setOverflowing(scroller.scrollWidth > scroller.clientWidth + 1);
      // Measured off the active tab's own box (not `inset-y-0` against the
      // scroller, which also includes its own `pb-1` padding) — otherwise
      // the pill comes out taller than a tab's real box, and than the same
      // box's own `hover:bg-page` background on an inactive tab.
      if (active) {
        setPill({
          left: active.offsetLeft,
          top: active.offsetTop,
          width: active.offsetWidth,
          height: active.offsetHeight,
        });
      }
    }
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [items, activeSlug]);

  useLayoutEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [activeSlug]);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      {pinned && <div aria-hidden="true" style={{ height: barHeight + 20 }} />}

      {/* Blurred strip behind the floating gap above the pinned bar — without
          it, that 20px of true viewport space would show whatever content is
          currently scrolling directly underneath, sharp and distracting
          right at the top edge. Lower z-index than the bar itself so it sits
          behind, not over, the tabs. */}
      {pinned && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-10 h-5 backdrop-blur-md"
        />
      )}

      <div className={pinned ? "fixed inset-x-0 top-5 z-20" : "relative"}>
        <div className={pinned ? "mx-auto max-w-5xl px-6" : ""}>
          <div ref={barRef} className="rounded-2xl bg-white p-2 shadow-md">
            <div className="relative">
              <div ref={scrollerRef} className="no-scrollbar relative flex gap-2 overflow-x-auto">
                {pill && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded-full bg-gradient-to-r from-brand-purple to-brand-blue shadow transition-[left,top,width,height] duration-200 ease-out"
                    style={{ left: pill.left, top: pill.top, width: pill.width, height: pill.height }}
                  />
                )}

                {items.map((item) => {
                  const active = item.slug === activeSlug;
                  return (
                    <Link
                      key={item.slug || "index"}
                      ref={active ? activeRef : undefined}
                      href={hrefFor(productKey, item.slug)}
                      className={`relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                        active ? "text-white" : "text-muted hover:bg-page hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {overflowing && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white to-transparent"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
