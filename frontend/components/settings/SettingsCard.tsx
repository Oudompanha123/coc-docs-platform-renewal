import type { ReactNode } from "react";

export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-5">
        <p className="text-lg font-bold text-dash-ink">{title}</p>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
