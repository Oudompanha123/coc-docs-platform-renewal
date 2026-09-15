import { FormField, fieldInputClass, fieldTextareaClass } from "./FormField";
import { ICON_KEYS } from "@/lib/docs/content-types";
import type { HeroContent } from "@/lib/docs/content-types";

export function HeroForm({ value, onChange }: { value: HeroContent; onChange: (next: HeroContent) => void }) {
  function set<K extends keyof HeroContent>(key: K, val: HeroContent[K]) {
    onChange({ ...value, [key]: val });
  }

  function updateFeature(index: number, patch: Partial<HeroContent["features"][number]>) {
    const features = value.features.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange({ ...value, features });
  }

  function removeFeature(index: number) {
    if (!window.confirm("Remove this feature card?")) return;
    onChange({ ...value, features: value.features.filter((_, i) => i !== index) });
  }

  function addFeature() {
    onChange({
      ...value,
      features: [...value.features, { icon: "sparkles", title: "", description: "" }],
    });
  }

  return (
    <div className="space-y-4">
      <FormField label="Heading" required>
        <input className={fieldInputClass} value={value.heading} onChange={(e) => set("heading", e.target.value)} />
      </FormField>
      <FormField label="Tagline" required>
        <input className={fieldInputClass} value={value.tagline} onChange={(e) => set("tagline", e.target.value)} />
      </FormField>
      <FormField label="Subline">
        <input className={fieldInputClass} value={value.subline} onChange={(e) => set("subline", e.target.value)} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="CTA label" required>
          <input className={fieldInputClass} value={value.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
        </FormField>
        <FormField label="CTA link" required>
          <input className={fieldInputClass} value={value.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} />
        </FormField>
      </div>
      <FormField label="Eyebrow (small label above the section heading)">
        <input className={fieldInputClass} value={value.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
      </FormField>
      <FormField label="Section heading" required>
        <input
          className={fieldInputClass}
          value={value.sectionHeading}
          onChange={(e) => set("sectionHeading", e.target.value)}
        />
      </FormField>
      <FormField label="Section intro">
        <textarea
          rows={2}
          className={fieldTextareaClass}
          value={value.sectionIntro}
          onChange={(e) => set("sectionIntro", e.target.value)}
        />
      </FormField>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted">Feature cards</span>
          <button
            type="button"
            onClick={addFeature}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-dash-ink hover:bg-page"
          >
            + Add card
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {value.features.map((feature, i) => (
            <div key={i} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <select
                  className={`${fieldInputClass} w-32`}
                  value={feature.icon}
                  onChange={(e) => updateFeature(i, { icon: e.target.value as HeroContent["features"][number]["icon"] })}
                >
                  {ICON_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldInputClass}
                  placeholder="Title"
                  value={feature.title}
                  onChange={(e) => updateFeature(i, { title: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
                >
                  Remove
                </button>
              </div>
              <textarea
                rows={2}
                className={`${fieldTextareaClass} mt-2`}
                placeholder="Description"
                value={feature.description}
                onChange={(e) => updateFeature(i, { description: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
