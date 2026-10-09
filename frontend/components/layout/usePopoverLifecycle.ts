"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * The behaviours every portaled sidebar "⋮" popover needs once it's no
 * longer clipped by the sidebar's own `overflow-y-auto` (which is the whole
 * reason it's portaled to `<body>` in the first place — see
 * SidebarItemMenu's module comment): stay anchored to its trigger across a
 * window resize, and close itself on a scroll or a route change rather than
 * floating over content it no longer points at.
 *
 * <p>Closing on scroll uses a capturing `window` listener — the sidebar's
 * own nav list scrolls internally and doesn't bubble a "scroll" event, but a
 * capture-phase listener on `window` still observes it.
 *
 * <p>`onRecompute`/`onClose` are read through refs, kept current every
 * render, rather than listed as effect dependencies — a caller whose own
 * recompute logic depends on other state (e.g. "also reposition the open
 * submenu") would otherwise need the listener torn down and re-attached on
 * every one of those changes just to avoid a stale closure.
 */
export function usePopoverLifecycle({
  isOpen,
  onRecompute,
  onClose,
}: {
  isOpen: boolean;
  onRecompute: () => void;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const onRecomputeRef = useRef(onRecompute);
  const onCloseRef = useRef(onClose);
  onRecomputeRef.current = onRecompute;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    onCloseRef.current();
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    function handleResize() {
      onRecomputeRef.current();
    }
    function handleScroll() {
      onCloseRef.current();
    }
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);
}
