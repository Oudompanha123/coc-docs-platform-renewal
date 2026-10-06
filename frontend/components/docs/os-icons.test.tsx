import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppleIcon, LinuxIcon, WindowsIcon } from "./os-icons";

/** Every <path fill="url(#...)"> in a container resolves to a <linearGradient> with a matching id inside that same container. */
function everyGradientRefResolves(container: HTMLElement) {
  const refs = Array.from(container.querySelectorAll("path"))
    .map((el) => el.getAttribute("fill") ?? "")
    .filter((fill) => fill.startsWith("url(#"))
    .map((fill) => fill.slice(5, -1)); // url(#xyz) -> xyz
  const gradientIds = Array.from(container.querySelectorAll("linearGradient")).map((el) => el.id);

  expect(refs.length).toBeGreaterThan(0);
  for (const id of refs) {
    expect(gradientIds).toContain(id);
  }
  return refs;
}

describe("os-icons — unique gradient ids", () => {
  it("two WindowsIcon instances on the same page mint different gradient ids, and each resolves correctly", () => {
    const { container } = render(
      <div>
        <WindowsIcon />
        <WindowsIcon />
      </div>,
    );

    const refs = everyGradientRefResolves(container);
    const uniqueIds = new Set(refs);
    // 2 icons x 4 panes each sharing one gradient per icon = 2 distinct ids.
    expect(uniqueIds.size).toBe(2);
  });

  it("two AppleIcon instances mint different gradient ids", () => {
    const { container } = render(
      <div>
        <AppleIcon />
        <AppleIcon />
      </div>,
    );

    const refs = everyGradientRefResolves(container);
    expect(new Set(refs).size).toBe(2);
  });

  it("Windows, macOS side by side never collide with each other either", () => {
    const { container } = render(
      <div>
        <WindowsIcon />
        <AppleIcon />
      </div>,
    );

    const refs = everyGradientRefResolves(container);
    // One distinct gradient id per icon instance (4 Windows paths share theirs, 2 Apple paths share theirs).
    expect(new Set(refs).size).toBe(2);
  });

  it("LinuxIcon (no gradient, flat colors) renders Tux's full-color fills with no gradient dependency", () => {
    const { container } = render(<LinuxIcon />);
    expect(container.querySelector("linearGradient")).toBeNull();
    expect(container.querySelectorAll('[fill="#1f2937"]').length).toBeGreaterThan(0);
    expect(container.querySelector('[fill="#f59e0b"]')).not.toBeNull();
  });
});
