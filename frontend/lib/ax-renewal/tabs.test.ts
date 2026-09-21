import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NO_TAB_OPEN, type AxRenewalExplorerKey } from "./explorerGroups";
import { useAxRenewalTabs } from "./tabs";

function setup(initialActive: AxRenewalExplorerKey | null) {
  return renderHook((active: AxRenewalExplorerKey | null) => useAxRenewalTabs(active), {
    initialProps: initialActive,
  });
}

describe("useAxRenewalTabs", () => {
  it("starts with the active section already open as a tab", () => {
    const { result } = setup("attach");
    expect(result.current.tabs).toEqual(["attach"]);
  });

  it("adds a newly navigated-to section as another tab, keeping the ones already open", () => {
    const { result, rerender } = setup("attach");
    rerender("codebase");
    rerender("findings");
    expect(result.current.tabs).toEqual(["attach", "codebase", "findings"]);
  });

  it("closing a tab that isn't the active one returns null — nothing to navigate to", () => {
    const { result, rerender } = setup("attach");
    rerender("codebase");

    let fallback: unknown;
    act(() => {
      fallback = result.current.closeTab("attach");
    });

    expect(fallback).toBeNull();
    expect(result.current.tabs).toEqual(["codebase"]);
  });

  it("closing the only open tab returns the NO_TAB_OPEN sentinel — the prototype allows this too", () => {
    const { result } = setup("attach");

    let fallback: unknown;
    act(() => {
      fallback = result.current.closeTab("attach");
    });

    expect(fallback).toBe(NO_TAB_OPEN);
    expect(result.current.tabs).toEqual([]);
  });

  it("closing the active tab with others still open falls back to a neighboring tab", () => {
    const { result, rerender } = setup("attach");
    rerender("codebase");
    rerender("findings");
    expect(result.current.tabs).toEqual(["attach", "codebase", "findings"]);

    let fallback: unknown;
    act(() => {
      fallback = result.current.closeTab("findings");
    });

    expect(fallback).toBe("codebase");
  });

  it("does not resurrect a closed tab once active becomes null", () => {
    const { result, rerender } = setup("attach");
    act(() => {
      result.current.closeTab("attach");
    });
    rerender(null);
    expect(result.current.tabs).toEqual([]);
  });
});
