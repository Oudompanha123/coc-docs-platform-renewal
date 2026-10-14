"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * A custom group header's "⋮" menu: Rename group, Delete group — on the
 * shared `DropdownMenu`, like `SidebarItemMenu` (ADR-104 r2.15). Delete is
 * super_admin-only and only for an empty group; when it can't apply, the row
 * is disabled with the reason written under it rather than in a hover title.
 * Never rendered for a built-in group (ADMINISTRATION/DEVELOPER) or PRODUCTS
 * — the caller doesn't mount it for those. Deleting asks first, in the
 * caller's own dialog.
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
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`More options for ${groupName}`}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-nav-muted outline-none transition-[opacity,background-color,color]",
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring",
          "hover:bg-nav-accent hover:text-nav-foreground data-[state=open]:bg-nav-accent data-[state=open]:text-nav-foreground data-[state=open]:opacity-100",
        )}
      >
        <MoreVertical className="size-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent aria-label={`${groupName} group options`} aria-labelledby={undefined} side="right" align="start" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="truncate">{groupName}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onRename}>
          <Pencil aria-hidden="true" />
          Rename group
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={!canDelete} onSelect={onDelete} className="h-auto min-h-9 py-1.5">
          <Trash2 aria-hidden="true" />
          <span className="flex flex-col">
            Delete group
            {!canDelete && <span className="text-xs font-normal text-muted-foreground">{deleteDisabledReason}</span>}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
