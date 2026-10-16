"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { absoluteUrl } from "@/lib/store/store-api";

export const ICON_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_ICON_BYTES = 2 * 1024 * 1024;

/** The app-icon template grid — what an app without an icon shows. */
export function IconTemplate({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className={className}>
      <rect width="96" height="96" rx="20" className="fill-muted-surface" />
      <g fill="none" className="stroke-muted-foreground/40" strokeWidth="0.75">
        <path d="M0 0l96 96M96 0L0 96M32 0v96M64 0v96M0 32h96M0 64h96" />
        <circle cx="48" cy="48" r="38" />
        <circle cx="48" cy="48" r="22" />
        <circle cx="48" cy="48" r="12" />
        <rect x="14" y="14" width="68" height="68" rx="10" />
      </g>
    </svg>
  );
}

/**
 * The app-icon tile of the Add App / Edit App info dialogs: the template grid
 * (or the current icon) with an "Upload App Icon" bar; picking a file shows
 * it in the tile straight away. PNG, JPEG or WebP, 2 MB at most — the backend
 * checks the same, and the file's real content.
 */
export function AppIconPicker({
  currentUrl,
  file,
  disabled,
  onChange,
}: {
  /** The app's icon so far (relative backend URL), if it has one. */
  currentUrl: string | null;
  file: File | null;
  disabled: boolean;
  onChange: (file: File | null) => void;
}) {
  const { t } = useLanguage();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview ?? (currentUrl ? absoluteUrl(currentUrl) : null);

  return (
    <div className="flex flex-col items-center">
      <label
        htmlFor={inputId}
        className={`group relative block h-32 w-32 overflow-hidden rounded-[28px] border border-surface-border shadow-sm outline-none has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview or a backend URL, not a Next image
          <img src={shown} alt={t.storeForm.iconAlt} className="h-full w-full object-cover" />
        ) : (
          <IconTemplate className="h-full w-full" />
        )}
        <span className="absolute inset-x-2 bottom-2 rounded-lg bg-primary/85 px-2 py-1.5 text-center text-xs font-medium text-primary-foreground transition-colors group-hover:bg-primary">
          {shown ? t.storeForm.iconChange : t.storeForm.iconUpload}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ICON_TYPES.join(",")}
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </label>
      <p className="mt-2 text-xs text-muted-foreground">{t.storeForm.iconHint}</p>
    </div>
  );
}

/**
 * The advisory check of a chosen icon; the backend re-checks. Returns what is
 * wrong, not a sentence — the form words it in the reader's language.
 */
export function iconProblem(file: File | null): "wrongType" | "tooLarge" | null {
  if (!file) return null;
  if (!ICON_TYPES.includes(file.type)) return "wrongType";
  if (file.size > MAX_ICON_BYTES) return "tooLarge";
  return null;
}
