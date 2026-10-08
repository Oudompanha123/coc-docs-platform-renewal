"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { Spinner } from "@/components/layout/Spinner";
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

const INPUT_CLASS =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-dash-ink outline-none focus:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple";

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
      title={announcement ? "Edit announcement" : "New announcement"}
      onClose={saving ? () => {} : onClose}
      className="w-full max-w-2xl overflow-y-auto rounded-[10px] border border-border bg-white p-6 shadow-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {isLive && (
          <p role="status" className="rounded-[10px] bg-brand-purple/10 px-3 py-2 text-xs font-medium text-brand-purple">
            This announcement is live. Saving updates it for everyone straight away.
          </p>
        )}

        <label className="block">
          <span className="flex items-baseline justify-between text-sm font-semibold text-dash-ink">
            Title
            <span className="text-xs font-normal text-muted">
              {title.length}/{MAX_TITLE}
            </span>
          </span>
          <input
            type="text"
            value={title}
            maxLength={MAX_TITLE}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled maintenance on Friday"
            autoFocus
            required
            className={INPUT_CLASS}
          />
        </label>

        <AnnouncementCategoryPicker value={category} onChange={setCategory} disabled={saving !== null} />


        <div>
          <label
            htmlFor="announcement-body"
            className="flex items-baseline justify-between text-sm font-semibold text-dash-ink"
          >
            Message
            <span className="text-xs font-normal text-muted">
              {body.length}/{MAX_BODY}
            </span>
          </label>
          <MarkdownEditor
            id="announcement-body"
            value={body}
            onChange={setBody}
            maxLength={MAX_BODY}
            rows={6}
            placeholder="What do people need to know? Use the toolbar or Markdown for formatting."
            required
            disabled={saving !== null}
            describedBy="announcement-body-hint"
          />
          <p id="announcement-body-hint" className="mt-1.5 text-xs text-muted">
            Markdown supported: **bold**, _italic_, # headings, - lists, [links](https://…), ``` code ```, &gt; quotes,
            and [colored text]{"{"}color=red{"}"}.
          </p>
        </div>

        <AnnouncementExpiryField value={expiresAt} onChange={setExpiresAt} disabled={saving !== null} />

        {!isLive && (
          <p className="text-xs text-muted">
            Publishing notifies every active member in their notification bell. Saving as a draft notifies no one.
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-[10px] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving !== null}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={
              isLive
                ? "flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                : "flex items-center gap-2 rounded-full border border-brand-purple px-4 py-2 text-sm font-semibold text-brand-purple transition-colors hover:bg-brand-purple/10 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {saving === "draft" && <Spinner />}
            {isLive ? "Save changes" : "Save draft"}
          </button>
          {!isLive && (
            <button
              type="button"
              onClick={() => void save(true)}
              disabled={!canPublish}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving === "publish" && <Spinner />}
              Save &amp; publish
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
