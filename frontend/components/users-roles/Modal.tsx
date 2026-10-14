"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type TransitionEvent } from "react";
import { XIcon } from "@/components/layout/icons";
import { cn } from "@/lib/utils";

/** No modal primitive exists elsewhere in this app yet — this is the minimal
 *  shell both AddAccountModal and DeactivateModal need, styled to match the
 *  existing card convention (rounded-2xl border-surface-border bg-card shadow).
 *  `title` is optional so a caller that needs a custom header (icon above
 *  the heading, e.g. DeactivateModal's warning state) can build it as part
 *  of `children` instead. */
const DEFAULT_CLASS_NAME = "w-full max-w-md overflow-y-auto rounded-2xl border border-surface-border bg-card p-6 shadow-xl";

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
  ariaLabel,
}: {
  title?: string;
  /** Makes the panel a named `role="dialog"` — for a caller that draws its
   *  own header and has no inner dialog element of its own. */
  ariaLabel?: string;
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
  const bodyClasses = [title ? "mt-3" : "", bodyClassName ?? ""].filter(Boolean).join(" ");

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
        // Opt-in: with `ariaLabel` the panel is the dialog to assistive
        // technology. Not on by default, because several callers already
        // mark their own content `role="dialog"`, and two nested dialogs are
        // worse than one.
        role={ariaLabel ? "dialog" : undefined}
        aria-modal={ariaLabel ? true : undefined}
        aria-label={ariaLabel}
        className={`relative ${className}${panelFade}`}
        style={{ maxHeight: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          // shadcn's dialog header (ADR-104 r2.10): the title, and a close
          // button in the corner — a titled dialog used to be closable only
          // from its own footer or Escape.
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold leading-tight text-foreground">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-2 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className={bodyClasses || undefined}>{children}</div>
      </div>
    </div>
  );
}

/**
 * A dialog's action row, as shadcn's DialogFooter (ADR-104 r2.10): its own
 * strip at the foot of the panel — a hairline above, a faint fill — with the
 * buttons on the right, primary last; on a phone they stack full width with
 * the primary on top. The negative margins reach the panel's `p-6` edges, so
 * it is for the default panel only; a custom-padded dialog builds its own.
 */
export function ModalFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "-mx-6 -mb-6 mt-6 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-surface-border bg-muted-surface/40 px-6 py-4 sm:flex-row sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}
