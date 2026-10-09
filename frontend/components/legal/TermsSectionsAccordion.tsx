"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { moveItem } from "@/components/docs/editor/reorder";
import { MarkdownEditor } from "./MarkdownEditor";
import { legalFieldInputClass } from "./LegalFieldGroup";
import { markdownWordCount } from "@/lib/legal/markdown";
import { LEGAL_DOC_LIMITS, slugifyAnchor, uniqueAnchor, type LegalDocSection } from "@/lib/legal/legal-document";
import { sectionHasIssue, type LegalDocValidationIssues } from "@/lib/legal/legal-document-validate";

/** `title` -> a unique anchor id, disambiguated against every OTHER
 *  section's current id (never against its own previous id, so renaming
 *  back and forth doesn't pile up suffixes). */
function anchorFor(title: string, index: number, sections: LegalDocSection[]): string {
  const base = slugifyAnchor(title);
  const others = new Set(sections.filter((_, i) => i !== index).map((s) => s.id));
  return uniqueAnchor(base, others);
}

/**
 * The Terms document's sections accordion (task spec §D): a toolbar with
 * Expand all/Collapse all and a count, a collapsed row showing drag handle +
 * number + heading + word count + error dot + chevron, and an open row with
 * the heading field, its auto anchor, the Markdown body editor, and
 * ↑ ↓ Duplicate Delete actions. A dashed "+ Add section" sits at the bottom,
 * and a small "+" between each row inserts there directly.
 */
