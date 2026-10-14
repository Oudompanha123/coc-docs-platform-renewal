"use client";

import { useEffect, useRef, useState } from "react";
import { ClockIcon, CalendarCheckIcon, WarningIcon, XIcon } from "@/components/layout/icons";
import { CATEGORY_META } from "@/components/announcements/categories";
import { MarkdownContent } from "@/components/markdown/MarkdownContent";
import { fetchAnnouncement, type Announcement } from "@/lib/announcements/announcements-api";
import { formatDateTime } from "@/lib/announcements/expiry";
import { timeAgo } from "@/lib/notify/activity";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; announcement: Announcement };

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const TITLE_ID = "announcement-modal-title";

/**
 * One announcement, opened from a bell row or a `?announcement=` deep link
 * (ADR-098).
 *
 * <p>Fetched on open rather than rendered from the bell row: the row holds
 * only the title, and an admin may have edited, unpublished or deleted it
 * since. Whatever the server says now is what is shown — including "no longer
 * available", which is the honest answer for a withdrawn one.
 *
 * <p>Built on the user site's own dialog, {@code ProfilePopup} — its rounded
 * card, deep shadow, corner close button, Escape and focus trap — rather than
 * the admin shell's plain {@code Modal}, because members mostly meet this on
 * `/home`. The header band takes the category's colour and icon (the same
 * {@link CATEGORY_META} the admin picked from), so "Maintenance" and
 * "Important" look different before a word is read.
 *
 * <p>The body is Markdown, rendered by {@link MarkdownContent} into React
 * elements — never HTML — so an announcement can carry formatting but cannot
 * carry markup (ADR-102, revising ADR-098's plain-text body).
 */
export function AnnouncementModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetchAnnouncement(id)
      .then((announcement) => {
        if (!cancelled) setState({ status: "ready", announcement });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Couldn't load this announcement.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // The page behind does not scroll while this is open, and focus goes back to
  // whatever opened it (a bell row) when it closes.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, []);

  // Focus the main button once there is one — "Got it" or "Close".
  useEffect(() => {
    if (state.status !== "loading") primaryRef.current?.focus();
  }, [state.status]);

  // Escape closes; Tab stays inside — the same handling as ProfilePopup.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const announcement = state.status === "ready" ? state.announcement : null;
  const meta = announcement ? (CATEGORY_META[announcement.category] ?? CATEGORY_META.info) : null;
  const Icon = meta?.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      aria-busy={state.status === "loading"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="animate-entrance relative flex max-h-full w-full max-w-[520px] flex-col overflow-hidden rounded-[20px] bg-card shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {state.status === "loading" && (
          <div role="status" aria-label="Loading announcement" className="animate-pulse">
            <div className="flex items-center gap-4 bg-muted-surface px-6 pb-5 pt-6">
              <div className="h-12 w-12 rounded-xl bg-card" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-card" />
                <div className="h-5 w-3/4 rounded bg-card" />
              </div>
            </div>
            <div className="space-y-2.5 px-6 py-6">
              <div className="h-3 w-40 rounded bg-muted-surface" />
              <div className="h-3.5 w-full rounded bg-muted-surface" />
              <div className="h-3.5 w-11/12 rounded bg-muted-surface" />
              <div className="h-3.5 w-2/3 rounded bg-muted-surface" />
            </div>
            <h2 id={TITLE_ID} className="sr-only">
              Loading announcement
            </h2>
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-col items-center px-6 pb-6 pt-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-surface text-muted-foreground">
              <WarningIcon className="h-6 w-6" />
            </span>
            <h2 id={TITLE_ID} className="mt-4 text-base font-bold text-foreground">
              Announcement unavailable
            </h2>
            <p role="alert" className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              {state.message}
            </p>
            <button
              ref={primaryRef}
              type="button"
              onClick={onClose}
              className="mt-6 rounded-control border border-surface-border px-6 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Close
            </button>
          </div>
        )}

        {announcement && meta && Icon && (
          <>
            {/* The category's own tint, with its colour carried into the
                eyebrow and icon via currentColor. */}
            <header className={`flex items-center gap-4 px-6 pb-5 pt-6 pr-14 ${meta.tile}`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium">Announcement · {meta.label}</p>
                <h2 id={TITLE_ID} className="mt-1 break-words text-xl font-semibold leading-snug text-foreground">
                  {announcement.title}
                </h2>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5" />
                  <time dateTime={announcement.publishedAt} title={formatDateTime(announcement.publishedAt)}>
                    Posted {formatDateTime(announcement.publishedAt)} · {timeAgo(announcement.publishedAt)}
                  </time>
                </span>
                {announcement.expiresAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarCheckIcon className="h-3.5 w-3.5" />
                    <time dateTime={announcement.expiresAt}>Until {formatDateTime(announcement.expiresAt)}</time>
                  </span>
                )}
              </div>

              <MarkdownContent
                source={announcement.body}
                className="mt-4 text-[15px] leading-7 text-foreground/70"
              />
            </div>

            <footer className="flex justify-end border-t border-surface-border px-6 py-4">
              <button
                ref={primaryRef}
                type="button"
                onClick={onClose}
                className="rounded-control bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
              >
                Got it
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
