"use client";

import { useRef } from "react";
import { EXPLORER_META, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import { XIcon } from "@/components/layout/icons";

type AxRenewalTabBarProps = {
  tabs: AxRenewalExplorerKey[];
  /** Null once every tab has been closed — matches the prototype, which allows closing its last tab too (see explorerGroups.ts's NO_TAB_OPEN). */
  active: AxRenewalExplorerKey | null;
  onSelect: (key: AxRenewalExplorerKey) => void;
  onClose: (key: AxRenewalExplorerKey) => void;
};

/** The active tab's top accent bar — mirrors the prototype's `.tab.cur`/`.nw`/`.ot`: the "old" system's own brown for Understand (the code as it is today), the brand accent for Plan/Build (the renewal), muted for Workspace. `#9c4620` matches the same "old" accent already used for the Old column in page.tsx's Old → New table. */
function accentColor(group: string): string {
  if (group === "Understand") return "bg-[#9c4620]";
  if (group === "Workspace") return "bg-muted";
  return "bg-primary";
}

/**
 * The open-tabs row across the top of the editor area, matching the
 * reference prototype's own compact `.tab` row — a small icon per tab, a
 * truncated label, a close × that only shows on hover/when active, and a 2px
 * accent bar on the active tab. Closing the active tab is handled by the
 * caller (it decides which neighboring tab becomes active).
 */
export function AxRenewalTabBar({ tabs, active, onSelect, onClose }: AxRenewalTabBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Plain mousedown/mousemove drag-to-scroll — with no visible scrollbar to
  // grab, click-drag on the strip itself is the only mouse affordance left
  // besides the wheel, and a plain div has no such behavior on its own (a
  // mousedown+drag just starts a text selection instead, as it would on any
  // element). `moved` distinguishes an actual drag from a plain click, so a
  // real tab-select/close click still fires normally when nothing dragged.
  const dragRef = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null);
  const wasDraggingRef = useRef(false);

  // Nothing to show here once every tab is closed — AxRenewalBreadcrumb
  // (rendered directly below this by AxRenewalTopbar) is the single "no tab
  // open" message for this whole area; a second one here just duplicated it.
  if (tabs.length === 0) return null;

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    dragRef.current = { startX: e.pageX, startScrollLeft: scroller.scrollLeft, moved: false };
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const scroller = scrollerRef.current;
    if (!drag || !scroller) return;
    const delta = e.pageX - drag.startX;
    if (Math.abs(delta) > 3) drag.moved = true;
    scroller.scrollLeft = drag.startScrollLeft - delta;
  }

  function endDrag() {
    if (dragRef.current) wasDraggingRef.current = dragRef.current.moved;
    dragRef.current = null;
  }

  // Capture phase, so a drag suppresses the tab's own onSelect/onClose click
  // before it fires — a plain click (no movement) is left alone.
  function handleClickCapture(e: React.MouseEvent) {
    if (wasDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      wasDraggingRef.current = false;
    }
  }

  return (
    <div
      ref={scrollerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onClickCapture={handleClickCapture}
      className="no-scrollbar flex min-w-0 flex-1 cursor-grab select-none overflow-x-auto border-b border-surface-border bg-muted-surface active:cursor-grabbing">
      {tabs.map((key) => {
        const meta = EXPLORER_META[key];
        const isActive = key === active;
        return (
          <div
            key={key}
            className={`group relative flex max-w-[220px] shrink-0 h-9 items-center gap-1.5 border-r border-surface-border pl-3 pr-2 text-xs ${
              isActive ? "bg-card font-semibold text-foreground" : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
            }`}
          >
            {isActive && (
              <span className={`absolute inset-x-0 top-0 h-[2px] ${accentColor(meta.group)}`} aria-hidden="true" />
            )}
            <button type="button" onClick={() => onSelect(key)} className="flex min-w-0 flex-1 items-center gap-1.5">
              <meta.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
              <span className="truncate">{meta.label}</span>
            </button>
            <button
              type="button"
              onClick={() => onClose(key)}
              aria-label={`Close ${meta.label}`}
              className={`shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 ${
                isActive ? "opacity-100" : ""
              }`}
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
