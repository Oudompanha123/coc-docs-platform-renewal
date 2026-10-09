"use client";

import { useState } from "react";
import { moveItem } from "@/components/docs/editor/reorder";
import { LegalIconDropdown } from "./LegalIconDropdown";
import { MarkdownEditor } from "./MarkdownEditor";
import { legalFieldInputClass } from "./LegalFieldGroup";
import { LEGAL_LIMITS, blankSection, type LegalContent, type LegalSection } from "@/lib/legal/content-types";
import { slugifyAnchor } from "@/lib/legal/validate";
import type { LegalValidationIssues } from "@/lib/legal/validate";

/** `title` -> a unique anchor id, disambiguated against every OTHER
 *  section's current id (never against its own previous id, so renaming
 *  back and forth doesn't pile up suffixes). */
function anchorFor(title: string, index: number, sections: LegalSection[]): string {
  const base = slugifyAnchor(title) || `section-${index + 1}`;
  const others = new Set(sections.filter((_, i) => i !== index).map((s) => s.id));
  if (!others.has(base)) return base;
  let n = 2;
  while (others.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * The sections accordion (task spec, Step 3 §D): a collapsed row shows a
 * drag handle, number badge, title and chevron; the open row gets a light
 * purple background and holds the title, icon dropdown and the Markdown
 * body editor. No outer card chrome here — the admin page wraps every
 * field group (this one included) in one continuous white paper card.
 */
export function LegalSectionsForm({
  value,
  onChange,
  issues,
  disabled,
}: {
  value: LegalContent;
  onChange: (next: LegalContent) => void;
  issues: LegalValidationIssues;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function toggleExpanded(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function updateSection(index: number, patch: Partial<LegalSection>) {
    const sections = value.sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ ...value, sections });
  }

  function renameSection(index: number, title: string) {
    const sections = value.sections.map((s, i) =>
      i === index ? { ...s, title, id: anchorFor(title, index, value.sections) } : s,
    );
    onChange({ ...value, sections });
  }

  function removeSection(index: number) {
    if (!window.confirm("Remove this section? This can't be undone once you save.")) return;
    onChange({ ...value, sections: value.sections.filter((_, i) => i !== index) });
  }

  function addSection() {
    if (value.sections.length >= LEGAL_LIMITS.maxSections) return;
    const title = `New section ${value.sections.length + 1}`;
    const section = { ...blankSection(""), title };
    section.id = anchorFor(title, value.sections.length, value.sections);
    onChange({ ...value, sections: [...value.sections, section] });
    setExpanded((prev) => new Set(prev).add(value.sections.length));
  }

  function moveSection(index: number, direction: -1 | 1) {
    onChange({ ...value, sections: moveItem(value.sections, index, direction) });
  }

  function dropAt(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const sections = value.sections.slice();
    const [moved] = sections.splice(dragIndex, 1);
    sections.splice(targetIndex, 0, moved!);
    onChange({ ...value, sections });
    setDragIndex(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-dash-ink">Sections</h2>
          <p className="mt-0.5 text-sm text-muted">Each section shows as a card on the live page.</p>
        </div>
        <span className="shrink-0 rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-muted">
          {value.sections.length} section{value.sections.length === 1 ? "" : "s"}
        </span>
      </div>
      {issues.sections && <p className="mt-2 text-xs text-danger">{issues.sections}</p>}

      <div className="mt-4 space-y-2.5">
        {value.sections.map((section, i) => {
          const isExpanded = expanded.has(i);
          return (
            <div
              key={i}
              draggable={!disabled}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropAt(i)}
              className={`rounded-xl border transition-colors ${
                dragIndex === i ? "border-brand-purple bg-brand-purple/5" : isExpanded ? "border-brand-purple/30 bg-brand-purple/5" : "border-border bg-white"
              }`}
            >
              <div className="flex items-center gap-2.5 p-3">
                <span
                  aria-hidden="true"
                  className={`shrink-0 text-muted ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}
                >
                  ⠿
                </span>
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    disabled={disabled || i === 0}
                    onClick={() => moveSection(i, -1)}
                    aria-label={`Move section ${i + 1} up`}
                    className="rounded px-1 text-xs text-muted hover:text-dash-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={disabled || i === value.sections.length - 1}
                    onClick={() => moveSection(i, 1)}
                    aria-label={`Move section ${i + 1} down`}
                    className="rounded px-1 text-xs text-muted hover:text-dash-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <span className="shrink-0 rounded-md bg-brand-purple/10 px-1.5 py-0.5 text-xs font-bold text-brand-purple">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-dash-ink">
                  {section.title || "Untitled section"}
                </span>
                {isExpanded && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeSection(i)}
                    aria-label={`Delete section ${i + 1}`}
                    className="shrink-0 rounded-full p-1.5 text-muted hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    🗑
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleExpanded(i)}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? `Collapse section ${i + 1}` : `Expand section ${i + 1}`}
                  className="shrink-0 rounded-full p-1.5 text-muted hover:bg-page"
                >
                  <span className={`inline-block transition-transform ${isExpanded ? "rotate-180" : ""}`}>⌄</span>
                </button>
              </div>

              {isExpanded && (
                <div className="space-y-3 border-t border-brand-purple/20 p-3 pt-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <span className="text-xs font-semibold text-muted">
                        Section title<span className="text-danger"> *</span>
                      </span>
                      <input
                        className={`${legalFieldInputClass} mt-1.5`}
                        placeholder="Section title"
                        value={section.title}
                        maxLength={LEGAL_LIMITS.maxSectionTitleLength}
                        disabled={disabled}
                        onChange={(e) => renameSection(i, e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-muted">Icon</span>
                      <div className="mt-1.5">
                        <LegalIconDropdown value={section.icon} disabled={disabled} onChange={(icon) => updateSection(i, { icon })} />
                      </div>
                    </div>
                  </div>
                  {issues[`sections[${i}].title`] && (
                    <p className="text-xs text-danger">{issues[`sections[${i}].title`]}</p>
                  )}

                  <div>
                    <span className="text-xs font-semibold text-muted">
                      Body<span className="text-danger"> *</span>
                    </span>
                    <div className="mt-1.5">
                      <MarkdownEditor
                        value={section.body}
                        onChange={(body) => updateSection(i, { body })}
                        maxLength={LEGAL_LIMITS.maxSectionBodyLength}
                        bulletStyle={value.bulletStyle}
                        disabled={disabled}
                        placeholder="Write this section…"
                      />
                    </div>
                  </div>
                  {issues[`sections[${i}].body`] && (
                    <p className="text-xs text-danger">{issues[`sections[${i}].body`]}</p>
                  )}

                  <p className="text-xs text-muted">
                    Anchor: <code className="rounded bg-page px-1 py-0.5 font-mono">#{section.id}</code>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled || value.sections.length >= LEGAL_LIMITS.maxSections}
        onClick={addSection}
        className="mt-3 w-full rounded-xl border border-dashed border-border py-2.5 text-sm font-semibold text-muted hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Add section
      </button>
    </div>
  );
}