export function TermsSectionsAccordion({
  sections,
  onChange,
  issues,
  disabled,
  expanded: controlledExpanded,
  onExpandedChange,
}: {
  sections: LegalDocSection[];
  onChange: (next: LegalDocSection[]) => void;
  issues: LegalDocValidationIssues;
  disabled?: boolean;
  /** Lets a sibling (the outline nav) open a section too — omit either prop
   *  to keep this fully self-contained, as the standalone tests do. */
  expanded?: ReadonlySet<number>;
  onExpandedChange?: (next: Set<number>) => void;
}) {
  const [internalExpanded, setInternalExpanded] = useState<Set<number>>(new Set(sections.length > 0 ? [0] : []));
  const expanded = controlledExpanded ?? internalExpanded;
  function setExpanded(next: Set<number> | ((prev: ReadonlySet<number>) => Set<number>)) {
    const resolved = typeof next === "function" ? next(expanded) : next;
    if (onExpandedChange) onExpandedChange(resolved);
    else setInternalExpanded(resolved);
  }
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const focusIndexRef = useRef<number | null>(null);
  const headingRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  useLayoutEffect(() => {
    if (focusIndexRef.current === null) return;
    const el = headingRefs.current.get(focusIndexRef.current);
    if (el) {
      el.focus();
      focusIndexRef.current = null;
    }
  });

  function toggleExpanded(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(sections.map((_, i) => i)));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  function updateSection(index: number, patch: Partial<LegalDocSection>) {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function renameSection(index: number, title: string) {
    onChange(sections.map((s, i) => (i === index ? { ...s, title, id: anchorFor(title, index, sections) } : s)));
  }

  function removeSection(index: number) {
    if (!window.confirm("Delete this section? This can't be undone once you save.")) return;
    onChange(sections.filter((_, i) => i !== index));
    setExpanded((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  }

  function duplicateSection(index: number) {
    if (sections.length >= LEGAL_DOC_LIMITS.maxSections) return;
    const source = sections[index]!;
    const title = `${source.title} (copy)`;
    const copy: LegalDocSection = { title, body: source.body, id: anchorFor(title, sections.length, sections) };
    const next = sections.slice();
    next.splice(index + 1, 0, copy);
    onChange(next);
    setExpanded((prev) => {
      const shifted = new Set<number>();
      prev.forEach((i) => shifted.add(i > index ? i + 1 : i));
      shifted.add(index + 1);
      return shifted;
    });
  }

  function addSectionAt(index: number) {
    if (sections.length >= LEGAL_DOC_LIMITS.maxSections) return;
    const title = `New section ${sections.length + 1}`;
    const section: LegalDocSection = { title, body: "", id: anchorFor(title, sections.length, sections) };
    const next = sections.slice();
    next.splice(index, 0, section);
    onChange(next);
    setExpanded((prev) => {
      const shifted = new Set<number>();
      prev.forEach((i) => shifted.add(i >= index ? i + 1 : i));
      shifted.add(index);
      return shifted;
    });
    focusIndexRef.current = index;
  }

  function moveSection(index: number, direction: -1 | 1) {
    onChange(moveItem(sections, index, direction));
  }

  function dropAt(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = sections.slice();
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved!);
    onChange(next);
    setDragIndex(null);
  }

  const atMax = sections.length >= LEGAL_DOC_LIMITS.maxSections;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={expandAll} className="text-xs font-semibold text-brand-purple hover:underline">
            Expand all
          </button>
          <span className="text-xs text-muted">·</span>
          <button type="button" onClick={collapseAll} className="text-xs font-semibold text-brand-purple hover:underline">
            Collapse all
          </button>
        </div>
        <span className="shrink-0 rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-muted">
          {sections.length} section{sections.length === 1 ? "" : "s"}
        </span>
      </div>
      {issues.sections && <p className="mt-2 text-xs text-danger">{issues.sections}</p>}

      {sections.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border py-8 text-center">
          <p className="text-sm font-semibold text-dash-ink">No sections yet</p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => addSectionAt(0)}
            className="mt-2 text-sm font-semibold text-brand-purple hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add your first section
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-1.5">
          {sections.map((section, i) => {
            const isExpanded = expanded.has(i);
            const hasError = sectionHasIssue(issues, i);
            const words = markdownWordCount(section.body);
            return (
              <div key={i} data-section-index={i}>
                <div
                  draggable={!disabled}
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dropAt(i)}
                  className={`rounded-xl border transition-colors ${
                    dragIndex === i ? "border-brand-purple bg-brand-purple/5" : isExpanded ? "border-brand-purple/30 bg-brand-purple/5" : "border-border bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 p-3">
                    <span aria-hidden="true" className={`shrink-0 text-muted ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}>
                      ⠿
                    </span>
                    <span className="shrink-0 rounded-md bg-brand-purple/10 px-1.5 py-0.5 text-xs font-bold text-brand-purple">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {hasError && <span aria-label="Has an error" className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-dash-ink">
                      {section.title || "Untitled section"}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{words} word{words === 1 ? "" : "s"}</span>
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
                      <div>
                        <span className="text-xs font-semibold text-muted">
                          Heading<span className="text-danger"> *</span>
                        </span>
                        <input
                          ref={(el) => {
                            if (el) headingRefs.current.set(i, el);
                            else headingRefs.current.delete(i);
                          }}
                          className={`${legalFieldInputClass} mt-1.5`}
                          placeholder="Section heading"
                          value={section.title}
                          maxLength={LEGAL_DOC_LIMITS.maxSectionTitleLength}
                          disabled={disabled}
                          onChange={(e) => renameSection(i, e.target.value)}
                        />
                        <p className="mt-1 text-xs text-muted">
                          Anchor: <code className="rounded bg-page px-1 py-0.5 font-mono">#{section.id}</code>
                        </p>
                        {issues[`sections[${i}].title`] && <p className="mt-1 text-xs text-danger">{issues[`sections[${i}].title`]}</p>}
                        {issues[`sections[${i}].id`] && <p className="mt-1 text-xs text-danger">{issues[`sections[${i}].id`]}</p>}
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-muted">
                          Body<span className="text-danger"> *</span>
                        </span>
                        <div className="mt-1.5">
                          <MarkdownEditor
                            value={section.body}
                            onChange={(body) => updateSection(i, { body })}
                            maxLength={LEGAL_DOC_LIMITS.maxSectionBodyLength}
                            bulletStyle="circle"
                            disabled={disabled}
                            placeholder="Write this section…"
                          />
                        </div>
                        {issues[`sections[${i}].body`] && <p className="mt-1 text-xs text-danger">{issues[`sections[${i}].body`]}</p>}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={disabled || i === 0}
                          onClick={() => moveSection(i, -1)}
                          aria-label={`Move section ${i + 1} up`}
                          className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-dash-ink hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={disabled || i === sections.length - 1}
                          onClick={() => moveSection(i, 1)}
                          aria-label={`Move section ${i + 1} down`}
                          className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-dash-ink hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          disabled={disabled || atMax}
                          onClick={() => duplicateSection(i)}
                          className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-dash-ink hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => removeSection(i)}
                          className="rounded-full border border-danger/30 px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!disabled && !atMax && (
                  <div className="group/insert relative h-2.5">
                    <button
                      type="button"
                      onClick={() => addSectionAt(i + 1)}
                      aria-label={`Add a section after ${section.title || "this one"}`}
                      className="absolute left-1/2 top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-xs text-muted opacity-0 shadow-sm transition-opacity hover:text-brand-purple group-hover/insert:opacity-100"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {sections.length > 0 && (
        <button
          type="button"
          disabled={disabled || atMax}
          onClick={() => addSectionAt(sections.length)}
          className="mt-3 w-full rounded-xl border border-dashed border-border py-2.5 text-sm font-semibold text-muted hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add section
        </button>
      )}
    </div>
  );
}
