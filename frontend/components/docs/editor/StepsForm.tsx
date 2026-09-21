import { FormField, fieldInputClass, fieldTextareaClass } from "./FormField";
import { moveItem } from "./reorder";
import type { StepsContent } from "@/lib/docs/content-types";

export function StepsForm({ value, onChange }: { value: StepsContent; onChange: (next: StepsContent) => void }) {
  function set<K extends keyof StepsContent>(key: K, val: StepsContent[K]) {
    onChange({ ...value, [key]: val });
  }

  function updateStep(index: number, patch: Partial<StepsContent["steps"][number]>) {
    const steps = value.steps.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ ...value, steps });
  }

  function removeStep(index: number) {
    if (!window.confirm("Remove this step?")) return;
    onChange({ ...value, steps: value.steps.filter((_, i) => i !== index) });
  }

  function addStep() {
    onChange({ ...value, steps: [...value.steps, { title: "", body: "" }] });
  }

  function moveStep(index: number, direction: -1 | 1) {
    onChange({ ...value, steps: moveItem(value.steps, index, direction) });
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

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Callout tone">
          <select
            className={fieldInputClass}
            value={value.calloutTone ?? "info"}
            onChange={(e) => set("calloutTone", e.target.value as "info" | "warning")}
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
          </select>
        </FormField>
        <div className="col-span-2">
          <FormField label="Callout text (leave blank to hide)">
            <input
              className={fieldInputClass}
              value={value.calloutText ?? ""}
              onChange={(e) => set("calloutText", e.target.value)}
            />
          </FormField>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted">Steps</span>
          <button
            type="button"
            onClick={addStep}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-dash-ink hover:bg-page"
          >
            + Add step
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {value.steps.map((step, i) => (
            <div key={i} className="rounded-[10px] border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveStep(i, -1)}
                    aria-label="Move step up"
                    className="rounded px-1 text-muted hover:text-dash-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === value.steps.length - 1}
                    onClick={() => moveStep(i, 1)}
                    aria-label="Move step down"
                    className="rounded px-1 text-muted hover:text-dash-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                  {i + 1}
                </span>
                <input
                  className={`${fieldInputClass} min-w-0 flex-1`}
                  placeholder="Step title"
                  value={step.title}
                  onChange={(e) => updateStep(i, { title: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
                >
                  Remove
                </button>
              </div>
              <textarea
                rows={2}
                className={`${fieldTextareaClass} mt-2`}
                placeholder="Body text (optional)"
                value={step.body}
                onChange={(e) => updateStep(i, { body: e.target.value })}
              />
              <textarea
                rows={2}
                className={`${fieldTextareaClass} mt-2 font-mono`}
                placeholder="Command (optional)"
                value={step.command ?? ""}
                onChange={(e) => updateStep(i, { command: e.target.value })}
              />
              <textarea
                rows={2}
                className={`${fieldTextareaClass} mt-2 font-mono`}
                placeholder="Command output (optional)"
                value={step.output ?? ""}
                onChange={(e) => updateStep(i, { output: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
