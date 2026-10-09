import "@testing-library/jest-dom/vitest";

/**
 * Web Storage that actually works, on every Node version.
 *
 * <p>Node 25 has its own global `localStorage` and `sessionStorage`. Without a
 * `--localstorage-file` it hands back an object with none of Storage's methods
 * — `localStorage.clear is not a function`. Vitest's jsdom environment won't
 * overwrite a global Node already has, so Node's empty one hid jsdom's real
 * one. That alone failed 46 tests across five files. Nothing was wrong with
 * the code under test.
 *
 * <p>This puts jsdom's own Storage back wherever the global one is unusable.
 * It's jsdom's, not a stub, so `vi.spyOn(Storage.prototype, …)` still reaches
 * it and storage semantics (string values, `key()`, `length`) stay real. On a
 * Node whose global is fine (≤ 24, or 25 given a file), nothing changes. A
 * test that wants its own Storage still uses `vi.stubGlobal("localStorage",
 * …)`.
 */
type StorageName = "localStorage" | "sessionStorage";

function usable(name: StorageName): boolean {
  try {
    const storage = (globalThis as Record<StorageName, Storage | undefined>)[name];
    return typeof storage?.getItem === "function" && typeof storage.clear === "function";
  } catch {
    return false;
  }
}

const domWindow = (globalThis as { jsdom?: { window: Window & typeof globalThis } }).jsdom?.window;

if (domWindow) {
  for (const name of ["localStorage", "sessionStorage"] as const) {
    if (usable(name)) continue;
    const real = domWindow[name];
    Object.defineProperty(globalThis, name, { configurable: true, enumerable: true, get: () => real });
  }
  // Node 25 also has its own `Storage` class. Spies on `Storage.prototype`
  // must reach the prototype the storages above actually use: jsdom's.
  if (!(globalThis.localStorage instanceof globalThis.Storage)) {
    Object.defineProperty(globalThis, "Storage", { configurable: true, writable: true, value: domWindow.Storage });
  }
}

/**
 * What Radix's Select needs from a browser that jsdom does not implement
 * (ADR-104 r2.10): pointer capture, used when the trigger opens on pointer
 * down, and `scrollIntoView`, used to bring the chosen item into view. No-ops
 * are faithful enough — jsdom has no layout to capture or scroll. Only filled
 * in where missing, so a test can still spy on or replace them.
 */
if (typeof Element !== "undefined") {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  if (typeof proto.hasPointerCapture !== "function") proto.hasPointerCapture = () => false;
  if (typeof proto.setPointerCapture !== "function") proto.setPointerCapture = () => {};
  if (typeof proto.releasePointerCapture !== "function") proto.releasePointerCapture = () => {};
  if (typeof proto.scrollIntoView !== "function") proto.scrollIntoView = () => {};
}
