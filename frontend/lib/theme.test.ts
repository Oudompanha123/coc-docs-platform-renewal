import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyTheme, getResolvedTheme, resolveTheme } from "./theme";

type Listener = (e: { matches: boolean }) => void;

function mockSystem(dark: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: dark,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mql));
  window.matchMedia = globalThis.matchMedia;
  return {
    flip(next: boolean) {
      mql.matches = next;
      listeners.forEach((l) => l({ matches: next }));
    },
    listenerCount: () => listeners.size,
  };
}

describe("theme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("system writes the OS's theme to data-theme, so every dark rule applies", () => {
    mockSystem(true);
    applyTheme("system");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("coc-docs-theme")).toBe("system");
  });

  it("system follows the OS live, and stops once an explicit theme is chosen", () => {
    const os = mockSystem(false);
    applyTheme("system");
    expect(document.documentElement.dataset.theme).toBe("light");
    os.flip(true);
    expect(document.documentElement.dataset.theme).toBe("dark");

    applyTheme("light");
    expect(os.listenerCount()).toBe(0);
    os.flip(true);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("resolves an explicit choice to itself and system to the OS", () => {
    mockSystem(true);
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("system")).toBe("dark");
    expect(getResolvedTheme()).toBe("dark"); // nothing stored = system
  });
});
