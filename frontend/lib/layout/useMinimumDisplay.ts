import { useEffect, useRef, useState } from "react";

/**
 * Keeps returning `true` for at least `minMs` after `active` first becomes
 * `true`, even if `active` flips back to `false` sooner — so a loading UI
 * shown for a fast operation is still visible/readable for a moment, rather
 * than flashing for a few milliseconds. Never delays hiding beyond `minMs`
 * from when it was first shown, and never holds it artificially once
 * `active` has been true for at least that long already.
 */
export function useMinimumDisplay(active: boolean, minMs = 300): boolean {
  const [shown, setShown] = useState(active);
  const shownAtRef = useRef<number | null>(active ? Date.now() : null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      shownAtRef.current = Date.now();
      setShown(true);
      return;
    }

    const shownAt = shownAtRef.current;
    const elapsed = shownAt === null ? minMs : Date.now() - shownAt;
    const remaining = Math.max(0, minMs - elapsed);
    if (remaining === 0) {
      setShown(false);
    } else {
      hideTimeoutRef.current = setTimeout(() => setShown(false), remaining);
    }
  }, [active, minMs]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return shown;
}
