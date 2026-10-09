"use client";

import { useState } from "react";
import type { LegalDocSection } from "@/lib/legal/legal-document";
import { sectionHasIssue, type LegalDocValidationIssues } from "@/lib/legal/legal-document-validate";

/**
 * The sticky left outline (task spec §C): numbered section headings.
 * Clicking one scrolls the form to that section and opens it; dragging one
 * reorders the same `sections` array the accordion edits (one source of
 * truth, two surfaces), and a red dot marks a section with an error.
 */
export function TermsOutlineNav({
  sections,
  onChange,
  onSelect,
  issues,
  disabled,
}: {
  sections: LegalDocSection[];
  onChange: (next: LegalDocSection[]) => void;
  onSelect: (index: number) => void;
  issues: LegalDocValidationIssues;
  disabled?: boolean;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function dropAt(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = sections.slice();
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved!);
    onChange(next);
    setDragIndex(null);
  }

  return (
    <nav aria-label="Outline" className="w-[220px] shrink-0">
      <div className="sticky top-6">
        <p className="px-2 text-xs font-medium text-muted-foreground">Outline</p>
        {sections.length === 0 ? (
          <p className="mt-2 px-2 text-xs text-muted-foreground">No sections yet.</p>
        ) : (
          <ol className="mt-2 space-y-0.5">
            {sections.map((section, i) => (
              <li
                key={i}
                draggable={!disabled}
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dropAt(i)}
              >
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                    dragIndex === i ? "bg-muted-surface" : ""
                  }`}
                >
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 truncate text-foreground">{section.title || "Untitled section"}</span>
                  {sectionHasIssue(issues, i) && <span aria-label="Has an error" className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </nav>
  );
}
