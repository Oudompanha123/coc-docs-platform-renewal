const VIEWPORT_MARGIN = 8;

export type MenuPosition = { top: number; left: number };

/**
 * Where a `position: fixed` popover should sit relative to the control that
 * opened it: to the control's right by default, flipped to its left if
 * there's no room, and clamped vertically so it never runs off the top or
 * bottom of the viewport. Shared by every sidebar "⋮" menu/submenu so they
 * behave identically now that they're portaled to `<body>` (see
 * SidebarItemMenu's module comment for why).
 */
export function computeMenuPosition(anchor: DOMRect, menuWidth: number, menuHeight: number, gap = 8): MenuPosition {
  const left =
    anchor.right + gap + menuWidth > window.innerWidth
      ? Math.max(VIEWPORT_MARGIN, anchor.left - menuWidth - gap)
      : anchor.right + gap;
  const naturalTop = anchor.top - 4;
  const top = Math.min(naturalTop, window.innerHeight - menuHeight - VIEWPORT_MARGIN);
  return { top: Math.max(VIEWPORT_MARGIN, top), left };
}
