"use client";

import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import { Check, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppIconPicker, iconProblem } from "@/components/store/AppIconPicker";
import { StoreDialog } from "@/components/store/StoreDialog";
import { ERROR_CLASS, INPUT_CLASS, LABEL_CLASS, TEXTAREA_CLASS } from "@/components/store/form-styles";
import { createStoreApp, findSameApp, STORE_CATEGORIES, storeAppHref, updateStoreApp, uploadStoreLogo, type StoreApp, type StoreCategory } from "@/lib/store/store-api";

const TITLE_ID = "store-app-form-title";

/**
 * "Add New App" and "Edit App info": the app icon and name, plus an optional
 * description, its platform (Mobile or PC, ADR-112) and its visibility.
 * Within that, each build is filed under the platform of its file (ADR-111).
 *
 * Adding is two requests — the app, then its icon — because the icon is sent
 * as the raw request body (see AdminStoreController). If the icon step fails
 * the app already exists, so the dialog switches to editing it and says what
 * is left to do, rather than offering to create it a second time.
 */
export function StoreAppForm({
  app: initialApp,
  existingApps = [],
  onSaved,
  onClose,
}: {
  /** Absent when adding. */
  app?: StoreApp;
  /** Every app already on the Store, so a name that is taken is caught here; the backend refuses it too (409). */
  existingApps?: StoreApp[];
  onSaved: (app: StoreApp) => void;
  onClose: () => void;
}) {
  const [app, setApp] = useState<StoreApp | undefined>(initialApp);
  const [name, setName] = useState(initialApp?.name ?? "");
  const [description, setDescription] = useState(initialApp?.description ?? "");
  const [category, setCategory] = useState<StoreCategory>(initialApp?.category ?? "mobile");
  const [isPublic, setIsPublic] = useState(initialApp?.isPublic ?? true);
  const [icon, setIcon] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adding = !initialApp;
  const hasBuilds = !!app?.builds.some((b) => !b.removedAt);
  const sameApp = adding && !app ? findSameApp(existingApps, name) : null;

  function check(): string | null {
    if (sameApp) return `${sameApp.name} is already on the Store.`;
    if (!name.trim()) return "Enter your app name.";
    if (name.trim().length > 80) return "The app name must be 80 characters or fewer.";
    return iconProblem(icon);
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
      const input = { name: name.trim(), description: description.trim(), category, isPublic };
      saved = saved ? await updateStoreApp(saved.id, input) : await createStoreApp(input);
      setApp(saved);
      if (icon) {
        saved = await uploadStoreLogo(saved.id, icon);
        setApp(saved);
        setIcon(null);
      }
      onSaved(saved);
      toast.success(initialApp ? `${saved.name} was updated.` : `${saved.name} was added.`);
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
    }
  }

  return (
    <StoreDialog titleId={TITLE_ID} onClose={onClose} busy={busy} maxWidth="max-w-[520px]">
      <form onSubmit={submit} noValidate>
        <div className="px-6 pb-2 pt-8 text-center">
          <h2 id={TITLE_ID} className="font-heading text-2xl font-semibold text-foreground">
            {adding ? "Add New App" : "Edit App info"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {adding ? "Hey there! Let's get started." : "Change how this app appears on the Store."}
          </p>
        </div>

        <div className="space-y-5 px-6 py-5">
          <AppIconPicker currentUrl={app?.logoUrl ?? null} file={icon} disabled={busy} onChange={setIcon} />

          <div>
            <label htmlFor="store-app-name" className={LABEL_CLASS}>
              App Name
            </label>
            <input
              id="store-app-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              disabled={busy}
              placeholder="Enter your app name"
              autoComplete="off"
              className={INPUT_CLASS}
            />
          </div>

          <fieldset disabled={busy || hasBuilds}>
            <legend className={LABEL_CLASS}>Platform</legend>
            <div className="grid grid-cols-2 gap-3">
              {STORE_CATEGORIES.map((c) => (
                // Filled tiles like the Store cards: the chosen one gets a strong
                // ring and a filled check, the other stays a quiet grey surface.
                <label
                  key={c.value}
                  className={`relative flex cursor-pointer items-center gap-3 rounded-2xl bg-muted-surface p-3 transition-shadow duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
                    category === c.value ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-foreground/15"
                  }`}
                >
                  <input
                    type="radio"
                    name="store-app-category"
                    value={c.value}
                    checked={category === c.value}
                    onChange={() => setCategory(c.value)}
                    className="sr-only"
                  />
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-foreground">
                    {c.value === "mobile" ? <Smartphone className="size-5" aria-hidden="true" /> : <Monitor className="size-5" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{c.label}</span>
                    <span className="block text-xs text-muted-foreground">{c.hint}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                      category === c.value ? "bg-primary text-primary-foreground" : "border border-foreground/20 bg-card"
                    }`}
                  >
                    {category === c.value && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </label>
              ))}
            </div>
            {hasBuilds && (
              <p className="mt-1 text-xs text-muted-foreground">Remove this app's builds to change its platform.</p>
            )}
          </fieldset>

          <div>
            <label htmlFor="store-app-description" className={LABEL_CLASS}>
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="store-app-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              disabled={busy}
              placeholder="What the app does and who it is for"
              className={TEXTAREA_CLASS}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted-surface px-4 py-3">
            <div>
              <p id="store-app-visibility-label" className="text-sm font-medium text-foreground">
                {isPublic ? "Public" : "Private"}
              </p>
              <p className="text-xs text-muted-foreground">
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
              className={`relative h-6 w-11 shrink-0 rounded-full outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                isPublic ? "bg-primary" : "bg-foreground/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${isPublic ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
          </div>

          {sameApp && (
            <div role="status" className="rounded-2xl bg-muted-surface px-4 py-3 text-sm">
              <p className="font-medium text-foreground">{sameApp.name} is already on the Store.</p>
              <p className="mt-1 text-muted-foreground">To add a new build of it, open it and choose Next version.</p>
              <Link
                href={storeAppHref(sameApp.number)}
                onClick={onClose}
                className="mt-3 inline-flex h-9 items-center rounded-control bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open {sameApp.name}
              </Link>
            </div>
          )}

          {error && (
            <p role="alert" className={ERROR_CLASS}>
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-surface-border px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? "Saving…" : adding && !app ? "Add App" : "Save"}
          </Button>
        </div>
      </form>
    </StoreDialog>
  );
}
