import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The test environment's own Web Storage (vitest.setup.ts). If this fails,
 * every test that reads `localStorage` fails with it — for a reason that has
 * nothing to do with the code under test, as 46 of them once did on Node 25.
 */
describe("test environment: Web Storage", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it.each([
    ["localStorage", () => localStorage],
    ["sessionStorage", () => sessionStorage],
  ] as const)("%s is a working Storage", (_name, storage) => {
    storage().setItem("k", "v");
    expect(storage().getItem("k")).toBe("v");
    expect(storage().length).toBe(1);
    expect(storage().key(0)).toBe("k");

    storage().removeItem("k");
    expect(storage().getItem("k")).toBeNull();
  });

  it("stores strings, as a real Storage does", () => {
    localStorage.setItem("n", 42 as unknown as string);

    expect(localStorage.getItem("n")).toBe("42");
  });

  it("is the same storage through window and the global", () => {
    window.localStorage.setItem("shared", "yes");

    expect(localStorage.getItem("shared")).toBe("yes");
  });

  it("lets a test spy on Storage.prototype — how 'storage unavailable' is simulated", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => localStorage.setItem("k", "v")).toThrow("QuotaExceededError");
  });
});
