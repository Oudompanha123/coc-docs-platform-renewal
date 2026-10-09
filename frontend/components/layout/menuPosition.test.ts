import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { computeMenuPosition } from "./menuPosition";

function rect(partial: Partial<DOMRect>): DOMRect {
  return {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...partial,
  };
}

describe("computeMenuPosition", () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    window.innerHeight = originalInnerHeight;
  });

  it("opens to the right of the anchor when there's room", () => {
    window.innerWidth = 1280;
    window.innerHeight = 800;
    const anchor = rect({ top: 100, left: 200, right: 230 });

    expect(computeMenuPosition(anchor, 220, 150)).toEqual({ top: 96, left: 238 });
  });

  it("flips to the left of the anchor when there's no room on the right", () => {
    window.innerWidth = 400;
    window.innerHeight = 800;
    const anchor = rect({ top: 100, left: 300, right: 330 });

    // 330 + 8 + 220 = 558 > 400 (viewport width) -> flips left of the anchor
    expect(computeMenuPosition(anchor, 220, 150)).toEqual({ top: 96, left: 72 });
  });

  it("clamps the flipped left position so it never goes off the left edge", () => {
    window.innerWidth = 200;
    window.innerHeight = 800;
    const anchor = rect({ top: 100, left: 10, right: 40 });

    // 40 + 8 + 220 = 268 > 200 (viewport width) -> flips left, and
    // 10 - 220 - 8 would be negative -> clamped to the 8px viewport margin
    expect(computeMenuPosition(anchor, 220, 150).left).toBe(8);
  });

  it("shifts up when opening at the anchor's top would overflow the bottom of the viewport", () => {
    window.innerWidth = 1280;
    window.innerHeight = 500;
    const anchor = rect({ top: 460, left: 100, right: 130 });

    // natural top (456) + height (150) = 606 > 500 -> shifted up to fit
    expect(computeMenuPosition(anchor, 220, 150)).toEqual({ top: 342, left: 138 });
  });

  it("clamps the shifted-up top so it never goes above the viewport margin", () => {
    window.innerWidth = 1280;
    window.innerHeight = 100;
    const anchor = rect({ top: 50, left: 100, right: 130 });

    expect(computeMenuPosition(anchor, 220, 150).top).toBe(8);
  });
});
