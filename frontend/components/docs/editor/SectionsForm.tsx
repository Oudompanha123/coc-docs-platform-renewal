import { FormField, fieldInputClass, fieldTextareaClass } from "./FormField";
import { moveItem } from "./reorder";
import type { SectionsContent } from "@/lib/docs/content-types";

export function SectionsForm({
  value,
  onChange,
}: {
  value: SectionsContent;
  onChange: (next: SectionsContent) => void;
}) {
  function set<K extends keyof SectionsContent>(key: K, val: SectionsContent[K]) {
    onChange({ ...value, [key]: val });
  }

  function updateSection(index: number, patch: Partial<SectionsContent["sections"][number]>) {
    const sections = value.sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ ...value, sections });
  }

  function removeSection(index: number) {
    if (!window.confirm("Remove this section?")) return;
    onChange({ ...value, sections: value.sections.filter((_, i) => i !== index) });
  }

  function addSection() {
    onChange({ ...value, sections: [...value.sections, { title: "" }] });
  }

  function moveSection(index: number, direction: -1 | 1) {
    onChange({ ...value, sections: moveItem(value.sections, index, direction) });
  }

  function addDownload(sectionIndex: number) {
    const section = value.sections[sectionIndex]!;
    updateSection(sectionIndex, { downloads: [...(section.downloads ?? []), { label: "", href: "" }] });
  }

  function updateDownload(sectionIndex: number, downloadIndex: number, patch: Partial<{ label: string; href: string }>) {
    const section = value.sections[sectionIndex]!;
    const downloads = (section.downloads ?? []).map((d, i) => (i === downloadIndex ? { ...d, ...patch } : d));
    updateSection(sectionIndex, { downloads });
  }

  function removeDownload(sectionIndex: number, downloadIndex: number) {
    const section = value.sections[sectionIndex]!;
    updateSection(sectionIndex, { downloads: (section.downloads ?? []).filter((_, i) => i !== downloadIndex) });
  }

  return (
    <div className="no-scrollbar-arrows min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-[30px] py-0">
      <FormField label="Eyebrow">
        <input className={fieldInputClass} value={value.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
      </FormField>
      <FormField label="Heading" required>
        <input className={fieldInputClass} value={value.heading} onChange={(e) => set("heading", e.target.value)} />
      </FormField>
      <FormField label="Intro">
        <textarea rows={2} className={fieldTextareaClass} value={value.intro} onChange={(e) => set("intro", e.target.value)} />
      </FormField>
      <FormField label="Callout text (leave blank to hide)">
        <input
          className={fieldInputClass}
          value={value.calloutText ?? ""}
          onChange={(e) => set("calloutText", e.target.value)}
        />
      </FormField>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted">Sections</span>
          <button
            type="button"
            onClick={addSection}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-dash-ink hover:bg-page"
          >
            + Add section
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {value.sections.map((section, i) => (
            <div key={i} className="rounded-[10px] border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveSection(i, -1)}
                    aria-label="Move section up"
                    className="rounded px-1 text-muted hover:text-dash-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === value.sections.length - 1}
                    onClick={() => moveSection(i, 1)}
                    aria-label="Move section down"
                    className="rounded px-1 text-muted hover:text-dash-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <input
                  className={`${fieldInputClass} min-w-0 flex-1`}
                  placeholder="Section title"
                  value={section.title}
                  onChange={(e) => updateSection(i, { title: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeSection(i)}
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
                >
                  Remove
                </button>
              </div>
              <textarea
                rows={2}
                className={`${fieldTextareaClass} mt-2`}
                placeholder="Note (optional)"
                value={section.note ?? ""}
                onChange={(e) => updateSection(i, { note: e.target.value })}
              />
              <textarea
                rows={2}
                className={`${fieldTextareaClass} mt-2 font-mono`}
                placeholder="Command (optional)"
                value={section.command ?? ""}
                onChange={(e) => updateSection(i, { command: e.target.value })}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  className={fieldInputClass}
                  placeholder='Example toggle label (e.g. "Show example")'
                  value={section.exampleLabel ?? ""}
                  onChange={(e) => updateSection(i, { exampleLabel: e.target.value })}
                />
                <input
                  className={`${fieldInputClass} font-mono`}
                  placeholder="Example command (optional)"
                  value={section.exampleCommand ?? ""}
                  onChange={(e) => updateSection(i, { exampleCommand: e.target.value })}
                />
              </div>

              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">Downloads (optional)</span>
                  <button
                    type="button"
                    onClick={() => addDownload(i)}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-dash-ink hover:bg-page"
                  >
                    + Add file
                  </button>
                </div>
                {(section.downloads ?? []).length > 0 && (
                  <div className="mt-1.5 space-y-1.5">
                    {(section.downloads ?? []).map((d, di) => (
                      <div key={di} className="flex items-center gap-1.5">
                        <input
                          className={`${fieldInputClass} min-w-0 flex-1`}
                          placeholder="Button label, e.g. fix-node-ca.ps1"
                          value={d.label}
                          onChange={(e) => updateDownload(i, di, { label: e.target.value })}
                        />
                        <input
                          className={`${fieldInputClass} min-w-0 flex-1 font-mono`}
                          placeholder="/downloads/fix-node-ca.ps1"
                          value={d.href}
                          onChange={(e) => updateDownload(i, di, { href: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => removeDownload(i, di)}
                          className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
