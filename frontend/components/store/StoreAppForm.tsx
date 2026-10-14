"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/store/PlatformIcon";
import { AppLogo } from "@/components/store/AppLogo";
import { StoreDialog } from "@/components/store/StoreDialog";
import {
  EMPTY_RELEASE,
  INPUT_CLASS,
  LABEL_CLASS,
  ReleaseFields,
  UploadProgress,
  releaseProblem,
  type ReleaseDraft,
} from "@/components/store/ReleaseFields";
import {
  PLATFORM_LABELS,
  createStoreApp,
  updateStoreApp,
  uploadStoreLogo,
  suggestFromFileName,
  uploadStoreRelease,
  type StoreApp,
  type StorePlatform,
} from "@/lib/store/store-api";

const TITLE_ID = "store-app-form-title";
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/**
 * Add an app (with its first build) or edit one. Admin only — the page shows
 * it to admins, and the backend refuses everyone else regardless.
 *
 * Adding is three requests — the app, its logo, its first build — because a
 * file is sent as the raw request body (see AdminStoreController). If a later
 * step fails the app already exists, so the dialog switches to editing it and
 * says what is left to do, rather than offering to create it a second time.
 */
export function StoreAppForm({
  app: initialApp,
  onSaved,
  onClose,
}: {
  /** Absent when adding. */
  app?: StoreApp;
  onSaved: (app: StoreApp) => void;
  onClose: () => void;
}) {
  const [app, setApp] = useState<StoreApp | undefined>(initialApp);
  const [name, setName] = useState(initialApp?.name ?? "");
  const [description, setDescription] = useState(initialApp?.description ?? "");
  const [platform, setPlatform] = useState<StorePlatform>(initialApp?.platform ?? "android");
  const [isPublic, setIsPublic] = useState(initialApp?.isPublic ?? false);
  const [logo, setLogo] = useState<File | null>(null);
  const [release, setRelease] = useState<ReleaseDraft>(EMPTY_RELEASE);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set once the admin types a name, so choosing a file never overwrites it.
  const [nameTouched, setNameTouched] = useState(false);

  const adding = !initialApp;

  /**
   * Choosing the install file fills in what the admin has left blank: the
   * file name, exactly as uploaded, as the app's name — so
   * `COC-Workbench-Setup-1.2.1.exe` is what the Store shows — and the
   * version found in it. Anything already typed is kept.
   */
  function changeRelease(next: ReleaseDraft) {
    if (next.file && next.file !== release.file) {
      const suggestion = suggestFromFileName(next.file.name);
      if (!nameTouched && !app) setName(suggestion.name);
      if (!next.version.trim() && suggestion.version) next = { ...next, version: suggestion.version };
    }
    setRelease(next);
  }
  // The first build is part of adding an app; once the app exists (or when
  // editing), builds are uploaded from its detail view instead.
  const needsRelease = adding && !(app && app.releases.length > 0);

  function check(): string | null {
    if (!name.trim()) return "Enter the app's name.";
    if (name.trim().length > 80) return "The name must be 80 characters or fewer.";
    if (logo && !LOGO_TYPES.includes(logo.type)) return "The logo must be a PNG, JPEG or WebP image.";
    if (logo && logo.size > MAX_LOGO_BYTES) return "The logo must be 2 MB or smaller.";
    if (needsRelease) return releaseProblem(release, platform);
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = check();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    let saved = app;
    try {
      const input = { name: name.trim(), description: description.trim(), platform, isPublic };
      saved = saved ? await updateStoreApp(saved.id, input) : await createStoreApp(input);
      setApp(saved);
      if (logo) {
        saved = await uploadStoreLogo(saved.id, logo);
        setApp(saved);
        setLogo(null);
      }
      if (needsRelease && release.file) {
        setProgress(0);
        saved = await uploadStoreRelease(
          saved.id,
          { version: release.version.trim(), environment: release.environment, notes: release.notes.trim(), file: release.file },
          setProgress,
        );
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't save the app.";
      if (saved && !initialApp) {
        // The app row exists; keep it and let the admin retry what failed.
        onSaved(saved);
        setError(`${message} The app was created — fix this and save again to finish.`);
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <StoreDialog titleId={TITLE_ID} onClose={onClose} busy={busy}>
      <form onSubmit={submit} noValidate>
        <div className="border-b border-border px-6 pb-4 pt-6">
          <h2 id={TITLE_ID} className="text-lg font-bold text-ink">
            {adding ? "Add an app" : `Edit ${initialApp.name}`}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {adding
              ? "Choose the install file and its name and version are filled in for you. More builds can be added from the app's page."
              : "Change how this app is presented. Builds are managed on the app's page."}
          </p>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-start gap-4">
            <AppLogo
              app={{ name: name || "?", logoUrl: logo ? null : (app?.logoUrl ?? null) }}
              className="h-16 w-16 text-2xl"
            />
            <div className="min-w-0 flex-1">
              <label htmlFor="store-app-logo" className={LABEL_CLASS}>
                Logo <span className="font-normal text-muted">(PNG, JPEG or WebP, up to 2 MB)</span>
              </label>
              <input
                id="store-app-logo"
                type="file"
                accept={LOGO_TYPES.join(",")}
                onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
                disabled={busy}
                className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-brand-purple/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-purple hover:file:bg-brand-purple/20"
              />
              {logo && <p className="mt-1 truncate text-xs text-muted">{logo.name}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="store-app-name" className={LABEL_CLASS}>
              Name
            </label>
            <input
              id="store-app-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              maxLength={80}
              disabled={busy}
              placeholder="e.g. COC-Workbench-Setup-1.2.1.exe"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="store-app-description" className={LABEL_CLASS}>
              Description <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="store-app-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              disabled={busy}
              placeholder="What the app does and who it is for"
              className={INPUT_CLASS}
            />
          </div>

          <fieldset>
            <legend className={LABEL_CLASS}>
              Platform {!adding && <span className="font-normal text-muted">(fixed once the app is added)</span>}
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(PLATFORM_LABELS) as StorePlatform[]).map((p) => (
                <label
                  key={p}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    platform === p
                      ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                      : "border-border text-muted hover:bg-page"
                  } ${app ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name="store-app-platform"
                    value={p}
                    checked={platform === p}
                    onChange={() => setPlatform(p)}
                    disabled={busy || !!app}
                    className="sr-only"
                  />
                  <PlatformIcon platform={p} className="h-4 w-4" />
                  {PLATFORM_LABELS[p]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
            <div>
              <p id="store-app-visibility-label" className="text-sm font-semibold text-ink">
                {isPublic ? "Public" : "Private"}
              </p>
              <p className="text-xs text-muted">
                {isPublic ? "Every signed-in user can see and download it." : "Only admins can see it."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              aria-labelledby="store-app-visibility-label"
              onClick={() => setIsPublic(!isPublic)}
              disabled={busy}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple ${
                isPublic ? "bg-brand-purple" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isPublic ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
          </div>

          {needsRelease && (
            <div className="rounded-2xl border border-border bg-page/60 p-4">
              <p className="mb-3 text-sm font-bold text-ink">First build</p>
              <ReleaseFields idPrefix="store-app-release" draft={release} platform={platform} disabled={busy} onChange={changeRelease} />
            </div>
          )}

          {progress !== null && <UploadProgress fraction={progress} />}

          {error && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-page disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-5 py-2 text-sm font-semibold text-white shadow transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
          >
            {busy ? "Saving…" : adding && !app ? "Add app" : "Save"}
          </button>
        </div>
      </form>
    </StoreDialog>
  );
}
