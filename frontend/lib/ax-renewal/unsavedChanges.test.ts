import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }) }));

import {
  clearUnsaved,
  confirmDiscardUnsaved,
  markUnsaved,
  resetUnsavedForTests,
  unsavedSections,
  useGuardedRouter,
  useUnsavedChangesGuard,
} from "./unsavedChanges";

/** Warning before a Plan section's unsaved edits are lost (ADR-076). */
describe("unsaved Plan edits", () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetUnsavedForTests();
    push.mockReset();
    confirmSpy = vi.spyOn(window, "confirm");
  });

  afterEach(() => {
    confirmSpy.mockRestore();
    resetUnsavedForTests();
  });

  function beforeUnloadIsBlocked(): boolean {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }

  describe("confirmDiscardUnsaved", () => {
    it("lets navigation through without asking when nothing is unsaved", () => {
      expect(confirmDiscardUnsaved()).toBe(true);
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it("asks, naming the section, when something is unsaved", () => {
      confirmSpy.mockReturnValue(false);
      markUnsaved(Symbol("a"), "Stack move");

      expect(confirmDiscardUnsaved()).toBe(false);
      expect(confirmSpy).toHaveBeenCalledWith(
        "You have unsaved changes in Stack move. Leave and discard them?",
      );
    });

    it("goes ahead when the person confirms", () => {
      confirmSpy.mockReturnValue(true);
      markUnsaved(Symbol("a"), "Pages");

      expect(confirmDiscardUnsaved()).toBe(true);
    });
  });

  describe("the browser's own leave / reload warning", () => {
    it("is raised only while something is unsaved", () => {
      expect(beforeUnloadIsBlocked()).toBe(false);

      const id = Symbol("a");
      markUnsaved(id, "Database");
      expect(beforeUnloadIsBlocked()).toBe(true);

      clearUnsaved(id);
      // A page with nothing to lose must not ask "leave site?" on every reload.
      expect(beforeUnloadIsBlocked()).toBe(false);
    });
  });

  describe("useUnsavedChangesGuard", () => {
    it("registers while dirty, and withdraws when saved", () => {
      const { rerender } = renderHook(({ dirty }) => useUnsavedChangesGuard(dirty, "Architecture"), {
        initialProps: { dirty: true },
      });
      expect(unsavedSections()).toEqual(["Architecture"]);

      rerender({ dirty: false });
      expect(unsavedSections()).toEqual([]);
    });

    it("withdraws on unmount, so a section that has gone stops blocking navigation", () => {
      const { unmount } = renderHook(() => useUnsavedChangesGuard(true, "Pages"));
      expect(unsavedSections()).toEqual(["Pages"]);

      unmount();
      expect(unsavedSections()).toEqual([]);
      expect(beforeUnloadIsBlocked()).toBe(false);
    });
  });

  describe("useGuardedRouter", () => {
    it("navigates straight away when nothing is unsaved", () => {
      const { result } = renderHook(() => useGuardedRouter());

      result.current.push("/ax-renewal?project=p1&section=pages");

      expect(push).toHaveBeenCalledWith("/ax-renewal?project=p1&section=pages");
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it("stays put when the person chooses to keep their edits", () => {
      confirmSpy.mockReturnValue(false);
      markUnsaved(Symbol("a"), "Stack move");
      const { result } = renderHook(() => useGuardedRouter());

      result.current.push("/ax-renewal?project=p1&section=pages");

      expect(push).not.toHaveBeenCalled();
    });

    it("navigates when the person chooses to discard them", () => {
      confirmSpy.mockReturnValue(true);
      markUnsaved(Symbol("a"), "Stack move");
      const { result } = renderHook(() => useGuardedRouter());

      result.current.push("/ax-renewal?project=p2");

      expect(push).toHaveBeenCalledWith("/ax-renewal?project=p2");
    });
  });
});
