"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { Spinner } from "@/components/layout/Spinner";
import { XIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor";
import {
  createAnnouncement,
  publishAnnouncement,
  updateAnnouncement,
  type AdminAnnouncement,
  type AnnouncementInput,
} from "@/lib/admin/announcements";
import type { AnnouncementCategory } from "@/lib/announcements/announcements-api";
import { isExpiryPast } from "@/lib/announcements/expiry";
import { AnnouncementCategoryPicker } from "./AnnouncementCategoryPicker";
import { AnnouncementExpiryField } from "./AnnouncementExpiryField";

/** Mirrors the backend's limits (AnnouncementService / V69). */
const MAX_TITLE = 150;
const MAX_BODY = 5000;

/**
 * Create or edit an announcement (ADR-098).
 *
 * <p>Saves through the API itself and hands the saved row back, so the page
 * only has to put it in its list. "Save & publish" is two requests — save,
 * then publish — rather than a combined endpoint: a publish that fails after
 * the save leaves a correct draft behind, which is the state the admin can
 * simply retry from.
 *
 * <p>Editing a published announcement has no publish button: it is already
 * live, and saving takes effect for readers at once.
 *
 * <p>The message is Markdown, written in {@link MarkdownEditor} — toolbar,
 * shortcuts and a Preview tab — and stored as the Markdown text itself
 * (ADR-102). The 5000-character limit counts that text.
 */
export function AnnouncementEditorModal({
  announcement,
  onClose,
  onSaved,
}: {
  /** Absent for a new announcement. */
  announcement?: AdminAnnouncement;
  onClose: () => void;
  /** The row as the server now has it, and whether it was just published. */
  onSaved: (saved: AdminAnnouncement, published: boolean) => void;
}) {
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [category, setCategory] = useState<AnnouncementCategory>(announcement?.category ?? "info");
  const [expiresAt, setExpiresAt] = useState<string | null>(announcement?.expiresAt ?? null);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The row as last saved by this dialog. Starts as the one being edited; a
  // "Save & publish" whose publish fails after its save succeeded leaves the
  // saved draft here, so the retry updates it (at its new version) instead of
  // creating a second copy or tripping over its own stale version number.
  const [current, setCurrent] = useState(announcement);

  const isLive = announcement?.status === "published";
  // A past expiry the admin just chose is refused by the server, so it is
  // refused here first. One that was already saved and left alone may still be
  // kept by an edit (fixing a typo in a lapsed announcement), but never
  // published — that would go out already expired.
  const expiryPast = isExpiryPast(expiresAt);
  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    saving === null &&
    !(expiryPast && expiresAt !== (announcement?.expiresAt ?? null));
  const canPublish = canSubmit && !expiryPast;

  async function save(publish: boolean) {
    setSaving(publish ? "publish" : "draft");
    setError(null);
    const input: AnnouncementInput = {
      title: title.trim(),
      body: body.trim(),
      category,
      expiresAt,
    };
    try {
      let saved = current
        ? await updateAnnouncement(current.id, input, current.versionNo)
        : await createAnnouncement(input);
      setCurrent(saved);
      if (publish) saved = await publishAnnouncement(saved.id);
      onSaved(saved, publish);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the announcement.");
      setSaving(null);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (canSubmit) void save(false);
  }

  return (
    <Modal
      ariaLabel={announcement ? "Edit announcement" : "New announcement"}
      onClose={saving ? () => {} : onClose}
      // Header, scrolling body, fixed footer (ADR-104 r2.10): the actions stay
      // in reach however long the message gets, instead of scrolling away
      // with it.
      className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-surface-border bg-card shadow-xl"
      bodyClassName="flex min-h-0 flex-1 flex-col"
    >
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-surface-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">
              {announcement ? "Edit announcement" : "New announcement"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isLive
                ? "This one is live — saving updates it for everyone straight away."
                : "Shown to every active member in their notification bell once published."}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={onClose}
            disabled={saving !== null}
            className="-mr-2 -mt-1 size-8 shrink-0"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <label htmlFor="announcement-title" className="flex items-baseline justify-between text-sm font-medium text-foreground">
              Title
              <span className="text-xs font-normal tabular-nums text-muted-foreground">
                {title.length}/{MAX_TITLE}
              </span>
            </label>
            <Input
              id="announcement-title"
              type="text"
              value={title}
              maxLength={MAX_TITLE}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled maintenance on Friday"
              autoFocus
              required
              className="mt-1.5"
            />
          </div>

          <AnnouncementCategoryPicker value={category} onChange={setCategory} disabled={saving !== null} />

          <div>
            <label
              htmlFor="announcement-body"
              className="flex items-baseline justify-between text-sm font-medium text-foreground"
            >
              Message
              <span className="text-xs font-normal tabular-nums text-muted-foreground">
                {body.length}/{MAX_BODY}
              </span>
            </label>
            <div className="mt-1.5">
              <MarkdownEditor
                id="announcement-body"
                value={body}
                onChange={setBody}
                maxLength={MAX_BODY}
                rows={6}
                placeholder="What do people need to know? Use the toolbar or Markdown for formatting."
                required
                disabled={saving !== null}
              />
            </div>
          </div>

          <AnnouncementExpiryField value={expiresAt} onChange={setExpiresAt} disabled={saving !== null} />

          {error && (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-surface-border bg-muted-surface/40 px-6 py-3">
          {!isLive && (
            <p className="mr-auto text-xs text-muted-foreground">A draft notifies no one.</p>
          )}
          <Button type="button" variant="outline" onClick={onClose} disabled={saving !== null}>
            Cancel
          </Button>
          <Button type="submit" variant={isLive ? "default" : "outline"} disabled={!canSubmit}>
            {saving === "draft" && <Spinner />}
            {isLive ? "Save changes" : "Save draft"}
          </Button>
          {!isLive && (
            <Button type="button" onClick={() => void save(true)} disabled={!canPublish}>
              {saving === "publish" && <Spinner />}
              Save &amp; publish
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
