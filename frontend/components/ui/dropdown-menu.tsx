"use client";

/**
 * DropdownMenu — shadcn/ui's, on Radix (ADR-104 r2.10).
 *
 * Mainly here for row actions: a list row that carried two to four buttons
 * (Edit, Publish, Delete…) now carries one "⋯" trigger, `RowActions`, that
 * opens them as a menu, as the design system's data tables do. The row reads
 * as data first, and a destructive action is one deliberate step away
 * instead of sitting a few pixels from Edit.
 *
 * The panel shares the select's popover look (rounded, hairline border,
 * grey hover rows), so every floating list in the app is the same object.
 *
 * // req: ADR-104
 */
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useThemedPortalContainer } from "@/lib/portal-container";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  const container = useThemedPortalContainer();
  return (
    <DropdownMenuPrimitive.Portal container={container}>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "animate-tab-content z-50 min-w-40 overflow-hidden rounded-xl border border-surface-border bg-popover p-1 text-popover-foreground shadow-md",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & { variant?: "default" | "destructive" }) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "relative flex h-9 cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 text-sm outline-none [&_svg]:size-4 [&_svg]:shrink-0",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        variant === "destructive"
          ? "text-destructive focus:bg-destructive/10 [&_svg]:text-destructive"
          : "focus:bg-accent focus:text-accent-foreground [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("px-2.5 py-1.5 text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-surface-border", className)} {...props} />;
}

/**
 * A row's "⋯" button and its menu. `label` names the trigger for screen
 * readers — "Actions for <row>" — because a bare icon button is otherwise
 * one of twenty identical, unnamed buttons down the table.
 */
export function RowActions({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={label}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none",
          "hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-foreground",
          className,
        )}
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
