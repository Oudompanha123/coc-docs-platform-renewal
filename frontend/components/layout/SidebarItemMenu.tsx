"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NavGroupConfig } from "@/lib/docs/nav-api";
import { computeMenuPosition } from "./menuPosition";
import { usePopoverLifecycle } from "./usePopoverLifecycle";

type Row = "rename" | "move" | "delete";

const MENU_WIDTH = 220;
const SUBMENU_WIDTH = 200;
const ROW_HEIGHT = 36;
const MENU_PADDING = 12;

/**
 * The sidebar row's "⋮" kebab menu (task: "Admin sidebar item menu" —
 * Rename, Move to group, Delete), matching the reference screenshot: a dark
 * popover to the right of the trigger, icon + label + right-side shortcut
 * letter or "›", a divider before the red Delete row.
 *
 * <p>The trigger button is a plain `<button>` rendered as a *sibling* of the
 * row's `<Link>` in `Sidebar.tsx`, not a descendant of it — clicking it (or
 * anything in the menu) therefore can never trigger the link's navigation,
 * which an earlier version of this component was vulnerable to when the
 * trigger lived inside the `<a>`.
 *
 * <p>The menu/submenu panels are portaled to `document.body` with
 * `position: fixed`. They used to render inline inside the sidebar's own
 * `<nav class="overflow-y-auto">`, which silently clipped them to the
 * sidebar's own scroll box — `position: fixed` escapes a scrollbar but not
 * the clipping an `overflow` ancestor still applies to its descendants, so
 * the menu rendered behind the main content instead of floating above it.
 * Portaling out of that subtree is what actually fixes it; the coordinates
 * are still computed from the trigger's `getBoundingClientRect()`, via
 * {@link computeMenuPosition} (shared with {@link SidebarGroupMenu} so both
 * flip/clamp to the viewport the same way).
 *
 * <p>Rename doesn't own its own UI here — activating it just tells the
 * parent row to switch into inline-edit mode (`onRename`), since swapping a
 * `<Link>`'s label for an `<input>` is the parent row's concern, not this
 * menu's. Move to group's submenu (the list of groups + "+ New group…")
 * lives here, since nothing else needs that state.
 *
 * <p>No shared popover/dropdown component exists anywhere in this codebase
 * to reuse (confirmed in Step 1's investigation) — every menu in this app
 * hand-rolls the same relative/absolute + click-outside shape, so this one
 * does too, styled for the sidebar's dark theme specifically (the Topbar's
 * own account menu is the closest structural template, but it's light-theme
 * and not shared/importable).
 */
