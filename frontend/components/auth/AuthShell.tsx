import type { ReactNode } from "react";

type AuthShellProps = {
  icon: ReactNode;
  badge?: ReactNode;
  heading: ReactNode;
  subheading: string;
  footer?: ReactNode;
  children: ReactNode;
  /** Vertical padding class for the form (right) panel at md+. Defaults to the Login page's value. */
  formPanelPaddingY?: string;
  /** Horizontal padding for the form (right) panel. Defaults to the original
   *  px-8/md:px-14 both pages used. Register overrides this to px-0 and
   *  re-applies the same px-8/md:px-14 on each of its own children instead,
   *  so its scrollable form's scrollbar renders flush against the card's
   *  edge rather than inset by the wrapper's padding. */
  formPanelPaddingX?: string;
};

/** Shared split-panel shell for the Login and Register screens. */
export function AuthShell({
  icon,
  badge,
  heading,
  subheading,
  footer,
  children,
  formPanelPaddingY = "md:py-16",
  formPanelPaddingX = "px-8 md:px-14",
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <div className="animate-entrance flex max-h-[760px] w-full max-w-[960px] flex-col overflow-hidden rounded-[28px] bg-white shadow-xl md:flex-row">
        <div className="relative flex flex-col items-center justify-center gap-4 overflow-hidden bg-gradient-to-br from-[#ded9f8] to-[#d3e2fb] px-6 py-8 text-center md:w-[50%] md:gap-6 md:px-10 md:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-[#c8b8f2] opacity-60 blur-2xl" />
            <div className="absolute right-6 top-16 h-16 w-16 rounded-full bg-[#a9e0d2] opacity-70 blur-xl" />
            <div className="absolute -left-6 bottom-24 h-24 w-24 rounded-full bg-[#e8cfa3] opacity-60 blur-xl" />
            <div className="absolute -right-16 -bottom-16 h-52 w-52 rounded-full bg-[#a9bdf5] opacity-60 blur-2xl" />
            <div className="absolute bottom-32 left-10 h-14 w-14 rounded-full bg-[#e8cfa3] opacity-50 blur-lg" />
          </div>

          <div className="relative z-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md md:h-16 md:w-16">
              {icon}
            </div>
            {badge && (
              <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow">
                {badge}
              </div>
            )}
          </div>

          <div className="relative z-10 space-y-1.5 md:space-y-2">
            <p className="text-xl font-extrabold leading-tight text-ink md:text-2xl">{heading}</p>
            <p className="max-w-[260px] text-sm text-muted">{subheading}</p>
          </div>

          <div aria-hidden="true" className="relative z-10 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" />
            <span className="h-[2px] w-6 bg-[#cfcbe6]" />
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" />
            <span className="h-[2px] w-6 bg-[#cfcbe6]" />
            <span className="h-2 w-2 rounded-full bg-[#cfcbe6]" />
          </div>

          {footer && <div className="relative z-10">{footer}</div>}
        </div>

        <div className={`flex flex-1 flex-col justify-center py-10 ${formPanelPaddingX} ${formPanelPaddingY}`}>{children}</div>
      </div>
    </div>
  );
}
