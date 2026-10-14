"use client";

/**
 * Popover — shadcn/ui's, on Radix (ADR-104 r2.11).
 *
 * The floating panel the date picker opens. Same object as every other
 * floating layer in the app (select list, dropdown menu): rounded, hairline
 * border, popover tokens, and portalled into the page's own shell so it keeps
 * the dark theme instead of drawing light from `<body>`.
 *
 * // req: ADR-104
 */
import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useThemedPortalContainer } from "@/lib/portal-container";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({
  className,
  align = "start",
  sideOffset = 6,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  const container = useThemedPortalContainer();
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "animate-tab-content z-50 rounded-xl border border-surface-border bg-popover p-3 text-popover-foreground shadow-md outline-none",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
