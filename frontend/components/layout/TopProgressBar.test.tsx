/* eslint-disable @next/next/no-html-link-for-pages -- plain <a> on purpose: the bar listens for real anchor clicks, which is what next/link renders too. */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/home" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

import { TOP_PROGRESS_DONE_MS, TOP_PROGRESS_GIVE_UP_MS, TopProgressBar } from "./TopProgressBar";

/** The page-load bar across the top of the screen. */
describe("TopProgressBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pathname.current = "/home";
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  function setup() {
    const utils = render(
      <>
        <TopProgressBar />
        <a href="/docs/jex3-0">same site</a>
        <a href="https://example.com/x">elsewhere</a>
        <a href="/docs/jex3-0" target="_blank">new tab</a>
        <a href="/home">this page</a>
      </>,
    );
    const bar = () => utils.container.querySelector<HTMLElement>("[data-phase]");
    const fill = () => bar()?.firstElementChild as HTMLElement | null;
    return { ...utils, bar, fill };
  }

  it("shows nothing until a navigation starts", () => {
    const { bar } = setup();

    expect(bar()).toBeNull();
  });

  it("spans the full width of the screen and grows from the left edge while the page loads", () => {
    const { bar, fill, getByText } = setup();

    fireEvent.click(getByText("same site"));

    expect(bar()).toHaveAttribute("data-phase", "loading");
    expect(bar()).toHaveClass("inset-x-0", "w-full");
    expect(fill()).toHaveClass("top-progress-bar-grow");
    // Not the old one-third segment that never reached the right-hand side.
    expect(fill()).not.toHaveClass("w-1/3");
  });

  it("completes to the full width when the page arrives, then goes away", () => {
    const { bar, fill, getByText, rerender } = setup();
    fireEvent.click(getByText("same site"));

    pathname.current = "/docs/jex3-0";
    rerender(
      <>
        <TopProgressBar />
      </>,
    );

    expect(bar()).toHaveAttribute("data-phase", "done");
    expect(fill()).toHaveClass("top-progress-bar-done");

    act(() => {
      vi.advanceTimersByTime(TOP_PROGRESS_DONE_MS);
    });
    expect(bar()).toBeNull();
  });

  it("gives up and clears itself when the route never changes", () => {
    const { bar, getByText } = setup();
    fireEvent.click(getByText("same site"));

    act(() => {
      vi.advanceTimersByTime(TOP_PROGRESS_GIVE_UP_MS);
    });
    expect(bar()).toHaveAttribute("data-phase", "done");

    act(() => {
      vi.advanceTimersByTime(TOP_PROGRESS_DONE_MS);
    });
    expect(bar()).toBeNull();
  });

  it.each(["elsewhere", "new tab", "this page"])("does not start for a link to %s", (label) => {
    const { bar, getByText } = setup();

    fireEvent.click(getByText(label));

    expect(bar()).toBeNull();
  });
});
