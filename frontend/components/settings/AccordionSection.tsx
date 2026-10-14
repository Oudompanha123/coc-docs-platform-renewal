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
 * One accordion section — a flat bordered card (rounded-xl border-surface-border
 * bg-card, no shadow: shadows are kept for popovers and modals, ADR-104) with a
 * compact neutral icon tile (size-8 rounded-lg bg-secondary), so this reads as
 * the same visual system as the other settings cards.
 */
export function AccordionSection({ icon: Icon, title, description, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-card">
      {/* A disclosure header, not a button: the whole card top is the hit
          area, it carries aria-expanded, and it has no button styling of its
          own. Belongs to a Collapsible primitive in phase 3 (ADR-104 §2.5). */}
      {/* eslint-disable-next-line react/forbid-elements */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        <ChevronDownIcon
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="border-t border-surface-border px-4 pb-4 pt-4">{children}</div>}
    </div>
  );
}
