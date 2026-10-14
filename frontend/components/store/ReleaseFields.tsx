"use client";

import { ENVIRONMENT_LABELS, MAX_NOTES, PLATFORM_EXTENSIONS, VERSION_PATTERN, formatBytes, type StoreEnvironment, type StorePlatform } from "@/lib/store/store-api";

export interface ReleaseDraft {
  version: string;
  environment: StoreEnvironment;
  notes: string;
  file: File | null;
}

export const EMPTY_RELEASE: ReleaseDraft = { version: "", environment: "production", notes: "", file: null };

export const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/30 disabled:opacity-60";

export const LABEL_CLASS = "mb-1 block text-xs font-semibold text-ink";

/**
 * The editor's immediate check of a build before it is sent. Advisory only —
 * the backend re-checks every rule and is the one that refuses.
 */
export function releaseProblem(draft: ReleaseDraft, platform: StorePlatform): string | null {
  if (!draft.version.trim()) return "Enter a version.";
  if (!VERSION_PATTERN.test(draft.version.trim())) {
    return "A version starts and ends with a letter or digit and uses only letters, digits, '.', '_', '+' and '-'.";
  }
  if (!draft.file) return "Choose the install file.";
  const name = draft.file.name.toLowerCase();
  if (!PLATFORM_EXTENSIONS[platform].some((ext) => name.endsWith(ext))) {
    return `This platform takes ${PLATFORM_EXTENSIONS[platform].join(", ")} files.`;
  }
  if (draft.file.size === 0) return "That file is empty.";
  if (draft.notes.length > MAX_NOTES) return `Release notes must be ${MAX_NOTES} characters or fewer.`;
  return null;
}

/** Version, environment, notes and file — shared by "Add app" and "Upload build". */
export function ReleaseFields({
  idPrefix,
  draft,
  platform,
  disabled,
  onChange,
}: {
  idPrefix: string;
  draft: ReleaseDraft;
  platform: StorePlatform;
  disabled: boolean;
  onChange: (next: ReleaseDraft) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-version`} className={LABEL_CLASS}>
            Version
          </label>
          <input
            id={`${idPrefix}-version`}
            value={draft.version}
            onChange={(e) => onChange({ ...draft, version: e.target.value })}
            placeholder="e.g. 1.4.2"
            maxLength={64}
            disabled={disabled}
            className={INPUT_CLASS}
          />
        </div>
        <fieldset>
          <legend className={LABEL_CLASS}>Environment</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["production", "development"] as const).map((env) => (
              <label
                key={env}
                className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  draft.environment === env
                    ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                    : "border-border text-muted hover:bg-page"
                }`}
              >
                <input
                  type="radio"
                  name={`${idPrefix}-environment`}
                  value={env}
                  checked={draft.environment === env}
                  onChange={() => onChange({ ...draft, environment: env })}
                  disabled={disabled}
                  className="sr-only"
                />
                {ENVIRONMENT_LABELS[env]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-file`} className={LABEL_CLASS}>
          Install file <span className="font-normal text-muted">({PLATFORM_EXTENSIONS[platform].join(", ")})</span>
        </label>
        <input
          id={`${idPrefix}-file`}
          type="file"
          accept={PLATFORM_EXTENSIONS[platform].join(",")}
          onChange={(e) => onChange({ ...draft, file: e.target.files?.[0] ?? null })}
          disabled={disabled}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-brand-purple/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-purple hover:file:bg-brand-purple/20"
        />
        {draft.file && (
          <p className="mt-1 text-xs text-muted">
            {draft.file.name} · {formatBytes(draft.file.size)}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-notes`} className={LABEL_CLASS}>
          Release notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          value={draft.notes}
          onChange={(e) => onChange({ ...draft, notes: e.target.value })}
          rows={3}
          maxLength={MAX_NOTES}
          disabled={disabled}
          placeholder="What changed in this build"
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}

export function UploadProgress({ fraction }: { fraction: number }) {
  const percent = Math.round(fraction * 100);
  return (
    <div className="space-y-1" role="status" aria-live="polite">
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-blue transition-[width]" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted">{percent < 100 ? `Uploading… ${percent}%` : "Saving…"}</p>
    </div>
  );
}
