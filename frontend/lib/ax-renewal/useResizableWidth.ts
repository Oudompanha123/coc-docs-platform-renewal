"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

interface UseResizableWidthOptions {
  /** sessionStorage key — remembers the width for reload, not across browser restarts (no existing persistence layer to extend for AX Renewal panel sizes, so this stays local rather than reaching for localStorage/a backend setting). */
  storageKey: string;
  defaultWidth: number;
  min: number;
  max: number;
  /** +1: dragging right grows the panel (a right-edge handle, e.g. the Explorer sidebar). -1: dragging left grows it (a left-edge handle, e.g. the AX Assistant panel). */
  direction: 1 | -1;
}

/** Drag-to-resize width state for one panel, with a hand-rolled pointer-drag (no resizable-panel dependency — this app doesn't have one, and the interaction is a single clamped width, not worth a library). */
export function useResizableWidth({ storageKey, defaultWidth, min, max, direction }: UseResizableWidthOptions) {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const widthRef = useRef(width);
  widthRef.current = width;

  // Read once on mount, client-side only — avoids an SSR/hydration mismatch
  // from reading sessionStorage during render.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      const parsed = stored == null ? NaN : Number(stored);
      if (Number.isFinite(parsed)) {
        setWidth(Math.min(max, Math.max(min, parsed)));
      }
    } catch {
      // sessionStorage unavailable (private mode, etc.) — default width stands.
    }
    // Only ever runs once per mounted panel — re-running on a min/max change
    // would silently reset an in-progress resize to a stale stored value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const startDrag = useCallback(
    (event: ReactPointerEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = widthRef.current;
      setIsDragging(true);
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      function clamp(next: number) {
        return Math.min(max, Math.max(min, next));
      }

      function onMove(e: PointerEvent) {
        setWidth(clamp(startWidth + (e.clientX - startX) * direction));
      }

      function onUp(e: PointerEvent) {
        const finalWidth = clamp(startWidth + (e.clientX - startX) * direction);
        setWidth(finalWidth);
        setIsDragging(false);
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        try {
          sessionStorage.setItem(storageKey, String(finalWidth));
        } catch {
          // Best-effort only — a failed write just means the width resets next reload.
        }
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [direction, max, min, storageKey],
  );

  return { width, isDragging, startDrag };
}
