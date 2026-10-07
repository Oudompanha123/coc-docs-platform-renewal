"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type TransitionEvent } from "react";

/** No modal primitive exists elsewhere in this app yet — this is the minimal
 *  shell both AddAccountModal and DeactivateModal need, styled to match the
 *  existing card convention (rounded-2xl border-border bg-white shadow).
 *  `title` is optional so a caller that needs a custom header (icon above
 *  the heading, e.g. DeactivateModal's warning state) can build it as part
 *  of `children` instead. */
const DEFAULT_CLASS_NAME = "w-full max-w-md overflow-y-auto rounded-[10px] border border-border bg-white p-5 shadow-xl";

/** Length of the `animated` fade, both directions — matches `duration-250` below. */
export const MODAL_FADE_MS = 250;

export function Modal({
  title,
  onClose,
  children,
  className = DEFAULT_CLASS_NAME,
  bodyClassName,
  animated = false,
  closing = false,
  onExited,
  placement = "center",
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  /** Replaces the whole default class list (not merged) — for a caller that
   *  wants its own padding (e.g. ProfileModal removing the horizontal p-5
   *  so its internal scroll region's scrollbar sits at the true edge, and
   *  re-adding that inset itself around its own content instead). Every
   *  other caller omits this and keeps the shared look unchanged. */
  className?: string;
  /** Classes for the wrapper around `children` — for a caller whose panel is
   *  a flex column and needs that wrapper to stretch (UserActivityModal's
   *  fixed-height panel with its own scroll region). */
  bodyClassName?: string;
  /** Fade in on open, and out while `closing` is true. Off by default, so
   *  every existing caller keeps mounting and unmounting instantly. */
  animated?: boolean;
  /** With `animated`: fade out, then call `onExited`. */
  closing?: boolean;
  /** With `animated`: the fade-out has finished — the caller unmounts now. */
  onExited?: () => void;
  /** `right`: a full-height side drawer that slides in from the right edge
   *  instead of a centered card. Same dim, scroll lock and exit handling. */
  placement?: "center" | "right";
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Transitions, not keyframe animations. A transition always runs from the
  // value on screen, so closing mid-open fades out from wherever the fade-in
  // had got to — a keyframe exit restarted at full opacity, which made the
  // dim jump before it faded. `entered` flips one frame after mount so the
  // browser has painted the starting opacity-0 to transition from.
  const [entered, setEntered] = useState(!animated);
  useEffect(() => {
    if (!animated) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [animated]);
  const shown = entered && !closing;

  // Unmount when the dim's own fade-out ends, not on a timer that guesses its
  // length (that one fired before the last frames and cut the fade short).
  // The timer stays only as a backstop for a browser that skips
  // `transitionend` — a hidden tab, or reduced motion making it instant.
  const exited = useRef(false);
  const onExitedRef = useRef(onExited);
  useEffect(() => {
    onExitedRef.current = onExited;
  }, [onExited]);
  const finishExit = useCallback(() => {
    if (exited.current) return;
    exited.current = true;
    onExitedRef.current?.();
  }, []);
  useEffect(() => {
    if (!animated || !closing) return;
    const backstop = window.setTimeout(finishExit, MODAL_FADE_MS + 100);
    return () => window.clearTimeout(backstop);
  }, [animated, closing, finishExit]);
  function onDimTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (closing && event.target === event.currentTarget && event.propertyName === "opacity") finishExit();
  }

  const fade = animated ? ` transition-opacity duration-250 ease-in-out ${shown ? "opacity-100" : "opacity-0"}` : "";
  const drawer = placement === "right";
  const panelFade = !animated
    ? ""
    : drawer
      ? ` transition-transform duration-250 ease-out motion-reduce:transition-none ${shown ? "translate-x-0" : "translate-x-full"}`
      : ` transition-[opacity,transform] duration-250 ease-in-out ${shown ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"}`;
  const bodyClasses = [title ? "mt-4" : "", bodyClassName ?? ""].filter(Boolean).join(" ");

  // The dim is its own layer, a sibling of the panel rather than its parent,
  // so fading it never fades the panel too — nested, the two opacities
  // multiplied and a near-full-screen white panel flashed in.
  return (
    <div
      className={drawer ? "fixed inset-0 z-50 flex justify-end" : "fixed inset-0 z-50 flex items-center justify-center px-4 py-[50px]"}
      onClick={onClose}
    >
      <div aria-hidden="true" data-modal-dim className={`absolute inset-0 bg-black/40${fade}`} onTransitionEnd={onDimTransitionEnd} />
      <div
        className={`relative ${className}${panelFade}`}
        style={{ maxHeight: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-base font-bold text-dash-ink">{title}</h2>}
        <div className={bodyClasses || undefined}>{children}</div>
      </div>
    </div>
  );
}
