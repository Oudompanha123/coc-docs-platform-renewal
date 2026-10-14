"use client";

/**
 * Select — shadcn/ui's, on Radix (ADR-104 r2.10).
 *
 * Replaces the native `<select>`. A native select's closed state can be
 * styled, but its open list is drawn by the operating system — the square
 * white box with a bright blue highlight the product owner flagged — and no
 * CSS reaches it in Safari or Firefox. Radix draws the list itself, so it
 * gets the design system's popover: rounded panel, hairline border, grey
 * hover, a check on the chosen row.
 *
 * Two layers:
 * - The shadcn parts (`Select`, `SelectTrigger`, `SelectContent`,
 *   `SelectItem`, …) for anything unusual.
 * - `SimpleSelect`, which takes `value` / `onValueChange` / `options` and
 *   is what nearly every call site needs. It also hides one Radix rule:
 *   an item's value may not be the empty string (Radix reserves it for
 *   "cleared"), while this app uses `""` for "All" in several filters.
 *   `SimpleSelect` maps `""` to a sentinel on the way in and back on the
 *   way out, so callers keep their existing values.
 *
 * The trigger is a pill on the shared field surface (`fieldSurfaceClass`),
 * so a select sits beside an `Input` as the same kind of control.
 *
 * // req: ADR-104
 */
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fieldSurfaceClass } from "./input";
import { useThemedPortalContainer } from "@/lib/portal-container";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "default" | "sm" }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        fieldSurfaceClass,
        "flex items-center justify-between gap-2 rounded-full text-left whitespace-nowrap",
        size === "sm" ? "h-9 pl-3.5 pr-2.5 text-sm" : "h-10 pl-4 pr-3",
        "data-[placeholder]:text-muted-foreground [&>span]:truncate",
        "data-[state=open]:bg-background data-[state=open]:border-surface-border",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  const container = useThemedPortalContainer();
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={position === "popper" ? 6 : undefined}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-32 overflow-hidden rounded-xl border border-surface-border bg-popover text-popover-foreground shadow-md",
          "animate-tab-content",
          position === "popper" && "w-(--radix-select-trigger-width)",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-muted-foreground">
          <ChevronUp className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-muted-foreground">
          <ChevronDown className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex h-9 w-full cursor-default select-none items-center rounded-lg pl-2.5 pr-8 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground data-[state=checked]:font-medium",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-2.5 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({ className, ...props }: ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-surface-border", className)} {...props} />;
}

export type SelectOption = { value: string; label: ReactNode; disabled?: boolean };

/** Radix forbids `""` as an item value; this app uses it for "All". */
const EMPTY = "__empty__";
const toRadix = (v: string) => (v === "" ? EMPTY : v);
const fromRadix = (v: string) => (v === EMPTY ? "" : v);

/**
 * The select most call sites want: a value, a change handler and a list.
 * `className` styles the trigger (widths, margins); `aria-label` names it
 * when no `<label htmlFor>` does.
 */
export function SimpleSelect({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  name,
  disabled,
  required,
  size,
  className,
  contentClassName,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  size?: "default" | "sm";
  className?: string;
  contentClassName?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  return (
    <Select
      value={toRadix(value)}
      onValueChange={(v) => onValueChange(fromRadix(v))}
      name={name}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        id={id}
        size={size}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className={className}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((o) => (
          <SelectItem key={o.value} value={toRadix(o.value)} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
