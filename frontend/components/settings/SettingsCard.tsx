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
    <div className="flex h-full flex-col rounded-xl border border-surface-border bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        {Icon && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Icon className="size-4" />
          </div>
        )}
        <div>
          <p className="text-base font-semibold text-foreground">{title}</p>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