export function SidebarItemMenu({
  itemLabel,
  kind,
  groups,
  currentGroupId,
  canDelete,
  deleteDisabledReason,
  onRename,
  onMove,
  onCreateGroupAndMove,
  onDeleteProduct,
}: {
  itemLabel: string;
  kind: "product" | "static";
  groups: NavGroupConfig[];
  /** The group this item is in right now — checked + disabled in the
   *  submenu. Irrelevant (and `onMove` omitted) for a product. */
  currentGroupId?: string | null;
  canDelete: boolean;
  /** Shown as the Delete row's title attribute when it's disabled. */
  deleteDisabledReason: string;
  onRename: () => void;
  onMove?: (groupId: string) => void;
  onCreateGroupAndMove?: (name: string) => void;
  onDeleteProduct?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [newGroupMode, setNewGroupMode] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Partial<Record<Row, HTMLButtonElement | null>>>({});
  const submenuRef = useRef<HTMLDivElement>(null);
  const newGroupInputRef = useRef<HTMLInputElement>(null);

  const showMove = kind === "static";
  const rows: Row[] = showMove ? ["rename", "move", "delete"] : ["rename", "delete"];

  function recomputeMenuPosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const estimatedHeight = rows.length * ROW_HEIGHT + MENU_PADDING;
    setPosition(computeMenuPosition(trigger.getBoundingClientRect(), MENU_WIDTH, estimatedHeight));
  }

  function recomputeSubmenuPosition() {
    const moveRow = rowRefs.current.move;
    if (!moveRow) return;
    const estimatedHeight = (groups.length + 1) * ROW_HEIGHT + MENU_PADDING;
    setSubmenuPosition(computeMenuPosition(moveRow.getBoundingClientRect(), SUBMENU_WIDTH, estimatedHeight));
  }

  function openMenu() {
    recomputeMenuPosition();
    setOpen(true);
  }

  function closeAll() {
    setOpen(false);
    setSubmenuOpen(false);
    setNewGroupMode(false);
    setNewGroupName("");
  }

  usePopoverLifecycle({
    isOpen: open,
    onRecompute: () => {
      recomputeMenuPosition();
      if (submenuOpen) recomputeSubmenuPosition();
    },
    onClose: closeAll,
  });

  useEffect(() => {
    if (!open) return;
    rowRefs.current[rows[0]!]?.focus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- `rows` is derived from `kind`, which never changes for a mounted row

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      // The submenu is portaled to `document.body` as its own tree, not a
      // DOM descendant of `menuRef` even though it's logically nested under
      // it — without this it reads as an "outside" click on the main menu
      // the instant a submenu row is pressed.
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target) || submenuRef.current?.contains(target)) {
        return;
      }
      closeAll();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function focusRow(index: number) {
    const key = rows[(index + rows.length) % rows.length]!;
    rowRefs.current[key]?.focus();
  }

  function currentRowIndex(): number {
    return rows.findIndex((r) => rowRefs.current[r] === document.activeElement);
  }

  function openSubmenu() {
    recomputeSubmenuPosition();
    setSubmenuOpen(true);
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    if (submenuOpen) return; // the submenu owns its own key handling while open
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusRow(currentRowIndex() + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusRow(currentRowIndex() - 1);
        break;
      case "ArrowRight":
        if (showMove && rowRefs.current.move === document.activeElement) {
          e.preventDefault();
          openSubmenu();
        }
        break;
      case "Escape":
        e.preventDefault();
        closeAll();
        triggerRef.current?.focus();
        break;
      case "r":
      case "R":
        e.preventDefault();
        closeAll();
        onRename();
        break;
      case "d":
      case "D":
        if (canDelete) {
          e.preventDefault();
          closeAll();
          onDeleteProduct?.();
        }
        break;
    }
  }

  function handleSubmenuKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" || e.key === "ArrowLeft") {
      e.preventDefault();
      setSubmenuOpen(false);
      setNewGroupMode(false);
      rowRefs.current.move?.focus();
    }
  }

  function startNewGroup() {
    setNewGroupMode(true);
    requestAnimationFrame(() => newGroupInputRef.current?.focus());
  }

  function submitNewGroup(e: React.FormEvent) {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    onCreateGroupAndMove?.(name);
    closeAll();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (open) closeAll();
          else openMenu();
        }}
        aria-label={`More options for ${itemLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`absolute right-[5px] top-1/2 flex h-6 w-6 -translate-y-1/2 shrink-0 items-center justify-center rounded-md text-base leading-none text-sidebar-muted opacity-0 transition-opacity hover:bg-white/10 focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100 ${
          open ? "opacity-100 bg-white/10" : ""
        }`}
      >
        ⋮
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`${itemLabel} options`}
            onKeyDown={handleMenuKeyDown}
            style={{ position: "fixed", top: position.top, left: position.left, minWidth: MENU_WIDTH }}
            className="z-[45] rounded-xl border border-white/10 bg-[#1f2037] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
          >
            <button
              ref={(el) => {
                rowRefs.current.rename = el;
              }}
              type="button"
              role="menuitem"
              onClick={() => {
                closeAll();
                onRename();
              }}
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
            >
              <span aria-hidden="true">✎</span>
              <span className="min-w-0 flex-1 truncate text-left">Rename</span>
              <span aria-hidden="true" className="text-xs text-white/50">R</span>
            </button>

            {showMove && (
              <button
                ref={(el) => {
                  rowRefs.current.move = el;
                }}
                type="button"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={submenuOpen}
                onClick={() => (submenuOpen ? setSubmenuOpen(false) : openSubmenu())}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              >
                <span aria-hidden="true">📁</span>
                <span className="min-w-0 flex-1 truncate text-left">Move to group</span>
                <span aria-hidden="true" className="text-xs text-white/50">›</span>
              </button>
            )}

            <div role="separator" className="my-1 h-px bg-white/10" />

            <button
              ref={(el) => {
                rowRefs.current.delete = el;
              }}
              type="button"
              role="menuitem"
              aria-disabled={!canDelete}
              title={canDelete ? undefined : deleteDisabledReason}
              disabled={!canDelete}
              onClick={() => {
                closeAll();
                onDeleteProduct?.();
              }}
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-[#f87171] hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">🗑</span>
              <span className="min-w-0 flex-1 truncate text-left">Delete</span>
              <span aria-hidden="true" className="text-xs text-[#f87171]/70">D</span>
            </button>
          </div>,
          document.body,
        )}

      {showMove &&
        submenuOpen &&
        submenuPosition &&
        createPortal(
          <div
            ref={submenuRef}
            role="menu"
            aria-label="Move to group"
            onKeyDown={handleSubmenuKeyDown}
            style={{ position: "fixed", top: submenuPosition.top, left: submenuPosition.left, minWidth: SUBMENU_WIDTH }}
            className="z-[45] rounded-xl border border-white/10 bg-[#1f2037] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
          >
            {groups.map((g) => {
              const isCurrent = g.id === currentGroupId;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isCurrent}
                  disabled={isCurrent}
                  onClick={() => {
                    onMove?.(g.id);
                    closeAll();
                  }}
                  className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none disabled:cursor-default disabled:opacity-60"
                >
                  <span aria-hidden="true">{isCurrent ? "✓" : ""}</span>
                  <span className="min-w-0 flex-1 truncate text-left">{g.name}</span>
                </button>
              );
            })}

            {!newGroupMode ? (
              <button
                type="button"
                role="menuitem"
                onClick={startNewGroup}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              >
                <span aria-hidden="true">+</span>
                <span>New group…</span>
              </button>
            ) : (
              <form onSubmit={submitNewGroup} className="px-1 py-1">
                <input
                  ref={newGroupInputRef}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  maxLength={24}
                  placeholder="Group name"
                  aria-label="New group name"
                  className="w-full rounded-lg border border-white/15 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-sidebar-muted focus:outline-none"
                />
              </form>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
