"use client";

import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/layout/icons";

type AccordionSectionProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/**
 * One accordion section — the outer card (radius/shadow/padding) matches
 * Overview's card convention exactly (rounded-2xl border-border bg-white
 * shadow-sm), and the header icon chip reuses Overview's StatCard icon-tile
 * treatment (h-10 w-10 rounded-xl gradient tile), so this reads as the same
 * visual system rather than a new one.
 */
export function AccordionSection({ icon: Icon, title, description, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-bold text-dash-ink">{title}</p>
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="border-t border-border px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}
