"use client";

import { useRef, useState } from "react";
import { PaperclipIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/store/AppLogo";
import { PlatformIcon } from "@/components/store/PlatformIcon";
import { StoreDialog } from "@/components/store/StoreDialog";
import { ERROR_CLASS, INPUT_CLASS, LABEL_CLASS, TEXTAREA_CLASS } from "@/components/store/form-styles";
import {
  PLATFORM_EXTENSIONS,
  categoryPlatforms,
  ENVIRONMENTS,
  ENVIRONMENT_LABELS,
  MAX_NOTES,
  PLATFORM_LABELS,
  VERSION_PATTERN,
  formatBytes,
  hasLiveBuild,
  platformOfFile,
  suggestNextVersion,
  uploadNextVersion,
  type StoreApp,
  type StoreEnvironment,
  type StorePlatform,
} from "@/lib/store/store-api";

const TITLE_ID = "store-next-version-title";

/**
 * "Update Next Version": uploads one file as the next version of this app —
 * same app, page, icon and history, never a new app (ADR-111).
 *
 * The file's type decides its platform (.apk Android, .ipa iOS, .exe/.msi
 * Windows, .dmg/.pkg macOS). The version is the admin's, pre-filled with the
 * next one for that platform (1.2.1 → 1.2.2). "Server Type" publishes the
 * file as Production, Development, or both. Every rule here is advisory —
 * the backend re-checks each one and is what refuses.
 */
export function NextVersionDialog({
  app,
  onUploaded,
  onClose,
}: {
  app: StoreApp;
  onUploaded: (app: StoreApp, summary: string) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [versionTouched, setVersionTouched] = useState(false);
  const [environments, setEnvironments] = useState<StoreEnvironment[]>([]);
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile: the file's type says iOS or Android. PC: the admin picks Windows or macOS.
  const allowed = categoryPlatforms(app.category);
  const isPc = app.category === "pc";
  const [chosen, setChosen] = useState<StorePlatform>(allowed[0]!);
  const filePlatform = file ? platformOfFile(file.name) : null;
  const platform = isPc ? chosen : filePlatform;
  const extensions = (isPc ? [chosen] : allowed).flatMap((p) => PLATFORM_EXTENSIONS[p]);
  const cleanVersion = version.trim();
  const duplicates = platform ? environments.filter((env) => hasLiveBuild(app, platform, cleanVersion, env)) : [];

  function pickFile(next: File | null) {
    setFile(next);
    setError(null);
    const nextPlatform = isPc ? chosen : next ? platformOfFile(next.name) : null;
    // Pre-fill the next version for that platform, unless the admin typed one.
    if (nextPlatform && !versionTouched) setVersion(suggestNextVersion(app, nextPlatform));
  }

  function choosePlatform(next: StorePlatform) {
    setChosen(next);
    setError(null);
    // A file for the other platform no longer fits; drop it rather than upload the wrong one.
    if (file && platformOfFile(file.name) !== next) setFile(null);
    if (!versionTouched) setVersion(suggestNextVersion(app, next));
  }

  function toggle(env: StoreEnvironment) {
    setEnvironments((current) => (current.includes(env) ? current.filter((e) => e !== env) : [...current, env]));
  }

  function problem(): string | null {
    if (!file) return "Upload your app file.";
    if (!filePlatform || !allowed.includes(filePlatform) || (isPc && filePlatform !== chosen)) {
      return `${app.name} is a ${app.category === "pc" ? "PC" : "Mobile"} app${isPc ? ` — choose a ${PLATFORM_LABELS[chosen]} file` : ""}. Choose one of: ${extensions.join(", ")}.`;
    }
    if (!platform) return "Choose a platform.";
    if (file.size === 0) return "That file is empty.";
    if (!cleanVersion) return "Enter the version.";
    if (!VERSION_PATTERN.test(cleanVersion)) {
      return "A version starts and ends with a letter or digit and uses only letters, digits, '.', '_', '+' and '-'.";
    }
    if (environments.length === 0) return "Choose Production, Development, or both.";
    if (duplicates.length > 0) {
      return `${PLATFORM_LABELS[platform]} v${cleanVersion} already has a ${duplicates
        .map((e) => ENVIRONMENT_LABELS[e])
        .join(" and ")} build. Use a new version, or remove that build first.`;
    }
    if (notes.length > MAX_NOTES) return `"What's new" must be ${MAX_NOTES} characters or fewer.`;
    return null;
  }

  const blocking = problem();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (blocking || !file || !platform) {
      setError(blocking);
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    try {
      const ordered = ENVIRONMENTS.filter((env) => environments.includes(env));
      const saved = await uploadNextVersion(app.id, { version: cleanVersion, environments: ordered, notes: notes.trim(), file }, setProgress);
      onUploaded(
        saved,
        `${PLATFORM_LABELS[platform]} v${cleanVersion} (${ordered.map((env) => ENVIRONMENT_LABELS[env]).join(" + ")}) is uploaded.`,
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload the file.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <StoreDialog titleId={TITLE_ID} onClose={onClose} busy={busy} maxWidth="max-w-[600px]">
      <form onSubmit={submit} noValidate>
        <div className="px-6 pb-2 pt-8 text-center">
          <h2 id={TITLE_ID} className="font-heading text-2xl font-semibold text-foreground">
            Update Next Version
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload the next build of {app.name}.</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex justify-center">
            <AppLogo app={app} className="h-32 w-32" />
          </div>

          <div>
            <label htmlFor="store-next-name" className={LABEL_CLASS}>
              App Name
            </label>
            <input id="store-next-name" value={app.name} readOnly disabled className={INPUT_CLASS} />
          </div>

          {isPc && (
            <div>
              <span id="store-next-platform-label" className={LABEL_CLASS}>
                Platform
              </span>
              <div role="group" aria-labelledby="store-next-platform-label" className="flex gap-2">
                {allowed.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={chosen === p ? "default" : "outline"}
                    aria-pressed={chosen === p}
                    disabled={busy}
                    onClick={() => choosePlatform(p)}
                  >
                    <PlatformIcon platform={p} className="size-3.5" />
                    {PLATFORM_LABELS[p]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="store-next-file" className={LABEL_CLASS}>
              App file
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className={`${INPUT_CLASS} flex min-w-0 items-center gap-2 text-left`}
              >
                <PaperclipIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className={`truncate ${file ? "text-foreground" : "text-muted-foreground"}`}>
                  {file ? `${file.name} · ${formatBytes(file.size)}` : isPc ? `Upload your ${extensions.join(", ")} file` : "Upload your .ipa or .apk file"}
                </span>
              </button>
              <Button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="shrink-0">
                Select
              </Button>
              <input
                ref={fileRef}
                id="store-next-file"
                type="file"
                accept={extensions.join(",")}
                disabled={busy}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </div>
            {file && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                {platform ? (
                  <>
                    <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
                    {PLATFORM_LABELS[platform]} build
                  </>
                ) : (
                  <span className="text-destructive">Not an installer file this Store accepts.</span>
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="store-next-version" className={LABEL_CLASS}>
                Version
              </label>
              <input
                id="store-next-version"
                value={version}
                onChange={(e) => {
                  setVersion(e.target.value);
                  setVersionTouched(true);
                }}
                maxLength={64}
                disabled={busy}
                placeholder="e.g. 1.2.2"
                autoComplete="off"
                className={INPUT_CLASS}
              />
            </div>
            <fieldset>
              <legend className={LABEL_CLASS}>Server Type</legend>
              <div className="flex h-[38px] items-center gap-5">
                {ENVIRONMENTS.map((env) => (
                  <label key={env} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={environments.includes(env)}
                      onChange={() => toggle(env)}
                      disabled={busy}
                      className="h-4 w-4 rounded border-surface-border accent-[var(--primary)]"
                    />
                    {ENVIRONMENT_LABELS[env]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div>
            <label htmlFor="store-next-notes" className={LABEL_CLASS}>
              What&apos;s new?
            </label>
            <textarea
              id="store-next-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
              rows={4}
              disabled={busy}
              placeholder="What changed in this version"
              className={TEXTAREA_CLASS}
            />
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
              {notes.length}/{MAX_NOTES} characters
            </p>
          </div>

          {progress !== null && (
            <div className="space-y-1" role="status" aria-live="polite">
              <div className="h-2 overflow-hidden rounded-full bg-muted-surface">
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : "Saving…"}
              </p>
            </div>
          )}

          {(error || (file && duplicates.length > 0)) && (
            <p role="alert" className={ERROR_CLASS}>
              {error ?? blocking}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-surface-border px-6 py-4 sm:flex-row sm:justify-center">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || blocking !== null} className="sm:min-w-36">
            {busy ? "Uploading…" : "Submit"}
          </Button>
        </div>
      </form>
    </StoreDialog>
  );
}
