import { act, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsTabPanels } from "./SettingsTabPanels";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function panel(id: string): HTMLElement {
  const el = document.getElementById(`panel-${id}`);
  if (!el) throw new Error(`no panel "panel-${id}"`);
  return el;
}

const PANELS = [
  { id: "account" as const, content: <div>Account content</div> },
  { id: "security" as const, content: <div>Security content</div> },
];

beforeEach(() => {
  stubMatchMedia(false);
});

describe("SettingsTabPanels", () => {
  it("shows only the active panel; the rest get the hidden attribute", () => {
    render(<SettingsTabPanels active="account" panels={PANELS} />);

    expect(panel("account")).toBeVisible();
    expect(panel("security")).not.toBeVisible();
    expect(panel("security")).toHaveAttribute("hidden");
  });

  it("keeps a panel's own React state mounted (not torn down) while it's hidden", async () => {
    const user = userEvent.setup();
    function Counter() {
      const [count, setCount] = useState(0);
      return (
        <button type="button" onClick={() => setCount((c) => c + 1)}>
          count:{count}
        </button>
      );
    }
    const { rerender } = render(
      <SettingsTabPanels active="account" panels={[{ id: "account", content: <Counter /> }, PANELS[1]!]} />,
    );
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("count:1");

    rerender(
      <SettingsTabPanels active="security" panels={[{ id: "account", content: <Counter /> }, PANELS[1]!]} />,
    );
    rerender(
      <SettingsTabPanels active="account" panels={[{ id: "account", content: <Counter /> }, PANELS[1]!]} />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("count:1");
  });

  describe("animation", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      stubMatchMedia(false);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("fades the outgoing panel out for 120ms, then fades + slides the incoming one in for 200ms", () => {
      const { rerender } = render(<SettingsTabPanels active="account" panels={PANELS} />);
      rerender(<SettingsTabPanels active="security" panels={PANELS} />);

      // Still the outgoing panel, now exiting.
      expect(panel("account")).toBeVisible();
      expect(panel("account")).toHaveClass("settings-tabpanel-exit");
      expect(panel("security")).toHaveAttribute("hidden");

      act(() => {
        vi.advanceTimersByTime(120);
      });

      // Swapped to the incoming panel, now entering.
      expect(panel("security")).toBeVisible();
      expect(panel("security")).toHaveClass("settings-tabpanel-enter");
      expect(panel("account")).toHaveAttribute("hidden");

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(panel("security")).not.toHaveClass("settings-tabpanel-enter");
    });

    it("prefers-reduced-motion switches instantly, with no animation class", () => {
      stubMatchMedia(true);
      const { rerender } = render(<SettingsTabPanels active="account" panels={PANELS} />);
      rerender(<SettingsTabPanels active="security" panels={PANELS} />);

      expect(panel("security")).toBeVisible();
      expect(panel("security")).not.toHaveClass("settings-tabpanel-enter");
      expect(panel("account")).toHaveAttribute("hidden");
    });
  });
});
