import type { ReactNode } from "react";

type AuthShellProps = {
  /** Accepted for call-site compatibility; no longer rendered — see below. */
  icon?: ReactNode;
  badge?: ReactNode;
  heading: ReactNode;
  /** ReactNode, not string — a page may need to mark part of it up (the OTP
   *  step emphasises which account the code belongs to). */
  subheading: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * The shell behind /login, /register, /forgot-password, /reset-password and
 * /create-password (ADR-104 r2.1).
 *
 * It used to be a 960px split panel: a pastel gradient on the left with
 * floating blurred circles, a decorative progress rail and a badge, and the
 * form on the right. It is now what the reference design the product owner
 * supplied shows — a narrow column on a plain background, a bold left-aligned
 * title, and the form. No card, no border, no shadow, no decoration.
 *
 * `icon` and `badge` are still accepted so no page had to change shape, and
 * neither is rendered: the reference has no icon above the title, and a badge
 * only existed to decorate the panel that is gone. Removing the props is a
 * separate mechanical sweep.
 */
export function AuthShell({ heading, subheading, footer, children }: AuthShellProps) {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="animate-entrance w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{heading}</h1>
        <p className="text-muted-foreground mt-2 text-sm text-balance">{subheading}</p>

        <div className="mt-6">{children}</div>

        {footer && <div className="text-muted-foreground mt-6 text-center text-xs text-balance">{footer}</div>}
      </div>
    </div>
  );
}
