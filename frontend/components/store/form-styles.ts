/**
 * Field styles shared by the Store's dialogs (Add App, Edit App info, Next
 * version), on the design-system tokens (ADR-104).
 */
import { inputBaseClass } from "@/components/ui/input";
import { textareaBaseClass } from "@/components/ui/textarea";

/**
 * A single-line field: the app-wide pill from `components/ui/input.tsx` —
 * filled with no border at rest, lifting to white with a thin border and a
 * soft shadow on focus, the same as `SearchInput` on the Store listing.
 */
export const INPUT_CLASS = `${inputBaseClass} text-foreground`;

/** A multi-line field: the same surface with a corner instead of a pill. */
export const TEXTAREA_CLASS = `${textareaBaseClass} text-foreground`;

export const LABEL_CLASS = "mb-1 block text-xs font-medium text-foreground";

export const ERROR_CLASS = "rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive";
