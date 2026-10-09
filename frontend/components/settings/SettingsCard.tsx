import type { ReactNode } from "react";

export function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  /** Optional header icon tile — same treatment as Overview's StatCard and
   *  AccordionSection, so every settings card reads as one visual system. */
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-5 flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <p className="text-lg font-bold text-dash-ink">{title}</p>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
