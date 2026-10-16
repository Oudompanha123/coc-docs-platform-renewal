import Link from "next/link";
import type { ReactNode } from "react";
import appIcon from "@/app/icon.png";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

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
 *
 * The product's logo sits above the title (product owner, 2026-10-14) — the
 * app icon itself (`app/icon.png`, imported so it is the same file the
 * favicon is built from) beside the name, linking back to /welcome.
 */
export function AuthShell({ heading, subheading, footer, children }: AuthShellProps) {
  return (
    <div className="landing-light bg-background relative flex min-h-svh flex-col items-center justify-center px-6 py-12">
      {/* `landing-light`: these pages are always light (ADR-104 decision 3),
          but :root darkens the page background on a dark OS — this pins it. */}
      {/* Before sign-in there is no Settings page to choose a language in,
          so these pages carry the switcher themselves (ADR-116). */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="animate-entrance w-full max-w-sm">
        <Link
          href="/welcome"
          className="mb-8 inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
          <img src={appIcon.src} alt="" width={40} height={40} className="size-10 object-contain" />
          <span className="text-base font-semibold tracking-tight text-foreground">Coc Docs Platform</span>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{heading}</h1>
        <p className="text-muted-foreground mt-2 text-sm text-balance">{subheading}</p>

        <div className="mt-6">{children}</div>

        {footer && <div className="text-muted-foreground mt-6 text-center text-xs text-balance">{footer}</div>}
      </div>
    </div>
  );
}
