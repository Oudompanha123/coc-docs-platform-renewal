"use client";

import type { PointerEvent } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/layout/icons";

type ResizeHandleProps = {
  /** Which edge of its own panel the handle sits on — only affects positioning (right-edge handles sit just outside the panel's right border, left-edge just outside its left). */
  edge: "right" | "left";
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  isDragging: boolean;
  label: string;
};

/**
 * A drag-to-resize divider: an 8px hit-area straddling the panel edge, with
 * a thin bar that tints the app's own blue accent on hover/drag (not the
 * reference mockup's amber — matches every other hover/active highlight
 * already in AX Renewal) and a small chevron pair that fades in alongside
 * it, plus a col-resize cursor.
 */
export function ResizeHandle({ edge, onPointerDown, isDragging, label }: ResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      onPointerDown={onPointerDown}
      data-dragging={isDragging || undefined}
      className={`ax-resize-handle group absolute inset-y-0 z-10 flex w-2 cursor-col-resize touch-none items-center justify-center ${
        edge === "right" ? "-right-1" : "-left-1"
      }`}
    >
      <div className="ax-resize-bar h-full w-[3px] rounded-full transition-colors" />
      <span className="ax-resize-chevrons pointer-events-none absolute flex items-center opacity-0 transition-opacity">
        <ChevronLeftIcon className="h-3 w-3 text-foreground" />
        <ChevronRightIcon className="-ml-1 h-3 w-3 text-foreground" />
      </span>
    </div>
  );
}
