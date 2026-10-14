"use client";

import { useState, type FormEvent } from "react";
import { Check, FolderInput, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavGroupConfig } from "@/lib/docs/nav-api";
import { cn } from "@/lib/utils";

const MAX_GROUP_NAME = 24;

/**
 * A sidebar row's "⋮" menu — Rename, Move to group, Delete — on the shared
 * `DropdownMenu` (ADR-104 r2.15), so it is the same light/dark panel as every
 * other menu in the app, with Lucide icons. It used to be a hand-rolled
 * navy panel from the retired brand palette with emoji icons, its own
 * positioning, focus and outside-click code, and a trigger whose hover
 * (`bg-white/10`) was invisible on the light sidebar.
 *
 * What it offers follows what can actually happen:
 * - **Delete appears only where it can apply.** A system page (Users &
 *   Roles, Claude Usage…) can never be deleted, so it has no Delete row —
 *   it used to show one, faded red, with the reason in a hover title. A
 *   product an admin may not delete shows the row disabled *with* the reason
 *   written under it.
 * - **Move to group** (system pages only) lists the groups with the current
 *   one checked, and "New group…" checks the name before creating it: not
 *   blank, not already taken.
 *
 * Keyboard: Radix's own — arrows, Enter, Esc back to the trigger, → into the
 * submenu, and type-ahead on the first letter (R, M, D). The trigger is a
 * sibling of the row's `<Link>`, never inside it, so nothing here navigates.
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
  /** The group this item is in right now — checked in the submenu. */
  currentGroupId?: string | null;
  canDelete: boolean;
  /** Why Delete is unavailable, shown under the disabled row (products only). */
  deleteDisabledReason: string;
  onRename: () => void;
  onMove?: (groupId: string) => void;
  onCreateGroupAndMove?: (name: string) => void;
  onDeleteProduct?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newGroupMode, setNewGroupMode] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupError, setNewGroupError] = useState<string | null>(null);

  const isProduct = kind === "product";

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setNewGroupMode(false);
      setNewGroupName("");
      setNewGroupError(null);
    }
  }

  function submitNewGroup(e: FormEvent) {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) {
      setNewGroupError("Enter a name.");
      return;
    }
    if (groups.some((g) => g.name.trim().toLowerCase() === name.toLowerCase())) {
      setNewGroupError(`"${name}" already exists.`);
      return;
    }
    onCreateGroupAndMove?.(name);
    onOpenChange(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger
        aria-label={`More options for ${itemLabel}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-nav-muted outline-none transition-[opacity,background-color,color]",
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring",
          "hover:bg-nav-accent hover:text-nav-foreground data-[state=open]:bg-nav-accent data-[state=open]:text-nav-foreground data-[state=open]:opacity-100",
        )}
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent aria-label={`${itemLabel} options`} aria-labelledby={undefined} side="right" align="start" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="truncate">{itemLabel}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onRename}>
          <Pencil aria-hidden="true" />
          Rename
        </DropdownMenuItem>

        {!isProduct && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderInput aria-hidden="true" />
              Move to group
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent aria-label="Move to group" className="w-52">
              {groups.map((g) => {
                const isCurrent = g.id === currentGroupId;
                return (
                  <DropdownMenuItem
                    key={g.id}
                    role="menuitemradio"
                    aria-checked={isCurrent}
                    disabled={isCurrent}
                    onSelect={() => onMove?.(g.id)}
                    className="data-[disabled]:opacity-100"
                  >
                    <Check aria-hidden="true" className={isCurrent ? "!text-foreground" : "invisible"} />
                    <span className="min-w-0 flex-1 truncate">{g.name}</span>
                    {isCurrent && <span className="text-xs text-muted-foreground">Current</span>}
                  </DropdownMenuItem>
                );
              })}
              {groups.length > 0 && <DropdownMenuSeparator />}
              {!newGroupMode ? (
                <DropdownMenuItem
                  onSelect={(e) => {
                    // Keep the menu open: the name is typed right here.
                    e.preventDefault();
                    setNewGroupMode(true);
                  }}
                >
                  <Plus aria-hidden="true" />
                  New group…
                </DropdownMenuItem>
              ) : (
                <form onSubmit={submitNewGroup} className="p-1.5">
                  <input
                    autoFocus
                    value={newGroupName}
                    onChange={(e) => {
                      setNewGroupName(e.target.value);
                      setNewGroupError(null);
                    }}
                    // Keystrokes belong to the field, not the menu's type-ahead.
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setNewGroupMode(false);
                      }
                      e.stopPropagation();
                    }}
                    maxLength={MAX_GROUP_NAME}
                    placeholder="Group name"
                    aria-label="New group name"
                    aria-invalid={Boolean(newGroupError) || undefined}
                    className="h-8 w-full rounded-full border border-surface-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/30 aria-invalid:border-destructive/50"
                  />
                  {newGroupError ? (
                    <p className="mt-1 px-1 text-xs text-destructive">{newGroupError}</p>
                  ) : (
                    <p className="mt-1 px-1 text-xs text-muted-foreground">Enter to create and move here</p>
                  )}
                </form>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {isProduct && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={!canDelete} onSelect={() => onDeleteProduct?.()} className="h-auto min-h-9 py-1.5">
              <Trash2 aria-hidden="true" />
              <span className="flex flex-col">
                Delete
                {!canDelete && <span className="text-xs font-normal text-muted-foreground">{deleteDisabledReason}</span>}
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
