/**
 * Alert — shadcn/ui's, in this app's tokens (ADR-104 r2.16).
 *
 * The one inline message box: an error under a form, a warning above an
 * editor, a "Saved" confirmation. It replaces roughly forty hand-drawn
 * `<div role="alert">`s that each picked their own red (`bg-danger/10`,
 * `bg-destructive/10`, `#fef2f2`…), radius and padding. Colour is reserved
 * for status (ADR-104), so the variants are statuses:
 *
 * - `default`     neutral information
 * - `info`        something to know, not a problem
 * - `success`     it worked
 * - `warning`     needs attention, nothing broke
 * - `destructive` an error
 *
 * Every variant gets its icon by default (pass `icon={false}` to drop it, or
 * your own), so the state never rests on colour alone. `role` defaults to
 * "alert" for `destructive` (announced at once) and "status" for the rest
 * (announced politely); a caller can override it.
 *
 * Put an action (a "Retry", a "Reload") in `action`; it sits on the right.
 *
 * // req: ADR-104
 */
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex w-full items-start gap-2.5 rounded-xl border px-4 py-3 text-left text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-surface-border bg-card text-card-foreground [&>svg]:text-muted-foreground",
        info: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>;

const ICONS: Record<AlertVariant, typeof Info> = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

export function Alert({
  className,
  variant = "default",
  icon,
  action,
  onDismiss,
  role,
  children,
  ...props
}: Omit<ComponentProps<"div">, "title"> &
  VariantProps<typeof alertVariants> & {
    /** `false` for no icon; a node to use your own. Defaults to the variant's. */
    icon?: ReactNode | false;
    /** A button or link on the right — "Retry", "Reload". */
    action?: ReactNode;
    /** Shows a × that calls this. */
    onDismiss?: () => void;
  }) {
  const v = variant ?? "default";
  const Icon = ICONS[v];
  return (
    <div
      data-slot="alert"
      data-variant={v}
      role={role ?? (v === "destructive" ? "alert" : "status")}
      className={cn(alertVariants({ variant: v }), className)}
      {...props}
    >
      {icon === false ? null : icon ?? <Icon aria-hidden="true" />}
      <div className="min-w-0 flex-1 space-y-0.5">{children}</div>
      {action && <div className="-my-1 shrink-0">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-my-0.5 -mr-1 flex size-6 shrink-0 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="alert-title" className={cn("font-medium leading-snug", className)} {...props} />;
}

/** Inherits the variant's colour; the default variant's reads muted. */
export function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm leading-relaxed opacity-90 [[data-variant=default]_&]:text-muted-foreground [[data-variant=default]_&]:opacity-100 [&_a]:underline [&_a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}
