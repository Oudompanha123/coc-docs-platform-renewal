/**
 * Button — the first shadcn/ui primitive (ADR-104 phase 1).
 *
 * The variants here are not shadcn's defaults. They were read off the call
 * sites this replaces, so a migrated button renders the same pixels it did
 * before (ADR-104 decision 2). Three of them — the submit buttons on
 * /forgot-password, /reset-password and /create-password — carried the *same*
 * 300-character class string, maintained in three places. That is the
 * duplication this file exists to end.
 *
 * `asChild` renders the caller's own element (a `<Link>`, usually) with these
 * classes instead of wrapping it in a `<button>`, via Radix's Slot. Without
 * it, a styled navigation link has to either duplicate the variant's classes
 * or be an anchor nested in a button, which is invalid HTML.
 *
 * // req: ADR-104
 */
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Shared by every variant. `disabled:opacity-60` is deliberately NOT here:
  // the link variant dims by going muted instead, and stacking the two would
  // make it fainter than it is today.
  "inline-flex items-center justify-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        /** The product's primary action — the brand gradient. */
        default:
          "bg-gradient-to-r from-brand-purple to-brand-blue text-white transition-opacity hover:opacity-90 disabled:opacity-60",
        /** Secondary action beside a primary one: "Back to login", "Continue with Google". */
        outline:
          "border border-border text-ink transition-colors hover:bg-page disabled:opacity-60",
        /** A bare icon affordance — the password-visibility toggle. Tints, never fills. */
        ghost: "text-muted transition-colors hover:text-ink disabled:opacity-60",
        /** Reads as a link, behaves as a button: "Resend code". */
        link: "text-brand-purple hover:underline disabled:text-muted disabled:no-underline",
        /** Destructive confirmation. No auth call site yet; added when one needs it. */
        destructive:
          "bg-destructive text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
        /** The settings area's "Revoke" / "Delete" affordances — outlined in the danger colour, not filled. */
        destructiveOutline:
          "border border-danger text-danger transition-colors hover:bg-danger/10 disabled:opacity-60",
      },
      size: {
        default: "rounded-xl px-4 py-3",
        sm: "rounded-xl px-4 py-2.5 text-sm",
        /**
         * The settings/dashboard scale. Two pixels shorter than `sm`, which
         * is not a distinction anyone designed — the auth pages and the
         * settings cards were simply built at different times. Both are kept
         * for now so migration moves no pixels; collapsing them into one is a
         * design decision, and it belongs in a PR that can show the before
         * and after rather than being smuggled in here.
         */
        md: "rounded-xl px-4 py-2 text-sm",
        /** Compact pair at the foot of a card form — Cancel / Save. */
        xs: "rounded-xl px-3 py-1.5 text-xs",
        icon: "h-4 w-4 rounded p-0",
        /** No box of its own — for the link variant, which sits inside a sentence. */
        inline: "rounded-none p-0",
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
