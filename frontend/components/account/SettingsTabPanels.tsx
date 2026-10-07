import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { SettingsSectionId } from "@/lib/account/settingsSections";

type Phase = "idle" | "exiting" | "entering";

const EXIT_MS = 120;
const ENTER_MS = 200;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Renders every settings section as an always-mounted tabpanel, showing only
 * `active`'s — so unsaved edits (Account) and other per-section state (the
 * Claude Usage period dropdown) survive a tab switch instead of being torn
 * down and rebuilt. Non-active panels get the `hidden` attribute (out of
 * layout and the accessibility tree); `SettingsSideMenu`'s tabs point at
 * these via `aria-controls`/`id="panel-<id>"`.
 *
 * <p>The switch itself is a 120ms fade-out of the outgoing panel followed
 * by a 200ms fade+slide-in of the incoming one, timed by `setPhase`/
 * `setShown` rather than overlapping — both can't be visible at once
 * without a layout that fits two differently-sized cards, and nothing in
 * the mockup called for that. `prefers-reduced-motion` skips the phases
 * (and their timers) entirely and swaps straight to `idle`, so a reduced-
 * motion user never waits out the 120ms+200ms sequencing just to see a
 * visually-static swap.
 */
export function SettingsTabPanels({
  active,
  panels,
}: {
  active: SettingsSectionId;
  panels: { id: SettingsSectionId; content: ReactNode }[];
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [shown, setShown] = useState(active);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (active === shown) {
      // Switched away and back before the exit timer fired: the pending
      // timeout was already cleared by this effect's own cleanup (React
      // runs it before this body), but `phase` itself was left at
      // "exiting" — without resetting it here, the current panel would be
      // stuck permanently at the exit animation's end state (opacity 0).
      if (phase !== "idle") setPhase("idle");
      return;
    }

    if (reducedMotion) {
      setShown(active);
      setPhase("idle");
      return;
    }

    setPhase("exiting");
    const toEnter = setTimeout(() => {
      setShown(active);
      setPhase("entering");
    }, EXIT_MS);
    return () => clearTimeout(toEnter);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on `active` (and the reduced-motion preference) only; `shown` is read, not meant to retrigger this transition.
  }, [active, reducedMotion]);

  useEffect(() => {
    if (phase !== "entering") return;
    const toIdle = setTimeout(() => setPhase("idle"), ENTER_MS);
    return () => clearTimeout(toIdle);
  }, [phase]);

  return (
    <>
      {panels.map(({ id, content }) => {
        const isDisplayed = id === shown;
        const animationClass =
          isDisplayed && phase === "exiting"
            ? "settings-tabpanel-exit"
            : isDisplayed && phase === "entering"
              ? "settings-tabpanel-enter"
              : undefined;
        return (
          <div
            key={id}
            id={`panel-${id}`}
            role="tabpanel"
            aria-labelledby={`tab-${id}`}
            hidden={!isDisplayed}
            className={animationClass}
          >
            {content}
          </div>
        );
      })}
    </>
  );
}
