"use client";

/**
 * Calendar — shadcn/ui's, on react-day-picker v9 (ADR-104 r2.11).
 *
 * A month grid in the app's own tokens: neutral cells, the selected day in
 * `--primary`, today marked with the muted surface. Day cells are round, in
 * line with the pill controls (ADR-104 r2.6). Used by `DatePicker`
 * (`./date-picker`); render it directly only for an always-open calendar.
 *
 * // req: ADR-104
 */
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const d = getDefaultClassNames();
  return (
    <DayPicker
      data-slot="calendar"
      showOutsideDays={showOutsideDays}
      className={cn("w-fit [--cell-size:2.25rem]", className)}
      classNames={{
        root: cn("w-fit", d.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", d.months),
        month: cn("flex w-full flex-col gap-3", d.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", d.nav),
        button_previous: cn(
          "inline-flex size-(--cell-size) items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40",
          d.button_previous,
        ),
        button_next: cn(
          "inline-flex size-(--cell-size) items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40",
          d.button_next,
        ),
        month_caption: cn("flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)", d.month_caption),
        caption_label: cn("select-none text-sm font-semibold", d.caption_label),
        month_grid: cn("w-full border-collapse", d.month_grid),
        weekdays: cn("flex", d.weekdays),
        weekday: cn("flex-1 select-none text-[0.8rem] font-normal text-muted-foreground", d.weekday),
        week: cn("mt-1 flex w-full", d.week),
        day: cn("relative aspect-square size-(--cell-size) p-0 text-center text-sm", d.day),
        day_button: cn(
          "inline-flex size-(--cell-size) items-center justify-center rounded-full font-normal outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
          d.day_button,
        ),
        today: cn("[&>button]:bg-muted-surface [&>button]:font-semibold", d.today),
        selected: cn(
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
          d.selected,
        ),
        outside: cn("text-muted-foreground opacity-50", d.outside),
        disabled: cn("text-muted-foreground opacity-40 [&>button]:pointer-events-none", d.disabled),
        hidden: cn("invisible", d.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...rest }) => {
          const Icon = orientation === "left" ? ChevronLeft : orientation === "right" ? ChevronRight : ChevronDown;
          return <Icon aria-hidden="true" className={cn("size-4", chevronClass)} {...rest} />;
        },
      }}
      {...props}
    />
  );
}
