import { useState } from "react";
import { FormField } from "./FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { moveItem } from "./reorder";
import { HERO_DOWNLOAD_OS_ICON } from "../os-icons";
import {
  HERO_DOWNLOAD_OS_LABEL,
  HERO_DOWNLOAD_OS_ORDER,
  ICON_KEYS,
  isValidHeroDownloadUrl,
  resolveHeroDownloadButton,
} from "@/lib/docs/content-types";
import type { HeroContent, HeroDownloadButton, HeroDownloadButtons, HeroDownloadOs } from "@/lib/docs/content-types";
import { uploadContentImage } from "@/lib/docs/content-image-api";
import { SimpleSelect } from "@/components/ui/select";

const DOWNLOAD_OS_PLACEHOLDER: Record<HeroDownloadOs, string> = {
  windows: "https://… .exe / .msi",
  macos: "https://… .dmg / .pkg",
  linux: "https://… .AppImage / .deb / .tar.gz",
};
const DOWNLOAD_URL_ERROR = "Must be an https:// URL or a path starting with /.";

export function HeroForm({ value, onChange }: { value: HeroContent; onChange: (next: HeroContent) => void }) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // What the admin is currently typing per OS, kept apart from `value.downloadButtons`
  // so the input can show an in-progress, momentarily-invalid string (e.g.
  // typing "https:/" one character at a time) without that string ever
  // reaching the saved draft — only a value isValidHeroDownloadUrl accepts
  // is committed via `set`, which is what keeps an invalid URL from ever
  // being saved (it simply never becomes part of `value`).
  const [downloadDrafts, setDownloadDrafts] = useState<Partial<Record<HeroDownloadOs, string>>>({});

  function set<K extends keyof HeroContent>(key: K, val: HeroContent[K]) {
    onChange({ ...value, [key]: val });
  }

  /** Both fields empty removes the second button entirely, rather than saving an empty one. */
  function setSecondaryCta(field: "label" | "href", val: string) {
    const next = { label: value.secondaryCta?.label ?? "", href: value.secondaryCta?.href ?? "", [field]: val };
    if (next.label === "" && next.href === "") {
      const rest = { ...value };
      delete rest.secondaryCta;
      onChange(rest);
      return;
    }
    onChange({ ...value, secondaryCta: next });
  }

  /** The raw, not-yet-defaulted entry for one OS — what its own inputs read
   *  from, as opposed to `resolveHeroDownloadButton`'s fully-defaulted view
   *  (which a bare input must never show as if it were typed in). A legacy
   *  bare-URL string normalises to `{ url }` so every caller here only ever
   *  deals with the object shape. */
  function entryOf(os: HeroDownloadOs): HeroDownloadButton {
    const raw = value.downloadButtons?.[os];
    return typeof raw === "string" ? { url: raw } : (raw ?? {});
  }

  function updateDownloadButton(os: HeroDownloadOs, patch: Partial<HeroDownloadButton>) {
    const next: HeroDownloadButtons = { ...value.downloadButtons, [os]: { ...entryOf(os), ...patch } };
    set("downloadButtons", next);
  }

  function toggleShow(os: HeroDownloadOs) {
    const shownNow = resolveHeroDownloadButton(os, value.downloadButtons?.[os]).show;
    updateDownloadButton(os, { show: !shownNow });
  }

  function downloadUrlValue(os: HeroDownloadOs): string {
    return downloadDrafts[os] ?? entryOf(os).url ?? "";
  }

  function setDownloadUrl(os: HeroDownloadOs, raw: string) {
    setDownloadDrafts((prev) => ({ ...prev, [os]: raw }));
    if (!isValidHeroDownloadUrl(raw)) return;
    updateDownloadButton(os, { url: raw });
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
    <div className="no-scrollbar-arrows min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-5 py-0">
      <FormField label="Layout">
        <div className="flex gap-2">
          {(["centered", "split"] as const).map((layout) => (
            <button
              key={layout}
              type="button"
              onClick={() => set("layout", layout)}
              className={`h-7 rounded-full border px-3 text-xs font-medium capitalize transition-colors ${
                (value.layout ?? "centered") === layout
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-surface-border text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {layout}
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Heading" required>
        <Input value={value.heading} onChange={(e) => set("heading", e.target.value)} />
      </FormField>
      <FormField label="Tagline" required>
        <Input value={value.tagline} onChange={(e) => set("tagline", e.target.value)} />
      </FormField>
      <FormField label="Subline">
        <Input value={value.subline} onChange={(e) => set("subline", e.target.value)} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="CTA label" required>
          <Input value={value.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
        </FormField>
        <FormField label="CTA link" required>
          <Input value={value.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} />
        </FormField>
      </div>
      <div>
        <span className="text-xs font-medium text-muted-foreground">Second button</span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Optional, shown beside the CTA. A path such as /ax-renewal, or an https:// URL. Leave both empty to hide it.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <FormField label="Second button label">
            <Input
              value={value.secondaryCta?.label ?? ""}
              onChange={(e) => setSecondaryCta("label", e.target.value)}
            />
          </FormField>
          <FormField label="Second button link">
            <Input
              value={value.secondaryCta?.href ?? ""}
              onChange={(e) => setSecondaryCta("href", e.target.value)}
            />
          </FormField>
        </div>
        {value.secondaryCta && !isValidHeroDownloadUrl(value.secondaryCta.href) && (
          <p role="alert" className="mt-1 text-xs font-medium text-destructive">
            Use a path starting with / or an https:// URL — this button stays hidden until it is one.
          </p>
        )}
      </div>

      <div>
        <span className="text-xs font-medium text-muted-foreground">Download buttons</span>
        <p className="mt-0.5 text-xs text-muted-foreground">Paste a download URL. Leave empty to hide that button.</p>
        <div className="mt-2 space-y-3">
          {HERO_DOWNLOAD_OS_ORDER.map((os) => {
            const label = HERO_DOWNLOAD_OS_LABEL[os];
            const Icon = HERO_DOWNLOAD_OS_ICON[os];
            const entry = entryOf(os);
            const shown = resolveHeroDownloadButton(os, value.downloadButtons?.[os]).show;
            const rawUrl = downloadUrlValue(os);
            const urlError = isValidHeroDownloadUrl(rawUrl) ? null : DOWNLOAD_URL_ERROR;
            const showNoUrlHint = shown && !urlError && rawUrl === "";
            return (
              <div key={os} className="rounded-xl border border-surface-border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-surface-border text-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={shown}
                    aria-label={`Show the ${label} download button`}
                    onClick={() => toggleShow(os)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      shown ? "bg-primary" : "bg-surface-border"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-[left] ${
                        shown ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className={`mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 ${shown ? "" : "opacity-60"}`}>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Label</span>
                    <Input
                      className="mt-1"
                      placeholder={`Download for ${label}`}
                      value={entry.label ?? ""}
                      onChange={(e) => updateDownloadButton(os, { label: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">URL</span>
                    <Input
                      className="mt-1"
                      placeholder={DOWNLOAD_OS_PLACEHOLDER[os]}
                      value={rawUrl}
                      onChange={(e) => setDownloadUrl(os, e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Version</span>
                    <Input
                      className="mt-1"
                      placeholder="v2.1.0"
                      maxLength={20}
                      value={entry.version ?? ""}
                      onChange={(e) => updateDownloadButton(os, { version: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">File size</span>
                    <Input
                      className="mt-1"
                      placeholder="84 MB"
                      maxLength={12}
                      value={entry.size ?? ""}
                      onChange={(e) => updateDownloadButton(os, { size: e.target.value })}
                    />
                  </label>
                </div>
                {urlError && <p className="mt-2 text-xs font-medium text-destructive">{urlError}</p>}
                {showNoUrlHint && <p className="mt-2 text-xs font-medium text-muted-foreground">Add a URL to show this button.</p>}
              </div>
            );
          })}
        </div>
      </div>

      <FormField label="Eyebrow (small label above the section heading)">
        <Input value={value.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
      </FormField>
      <FormField label="Section heading" required>
        <Input
          value={value.sectionHeading}
          onChange={(e) => set("sectionHeading", e.target.value)}
        />
      </FormField>
      <FormField label="Section intro">
        <Textarea
          rows={2}
          className="h-[120px] resize-none"
          value={value.sectionIntro}
          onChange={(e) => set("sectionIntro", e.target.value)}
        />
      </FormField>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Feature cards</span>
          <Button
            type="button"
            onClick={addFeature}
            variant="outline" size="sm"
          >
            + Add card
          </Button>
        </div>
        {uploadError && <p className="mt-2 text-xs font-medium text-destructive">{uploadError}</p>}
        <div className="mt-2 space-y-3">
          {value.features.map((feature, i) => (
            <div key={i} className="rounded-xl border border-surface-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveFeature(i, -1)}
                    aria-label="Move card up"
                    className="rounded px-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === value.features.length - 1}
                    onClick={() => moveFeature(i, 1)}
                    aria-label="Move card down"
                    className="rounded px-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <SimpleSelect
                  aria-label="Feature icon"
                  value={feature.icon}
                  onValueChange={(v) => updateFeature(i, { icon: v as HeroContent["features"][number]["icon"] })}
                  options={ICON_KEYS.map((key) => ({ value: key, label: key }))}
                  className="w-32 shrink-0"
                />
                <Input
                  className="min-w-0 flex-1"
                  placeholder="Title"
                  value={feature.title}
                  onChange={(e) => updateFeature(i, { title: e.target.value })}
                />
                <Button
                  type="button"
                  onClick={() => removeFeature(i)}
                  variant="ghost" size="sm" className="h-7 shrink-0 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
              <Textarea
                rows={2}
                className="h-[120px] resize-none mt-2"
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
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Remove image, use icon
                    </button>
                  </>
                ) : (
                  <label className="text-xs font-medium text-foreground hover:underline">
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
        <Textarea
          rows={3}
          className="h-[120px] resize-none"
          value={value.closingNote ?? ""}
          onChange={(e) => set("closingNote", e.target.value || undefined)}
        />
      </FormField>
    </div>
  );
}
