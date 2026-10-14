"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "@/lib/layout/ShellContext";

/** Dragged this far past the minimum, the sidebar folds to its rail instead. */
const COLLAPSE_BELOW = SIDEBAR_MIN_WIDTH - 48;
const KEY_STEP = 16;

/**
 * The admin sidebar's drag-to-resize edge (ADR-104 r2.12) — the claude.ai
 * pattern: an invisible strip straddling the sidebar's right border that
 * shows a short grey pill on hover, and a col-resize cursor. Drag to set the
 * width, drag well past the minimum to fold to the icon rail, double-click
 * to go back to the default width.
 *
 * A focusable `separator` with its value, so the keyboard can do the same:
 * ←/→ resize in 16px steps, Home/End jump to the limits.
 */
export function SidebarResizeHandle({
  width,
  onResize,
  onCollapse,
  onDraggingChange,
}: {
  width: number;
  onResize: (width: number) => void;
  onCollapse: () => void;
  onDraggingChange?: (dragging: boolean) => void;
}) {
  const start = useRef<{ x: number; width: number } | null>(null);
  const lastRaw = useRef(width);
  const [dragging, setDragging] = useState(false);

  function setDrag(next: boolean) {
    setDragging(next);
    onDraggingChange?.(next);
    // The cursor and the no-text-selection rule have to hold over the whole
    // page while dragging, not just over the 12px strip the pointer left.
    document.body.style.cursor = next ? "col-resize" : "";
    document.body.style.userSelect = next ? "none" : "";
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, width };
    lastRaw.current = width;
    setDrag(true);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const raw = start.current.width + (e.clientX - start.current.x);
    lastRaw.current = raw;
    onResize(raw);
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const raw = lastRaw.current;
    const startWidth = start.current.width;
    start.current = null;
    setDrag(false);
    if (raw < COLLAPSE_BELOW) {
      // Folded, not shrunk: reopening brings back the width it had before.
      onResize(startWidth);
      onCollapse();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const next =
      e.key === "ArrowLeft" ? width - KEY_STEP
      : e.key === "ArrowRight" ? width + KEY_STEP
      : e.key === "Home" ? SIDEBAR_MIN_WIDTH
      : e.key === "End" ? SIDEBAR_MAX_WIDTH
      : null;
    if (next === null) return;
    e.preventDefault();
    onResize(next);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-controls="admin-sidebar"
      aria-valuemin={SIDEBAR_MIN_WIDTH}
      aria-valuemax={SIDEBAR_MAX_WIDTH}
      aria-valuenow={width}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => onResize(SIDEBAR_DEFAULT_WIDTH)}
      onKeyDown={onKeyDown}
      className="group absolute inset-y-0 -right-1.5 z-20 flex w-3 cursor-col-resize touch-none items-center justify-center outline-none"
    >
      <span
        aria-hidden="true"
        className="h-10 w-1 rounded-full bg-nav-muted/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[dragging]:bg-nav-foreground/70 group-data-[dragging]:opacity-100"
      />
    </div>
  );
}
