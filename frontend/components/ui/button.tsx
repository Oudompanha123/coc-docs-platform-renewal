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
  // The corner is the `shape` variant below, not part of the base.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      // Declared before `size` on purpose: cva emits classes in key order and
      // `cn` keeps the last conflicting one, so `size="inline"`'s
      // `rounded-none` must come after the shape to win.
      shape: {
        /** `--radius-control` (globals.css) — the app's button corner, set in
         *  one place. A pill since r2.9, at the product owner's choice. */
        default: "rounded-control",
        /** Fully rounded — the sign-in pages (/login, /register and the
         *  password screens), which the product owner kept on the earlier pill
         *  style (r2.7), and controls that sit inside a pill field. */
        pill: "rounded-full",
      },
      variant: {
        /** The primary action. Solid, near-black, no gradient. */
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        /** Bordered — "Continue with Google", "Cancel". */
        outline: "border border-surface-border bg-background hover:bg-accent hover:text-accent-foreground",
        /** A filled but quiet action. */
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        /** No box until hovered — toolbar and icon affordances. */
        ghost: "hover:bg-accent hover:text-accent-foreground",
        /** Reads as a link, behaves as a button. */
        link: "text-foreground underline-offset-4 hover:underline",
        /** Irreversible, filled. */
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20",
        /** Irreversible, outlined — "Revoke", "Turn off", "Deactivate". */
        destructiveOutline:
          "border border-destructive/40 text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/20",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 gap-1.5 px-4 text-xs",
        lg: "h-11 px-7",
        icon: "size-10",
        /** Sits inside a sentence — no box of its own. Pair with `link`. */
        inline: "h-auto rounded-none p-0",
      },
    },
    defaultVariants: { shape: "default", variant: "default", size: "default" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child element with these classes instead of a `<button>`. */
    asChild?: boolean;
  };

export function Button({ className, shape, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ shape, variant, size }), className)} {...props} />;
}

export { buttonVariants };
