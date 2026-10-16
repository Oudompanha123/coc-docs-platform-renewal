"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { XIcon } from "@/components/layout/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The Store page's dialog frame — the same rounded card, Escape, focus trap
 * and scroll lock as `AnnouncementModal`, the user site's own dialog, so the
 * Store does not introduce a second look for "a box over the page".
 *
 * `busy` holds the dialog open (no Escape, no backdrop close) while an upload
 * is in flight, so a stray click cannot abandon it halfway.
 */
export function StoreDialog({
  titleId,
  onClose,
  busy = false,
  maxWidth = "max-w-[640px]",
  children,
}: {
  titleId: string;
  onClose: () => void;
  busy?: boolean;
  maxWidth?: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    return () => {
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (!busyRef.current) onClose();
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 sm:py-10"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`animate-entrance relative flex max-h-full w-full ${maxWidth} flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.35)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label={t.storeForm.close}
          className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted-surface hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed"
        >
          <XIcon className="h-4 w-4" />
        </button>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
