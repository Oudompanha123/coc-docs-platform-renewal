import { beforeEach, describe, expect, it, vi } from "vitest";
import { readSourcePathOverride, writeSourcePathOverride } from "./engine-preference";

/**
 * A real in-memory Storage, not the ambient `localStorage` global — the
 * sandbox this suite runs in does not implement a working one (every method
 * either throws or silently no-ops; see the `--localstorage-file` warning
 * vitest prints), which is exactly the situation `writeSourcePathOverride`'s
 * own try/catch is written to survive. Stubbing a real implementation here
 * is what makes the round trip itself testable, rather than only its
 * degrade-gracefully branch.
 */
function fakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe("source path override (ADR-054)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", fakeStorage());
  });

  it("is empty for a project nothing has been written for", () => {
    expect(readSourcePathOverride("p1")).toBe("");
  });

  it("round-trips what was written", () => {
    writeSourcePathOverride("p1", "C:\\legacy\\app");

    expect(readSourcePathOverride("p1")).toBe("C:\\legacy\\app");
  });

  it("trims surrounding whitespace before storing", () => {
    writeSourcePathOverride("p1", "  /home/dev/legacy-app  ");

    expect(readSourcePathOverride("p1")).toBe("/home/dev/legacy-app");
  });

  it("keeps two projects' paths independent", () => {
    writeSourcePathOverride("p1", "/home/dev/project-one");
    writeSourcePathOverride("p2", "/home/dev/project-two");

    expect(readSourcePathOverride("p1")).toBe("/home/dev/project-one");
    expect(readSourcePathOverride("p2")).toBe("/home/dev/project-two");
  });

  it("forgets the path when written with blank, rather than storing an empty string", () => {
    writeSourcePathOverride("p1", "/home/dev/legacy-app");
    writeSourcePathOverride("p1", "   ");

    expect(readSourcePathOverride("p1")).toBe("");
    expect(localStorage.getItem("coc-ax-renewal-source-path:p1")).toBeNull();
  });

  it("degrades to empty, rather than throwing, when storage itself is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("storage disabled");
      },
    });

    expect(readSourcePathOverride("p1")).toBe("");
  });

  it("degrades silently, rather than throwing, when storage refuses a write", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("storage disabled");
      },
    });

    expect(() => writeSourcePathOverride("p1", "/home/dev/legacy-app")).not.toThrow();
  });
});
