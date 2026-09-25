"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/layout/icons";
import { ShieldIcon } from "@/components/auth/icons";
import { ApplicantAvatar } from "@/components/layout/ApplicantAvatar";
import { ApproveRegistrationModal } from "@/components/layout/ApproveRegistrationModal";
import { NewSignInModal } from "@/components/layout/NewSignInModal";
import { useNotifications } from "@/lib/notify/useNotifications";
import type { PendingAccount } from "@/lib/admin/accounts";
import type { SessionSummary } from "@/lib/auth/api";

type NotificationFilter = "unread" | "all";

/**
 * The bell from the main admin Topbar, reused here rather than re-invented —
 * same `useNotifications` hook (real approval/new-device alerts, not a
 * mock), same two modals it can open. A fresh component rather than a shared
 * extraction out of Topbar.tsx: that file is the main admin shell's, not
 * this one's to restructure for a visual-parity pass here.
 */
export function AxRenewalNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [approving, setApproving] = useState<PendingAccount | null>(null);
  const [reviewingSignIn, setReviewingSignIn] = useState<SessionSummary | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const unreadCountRef = useRef(0);

  const notifications = useNotifications({
    onOpenApproval: (account) => setApproving(account),
    onOpenSignIn: (session) => setReviewingSignIn(session),
  });
  unreadCountRef.current = notifications.unreadCount;

  const visible = filter === "unread" ? notifications.items.filter((n) => !n.read) : notifications.items;

  useEffect(() => {
    if (open) setFilter(unreadCountRef.current > 0 ? "unread" : "all");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications, ${notifications.unreadCount} unread`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative shrink-0 rounded-xl bg-gray-100 p-2.5 text-dash-ink/70 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
      >
        <BellIcon className="h-4 w-4" />
        {notifications.unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {notifications.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-80 rounded-[10px] border border-border bg-white shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-dash-ink">Notifications</p>
            <div className="mt-2.5 flex items-center gap-1.5">
              {(["unread", "all"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                    filter === key ? "bg-brand-purple/10 text-brand-purple" : "border border-border text-muted hover:bg-page"
                  }`}
                >
                  {key}
                </button>
              ))}
              <button
                type="button"
                onClick={() => notifications.markAllRead()}
                disabled={notifications.unreadCount === 0}
                className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-brand-purple transition-colors hover:bg-brand-purple/10 disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
              >
                Read all
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                {filter === "unread" ? "You're all caught up." : "Nothing needs your attention."}
              </p>
            ) : (
              visible.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    notifications.markRead(n.id);
                    void notifications.open(n);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-page ${
                    n.read ? "" : "bg-brand-purple/5"
                  }`}
                >
                  {n.type === "auth.new-device" ? (
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                      <ShieldIcon className="h-4 w-4" />
                    </span>
                  ) : (
                    <ApplicantAvatar name={n.subjectName ?? n.title} avatarUrl={n.iconUrl} className="mt-0.5 h-8 w-8 text-[11px]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm text-dash-ink ${n.read ? "font-medium" : "font-semibold"}`}>
                      {n.title}
                    </span>
                    <span className="block truncate text-xs text-muted">{n.detail}</span>
                  </span>
                  {!n.read && (
                    <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-purple" />
                  )}
                </button>
              ))
            )}
          </div>
          {notifications.items.some((n) => n.type === "registration.pending") && (
            <Link
              href="/users-roles?tab=pending"
              onClick={() => setOpen(false)}
              className="block w-full rounded-b-[10px] border-t border-border px-4 py-2.5 text-center text-sm font-semibold text-brand-purple transition-colors hover:bg-page"
            >
              View all
            </Link>
          )}
        </div>
      )}

      {approving && (
        <ApproveRegistrationModal
          account={approving}
          onClose={() => setApproving(null)}
          onApproved={() => void notifications.refresh()}
        />
      )}
      {reviewingSignIn && (
        <NewSignInModal
          session={reviewingSignIn}
          onClose={() => setReviewingSignIn(null)}
          onEnded={() => void notifications.refresh()}
        />
      )}
    </div>
  );
}
