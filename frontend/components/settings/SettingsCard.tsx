import type { ReactNode } from "react";

/**
 * Replaces AccordionSection for this page's redesign: content is always
 * visible, nothing to click to reveal it (per direction — the previous
 * click-to-expand accordion hid data that should be visible immediately).
 * Card chrome is unchanged from AccordionSection / Overview's own cards
 * (rounded-2xl border-border bg-white shadow-sm), so it still belongs to
 * the same visual system.
 */
export function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-bold text-dash-ink">{title}</p>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      </div>
      <div className="mt-5 flex-1">{children}</div>
    </div>
  );
}
