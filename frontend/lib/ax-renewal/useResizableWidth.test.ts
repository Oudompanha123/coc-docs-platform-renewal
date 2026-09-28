import { act, renderHook } from "@testing-library/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useResizableWidth } from "./useResizableWidth";

// jsdom's PointerEvent support is inconsistent across versions — dispatching
// a MouseEvent under the "pointermove"/"pointerup" type name works either
// way, since the hook's own window listeners only read `.clientX` off
// whatever event object arrives, never a Pointer-specific API.
function fireWindowPointer(type: "pointermove" | "pointerup", clientX: number) {
  window.dispatchEvent(new MouseEvent(type, { clientX }));
}

function reactPointerDown(clientX: number) {
  return { clientX, preventDefault: vi.fn() } as unknown as ReactPointerEvent<HTMLDivElement>;
}

describe("useResizableWidth", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("starts at defaultWidth when nothing is stored yet", () => {
    const { result } = renderHook(() =>
      useResizableWidth({ storageKey: "w1", defaultWidth: 300, min: 200, max: 400, direction: 1 }),
    );
    expect(result.current.width).toBe(300);
  });

  it("reads a previously stored width on mount, clamped to min/max", () => {
    sessionStorage.setItem("w2", "999");
    const { result } = renderHook(() =>
      useResizableWidth({ storageKey: "w2", defaultWidth: 300, min: 200, max: 400, direction: 1 }),
    );
    expect(result.current.width).toBe(400);
  });

  it("a right-edge handle (direction 1) grows the width as the pointer moves right", () => {
    const { result } = renderHook(() =>
      useResizableWidth({ storageKey: "w3", defaultWidth: 300, min: 200, max: 400, direction: 1 }),
    );

    act(() => result.current.startDrag(reactPointerDown(100)));
    expect(result.current.isDragging).toBe(true);

    act(() => fireWindowPointer("pointermove", 150));
    expect(result.current.width).toBe(350);

    act(() => fireWindowPointer("pointerup", 150));
    expect(result.current.isDragging).toBe(false);
    expect(sessionStorage.getItem("w3")).toBe("350");
  });

  it("a left-edge handle (direction -1) grows the width as the pointer moves left", () => {
    const { result } = renderHook(() =>
      useResizableWidth({ storageKey: "w4", defaultWidth: 300, min: 200, max: 400, direction: -1 }),
    );

    act(() => result.current.startDrag(reactPointerDown(100)));
    act(() => fireWindowPointer("pointermove", 60));
    expect(result.current.width).toBe(340);
  });

  it("clamps to min/max when the drag goes past either bound", () => {
    const { result } = renderHook(() =>
      useResizableWidth({ storageKey: "w5", defaultWidth: 300, min: 200, max: 400, direction: 1 }),
    );

    act(() => result.current.startDrag(reactPointerDown(100)));
    act(() => fireWindowPointer("pointermove", 1000));
    expect(result.current.width).toBe(400);

    act(() => fireWindowPointer("pointermove", -1000));
    expect(result.current.width).toBe(200);
  });

  it("stops listening for pointer movement once the drag ends", () => {
    const { result } = renderHook(() =>
      useResizableWidth({ storageKey: "w6", defaultWidth: 300, min: 200, max: 400, direction: 1 }),
    );

    act(() => result.current.startDrag(reactPointerDown(100)));
    act(() => fireWindowPointer("pointerup", 150));
    expect(result.current.width).toBe(350);

    // A move after pointerup is a leftover/duplicate event, not a new drag —
    // the width must not keep changing once the listeners were removed.
    act(() => fireWindowPointer("pointermove", 400));
    expect(result.current.width).toBe(350);
  });
});
