/**
 * Button — shadcn/ui's, on this product's tokens (ADR-104 r2.0).
 *
 * This replaced a brand-gradient button. The first version of this file kept
 * that gradient and every size the codebase had grown, because the ADR as
 * drafted promised that no pixel would move. The product owner wanted the UI
 * upgraded rather than rewired, so the geometry here is now shadcn's: a
 * 36px-tall control, `rounded-md`, `text-sm font-medium`, a solid near-black
 * primary, and a focus ring drawn as a 3px halo in the ring colour instead of
 * a 2px outline in brand purple.
 *
 * Sizes are shadcn's four. The `md`, `xs` and `inline` steps this file used
 * to carry are gone: they existed only to reproduce four padding scales that
 * had accumulated across the app, and the upgrade is the moment to collapse
 * them rather than preserve them forever.
 *
 * // req: ADR-104
 */
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // `rounded-full` is the house shape, from the reference design the product
  // owner supplied: pill buttons and pill fields, not shadcn's default
  // rectangles. A caller that genuinely needs a square corner overrides it.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** The primary action. Solid, near-black, no gradient. */
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        /** A bordered pill — "Continue with Google", "Cancel". */
        outline: "border border-surface-border bg-background hover:bg-accent hover:text-accent-foreground",
        /** A filled but quiet action. */
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        /** No box until hovered — toolbar and icon affordances. */
        ghost: "hover:bg-accent hover:text-accent-foreground",
        /** Reads as a link, behaves as a button. */
        link: "text-foreground underline-offset-4 hover:underline",
        /** Irreversible, filled. */
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
        /** Irreversible, outlined — "Revoke", "Turn off", "Deactivate". */
        destructiveOutline:
          "border border-destructive/40 text-destructive shadow-xs hover:bg-destructive/10 focus-visible:ring-destructive/20",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 gap-1.5 px-3.5 text-xs",
        lg: "h-11 px-7",
        icon: "size-10",
        /** Sits inside a sentence — no box of its own. Pair with `link`. */
        inline: "h-auto rounded-none p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child element with these classes instead of a `<button>`. */
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
