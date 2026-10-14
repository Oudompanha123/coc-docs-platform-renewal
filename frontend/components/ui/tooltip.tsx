"use client";

/**
 * Tooltip — shadcn/ui's, on Radix (ADR-104 r2.10).
 *
 * For a short explanation that would otherwise sit under a control as a line
 * of small print — the role descriptions in the roles picker, first. It opens
 * on hover and on keyboard focus, so it is not a mouse-only affordance, and
 * the trigger keeps the same text in its accessible description, so a screen
 * reader hears it without the tooltip opening at all.
 *
 * Portalled into the themed shell like the select and menu, so dark mode
 * reaches it.
 *
 * // req: ADR-104
 */
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useThemedPortalContainer } from "@/lib/portal-container";

/** Wrap a region once; tooltips inside share one open/close delay. */
export function TooltipProvider({ delayDuration = 300, ...props }: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  const container = useThemedPortalContainer();
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "animate-tab-content z-50 max-w-60 rounded-lg bg-primary px-2.5 py-1.5 text-xs leading-snug text-primary-foreground shadow-md",
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
