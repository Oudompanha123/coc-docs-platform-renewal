import { useState } from "react";
import { FormField, fieldInputClass, fieldTextareaClass } from "./FormField";
import { moveItem } from "./reorder";
import { ICON_KEYS } from "@/lib/docs/content-types";
import type { HeroContent } from "@/lib/docs/content-types";
import { uploadContentImage } from "@/lib/docs/content-image-api";

export function HeroForm({ value, onChange }: { value: HeroContent; onChange: (next: HeroContent) => void }) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  function moveFeature(index: number, direction: -1 | 1) {
    onChange({ ...value, features: moveItem(value.features, index, direction) });
  }

  async function handleImageChange(index: number, file: File | null) {
    if (!file) return;
    setUploadError(null);
    setUploadingIndex(index);
    try {
      const url = await uploadContentImage(file);
      updateFeature(index, { imageUrl: url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Couldn't upload that image.");
    } finally {
      setUploadingIndex(null);
    }
  }

  return (
    <div className="no-scrollbar-arrows min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-[30px] py-0">
      <FormField label="Layout">
        <div className="flex gap-2">
          {(["centered", "split"] as const).map((layout) => (
            <button
              key={layout}
              type="button"
              onClick={() => set("layout", layout)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                (value.layout ?? "centered") === layout
                  ? "bg-brand-purple/10 text-brand-purple"
                  : "border border-border text-muted hover:bg-page"
              }`}
            >
              {layout}
            </button>
          ))}
        </div>
      </FormField>
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
        {uploadError && <p className="mt-2 text-xs font-semibold text-[#c94040]">{uploadError}</p>}
        <div className="mt-2 space-y-3">
          {value.features.map((feature, i) => (
            <div key={i} className="rounded-[10px] border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveFeature(i, -1)}
                    aria-label="Move card up"
                    className="rounded px-1 text-muted hover:text-dash-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === value.features.length - 1}
                    onClick={() => moveFeature(i, 1)}
                    aria-label="Move card down"
                    className="rounded px-1 text-muted hover:text-dash-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <select
                  className={`${fieldInputClass} w-28 shrink-0`}
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
                  className={`${fieldInputClass} min-w-0 flex-1`}
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
              <div className="mt-2 flex items-center gap-3">
                {feature.imageUrl ? (
                  <>
                    <img src={feature.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => updateFeature(i, { imageUrl: undefined })}
                      className="text-xs font-semibold text-muted hover:text-dash-ink"
                    >
                      Remove image, use icon
                    </button>
                  </>
                ) : (
                  <label className="text-xs font-semibold text-brand-purple hover:underline">
                    {uploadingIndex === i ? "Uploading…" : "Upload image instead of icon"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploadingIndex !== null}
                      onChange={(e) => handleImageChange(i, e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <FormField label="Closing note (optional paragraph below the feature cards)">
        <textarea
          rows={3}
          className={fieldTextareaClass}
          value={value.closingNote ?? ""}
          onChange={(e) => set("closingNote", e.target.value || undefined)}
        />
      </FormField>
    </div>
  );
}
