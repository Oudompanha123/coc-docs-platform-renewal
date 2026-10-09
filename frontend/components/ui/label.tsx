/**
 * Label — the field-caption primitive (ADR-104 phase 1).
 *
 * shadcn's own Label wraps `@radix-ui/react-label`. This one does not, and
 * that is a deliberate deviation: Radix's Label adds one behaviour over a
 * plain element — suppressing text selection when you double-click the
 * caption — in exchange for another dependency. Every label in this codebase
 * already carries an explicit `htmlFor`, which is the part that matters, so
 * the package would buy nothing the browser is not already doing.
 *
 * Layout classes (`mb-1.5 block`) stay with the caller. How much space sits
 * under a caption is the form's business, not the caption's.
 *
 * // req: ADR-104
 */
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-semibold text-ink", className)} {...props} />;
}
