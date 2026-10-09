"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { computeMenuPosition } from "./menuPosition";
import { usePopoverLifecycle } from "./usePopoverLifecycle";

type Row = "rename" | "delete";

const MENU_WIDTH = 200;
const ROW_HEIGHT = 36;
const MENU_PADDING = 12;

/**
 * A custom group header's own "⋮" menu (task spec §D): Rename group
 * (super_admin + admin) and Delete group (super_admin only, and only while
 * empty — disabled with a tooltip otherwise). Never shown for a built-in
 * group (ADMINISTRATION/DEVELOPER) or for PRODUCTS — the caller simply
 * doesn't render this for those.
 *
 * <p>Portaled to `document.body` with `position: fixed`, for the same
 * reason as {@link SidebarItemMenu}: rendered inline, this panel used to be
 * clipped by the sidebar's own `overflow-y-auto` nav list instead of
 * floating above the page. {@link computeMenuPosition}/{@link
 * usePopoverLifecycle} are shared with that component so both popovers
 * reposition/close the same way.
 */
export function SidebarGroupMenu({
  groupName,
  canDelete,
  deleteDisabledReason,
  onRename,
  onDelete,
}: {
  groupName: string;
  canDelete: boolean;
  deleteDisabledReason: string;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Partial<Record<Row, HTMLButtonElement | null>>>({});
  const rows: Row[] = ["rename", "delete"];

  function recomputePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const estimatedHeight = rows.length * ROW_HEIGHT + MENU_PADDING;
    setPosition(computeMenuPosition(trigger.getBoundingClientRect(), MENU_WIDTH, estimatedHeight));
  }

  function openMenu() {
    recomputePosition();
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  usePopoverLifecycle({ isOpen: open, onRecompute: recomputePosition, onClose: close });

  useEffect(() => {
    if (!open) return;
    rowRefs.current.rename?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (menuRef.current?.contains(e.target as Node) || triggerRef.current?.contains(e.target as Node)) return;
      close();
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

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusRow(currentRowIndex() + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusRow(currentRowIndex() - 1);
        break;
      case "Escape":
        e.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
      case "r":
      case "R":
        e.preventDefault();
        close();
        onRename();
        break;
      case "d":
      case "D":
        if (canDelete) {
          e.preventDefault();
          close();
          onDelete();
        }
        break;
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : openMenu())}
        aria-label={`More options for ${groupName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-sm leading-none text-sidebar-muted/70 opacity-0 transition-opacity hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100 ${
          open ? "opacity-100 bg-white/10 text-white" : ""
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
            aria-label={`${groupName} group options`}
            onKeyDown={handleKeyDown}
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
                close();
                onRename();
              }}
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
            >
              <span aria-hidden="true">✎</span>
              <span className="min-w-0 flex-1 truncate text-left">Rename group</span>
              <span aria-hidden="true" className="text-xs text-white/50">R</span>
            </button>
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
                close();
                onDelete();
              }}
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-[#f87171] hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">🗑</span>
              <span className="min-w-0 flex-1 truncate text-left">Delete group</span>
              <span aria-hidden="true" className="text-xs text-[#f87171]/70">D</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
